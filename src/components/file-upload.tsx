import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUp, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { extractContentFromPDF } from '@/lib/pdf';

interface FileUploadProps {
  onFileSelect: (text: string, images: string[], firstPage: string) => void;
  accept?: Record<string, string[]>;
  className?: string;
  disabled?: boolean;
  onProgress?: (progress: number) => void;
}

export function FileUpload({ 
  onFileSelect, 
  accept, 
  className, 
  disabled,
  onProgress 
}: FileUploadProps) {
  const handleFile = async (file: File) => {
    try {
      onProgress?.(10);
      const content = await extractContentFromPDF(file);
      onProgress?.(100);
      onFileSelect(content.text, content.images, content.firstPage);
    } catch (error) {
      console.error('Erreur lors du traitement du fichier:', error);
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!disabled && acceptedFiles.length > 0) {
      try {
        await handleFile(acceptedFiles[0]);
      } catch (error) {
        console.error('Erreur lors du dépôt du fichier:', error);
      }
    }
  }, [onFileSelect, disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
    disabled
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 cursor-pointer',
        className
      )}
    >
      <input {...getInputProps()} />
      <FileUp className="mx-auto h-12 w-12 text-gray-400" />
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          {isDragActive 
            ? 'Déposez le fichier ici...' 
            : disabled 
              ? 'Traitement en cours...'
              : 'Glissez-déposez un fichier PDF ici, ou cliquez pour parcourir'
          }
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-2"
          disabled={disabled}
        >
          <Upload className="mr-2 h-4 w-4" />
          Parcourir
        </Button>
      </div>
    </div>
  );
}