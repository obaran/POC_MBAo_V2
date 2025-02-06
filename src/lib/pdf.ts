import * as pdfjsLib from 'pdfjs-dist';
import { createCanvas, loadImage } from 'canvas';
import { createWorker } from 'tesseract.js';

// Configuration du worker PDF.js avec un chemin local
const pdfWorkerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

interface PDFContent {
  text: string;
  images: string[];
  firstPage: string;
}

async function extractTextFromImage(imageData: string): Promise<string> {
  try {
    const worker = await createWorker('fra');
    const { data: { text } } = await worker.recognize(imageData);
    await worker.terminate();
    return text;
  } catch (error) {
    console.error('Erreur lors de l\'extraction du texte de l\'image:', error);
    return '';
  }
}

export async function extractTitleFromFirstPage(firstPageImage: string): Promise<string> {
  try {
    const text = await extractTextFromImage(firstPageImage);
    const lines = text.split('\n').map(line => line.trim());
    const title = lines.find(line => line.length > 0) || 'Document sans titre';
    return title;
  } catch (error) {
    console.error('Erreur lors de l\'extraction du titre:', error);
    return 'Document sans titre';
  }
}

export async function extractContentFromPDF(file: File): Promise<PDFContent> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    const images: string[] = [];
    let firstPage: string | null = null;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Extraction du texte du PDF
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';

      // Capture de la page avec une meilleure qualité
      const scale = 3.0;
      const viewport = page.getViewport({ scale });
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      
      if (context) {
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        try {
          const imageData = canvas.toDataURL('image/jpeg', 1.0);
          
          // Extraction du texte de l'image avec OCR
          const imageText = await extractTextFromImage(imageData);
          if (imageText.trim()) {
            fullText += `\n[Texte extrait de l'image page ${pageNum}]\n${imageText}\n\n`;
          }

          if (pageNum === 1) {
            firstPage = imageData;
          } else {
            images.push(imageData);
          }
        } catch (error) {
          console.warn('Erreur lors du traitement de l\'image:', error);
        }
      }
    }

    return { 
      text: fullText, 
      images, 
      firstPage: firstPage || images[0] || '' 
    };
  } catch (error) {
    console.error('Erreur lors du traitement du PDF:', error);
    throw new Error('Le traitement du PDF a échoué. Veuillez vérifier que le fichier est valide.');
  }
}