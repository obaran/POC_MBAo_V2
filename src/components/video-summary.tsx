import React, { useState } from 'react';
import { Button } from './ui/button';
import { FileUp } from 'lucide-react';
import { generateVideoSummary } from '@/lib/ai';
import { parseSRT } from '@/lib/srt';

interface VideoSummaryProps {
  onSummaryGenerated: (summary: any) => void;
}

export function VideoSummary({ onSummaryGenerated }: VideoSummaryProps) {
  const [script, setScript] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSRTUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const extractedText = parseSRT(content);
      setScript(extractedText);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur lors de la lecture du fichier SRT');
    }
  };

  const handleGenerateSummary = async () => {
    if (!script.trim()) {
      setError('Veuillez entrer un script vidéo ou charger un fichier SRT');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const summary = await generateVideoSummary(script);
      onSummaryGenerated(summary);
      setScript('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Synthèse de la vidéo
      </h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="script" className="block text-sm font-medium text-gray-700 mb-2">
            Script de la vidéo
          </label>
          <div className="space-y-4">
            <textarea
              id="script"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="w-full h-40 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Collez le script de votre vidéo ici ou chargez un fichier SRT..."
            />

            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <label
                  htmlFor="srt-upload"
                  className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Charger un fichier SRT
                </label>
                <input
                  id="srt-upload"
                  type="file"
                  accept=".srt"
                  onChange={handleSRTUpload}
                  className="hidden"
                />
              </div>

              <Button
                onClick={handleGenerateSummary}
                disabled={processing}
                className="flex-shrink-0"
              >
                {processing ? 'Génération en cours...' : 'Générer la synthèse'}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}