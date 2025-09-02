import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  BookOpen, 
  PlayCircle, 
  MessageCircle,
  Bell,
  BellOff,
  Settings,
  Star,
  Target,
  Zap
} from 'lucide-react';
import HelpCenter from './HelpCenter';
import { cn } from '@/lib/utils';

// =====================================================
// INTERFACES
// =====================================================

interface HelpButtonProps {
  variant?: 'default' | 'floating' | 'minimal';
  showBadge?: boolean;
  className?: string;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function HelpButton({ 
  variant = 'default', 
  showBadge = true,
  className 
}: HelpButtonProps) {
  const {
    availableFlows,
    completedFlows,
    isActive,
    startTutorial,
    autoStart,
    showHints,
    enableSounds,
    setAutoStart,
    setShowHints,
    setEnableSounds
  } = useTutorial();

  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  // =====================================================
  // FUNCIONES AUXILIARES
  // =====================================================

  const getAvailableTutorialsCount = () => {
    return availableFlows.filter(flow => !completedFlows.includes(flow.id)).length;
  };

  const getQuickActions = () => [
    {
      id: 'welcome-tour',
      label: 'Tour de Bienvenida',
      icon: Target,
      description: 'Conoce las funcionalidades principales',
      action: () => startTutorial('welcome-tour'),
      available: !completedFlows.includes('welcome-tour')
    },
    {
      id: 'project-management',
      label: 'Gestión de Proyectos',
      icon: BookOpen,
      description: 'Aprende a gestionar proyectos',
      action: () => startTutorial('project-management'),
      available: !completedFlows.includes('project-management')
    },
    {
      id: 'help-center',
      label: 'Centro de Ayuda',
      icon: HelpCircle,
      description: 'Busca respuestas y documentación',
      action: () => setIsHelpCenterOpen(true),
      available: true
    },
    {
      id: 'contact-support',
      label: 'Contactar Soporte',
      icon: MessageCircle,
      description: 'Habla con nuestro equipo',
      action: () => {
        // Implementar chat de soporte
        console.log('Abrir chat de soporte');
      },
      available: true
    }
  ];

  // =====================================================
  // RENDERIZADO POR VARIANTE
  // =====================================================

  if (variant === 'minimal') {
    return (
      <div className={cn("relative", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsHelpCenterOpen(true)}
          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700"
        >
          <HelpCircle className="w-4 h-4" />
        </Button>
        {showBadge && getAvailableTutorialsCount() > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {getAvailableTutorialsCount()}
          </Badge>
        )}
        <HelpCenter 
          isOpen={isHelpCenterOpen} 
          onClose={() => setIsHelpCenterOpen(false)} 
        />
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative">
            <Button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-2xl"
            >
              <HelpCircle className="w-6 h-6" />
            </Button>
            
            {showBadge && getAvailableTutorialsCount() > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center text-xs font-bold"
              >
                {getAvailableTutorialsCount()}
              </Badge>
            )}

            {/* Quick Menu */}
            {showQuickMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Centro de Ayuda</h3>
                      <p className="text-xs text-slate-500">Acceso rápido a la ayuda</p>
                    </div>
                  </div>

                  {getQuickActions().map((action) => (
                    <Button
                      key={action.id}
                      variant="ghost"
                      onClick={() => {
                        action.action();
                        setShowQuickMenu(false);
                      }}
                      disabled={!action.available}
                      className="w-full justify-start h-auto p-3 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg",
                          action.available 
                            ? "bg-blue-100 text-blue-600" 
                            : "bg-slate-100 text-slate-400"
                        )}>
                          <action.icon className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-slate-800">
                            {action.label}
                          </div>
                          <div className="text-xs text-slate-500">
                            {action.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}

                  <div className="pt-3 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsHelpCenterOpen(true);
                        setShowQuickMenu(false);
                      }}
                      className="w-full"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Ver Todo
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        <HelpCenter 
          isOpen={isHelpCenterOpen} 
          onClose={() => setIsHelpCenterOpen(false)} 
        />
      </div>
    );
  }

  // Variant default
  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        onClick={() => setIsHelpCenterOpen(true)}
        className="relative h-10 px-4 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
      >
        <HelpCircle className="w-4 h-4 mr-2" />
        Ayuda
        {showBadge && getAvailableTutorialsCount() > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {getAvailableTutorialsCount()}
          </Badge>
        )}
      </Button>

      <HelpCenter 
        isOpen={isHelpCenterOpen} 
        onClose={() => setIsHelpCenterOpen(false)} 
      />
    </div>
  );
}

// =====================================================
// COMPONENTE DE CONFIGURACIÓN DE AYUDA
// =====================================================

export function HelpSettings() {
  const {
    autoStart,
    showHints,
    enableSounds,
    setAutoStart,
    setShowHints,
    setEnableSounds
  } = useTutorial();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-slate-800">Auto-iniciar tutoriales</h4>
          <p className="text-sm text-slate-500">
            Iniciar automáticamente tutoriales para nuevos usuarios
          </p>
        </div>
        <Button
          variant={autoStart ? "default" : "outline"}
          size="sm"
          onClick={() => setAutoStart(!autoStart)}
        >
          {autoStart ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-slate-800">Mostrar hints</h4>
          <p className="text-sm text-slate-500">
            Mostrar consejos y sugerencias contextuales
          </p>
        </div>
        <Button
          variant={showHints ? "default" : "outline"}
          size="sm"
          onClick={() => setShowHints(!showHints)}
        >
          {showHints ? <Zap className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-slate-800">Sonidos de notificación</h4>
          <p className="text-sm text-slate-500">
            Reproducir sonidos para notificaciones del tutorial
          </p>
        </div>
        <Button
          variant={enableSounds ? "default" : "outline"}
          size="sm"
          onClick={() => setEnableSounds(!enableSounds)}
        >
          {enableSounds ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
