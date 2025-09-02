import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  SkipForward, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  HelpCircle,
  Lightbulb,
  Target,
  Clock,
  CheckCircle,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function TutorialOverlay() {
  const {
    isActive,
    currentFlow,
    currentStep,
    stepIndex,
    progress,
    nextStep,
    prevStep,
    skipStep,
    exitTutorial,
    enableSounds,
    setEnableSounds
  } = useTutorial();

  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // =====================================================
  // EFECTOS
  // =====================================================

  // Encontrar y posicionar el elemento objetivo
  useEffect(() => {
    if (!isActive || !currentStep) {
      setTargetElement(null);
      return;
    }

    const findTargetElement = () => {
      const element = document.querySelector(currentStep.target) as HTMLElement;
      if (element) {
        setTargetElement(element);
        updateOverlayPosition(element);
      } else {
        // Si no se encuentra el elemento, usar posición central
        setOverlayPosition({
          x: window.innerWidth / 2 - 200,
          y: window.innerHeight / 2 - 150,
          width: 400,
          height: 300
        });
      }
    };

    // Buscar el elemento con un pequeño delay para asegurar que esté renderizado
    const timeoutId = setTimeout(findTargetElement, 100);

    // Actualizar posición en scroll y resize
    const updatePosition = () => {
      if (targetElement) {
        updateOverlayPosition(targetElement);
      }
    };

    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isActive, currentStep, targetElement]);

  // =====================================================
  // FUNCIONES AUXILIARES
  // =====================================================

  const updateOverlayPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const padding = 20;
    
    let x = rect.left - padding;
    let y = rect.top - padding;
    let width = rect.width + (padding * 2);
    let height = rect.height + (padding * 2);

    // Ajustar posición según la posición del tooltip
    switch (currentStep?.position) {
      case 'top':
        y = rect.top - 200 - padding;
        break;
      case 'bottom':
        y = rect.bottom + padding;
        break;
      case 'left':
        x = rect.left - 300 - padding;
        break;
      case 'right':
        x = rect.right + padding;
        break;
      case 'center':
        x = window.innerWidth / 2 - 200;
        y = window.innerHeight / 2 - 150;
        width = 400;
        height = 300;
        break;
    }

    setOverlayPosition({ x, y, width, height });
  };

  const handleAction = () => {
    if (!currentStep) return;

    switch (currentStep.action) {
      case 'click':
        if (targetElement) {
          targetElement.click();
        }
        break;
      case 'hover':
        // Simular hover
        if (targetElement) {
          targetElement.dispatchEvent(new MouseEvent('mouseenter'));
        }
        break;
      case 'scroll':
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        break;
    }
  };

  const getProgressPercentage = () => {
    if (!currentFlow || !progress) return 0;
    return ((stepIndex + 1) / currentFlow.steps.length) * 100;
  };

  const getEstimatedTimeRemaining = () => {
    if (!currentFlow || !progress) return 0;
    const remainingSteps = currentFlow.steps.length - stepIndex - 1;
    return Math.max(0, remainingSteps * 2); // 2 minutos por paso estimado
  };

  // =====================================================
  // RENDERIZADO
  // =====================================================

  if (!isActive || !currentFlow || !currentStep) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] pointer-events-none"
      >
        {/* Overlay de fondo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Highlight del elemento objetivo */}
        {targetElement && currentStep.position !== 'center' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute border-4 border-blue-500 rounded-lg shadow-2xl"
            style={{
              left: overlayPosition.x,
              top: overlayPosition.y,
              width: overlayPosition.width,
              height: overlayPosition.height,
              boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)'
            }}
          />
        )}

        {/* Tooltip del tutorial */}
        <motion.div
          ref={overlayRef}
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "absolute pointer-events-auto",
            "bg-white rounded-2xl shadow-2xl border border-slate-200",
            "max-w-md w-full mx-4"
          )}
          style={{
            left: currentStep.position === 'left' ? overlayPosition.x - 320 : 
                  currentStep.position === 'right' ? overlayPosition.x + overlayPosition.width + 20 :
                  currentStep.position === 'center' ? overlayPosition.x : 
                  Math.min(overlayPosition.x, window.innerWidth - 400),
            top: currentStep.position === 'top' ? overlayPosition.y - 250 :
                 currentStep.position === 'bottom' ? overlayPosition.y + overlayPosition.height + 20 :
                 currentStep.position === 'center' ? overlayPosition.y :
                 Math.min(overlayPosition.y, window.innerHeight - 300)
          }}
        >
          {/* Header del tutorial */}
          <div className="relative">
            {/* Progreso */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 rounded-t-2xl overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${getProgressPercentage()}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Contenido del header */}
            <CardHeader className="pb-4 pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white text-lg">
                    {currentFlow.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg text-slate-800">
                      {currentStep.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Paso {stepIndex + 1} de {currentFlow.steps.length}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {getEstimatedTimeRemaining()} min restantes
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controles del header */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEnableSounds(!enableSounds)}
                    className="h-8 w-8 p-0"
                  >
                    {enableSounds ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={exitTutorial}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Contenido principal */}
            <CardContent className="space-y-4">
              {/* Descripción */}
              <p className="text-slate-600 leading-relaxed">
                {currentStep.description}
              </p>

              {/* Tips */}
              {currentStep.tips && currentStep.tips.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Consejos útiles</span>
                  </div>
                  <ul className="space-y-1">
                    {currentStep.tips.map((tip, index) => (
                      <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Acción requerida */}
              {currentStep.action && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-800">Acción requerida</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">
                    {currentStep.actionText}
                  </p>
                  <Button
                    onClick={handleAction}
                    size="sm"
                    className="bg-slate-800 hover:bg-slate-900 text-white"
                  >
                    {currentStep.action === 'click' && <CheckCircle className="w-4 h-4 mr-2" />}
                    {currentStep.action === 'hover' && <HelpCircle className="w-4 h-4 mr-2" />}
                    {currentStep.action === 'scroll' && <ChevronRight className="w-4 h-4 mr-2" />}
                    {currentStep.action === 'wait' && <Clock className="w-4 h-4 mr-2" />}
                    Ejecutar Acción
                  </Button>
                </div>
              )}

              {/* Controles de navegación */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    disabled={stepIndex === 0}
                    className="h-9"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                  
                  {currentStep.skipable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={skipStep}
                      className="h-9 text-slate-500 hover:text-slate-700"
                    >
                      <SkipForward className="w-4 h-4 mr-1" />
                      Omitir
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {stepIndex === currentFlow.steps.length - 1 ? (
                    <Button
                      onClick={nextStep}
                      className="h-9 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Completar
                    </Button>
                  ) : (
                    <Button
                      onClick={nextStep}
                      className="h-9 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
