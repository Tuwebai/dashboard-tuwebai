import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FolderOpen, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Calendar,
  Code,
  Settings,
  Clock,
  X
} from 'lucide-react';
import { Project } from '@/types/project.types';
import { formatDateSafe } from '@/utils/formatDateSafe';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onView: (project: Project) => void;
  onUpdateIcon?: (projectId: string, iconName: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  onView,
  onUpdateIcon
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(project.customicon || 'FolderOpen');

  // Iconos disponibles para personalización
  const availableIcons = [
    { name: 'FolderOpen', icon: FolderOpen, label: 'Carpeta' },
    { name: 'Code', icon: Code, label: 'Código' },
    { name: 'Settings', icon: Settings, label: 'Configuración' },
    { name: 'Clock', icon: Clock, label: 'Reloj' },
    { name: 'ExternalLink', icon: ExternalLink, label: 'Enlace' },
    { name: 'Calendar', icon: Calendar, label: 'Calendario' },
    { name: 'Edit', icon: Edit, label: 'Editar' }
  ];

  const getIconComponent = (iconName: string) => {
    const iconData = availableIcons.find(icon => icon.name === iconName);
    return iconData ? iconData.icon : FolderOpen;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'development':
        return 'bg-blue-500 text-white';
      case 'production':
        return 'bg-green-500 text-white';
      case 'paused':
        return 'bg-yellow-500 text-white';
      case 'maintenance':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'development':
        return 'Desarrollo';
      case 'production':
        return 'Producción';
      case 'paused':
        return 'Pausado';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'development':
        return <Code className="h-4 w-4" />;
      case 'production':
        return <Settings className="h-4 w-4" />;
      case 'paused':
        return <Clock className="h-4 w-4" />;
      case 'maintenance':
        return <Settings className="h-4 w-4" />;
      default:
        return <FolderOpen className="h-4 w-4" />;
    }
  };

  const handleDelete = () => {
    setShowConfirmDelete(false);
    onDelete(project);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card 
      className="bg-zinc-800 border-zinc-700 hover:border-zinc-600 transition-colors cursor-pointer group"
      onClick={(e) => {
        // Evitar que se active cuando se hace click en botones
        if (!(e.target as HTMLElement).closest('button')) {
          onView(project);
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
                         <button
               onClick={(e) => {
                 e.stopPropagation();
                 setShowIconPicker(true);
               }}
               className="h-10 w-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center hover:from-green-500 hover:to-blue-500 transition-all duration-200 cursor-pointer"
               title="Cambiar icono"
             >
               {React.createElement(getIconComponent(selectedIcon), { className: "h-5 w-5 text-white" })}
             </button>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                {project.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor(project.status)}>
                  {getStatusIcon(project.status)}
                  <span className="ml-1">{getStatusLabel(project.status)}</span>
                </Badge>
                {!project.is_active && (
                  <Badge variant="destructive" className="text-xs">
                    Inactivo
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
              className="text-gray-400 hover:text-blue-400 hover:bg-zinc-700"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirmDelete(true);
              }}
              className="text-gray-400 hover:text-red-400 hover:bg-zinc-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Descripción */}
        {project.description && (
          <p className="text-gray-300 text-sm leading-relaxed">
            {truncateText(project.description, 150)}
          </p>
        )}

        {/* Tecnologías */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="space-y-2 group/tech">
            <h4 className="text-sm font-medium text-gray-400 hover:text-blue-300 transition-colors cursor-pointer">
              Tecnologías
            </h4>
            <div className="flex flex-wrap gap-1 opacity-0 group-hover/tech:opacity-100 transition-opacity duration-200">
              {project.technologies.slice(0, 5).map((tech, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-blue-500/5 text-blue-100 border-blue-500/10 text-xs"
                >
                  {tech}
                </Badge>
              ))}
              {project.technologies.length > 5 && (
                <Badge variant="secondary" className="bg-gray-500/5 text-gray-100 border-gray-500/10 text-xs">
                  +{project.technologies.length - 5} más
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Variables de entorno */}
        {project.environment_variables && Object.keys(project.environment_variables).length > 0 && (
          <div className="space-y-2 group/env">
            <h4 className="text-sm font-medium text-gray-400 hover:text-purple-300 transition-colors cursor-pointer">
              Variables de Entorno
            </h4>
            <div className="flex flex-wrap gap-1 opacity-0 group-hover/env:opacity-100 transition-opacity duration-200">
              {Object.keys(project.environment_variables).slice(0, 3).map((key) => (
                <Badge
                  key={key}
                  variant="secondary"
                  className="bg-purple-500/5 text-purple-100 border-purple-500/10 text-xs"
                >
                  {key}
                </Badge>
              ))}
              {Object.keys(project.environment_variables).length > 3 && (
                <Badge variant="secondary" className="bg-gray-500/5 text-gray-100 border-gray-500/10 text-xs">
                  +{Object.keys(project.environment_variables).length - 3} más
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* GitHub Repository */}
        {project.github_repository_url && (
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-gray-400" />
            <a
              href={project.github_repository_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm truncate"
            >
              Ver en GitHub
            </a>
          </div>
        )}

        {/* Fechas */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-zinc-700">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Creado: {formatDateSafe(project.created_at)}</span>
          </div>
          {project.updated_at !== project.created_at && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Actualizado: {formatDateSafe(project.updated_at)}</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Confirmación de eliminación */}
      {showConfirmDelete && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 max-w-sm mx-4">
            <h3 className="text-white font-semibold mb-2">Confirmar eliminación</h3>
            <p className="text-gray-300 text-sm mb-4">
              ¿Estás seguro de que quieres eliminar el proyecto "{project.name}"? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmDelete(false)}
                className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de selección de iconos */}
      {showIconPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Personalizar Icono</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowIconPicker(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-4 gap-3 mb-4">
              {availableIcons.map((iconData) => (
                <button
                  key={iconData.name}
                  onClick={() => {
                    setSelectedIcon(iconData.name);
                    // Aquí podrías llamar a una función para actualizar el proyecto
                    
                  }}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    selectedIcon === iconData.name
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-zinc-600 bg-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 bg-gradient-to-br from-green-600 to-blue-600 rounded flex items-center justify-center">
                      {React.createElement(iconData.icon, { className: "h-4 w-4 text-white" })}
                    </div>
                    <span className="text-xs text-gray-300">{iconData.label}</span>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowIconPicker(false)}
                className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (onUpdateIcon) {
                    onUpdateIcon(project.id, selectedIcon);
                  }
                  setShowIconPicker(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
