import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Edit, 
  Trash2, 
  X, 
  Calendar, 
  Clock, 
  Code, 
  Settings,
  Users,
  FileText,
  GitBranch,
  GitCommit,
  History,
  Rocket,
  Activity,
  Folder
} from 'lucide-react';
import { Project } from '@/types/project.types';
import { formatDateSafe } from '@/utils/formatDateSafe';
import { VersionManagement } from './VersionManagement';
import FileManager from '@/components/FileManager';

interface ProjectDetailsProps {
  project: Project;
  onEdit: (project: Project) => void;
  onClose: () => void;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project,
  onEdit,
  onClose
}) => {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-[99vw] sm:max-w-[98vw] md:max-w-[97vw] lg:max-w-[96vw] xl:max-w-[95vw] 2xl:max-w-[94vw] max-h-[98vh] overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b border-zinc-700 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white break-words">{project.name}</h2>
            <p className="text-gray-400 text-sm sm:text-base">Detalles del proyecto</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onEdit(project)}
              variant="outline"
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 w-full sm:w-auto"
            >
              <Edit className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 w-full sm:w-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full">
            <TabsList className="grid w-full grid-cols-3 bg-zinc-800 border-b border-zinc-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 text-xs sm:text-sm">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Resumen</span>
              </TabsTrigger>
              <TabsTrigger value="versions" className="data-[state=active]:bg-blue-600 text-xs sm:text-sm">
                <History className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Versiones</span>
              </TabsTrigger>
              <TabsTrigger value="files" className="data-[state=active]:bg-blue-600 text-xs sm:text-sm">
                <Folder className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Archivos</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab de Resumen */}
            <TabsContent value="overview" className="p-4 sm:p-6 h-full overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Información básica */}
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Información Básica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Nombre</label>
                      <p className="text-white">{project.name}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-400">Descripción</label>
                      <p className="text-gray-300">{project.description || 'Sin descripción'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-400">Estado</label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-400">Creado</label>
                        <div className="flex items-center gap-1 mt-1 text-gray-300">
                          <Calendar className="h-3 w-3" />
                          {formatDateSafe(project.created_at)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-400">Actualizado</label>
                        <div className="flex items-center gap-1 mt-1 text-gray-300">
                          <Clock className="h-3 w-3" />
                          {formatDateSafe(project.updated_at)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tecnologías */}
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Tecnologías
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies && project.technologies.length > 0 ? (
                        project.technologies.map((tech, index) => (
                          <Badge key={index} variant="outline" className="border-zinc-600 text-zinc-300">
                            {tech}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-gray-400">No hay tecnologías especificadas</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Repositorio */}
                {project.github_repository_url && (
                  <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <GitBranch className="h-5 w-5" />
                        Repositorio
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <GitCommit className="h-4 w-4 text-gray-400" />
                        <a
                          href={project.github_repository_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          {project.github_repository_url}
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Variables de entorno */}
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Variables de Entorno
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.environment_variables && Object.keys(project.environment_variables).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(project.environment_variables).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center p-2 bg-zinc-700 rounded">
                            <span className="text-gray-300 font-mono text-sm">{key}</span>
                            <span className="text-gray-400 text-sm">
                              {typeof value === 'string' ? value : JSON.stringify(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No hay variables de entorno configuradas</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab de Versiones */}
            <TabsContent value="versions" className="h-full overflow-y-auto p-0">
              <VersionManagement projectId={project.id} />
            </TabsContent>

            {/* Tab de Archivos */}
            <TabsContent value="files" className="h-full overflow-y-auto p-0">
              <FileManager projectId={project.id} isAdmin={true} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
