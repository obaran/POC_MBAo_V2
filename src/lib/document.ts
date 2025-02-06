import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface Section {
  id: string;
  type: 'text' | 'image';
  title: string;
  content: string;
  selected: boolean;
  metadata?: {
    courseCode?: string;
    subtitle?: string;
    titleColor?: [number, number, number];
  };
}

function sanitizeFileName(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export async function generateFinalDocument(sections: Section[], documentTitle: string): Promise<void> {
  if (!sections || sections.length === 0) {
    throw new Error('Aucune section à inclure dans le PDF');
  }

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
      putOnlyUsedFonts: true
    });

    // Configuration des marges et dimensions
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (2 * margin);
    const footerHeight = 15;
    const usablePageHeight = pageHeight - margin - footerHeight;

    // Configuration des styles
    const styles = {
      title: { size: 28, style: 'bold', color: [0, 51, 153] },
      heading1: { size: 18, style: 'bold', color: [0, 51, 153] },
      heading2: { size: 14, style: 'bold', color: [51, 51, 51] },
      body: { size: 11, style: 'normal', color: [0, 0, 0] },
      footer: { size: 9, style: 'normal', color: [128, 128, 128] }
    };

    // Fonction pour ajouter le numéro de page
    const addPageNumber = (pageNum: number) => {
      const totalPages = doc.internal.getNumberOfPages();
      doc.setFont('helvetica', styles.footer.style);
      doc.setFontSize(styles.footer.size);
      doc.setTextColor(...styles.footer.color);
      doc.text(
        `Page ${pageNum} sur ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    };

    // Fonction pour ajouter un fond semi-transparent avec coins arrondis
    const addBackgroundBox = (x: number, y: number, width: number, height: number, opacity: number = 0.6) => {
      const radius = 5;
      const margin = 8;
      
      doc.setFillColor(0, 0, 0);
      doc.setGState(new doc.GState({ opacity }));
      doc.roundedRect(x - margin, y - margin, width + (margin * 2), height + (margin * 2), radius, radius, 'F');
      doc.setGState(new doc.GState({ opacity: 1 }));
    };

    // Fonction pour ajouter du texte avec un fond
    const addTextWithBackground = (
      text: string,
      x: number,
      y: number,
      options: {
        fontSize: number;
        fontStyle: string;
        align: 'left' | 'center' | 'right';
        maxWidth?: number;
        opacity?: number;
        blur?: number;
      }
    ) => {
      doc.setFont('helvetica', options.fontStyle);
      doc.setFontSize(options.fontSize);
      doc.setTextColor(255, 255, 255);

      const lines = options.maxWidth
        ? doc.splitTextToSize(text, options.maxWidth)
        : [text];
      
      const textWidth = Math.max(...lines.map((line: string) => 
        doc.getTextWidth(line)
      ));
      const textHeight = lines.length * (options.fontSize / 2.54);
      
      let textX = x;
      if (options.align === 'center') {
        textX -= textWidth / 2;
      } else if (options.align === 'right') {
        textX -= textWidth;
      }

      addBackgroundBox(textX, y - (textHeight / 2), textWidth, textHeight, options.opacity);

      doc.text(lines, x, y, {
        align: options.align,
        baseline: 'middle'
      });
    };

    // Fonction pour calculer la hauteur du texte
    const calculateTextHeight = (text: string, fontSize: number, maxWidth: number): number => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      return lines.length * (fontSize / 2.54);
    };

    // Fonction pour ajouter une section de texte avec gestion intelligente des sauts de page
    const addTextSection = (section: Section, startY: number): number => {
      const titleHeight = calculateTextHeight(section.title, styles.heading1.size, contentWidth);
      const contentHeight = calculateTextHeight(section.content, styles.body.size, contentWidth);
      const totalHeight = titleHeight + contentHeight + 15; // 15mm pour l'espacement

      // Si la section ne tient pas sur la page actuelle, commencer une nouvelle page
      if (startY + totalHeight > usablePageHeight) {
        doc.addPage();
        startY = margin;
      }

      // Ajouter le trait vertical décoratif
      doc.setDrawColor(...(section.metadata?.titleColor || styles.heading1.color));
      doc.setLineWidth(0.5);
      doc.line(margin - 5, startY, margin - 5, startY + titleHeight + 5);

      // Titre de la section
      doc.setFont('helvetica', styles.heading1.style);
      doc.setFontSize(styles.heading1.size);
      doc.setTextColor(...(section.metadata?.titleColor || styles.heading1.color));
      const titleLines = doc.splitTextToSize(section.title, contentWidth);
      doc.text(titleLines, margin, startY);
      
      startY += titleHeight + 5;

      // Fond subtil pour le paragraphe
      const paragraphY = startY;
      doc.setFillColor(245, 247, 250);
      doc.setGState(new doc.GState({ opacity: 0.5 }));
      doc.roundedRect(margin - 2, paragraphY - 2, contentWidth + 4, contentHeight + 4, 2, 2, 'F');
      doc.setGState(new doc.GState({ opacity: 1 }));

      // Contenu
      doc.setFont('helvetica', styles.body.style);
      doc.setFontSize(styles.body.size);
      doc.setTextColor(...styles.body.color);
      const contentLines = doc.splitTextToSize(section.content, contentWidth);
      
      // Justifier le texte manuellement
      const lineHeight = styles.body.size / 2.54;
      contentLines.forEach((line: string, index: number) => {
        const y = paragraphY + (index * lineHeight);
        if (y <= usablePageHeight) {
          doc.text(line, margin, y, { align: 'justify' });
        } else {
          // Si une ligne dépasse la page, créer une nouvelle page
          doc.addPage();
          doc.text(line, margin, margin + (lineHeight * (index % Math.floor((usablePageHeight - margin) / lineHeight))), { align: 'justify' });
        }
      });

      return paragraphY + contentHeight + 10;
    };

    // Fonction pour ajouter une image
    const addImage = async (section: Section, isFirstPage: boolean): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          const img = new Image();
          img.onload = () => {
            try {
              const aspectRatio = img.width / img.height;
              const maxWidth = pageWidth;
              const maxHeight = pageHeight;
              
              let width = maxWidth;
              let height = width / aspectRatio;
              
              if (height > maxHeight) {
                height = maxHeight;
                width = height * aspectRatio;
              }

              const x = (pageWidth - width) / 2;
              const y = 0;

              if (!isFirstPage) {
                doc.addPage();
              }

              doc.addImage(section.content, 'JPEG', x, y, width, height, undefined, 'MEDIUM');

              if (isFirstPage && section.metadata) {
                const centerX = pageWidth / 2;

                // Code du cours avec fond (à 15% de la hauteur)
                if (section.metadata.courseCode) {
                  addTextWithBackground(
                    section.metadata.courseCode,
                    centerX,
                    height * 0.15,
                    {
                      fontSize: styles.heading2.size * 1.4,
                      fontStyle: styles.heading2.style,
                      align: 'center',
                      opacity: 0.6,
                      blur: 2
                    }
                  );
                }

                // Titre principal avec fond (à 45% de la hauteur)
                addTextWithBackground(
                  section.title,
                  centerX,
                  height * 0.45,
                  {
                    fontSize: styles.title.size * 1.2,
                    fontStyle: styles.title.style,
                    align: 'center',
                    maxWidth: width * 0.8,
                    opacity: 0.6,
                    blur: 3
                  }
                );

                // Sous-titre avec fond (à 85% de la hauteur)
                if (section.metadata.subtitle) {
                  addTextWithBackground(
                    section.metadata.subtitle,
                    centerX,
                    height * 0.85,
                    {
                      fontSize: styles.heading1.size * 1.2,
                      fontStyle: styles.heading1.style,
                      align: 'center',
                      opacity: 0.6,
                      blur: 2
                    }
                  );
                }
              }

              addPageNumber(doc.internal.getCurrentPageInfo().pageNumber);
              resolve();
            } catch (error) {
              console.error('Erreur lors du traitement de l\'image:', error);
              resolve();
            }
          };

          img.onerror = () => {
            console.error('Erreur de chargement de l\'image');
            resolve();
          };

          img.src = section.content;
        } catch (error) {
          console.error('Erreur lors de la préparation de l\'image:', error);
          resolve();
        }
      });
    };

    let currentY = margin;
    let hasAddedFirstPage = false;

    // Traiter d'abord la page de couverture si elle existe
    const coverSection = sections.find(s => s.type === 'image' && s.metadata?.courseCode);
    if (coverSection) {
      await addImage(coverSection, true);
      hasAddedFirstPage = true;
    }

    // Traiter les sections de texte
    const textSections = sections.filter(s => s.type === 'text');
    if (textSections.length > 0) {
      if (hasAddedFirstPage) {
        doc.addPage();
        currentY = margin;
      }

      for (const section of textSections) {
        currentY = addTextSection(section, currentY);
        addPageNumber(doc.internal.getCurrentPageInfo().pageNumber);
      }
    }

    // Traiter les images restantes
    const remainingImages = sections.filter(s => s.type === 'image' && s !== coverSection);
    for (const section of remainingImages) {
      await addImage(section, false);
    }

    // Sauvegarder le PDF
    const fileName = `${sanitizeFileName(documentTitle)}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw new Error('La génération du PDF a échoué. Veuillez réessayer.');
  }
}