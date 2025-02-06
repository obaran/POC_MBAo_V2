import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Image as ImageIcon, Plus } from 'lucide-react';

interface Section {
  id: string;
  type: 'text' | 'image';
  title: string;
  content: string;
  selected: boolean;
  metadata?: {
    courseCode?: string;
    subtitle?: string;
  };
}

interface PDFPreviewProps {
  sections: Section[];
  onAddCover: (coverData: {
    type: 'image';
    title: string;
    content: string;
    metadata?: {
      courseCode?: string;
      subtitle?: string;
    };
  }) => void;
}

export function PDFPreview({ sections, onAddCover }: PDFPreviewProps) {
  const [customCover, setCustomCover] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        // Format A4 en pixels à 300 DPI : 2480 x 3508 pixels
        if (img.width < 2480 || img.height < 3508) {
          alert("Pour une qualité optimale, l'image de couverture devrait avoir une résolution minimale de 2480 x 3508 pixels (format A4 à 300 DPI). Les images de plus petite taille peuvent apparaître pixelisées.");
        }
        setCustomCover(reader.result as string);
      };
      img.src = e.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddCover = () => {
    if (!customCover || !title.trim()) {
      alert("Veuillez ajouter une image et un titre");
      return;
    }

    onAddCover({
      type: 'image',
      title: title,
      content: customCover,
      metadata: {
        courseCode: courseCode || undefined,
        subtitle: subtitle || undefined
      }
    });

    // Réinitialiser le formulaire
    setCustomCover(null);
    setTitle('');
    setCourseCode('');
    setSubtitle('');
  };

  return (
    <div className="space-y-6">
      <div className="course-section p-6">
        <h3 className="text-lg font-semibold mb-4">Personnalisation de la couverture</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image de couverture
            </label>
            <div className="text-sm text-gray-500 mb-4">
              <p>Format recommandé :</p>
              <ul className="list-disc list-inside ml-2">
                <li>Résolution minimale : 2480 x 3508 pixels (A4 à 300 DPI)</li>
                <li>Format : JPG ou PNG</li>
                <li>Orientation : Portrait</li>
                <li>Taille maximale : 10 MB</li>
              </ul>
            </div>
            <div className="flex items-center gap-4">
              {customCover && (
                <img
                  src={customCover}
                  alt="Aperçu"
                  className="h-32 w-32 object-cover rounded-lg"
                />
              )}
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                {customCover ? 'Changer l\'image' : 'Ajouter une image'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre principal
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: MATHS & PHYSIQUES"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code du cours
            </label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="Ex: B1C1"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sous-titre
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Ex: Niveau 1"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {customCover && (
            <Button onClick={handleAddCover} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter la page de garde
            </Button>
          )}
        </div>
      </div>

      <div className="course-section p-6">
        <h3 className="text-lg font-semibold mb-4">Aperçu des sections</h3>
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <h4 className="font-medium text-gray-800">{section.title}</h4>
              {section.type === 'image' ? (
                <img
                  src={section.content}
                  alt={section.title}
                  className="mt-2 max-h-32 object-contain"
                />
              ) : (
                <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                  {section.content}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}