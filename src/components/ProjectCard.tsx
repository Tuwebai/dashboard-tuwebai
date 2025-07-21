import { useState } from 'react';
import { Project } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  Layers,
  Globe,
  Smartphone,
  Store,
  Layout
} from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

const projectTypeIcons = {
  Web: Globe,
  App: Smartphone,
  Landing: Layout,
  Ecommerce: Store,
};

const projectTypeColors = {
  Web: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  App: 'bg-green-500/10 text-green-400 border-green-500/20',
  Landing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Ecommerce: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

export default function ProjectCard({ project, onView, onEdit, onDelete }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const TypeIcon = projectTypeIcons[project.type];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Card 
      className="group bg-gradient-card border-border hover:border-primary/30 transition-all duration-300 hover:shadow-glow cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onView(project)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${projectTypeColors[project.type]}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                {project.name}
              </CardTitle>
              <Badge 
                variant="outline" 
                className={`mt-1 ${projectTypeColors[project.type]}`}
              >
                {project.type}
              </Badge>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Más</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(project); }}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Eye className="h-4 w-4 mr-2" />
                    </TooltipTrigger>
                    <TooltipContent>Ver</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project); }}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Edit className="h-4 w-4 mr-2" />
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                className="text-destructive"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Trash2 className="h-4 w-4 mr-2" />
                    </TooltipTrigger>
                    <TooltipContent>Eliminar</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <CardDescription className="text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </CardDescription>

        {project.funcionalidades && project.funcionalidades.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Funcionalidades</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {project.funcionalidades.slice(0, 3).map((func, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs bg-muted/50"
                >
                  {func}
                </Badge>
              ))}
              {project.funcionalidades.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-muted/50">
                  +{project.funcionalidades.length - 3} más
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Creado: {formatDate(project.createdAt)}</span>
          </div>
          <div 
            className={`transition-transform duration-300 ${
              isHovered ? 'translate-x-1' : ''
            }`}
          >
            →
          </div>
        </div>
      </CardContent>
    </Card>
  );
}