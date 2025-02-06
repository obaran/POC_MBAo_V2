import React, { useEffect, useState } from 'react';
import { Progress } from './ui/progress';
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';

interface GenerationProgressProps {
  currentStep: number;
}

export function GenerationProgress({ currentStep }: GenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [showWaitMessage, setShowWaitMessage] = useState(false);
  const steps = currentStep === 1 ? [
    { name: 'Analyse', duration: 15 },
    { name: 'Extraction', duration: 10 },
    { name: 'Structure', duration: 10 },
    { name: 'Finalisation', duration: 10 }
  ] : [
    { name: 'Préparation', duration: 8 },
    { name: 'Traitement', duration: 8 },
    { name: 'Structuration', duration: 8 },
    { name: 'Finalisation', duration: 8 }
  ];

  useEffect(() => {
    // Définir la durée en fonction de l'étape
    const duration = currentStep === 1 ? 45000 : 32000; // 45 sec pour PDF, 32 sec pour structuration
    const interval = 100; // Mise à jour toutes les 100ms
    const step = 100 / (duration / interval);
    let currentProgress = 0;

    const timer = setInterval(() => {
      currentProgress += step;
      if (currentProgress >= 100) {
        clearInterval(timer);
        currentProgress = 100;
        // Afficher le message d'attente si le chargement n'est pas terminé
        setTimeout(() => setShowWaitMessage(true), 500);
      }
      setProgress(currentProgress);
    }, interval);

    return () => {
      clearInterval(timer);
      setShowWaitMessage(false);
    };
  }, [currentStep]);

  const getCurrentStep = () => {
    const stepWidth = 100 / steps.length;
    return Math.floor(progress / stepWidth);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium text-gray-700">
          Progression
        </div>
        <div className="text-sm font-medium text-gray-700">
          {Math.round(progress)}%
        </div>
      </div>

      <Progress value={progress} className="h-2" />
      
      <div className="flex justify-between items-start px-2">
        {steps.map((step, index) => {
          const stepProgress = progress;
          const isCurrentStep = getCurrentStep() === index;
          const isCompleted = stepProgress >= ((index + 1) / steps.length) * 100;
          const isInProgress = stepProgress >= (index / steps.length) * 100;

          return (
            <div 
              key={step.name}
              className={`flex flex-col items-center gap-2 transition-colors duration-300 ${
                isCompleted ? 'text-blue-600' : 
                isInProgress ? 'text-blue-500' : 'text-gray-400'
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : isInProgress ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              <span className="text-xs font-medium whitespace-nowrap">
                {step.name}
              </span>
            </div>
          );
        })}
      </div>

      {showWaitMessage && (
        <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p>Finalisation... Veuillez patienter</p>
        </div>
      )}
    </div>
  );
}