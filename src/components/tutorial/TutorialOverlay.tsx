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
// HOOK PARA RESPONSIVIDAD
// =====================================================

const useResponsiveTutorial = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setScreenSize({ width, height });
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  return { isMobile, isTablet, screenSize };
};

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function TutorialOverlay() {
  const navigate = useNavigate();
  const { isMobile, isTablet, screenSize } = useResponsiveTutorial();
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

    // Navegación automática si está configurada
    if (currentStep.autoNavigate && currentStep.action === 'navigate' && currentStep.navigateTo) {
      const autoNavigateTimeout = setTimeout(() => {
        try {
          navigate(currentStep.navigateTo);
        } catch (error) {
          console.error('❌ Error en navegación automática:', error);
        }
      }, 100); // Delay mínimo para que se muestre el modal

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(autoNavigateTimeout);
      };
    }

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
  }, [isActive, currentStep, targetElement, navigate]);

  // =====================================================
  // FUNCIONES AUXILIARES
  // =====================================================

  const updateOverlayPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const padding = isMobile ? 10 : 20;
    
    let x = rect.left - padding;
    let y = rect.top - padding;
    let width = rect.width + (padding * 2);
    let height = rect.height + (padding * 2);

    // Ajustar posición según la posición del tooltip y dispositivo
    switch (currentStep?.position) {
      case 'top':
        y = rect.top - (isMobile ? 200 : 250) - padding;
        break;
      case 'bottom':
        y = rect.bottom + padding;
        break;
      case 'left':
        x = rect.left - (isMobile ? 280 : 350) - padding;
        break;
      case 'right':
        x = rect.right + padding;
        break;
      case 'center':
        x = screenSize.width / 2 - (isMobile ? 160 : 200);
        y = screenSize.height / 2 - (isMobile ? 120 : 150);
        width = isMobile ? 320 : 400;
        height = isMobile ? 240 : 300;
        break;
    }

    // Asegurar que el overlay no se salga de la pantalla
    const maxWidth = isMobile ? 340 : 420;
    const maxHeight = isMobile ? 260 : 320;
    x = Math.max(10, Math.min(x, screenSize.width - maxWidth));
    y = Math.max(10, Math.min(y, screenSize.height - maxHeight));

    setOverlayPosition({ x, y, width, height });
  };

  const handleAction = async () => {
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
      case 'navigate':
        // Manejar navegación directamente
        if (currentStep.navigateTo) {
          try {
            navigate(currentStep.navigateTo);
          } catch (error) {
            console.error('Error during navigation:', error);
          }
        }
        break;
      case 'wait':
        // Para acciones de espera, avanzar al siguiente paso
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



  // Función para calcular posición responsive del tooltip
  const getTooltipPosition = () => {
    const tooltipWidth = isMobile ? 320 : isTablet ? 360 : 400;
    const tooltipHeight = isMobile ? 300 : isTablet ? 350 : 400;
    
    // Siempre usar posición central en móviles para mejor UX
    if (isMobile) {
      return {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${tooltipWidth}px`,
        maxWidth: '90vw',
        maxHeight: '90vh'
      };
    }
    
    // En tablet, usar posición central también para mejor experiencia
    if (isTablet) {
      return {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${tooltipWidth}px`,
        maxWidth: '80vw',
        maxHeight: '80vh'
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
    if (left + tooltipWidth > screenSize.width - 20) {
      left = rect.left - tooltipWidth - padding;
    }
    
    // Ajustar si se sale por abajo
    if (top + tooltipHeight > screenSize.height - 20) {
      top = screenSize.height - tooltipHeight - 20;
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
        {/* Overlay de fondo - Solo en desktop y tablet */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
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
                  "bg-white rounded-2xl shadow-2xl border-2 border-slate-300",
                  // Mejoras de contraste
                  "ring-2 ring-blue-100 ring-opacity-50",
                  // Responsive classes mejoradas
                  isMobile ? "w-[90vw] max-w-[90vw]" : isTablet ? "w-[80vw] max-w-[80vw]" : "w-auto",
                  isMobile ? "text-sm" : isTablet ? "text-sm" : "text-base",
                  isMobile ? "mx-4" : "mx-0",
                  // Mejoras para touch
                  "touch-manipulation",
                  "select-none"
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
            <CardHeader className={cn(
              "pb-3 pt-4",
              isMobile ? "px-4" : "px-6"
            )}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={cn(
                    "flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl text-white flex-shrink-0 shadow-lg",
                    "ring-2 ring-blue-200 ring-opacity-50",
                    isMobile ? "w-8 h-8 text-sm" : isTablet ? "w-9 h-9 text-base" : "w-10 h-10 text-lg"
                  )}>
                    {currentFlow.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                                            <CardTitle className={cn(
                          "text-slate-900 leading-tight font-bold",
                          isMobile ? "text-base" : isTablet ? "text-lg" : "text-xl"
                        )}>
                          {currentStep.title}
                        </CardTitle>
                    <div className={cn(
                      "flex items-center gap-2 mt-1",
                      isMobile ? "flex-col" : "flex-row"
                    )}>
                      <Badge variant="secondary" className="text-xs w-fit bg-blue-100 text-blue-800 border border-blue-200">
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
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEnableSounds(!enableSounds)}
                    className={cn(
                      "p-0 text-slate-500 hover:text-slate-700",
                      isMobile ? "h-8 w-8" : isTablet ? "h-9 w-9" : "h-8 w-8"
                    )}
                    title={enableSounds ? "Silenciar sonidos" : "Activar sonidos"}
                  >
                    {enableSounds ? (
                      <Volume2 className={cn(
                        isMobile ? "w-4 h-4" : "w-4 h-4"
                      )} />
                    ) : (
                      <VolumeX className={cn(
                        isMobile ? "w-4 h-4" : "w-4 h-4"
                      )} />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={exitTutorial}
                    className={cn(
                      "p-0 text-slate-500 hover:text-red-600",
                      isMobile ? "h-8 w-8" : isTablet ? "h-9 w-9" : "h-8 w-8"
                    )}
                    title="Cerrar tutorial"
                  >
                    <X className={cn(
                      isMobile ? "w-4 h-4" : "w-4 h-4"
                    )} />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Contenido principal */}
            <CardContent className={cn(
              "space-y-3",
              isMobile ? "px-4" : "px-6"
            )}>
              {/* Descripción */}
                                <p className={cn(
                    "text-slate-700 leading-relaxed font-medium",
                    isMobile ? "text-sm" : isTablet ? "text-base" : "text-lg"
                  )}>
                    {currentStep.description}
                  </p>

              {/* Tips */}
              {currentStep.tips && currentStep.tips.length > 0 && (
                <div className={cn(
                  "bg-blue-50 border border-blue-200 rounded-lg",
                  isMobile ? "p-2" : "p-3"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className={cn(
                      "text-blue-600",
                      isMobile ? "w-3 h-3" : "w-4 h-4"
                    )} />
                    <span className={cn(
                      "font-medium text-blue-800",
                      isMobile ? "text-xs" : "text-sm"
                    )}>Consejos útiles</span>
                  </div>
                  <ul className="space-y-1">
                    {currentStep.tips.map((tip, index) => (
                      <li key={index} className={cn(
                        "text-blue-700 flex items-start gap-2",
                        isMobile ? "text-xs" : "text-sm"
                      )}>
                        <span className="text-blue-500 mt-1 flex-shrink-0">•</span>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Acción requerida - Solo mostrar si no es navegación automática */}
              {currentStep.action && currentStep.action !== 'navigate' && (
                <div className={cn(
                  "bg-slate-50 border border-slate-200 rounded-lg",
                  isMobile ? "p-2" : "p-3"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className={cn(
                      "text-slate-600",
                      isMobile ? "w-3 h-3" : "w-4 h-4"
                    )} />
                    <span className={cn(
                      "font-medium text-slate-800",
                      isMobile ? "text-xs" : "text-sm"
                    )}>Acción requerida</span>
                  </div>
                  <p className={cn(
                    "text-slate-600 mb-3 leading-relaxed",
                    isMobile ? "text-xs" : "text-sm"
                  )}>
                    {currentStep.actionText}
                  </p>
                  <Button
                    onClick={handleAction}
                    size="sm"
                    className={cn(
                      "bg-slate-800 hover:bg-slate-900 text-white",
                      isMobile ? "w-full text-sm h-10" : "w-auto text-sm h-9"
                    )}
                  >
                    {currentStep.action === 'click' && <CheckCircle className={cn(
                      "mr-2",
                      isMobile ? "w-4 h-4" : "w-4 h-4"
                    )} />}
                    {currentStep.action === 'hover' && <HelpCircle className={cn(
                      "mr-2",
                      isMobile ? "w-4 h-4" : "w-4 h-4"
                    )} />}
                    {currentStep.action === 'scroll' && <ChevronRight className={cn(
                      "mr-2",
                      isMobile ? "w-4 h-4" : "w-4 h-4"
                    )} />}
                    {currentStep.action === 'wait' && <Clock className={cn(
                      "mr-2",
                      isMobile ? "w-4 h-4" : "w-4 h-4"
                    )} />}
                    Ejecutar Acción
                  </Button>
                </div>
              )}



              {/* Controles de navegación */}
              <div className={cn(
                "flex items-stretch justify-between gap-3 pt-3 border-t border-slate-200",
                isMobile ? "flex-col" : "flex-row items-center gap-2"
              )}>
                <div className={cn(
                  "flex items-center gap-2",
                  isMobile ? "order-2" : "order-1"
                )}>
                                      <Button
                      variant="outline"
                      size="sm"
                      onClick={prevStep}
                      disabled={stepIndex === 0}
                      className={cn(
                        "text-sm border-2 border-slate-300 hover:border-slate-400",
                        "focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
                        "transition-all duration-200",
                        isMobile ? "h-10 flex-1" : "h-9 flex-none"
                      )}
                    >
                    <ChevronLeft className={cn(
                      "mr-1",
                      isMobile ? "w-4 h-4" : "w-4 h-4"
                    )} />
                    <span className={isMobile ? "inline" : "inline"}>Anterior</span>
                  </Button>
                  
                  {currentStep.skipable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={skipStep}
                      className={cn(
                        "text-slate-500 hover:text-slate-700 text-sm",
                        isMobile ? "h-10" : "h-9"
                      )}
                    >
                      <SkipForward className={cn(
                        "mr-1",
                        isMobile ? "w-4 h-4" : "w-4 h-4"
                      )} />
                      <span className={isMobile ? "inline" : "inline"}>Omitir</span>
                    </Button>
                  )}
                </div>

                <div className={cn(
                  "flex items-center gap-2",
                  isMobile ? "order-1" : "order-2"
                )}>
                  {stepIndex === currentFlow.steps.length - 1 ? (
                    <Button
                      onClick={nextStep}
                      className={cn(
                        "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm",
                        isMobile ? "h-10 flex-1" : "h-9 flex-none"
                      )}
                    >
                      <Star className={cn(
                        "mr-2",
                        isMobile ? "w-4 h-4" : "w-4 h-4"
                      )} />
                      <span className={isMobile ? "inline" : "inline"}>Completar</span>
                    </Button>
                  ) : (
                                          <Button
                        onClick={async () => {
                          // Manejar navegación si es necesario
                          if (currentStep?.action === 'navigate' && currentStep.navigateTo) {
                            try {
                              // Navegar inmediatamente
                              navigate(currentStep.navigateTo);
                              // Avanzar al siguiente paso inmediatamente
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
                        className={cn(
                          "bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white text-sm",
                          "shadow-lg hover:shadow-xl transition-all duration-200",
                          "ring-2 ring-blue-200 ring-opacity-50 hover:ring-opacity-75",
                          isMobile ? "h-10 flex-1" : "h-9 flex-none"
                        )}
                      >
                      <span className={isMobile ? "inline" : "inline"}>Siguiente</span>
                      <ChevronRight className={cn(
                        "ml-1",
                        isMobile ? "w-4 h-4" : "w-4 h-4"
                      )} />
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
