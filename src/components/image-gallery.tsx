import React, { useState } from 'react';
import { Button } from './ui/button';
import { Plus, X } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  onAddImages: () => void;
}

export function ImageGallery({ images, onAddImages }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <img
              src={image}
              alt={`Image ${index + 1}`}
              className="w-full h-48 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
              onClick={() => setSelectedImage(image)}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg">
              <span className="text-white text-sm">Cliquer pour agrandir</span>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={onAddImages} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Ajouter les images à la synthèse
      </Button>

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <img
              src={selectedImage}
              alt="Image agrandie"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 text-white hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}