import React from 'react';

interface PDFViewerProps {
  text: string;
  images: string[];
}

export function PDFViewer({ text, images }: PDFViewerProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Texte extrait</h3>
        <div className="whitespace-pre-wrap text-gray-700">{text}</div>
      </div>

      {images.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Images et schémas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((src, index) => (
              <div key={index} className="relative group">
                <img
                  src={src}
                  alt={`Image ${index + 1}`}
                  className="w-full h-auto rounded-lg cursor-pointer transition-transform hover:scale-105"
                  onClick={() => window.open(src, '_blank')}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg">
                  <span className="text-white text-sm">Cliquer pour agrandir</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}