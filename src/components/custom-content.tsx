import React, { useState } from 'react';
import { Plus, FileImage, Type } from 'lucide-react';
import { Button } from './ui/button';

interface CustomContentProps {
  onAddContent: (content: { type: 'text' | 'image'; title: string; content: string }) => void;
}

export function CustomContent({ onAddContent }: CustomContentProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [contentType, setContentType] = useState<'text' | 'image' | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentType || !title.trim() || !content.trim()) return;

    onAddContent({
      type: contentType,
      title: title.trim(),
      content: content.trim()
    });

    // Reset form
    setIsAdding(false);
    setContentType(null);
    setTitle('');
    setContent('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setContent(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (!isAdding) {
    return (
      <div className="course-section p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Contenu personnalisé
        </h2>
        <div className="flex gap-4">
          <Button
            onClick={() => {
              setIsAdding(true);
              setContentType('text');
            }}
            className="flex-1"
          >
            <Type className="h-4 w-4 mr-2" />
            Ajouter du texte
          </Button>
          <Button
            onClick={() => {
              setIsAdding(true);
              setContentType('image');
            }}
            className="flex-1"
          >
            <FileImage className="h-4 w-4 mr-2" />
            Ajouter une image
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-section p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        {contentType === 'text' ? 'Ajouter du texte' : 'Ajouter une image'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Titre de la section
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Entrez un titre"
            required
          />
        </div>

        {contentType === 'text' ? (
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Contenu
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-40 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Entrez votre texte ici..."
              required
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
            {content && (
              <div className="mt-4">
                <img
                  src={content}
                  alt="Aperçu"
                  className="max-h-48 rounded-md"
                />
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setIsAdding(false);
              setContentType(null);
              setTitle('');
              setContent('');
            }}
          >
            Annuler
          </Button>
          <Button type="submit">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </form>
    </div>
  );
}