import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
    const isMobile = window.innerWidth < 768;
    
    let x = rect.left - padding;
    let y = rect.top - padding;
    let width = rect.width + (padding * 2);
    let height = rect.height + (padding * 2);

    // Ajustar posición según la posición del tooltip y dispositivo
    switch (currentStep?.position) {
      case 'top':
        y = rect.top - (isMobile ? 150 : 200) - padding;
        break;
      case 'bottom':
        y = rect.bottom + padding;
        break;
      case 'left':
        x = rect.left - (isMobile ? 200 : 300) - padding;
        break;
      case 'right':
        x = rect.right + padding;
        break;
      case 'center':
        x = window.innerWidth / 2 - (isMobile ? 150 : 200);
        y = window.innerHeight / 2 - (isMobile ? 100 : 150);
        width = isMobile ? 300 : 400;
        height = isMobile ? 200 : 300;
        break;
    }

    // Asegurar que el overlay no se salga de la pantalla
    x = Math.max(10, Math.min(x, window.innerWidth - (isMobile ? 320 : 420)));
    y = Math.max(10, Math.min(y, window.innerHeight - (isMobile ? 220 : 320)));

    setOverlayPosition({ x, y, width, height });
  };

  const handleAction = async () => {
    if (!currentStep) return;

    console.log('Ejecutando acción:', currentStep.action);

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
      case 'navigate':
        // Manejar navegación directamente
        if (currentStep.navigateTo) {
          try {
            console.log('Ejecutando acción de navegación a:', currentStep.navigateTo);
            navigate(currentStep.navigateTo);
            
            // Esperar a que se complete la navegación
            if (currentStep.waitForNavigation) {
              const delay = currentStep.navigationDelay || 1000;
              console.log('Esperando navegación en acción:', delay + 'ms');
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } catch (error) {
            console.error('Error during navigation:', error);
          }
        }
        break;
      case 'wait':
        // Para acciones de espera, avanzar al siguiente paso
        console.log('Acción de espera completada, avanzando al siguiente paso');
        nextStep();
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

  // Debug logs
  console.log('TutorialOverlay render:', {
    isActive,
    currentFlow: currentFlow?.id,
    currentStep: currentStep?.id,
    currentStepTitle: currentStep?.title,
    currentStepAction: currentStep?.action,
    currentStepNavigateTo: currentStep?.navigateTo,
    stepIndex,
    targetElement: !!targetElement,
    overlayPosition
  });

  // Función para calcular posición responsive del tooltip
  const getTooltipPosition = () => {
    const isMobile = window.innerWidth < 768;
    const tooltipWidth = isMobile ? 320 : 400;
    const tooltipHeight = isMobile ? 300 : 400;
    
    // Siempre usar posición central en móviles para mejor UX
    if (isMobile) {
      return {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${tooltipWidth}px`,
        maxWidth: '90vw'
      };
    }
    
    // En desktop, calcular posición basada en el elemento objetivo
    if (currentStep.position === 'center' || !targetElement) {
      return {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${tooltipWidth}px`
      };
    }
    
    // Calcular posición relativa al elemento objetivo
    const rect = targetElement.getBoundingClientRect();
    const padding = 20;
    
    let left = rect.right + padding;
    let top = rect.top;
    
    // Ajustar si se sale por la derecha
    if (left + tooltipWidth > window.innerWidth - 20) {
      left = rect.left - tooltipWidth - padding;
    }
    
    // Ajustar si se sale por abajo
    if (top + tooltipHeight > window.innerHeight - 20) {
      top = window.innerHeight - tooltipHeight - 20;
    }
    
    // Ajustar si se sale por arriba
    if (top < 20) {
      top = 20;
    }
    
    return {
      left: `${Math.max(20, left)}px`,
      top: `${Math.max(20, top)}px`,
      width: `${tooltipWidth}px`
    };
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] pointer-events-none"
      >
        {/* Overlay de fondo - Solo en desktop */}
        {window.innerWidth >= 768 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />
        )}

        {/* Highlight del elemento objetivo - Solo para elementos específicos */}
        {targetElement && currentStep.position !== 'center' && currentStep.target !== '.main-navigation' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute border-2 border-blue-400 rounded-lg"
            style={{
              left: overlayPosition.x,
              top: overlayPosition.y,
              width: overlayPosition.width,
              height: overlayPosition.height,
              boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3), 0 0 10px rgba(59, 130, 246, 0.2)'
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
            // Responsive classes
            "w-full max-w-[90vw] sm:max-w-md md:max-w-lg",
            "text-sm sm:text-base",
            "mx-2 sm:mx-4"
          )}
          style={{
            ...getTooltipPosition(),
            zIndex: 10001
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
            <CardHeader className="pb-3 pt-4 sm:pb-4 sm:pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white text-sm sm:text-lg flex-shrink-0">
                    {currentFlow.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg text-slate-800 leading-tight">
                      {currentStep.title}
                    </CardTitle>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs w-fit">
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
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEnableSounds(!enableSounds)}
                    className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-slate-500 hover:text-slate-700"
                    title={enableSounds ? "Silenciar sonidos" : "Activar sonidos"}
                  >
                    {enableSounds ? (
                      <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : (
                      <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={exitTutorial}
                    className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-slate-500 hover:text-red-600"
                    title="Cerrar tutorial"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Contenido principal */}
            <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
              {/* Descripción */}
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                {currentStep.description}
              </p>

              {/* Tips */}
              {currentStep.tips && currentStep.tips.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                    <span className="text-xs sm:text-sm font-medium text-blue-800">Consejos útiles</span>
                  </div>
                  <ul className="space-y-1">
                    {currentStep.tips.map((tip, index) => (
                      <li key={index} className="text-xs sm:text-sm text-blue-700 flex items-start gap-2">
                        <span className="text-blue-500 mt-1 flex-shrink-0">•</span>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Acción requerida - Solo mostrar si no es navegación automática */}
              {currentStep.action && currentStep.action !== 'navigate' && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
                    <span className="text-xs sm:text-sm font-medium text-slate-800">Acción requerida</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mb-3 leading-relaxed">
                    {currentStep.actionText}
                  </p>
                  <Button
                    onClick={handleAction}
                    size="sm"
                    className="bg-slate-800 hover:bg-slate-900 text-white w-full sm:w-auto text-xs sm:text-sm"
                  >
                    {currentStep.action === 'click' && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
                    {currentStep.action === 'hover' && <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
                    {currentStep.action === 'scroll' && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
                    {currentStep.action === 'wait' && <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
                    Ejecutar Acción
                  </Button>
                </div>
              )}



              {/* Controles de navegación */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-2 pt-3 sm:pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 order-2 sm:order-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    disabled={stepIndex === 0}
                    className="h-8 sm:h-9 flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">Anterior</span>
                    <span className="sm:hidden">Ant.</span>
                  </Button>
                  
                  {currentStep.skipable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={skipStep}
                      className="h-8 sm:h-9 text-slate-500 hover:text-slate-700 text-xs sm:text-sm"
                    >
                      <SkipForward className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">Omitir</span>
                      <span className="sm:hidden">Skip</span>
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 order-1 sm:order-2">
                  {stepIndex === currentFlow.steps.length - 1 ? (
                    <Button
                      onClick={nextStep}
                      className="h-8 sm:h-9 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Completar</span>
                      <span className="sm:hidden">Finalizar</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={async () => {
                        // Manejar navegación si es necesario
                        if (currentStep?.action === 'navigate' && currentStep.navigateTo) {
                          try {
                            console.log('Navegando a:', currentStep.navigateTo);
                            
                            // Navegar inmediatamente
                            navigate(currentStep.navigateTo);
                            
                            // Esperar un poco para que se complete la navegación
                            const delay = currentStep.navigationDelay || 2000;
                            console.log('Esperando navegación:', delay + 'ms');
                            await new Promise(resolve => setTimeout(resolve, delay));
                            
                            // Avanzar al siguiente paso después de la navegación
                            console.log('Navegación completada, avanzando al siguiente paso');
                            nextStep();
                            return;
                          } catch (error) {
                            console.error('Error during navigation:', error);
                            // Si hay error, avanzar de todas formas
                            nextStep();
                          }
                        } else {
                          // Si no es navegación, avanzar normalmente
                          nextStep();
                        }
                      }}
                      className="h-8 sm:h-9 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Siguiente</span>
                      <span className="sm:hidden">Sig.</span>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
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
