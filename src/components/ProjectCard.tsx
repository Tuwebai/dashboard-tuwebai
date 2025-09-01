import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  Calendar, 
  Clock, 
  Users, 
  User,
  CheckCircle,
  Play,
  Pause,
  AlertCircle,
  Globe,
  ShoppingCart,
  Briefcase,
  Home,
  Smartphone,
  Laptop,
  Palette,
  Code,
  Database,
  Zap
} from 'lucide-react';
import { formatDateSafe } from '@/utils/formatDateSafe';

interface ProjectPhase {
  key: string;
  estado: 'Pendiente' | 'En Progreso' | 'Terminado';
  descripcion?: string;
  fechaEntrega?: string;
  archivos?: Array<{ url: string; name: string }>;
  comentarios?: Array<{
    id: string;
    texto: string;
    autor: string;
    fecha: string;
    tipo: 'admin' | 'cliente';
  }>;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  status: string;
  created_at: string;
  updated_at: string;
  type?: string;
  ownerEmail?: string;
  createdAt?: string;
  fases?: ProjectPhase[];
}

interface ProjectCardProps {
  project: Project;
  user: any;
  projectCreators: Record<string, { full_name: string; email: string }>;
  onViewProject: (project: Project) => void;
  onNavigateToCollaboration?: (projectId: string) => void;
  onNavigateToEdit?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  showAdminActions?: boolean;
  index?: number;
}

// Función para calcular progreso del proyecto
const calculateProjectProgress = (project: Project) => {
  if (!project.fases || project.fases.length === 0) return 0;
  const completedPhases = project.fases.filter((f: ProjectPhase) => f.estado === 'Terminado').length;
  return Math.round((completedPhases / project.fases.length) * 100);
};

// Función para obtener el estado del proyecto
const getProjectStatus = (project: Project) => {
  if (!project.fases || project.fases.length === 0) return 'Sin iniciar';
  
  const completedPhases = project.fases.filter((f: ProjectPhase) => f.estado === 'Terminado').length;
  const totalPhases = project.fases.length;
  
  if (completedPhases === 0) return 'Sin iniciar';
  if (completedPhases === totalPhases) return 'Completado';
  if (completedPhases > totalPhases / 2) return 'En progreso avanzado';
  return 'En progreso';
};

// Función para obtener el color del estado
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completado': return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'En progreso avanzado': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'En progreso': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'Sin iniciar': return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
  }
};

// Función para obtener el icono del estado
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Completado': return <CheckCircle className="h-4 w-4" />;
    case 'En progreso avanzado': return <Play className="h-4 w-4" />;
    case 'En progreso': return <Pause className="h-4 w-4" />;
    case 'Sin iniciar': return <Clock className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

// Función para obtener el icono contextual del tipo de proyecto
const getProjectTypeIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'landing page':
    case 'landing':
      return <Globe className="h-4 w-4" />;
    case 'ecommerce':
    case 'tienda online':
      return <ShoppingCart className="h-4 w-4" />;
    case 'corporativo':
    case 'empresa':
      return <Briefcase className="h-4 w-4" />;
    case 'portfolio':
    case 'portafolio':
      return <User className="h-4 w-4" />;
    case 'blog':
      return <MessageSquare className="h-4 w-4" />;
    case 'app móvil':
    case 'mobile':
      return <Smartphone className="h-4 w-4" />;
    case 'web app':
    case 'aplicación web':
      return <Laptop className="h-4 w-4" />;
    case 'diseño':
    case 'ui/ux':
      return <Palette className="h-4 w-4" />;
    case 'desarrollo':
    case 'programación':
      return <Code className="h-4 w-4" />;
    case 'base de datos':
    case 'database':
      return <Database className="h-4 w-4" />;
    case 'api':
    case 'backend':
      return <Zap className="h-4 w-4" />;
    default:
      return <Home className="h-4 w-4" />;
  }
};

// Función para obtener el color del tipo de proyecto
const getProjectTypeColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'landing page':
    case 'landing':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'ecommerce':
    case 'tienda online':
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'corporativo':
    case 'empresa':
      return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    case 'portfolio':
    case 'portafolio':
      return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
    case 'blog':
      return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    case 'app móvil':
    case 'mobile':
      return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
    case 'web app':
    case 'aplicación web':
      return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
    case 'diseño':
    case 'ui/ux':
      return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    case 'desarrollo':
    case 'programación':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'base de datos':
    case 'database':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'api':
    case 'backend':
      return 'bg-violet-500/10 text-violet-600 border-violet-500/20';
    default:
      return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
  }
};

// Función para verificar si un proyecto está próximo a su fecha límite
const isProjectUrgent = (project: Project) => {
  if (!project.fases || project.fases.length === 0) return false;
  
  const now = new Date();
  const urgentPhases = project.fases.filter((fase: ProjectPhase) => {
    if (!fase.fechaEntrega || fase.estado === 'Terminado') return false;
    
    const deadline = new Date(fase.fechaEntrega);
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilDeadline <= 3 && daysUntilDeadline >= 0;
  });
  
  return urgentPhases.length > 0;
};

export default function ProjectCard({
  project,
  user,
  projectCreators,
  onViewProject,
  onNavigateToCollaboration,
  onNavigateToEdit,
  onDeleteProject,
  showAdminActions = false,
  index = 0
}: ProjectCardProps) {
  const progress = calculateProjectProgress(project);
  const status = getProjectStatus(project);
  const totalComments = project.fases?.reduce((total: number, fase: ProjectPhase) => 
    total + (fase.comentarios?.length || 0), 0) || 0;
  const isUrgent = isProjectUrgent(project);
  const projectType = project.type || 'Sin tipo';

  return (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="w-full max-w-xs"
    >
      <div 
        className="bg-white rounded-2xl shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300 overflow-hidden relative cursor-pointer hover:scale-[1.01] w-full h-[480px] flex flex-col"
        onClick={() => onViewProject(project)}
      >
        {/* Barra superior de gradiente animado */}
        <div className={`absolute top-0 left-0 w-full h-1.5 rounded-t-2xl ${
          isUrgent 
            ? 'bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 animate-pulse' 
            : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
        }`} />
        
        <div className="p-5 flex-1 flex flex-col">
          {/* Header del proyecto */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-slate-800 truncate">{project.name}</h3>
                {isUrgent && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Urgente
                  </Badge>
                )}
              </div>
              <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                {project.description || 'Sin descripción'}
              </p>
              
              {/* Información del creador del proyecto - Solo visible para admin */}
              {user?.role === 'admin' && project.created_by && projectCreators[project.created_by] && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200/50 mb-3">
                  <User className="h-3 w-3 text-slate-500" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-700">
                      Creado por: {projectCreators[project.created_by].full_name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {projectCreators[project.created_by].email}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Estado y progreso */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`${getStatusColor(status)} border-slate-200 text-xs`}>
                {getStatusIcon(status)}
                <span className="ml-1">{status}</span>
              </Badge>
              <span className="text-sm font-medium text-slate-700">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Tag de tipo de proyecto */}
          <div className="mb-3">
            <Badge variant="outline" className={`${getProjectTypeColor(projectType)} border-slate-200 text-xs`}>
              {getProjectTypeIcon(projectType)}
              <span className="ml-1">{projectType}</span>
            </Badge>
          </div>

          {/* Información del proyecto */}
          <div className="grid grid-cols-2 gap-3 text-xs mb-3 flex-1">
            <div>
              <span className="text-slate-500">Funcionalidades:</span>
              <p className="font-medium text-slate-700">{(project as any).funcionalidades?.length || 0}</p>
            </div>
            <div>
              <span className="text-slate-500">Fases:</span>
              <p className="font-medium text-slate-700">
                {project.fases?.filter((f: ProjectPhase) => f.estado === 'Terminado').length || 0}/
                {project.fases?.length || 0}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Comentarios:</span>
              <p className="font-medium flex items-center gap-1 text-slate-700">
                <MessageSquare className="h-3 w-3" />
                {totalComments}
              </p>
            </div>
          </div>

          {/* Fechas */}
          <div className="text-xs text-slate-500 space-y-1 mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="truncate">Creado: {formatDateSafe(project.created_at || project.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="truncate">Actualizado: {formatDateSafe(project.updated_at)}</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 pt-2 mt-auto">
            {user?.role !== 'admin' && onNavigateToCollaboration && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToCollaboration(project.id);
                }}
              >
                <Users className="h-3 w-3 mr-1" />
                Colaborar
              </Button>
            )}
            
            {showAdminActions && user?.role === 'admin' && (
              <>
                {onNavigateToEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToEdit(project.id);
                    }}
                  >
                    Editar
                  </Button>
                )}
                {onDeleteProject && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(project.id);
                    }}
                  >
                    Eliminar
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
