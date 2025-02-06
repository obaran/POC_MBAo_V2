import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from './ui/button';
import { Crop as CropIcon, X } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (croppedImage: string) => void;
  onClose: () => void;
}

export function ImageCropper({ imageUrl, onCrop, onClose }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const imageRef = useRef<HTMLImageElement>(null);

  const getCroppedImg = () => {
    if (!imageRef.current) return;

    const image = imageRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width! * scaleX;
    canvas.height = crop.height! * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      image,
      crop.x! * scaleX,
      crop.y! * scaleY,
      crop.width! * scaleX,
      crop.height! * scaleY,
      0,
      0,
      crop.width! * scaleX,
      crop.height! * scaleY
    );

    const base64Image = canvas.toDataURL('image/jpeg', 1.0);
    onCrop(base64Image);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Rogner l'image
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto mb-4">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            aspect={undefined}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Image à rogner"
              className="max-w-full"
            />
          </ReactCrop>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button
            onClick={getCroppedImg}
          >
            <CropIcon className="h-4 w-4 mr-2" />
            Appliquer
          </Button>
        </div>
      </div>
    </div>
  );
}