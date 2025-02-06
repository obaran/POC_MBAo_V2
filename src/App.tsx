import React, { useState, useRef } from 'react';
import { FileUp, Book, Video, Download, ArrowUp } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from './components/ui/button';
import { FileUpload } from './components/file-upload';
import { ContentSection } from './components/content-section';
import { VideoSummary } from './components/video-summary';
import { CustomContent } from './components/custom-content';
import { PDFPreview } from './components/pdf-preview';
import { GenerationProgress } from './components/generation-progress';
import { generateStructuredDocument } from './lib/ai';
import { generateFinalDocument } from './lib/document';
import { extractTitleFromFirstPage } from './lib/pdf';

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

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [firstPage, setFirstPage] = useState<string>('');
  const [sections, setSections] = useState<Section[]>([]);
  const [documentTitle, setDocumentTitle] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);

  const handleColorUpdateAll = (color: [number, number, number]) => {
    setSections(currentSections => 
      currentSections.map(section => ({
        ...section,
        metadata: {
          ...section.metadata,
          titleColor: color
        }
      }))
    );
  };

  // Gérer l'affichage du bouton de retour en haut
  React.useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const scrollTop = contentRef.current.scrollTop;
        setShowScrollTop(scrollTop > 300);
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handleFileSelect = async (text: string, images: string[], firstPage: string) => {
    setExtractedText(text);
    setExtractedImages(images);
    setFirstPage(firstPage);
    
    const pdfTitle = await extractTitleFromFirstPage(firstPage);
    setDocumentTitle(pdfTitle);
    
    setCurrentStep(2);
  };

  const handleGenerateSummary = async () => {
    if (!extractedText) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      const structure = await generateStructuredDocument(extractedText, extractedImages);
      
      const firstPageSection: Section = {
        id: 'first-page',
        type: 'image',
        title: 'Page de couverture',
        content: firstPage,
        selected: true
      };

      const textSections: Section[] = [
        {
          id: 'introduction',
          type: 'text',
          title: documentTitle,
          content: structure.introduction,
          selected: true
        },
        ...structure.mainConcepts.map((concept, index) => ({
          id: `concept-${index}`,
          type: 'text',
          title: concept.title,
          content: concept.content,
          selected: true
        }))
      ];

      const imageSections: Section[] = extractedImages.map((image, index) => ({
        id: `image-${index}`,
        type: 'image',
        title: `Figure ${index + 1}`,
        content: image,
        selected: false
      }));
      
      setSections([firstPageSection, ...textSections, ...imageSections]);
      setCurrentStep(3);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur lors de la génération du résumé');
    } finally {
      setProcessing(false);
    }
  };

  const handleGeneratePDF = async () => {
    const selectedSections = sections.filter(section => section.selected);
    if (selectedSections.length === 0) {
      setError('Veuillez sélectionner au moins une section');
      return;
    }

    setGeneratingPDF(true);
    setError(null);

    try {
      for (const section of selectedSections) {
        if (section.type === 'image') {
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = () => reject(new Error(`L'image "${section.title}" est invalide ou corrompue`));
            img.src = section.content;
          });
        }
      }

      await generateFinalDocument(selectedSections, documentTitle);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la génération du PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleVideoSummary = (summary: { title: string; content: string }) => {
    setSections(currentSections => [
      ...currentSections,
      {
        id: `video-${Date.now()}`,
        type: 'text',
        title: summary.title,
        content: summary.content,
        selected: true
      }
    ]);
  };

  const handleCustomContent = (content: { type: 'text' | 'image'; title: string; content: string }) => {
    setSections(currentSections => [
      ...currentSections,
      {
        id: `custom-${Date.now()}`,
        type: content.type,
        title: content.title,
        content: content.content,
        selected: true
      }
    ]);
  };

  const handleAddCover = (coverData: {
    type: 'image';
    title: string;
    content: string;
    metadata?: {
      courseCode?: string;
      subtitle?: string;
    };
  }) => {
    const newSection: Section = {
      id: `cover-${Date.now()}`,
      type: coverData.type,
      title: coverData.title,
      content: coverData.content,
      selected: true,
      metadata: coverData.metadata
    };

    setSections(currentSections => [newSection, ...currentSections]);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] overflow-x-hidden">
      <nav className="fixed left-0 top-0 h-full w-20 bg-white shadow-lg">
        <div className="flex flex-col items-center gap-8 pt-8">
          <div className="text-2xl font-bold text-blue-600">SZ</div>
          <Button
            variant={currentStep === 1 ? 'primary' : 'secondary'}
            className="w-12 h-12 rounded-full p-0"
            onClick={() => setCurrentStep(1)}
          >
            <FileUp className="h-6 w-6" />
          </Button>
          <Button
            variant={currentStep === 2 ? 'primary' : 'secondary'}
            className="w-12 h-12 rounded-full p-0"
            onClick={() => setCurrentStep(2)}
          >
            <Book className="h-6 w-6" />
          </Button>
          <Button
            variant={currentStep === 3 ? 'primary' : 'secondary'}
            className="w-12 h-12 rounded-full p-0"
            onClick={() => setCurrentStep(3)}
          >
            <Video className="h-6 w-6" />
          </Button>
        </div>
      </nav>

      <main className="ml-20 p-8 max-h-screen overflow-y-auto" ref={contentRef}>
        <div className="max-w-6xl mx-auto">
          <h1 className="course-title mb-8">SynthéZ</h1>

          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="section-title">
                Chargement du PDF
              </h2>
              <FileUpload
                onFileSelect={handleFileSelect}
                accept={{ 'application/pdf': ['.pdf'] }}
                className="h-64"
                disabled={processing}
                onProgress={setUploadProgress}
              />
              {uploadProgress > 0 && (
                <GenerationProgress currentStep={1} />
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="section-title">
                Traitement du contenu
              </h2>
              <div className="course-section p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Contenu extrait</h3>
                  <div className="max-h-[400px] overflow-y-auto p-4 bg-gray-50 rounded-md">
                    <pre className="content-text">{extractedText}</pre>
                  </div>
                </div>

                {processing && <GenerationProgress currentStep={2} />}

                <Button
                  onClick={handleGenerateSummary}
                  disabled={processing}
                  className="w-full mt-4"
                >
                  {processing ? 'Génération en cours...' : 'Générer le cours structuré'}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="section-title">
                    Organisation du contenu
                  </h2>
                  <Button 
                    onClick={handleGeneratePDF} 
                    disabled={sections.length === 0 || generatingPDF}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {generatingPDF ? 'Génération...' : 'Générer le PDF'}
                  </Button>
                </div>

                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sections.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {sections.map((section) => (
                        <ContentSection
                          key={section.id}
                          section={section}
                          onToggle={() => {
                            setSections(sections.map(s =>
                              s.id === section.id ? { ...s, selected: !s.selected } : s
                            ));
                          }}
                          onRemove={() => {
                            setSections(sections.filter(s => s.id !== section.id));
                          }}
                          onUpdate={(updatedSection) => {
                            setSections(sections.map(s =>
                              s.id === updatedSection.id ? updatedSection : s
                            ));
                          }}
                          onUpdateAll={handleColorUpdateAll}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <VideoSummary onSummaryGenerated={handleVideoSummary} />
                <CustomContent onAddContent={handleCustomContent} />
              </div>

              <div>
                <h2 className="section-title mb-6">
                  Aperçu du document
                </h2>
                <PDFPreview 
                  sections={sections.filter(s => s.selected)} 
                  onAddCover={handleAddCover}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
            aria-label="Retour en haut"
          >
            <ArrowUp className="h-6 w-6" />
          </button>
        )}
      </main>
    </div>
  );
}