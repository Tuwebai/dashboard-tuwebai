import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Eye, 
  EyeOff, 
  Download, 
  Edit, 
  Trash2, 
  ExternalLink,
  Settings,
  Key,
  Lock,
  FolderOpen,
  Globe
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { environmentService, EnvironmentVariable as EnvVar } from '@/lib/environmentService';

interface EnvironmentVariable {
  key: string;
  value: string;
  isSensitive: boolean;
  environment?: string;
  id?: string;
}

interface ProjectWithVariables {
  id: string;
  name: string;
  description: string;
  customicon?: string;
  variables: EnvironmentVariable[];
}

const EnvironmentVariables: React.FC = () => {
  const { user, projects } = useApp();
  
  // Verificación de seguridad
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }
  
  const [projectsWithVariables, setProjectsWithVariables] = useState<ProjectWithVariables[]>([]);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [editingVar, setEditingVar] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('production');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);

  // Cargar variables de entorno para todos los proyectos
  useEffect(() => {
    const loadAllProjectVariables = async () => {
      if (!projects || !Array.isArray(projects) || projects.length === 0) return;
      
      setIsLoading(true);
      try {
        const projectsWithVars: ProjectWithVariables[] = [];
        
        for (const project of projects) {
          try {
            if (!project.id) continue;
            const variables = await environmentService.getEnvironmentVariables(project.id, selectedEnvironment);
            projectsWithVars.push({
              ...project,
              id: project.id || '',
              variables: variables || []
            });
          } catch (error) {
            console.error(`Error loading variables for project ${project.id}:`, error);
            projectsWithVars.push({
              ...project,
              id: project.id || '',
              variables: []
            });
          }
        }
        
        setProjectsWithVariables(projectsWithVars);
      } catch (error) {
        console.error('Error loading project variables:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllProjectVariables();
  }, [projects, selectedEnvironment]);

  const toggleValueVisibility = (projectId: string, key: string) => {
    setShowValues(prev => ({ ...prev, [`${projectId}-${key}`]: !prev[`${projectId}-${key}`] }));
  };

  const addVariable = (projectId: string) => {
    if (!projectId) return;
    setProjectsWithVariables(prev => prev.map(project => {
      if (project.id === projectId) {
        const newVar: EnvironmentVariable = {
          key: '',
          value: '',
          isSensitive: false,
          environment: selectedEnvironment
        };
        return {
          ...project,
          variables: [...project.variables, newVar]
        };
      }
      return project;
    }));
    setEditingVar(`${projectId}-new-${Date.now()}`);
  };

  const updateVariable = (projectId: string, index: number, field: 'key' | 'value' | 'isSensitive', value: string | boolean) => {
    if (!projectId) return;
    setProjectsWithVariables(prev => prev.map(project => {
      if (project.id === projectId) {
        const updatedVariables = project.variables.map((v, i) => 
          i === index ? { ...v, [field]: value } : v
        );
        return { ...project, variables: updatedVariables };
      }
      return project;
    }));
  };

  const deleteVariable = async (projectId: string, index: number) => {
    if (!projectId) return;
    const project = projectsWithVariables.find(p => p.id === projectId);
    if (!project) return;

    const variable = project.variables[index];
    
    try {
      if (variable.id) {
        await environmentService.deleteEnvironmentVariable(variable.id);
      }
      
      setProjectsWithVariables(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            variables: p.variables.filter((_, i) => i !== index)
          };
        }
        return p;
      }));

      toast({
        title: "Variable eliminada",
        description: "La variable de entorno ha sido eliminada correctamente.",
      });
    } catch (error) {
      console.error('Error deleting variable:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la variable de entorno.",
        variant: "destructive",
      });
    }
  };

  const saveVariable = async (projectId: string, index: number) => {
    if (!projectId) return;
    const project = projectsWithVariables.find(p => p.id === projectId);
    if (!project) return;

    const variable = project.variables[index];
    if (!variable.key.trim()) {
      toast({
        title: "Error",
        description: "La clave de la variable es requerida.",
        variant: "destructive",
      });
      return;
    }

    // Verificar duplicados en el mismo proyecto
    const isDuplicate = project.variables.some((v, i) => 
      i !== index && v.key.toLowerCase() === variable.key.toLowerCase()
    );

    if (isDuplicate) {
      toast({
        title: "Error",
        description: "Ya existe una variable con esa clave en este proyecto.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Agregar el usuario actual como creador si no existe
      const variableToSave = {
        ...variable,
        project_id: projectId,
        environment: selectedEnvironment,
        created_by: user?.id || null
      };

      const savedVariable = await environmentService.upsertEnvironmentVariable(variableToSave);

      setProjectsWithVariables(prev => prev.map(p => {
        if (p.id === projectId) {
          const updatedVariables = p.variables.map((v, i) => 
            i === index ? { ...savedVariable } : v
          );
          return { ...p, variables: updatedVariables };
        }
        return p;
      }));

      setEditingVar(null);
      toast({
        title: "Variable guardada",
        description: "La variable de entorno ha sido guardada correctamente.",
      });
    } catch (error) {
      console.error('Error saving variable:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo guardar la variable de entorno.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const exportProjectVariables = (project: ProjectWithVariables) => {
    const envContent = project.variables
      .filter(v => v.environment === selectedEnvironment)
      .map(v => `${v.key}=${v.value}`)
      .join('\n');
    
    const blob = new Blob([envContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}.env.${selectedEnvironment}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Variables exportadas",
      description: `Las variables de ${project.name} han sido exportadas.`,
    });
  };

  const toggleProjectExpansion = (projectId: string) => {
    if (!projectId) return;
    setExpandedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  const getProjectIcon = (project: ProjectWithVariables) => {
    if (project.customicon) {
      return project.customicon;
    }
    return 'FolderOpen';
  };

  // Verificación adicional de seguridad
  if (!projects || !Array.isArray(projects)) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Variables de Entorno</h1>
            <p className="text-gray-400 mt-1">Gestiona las variables de entorno de todos tus proyectos</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
              <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Producción</SelectItem>
                <SelectItem value="development">Desarrollo</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Cargando variables de entorno...</p>
          </div>
        ) : projectsWithVariables.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No hay proyectos</h3>
            <p className="text-sm">Crea un proyecto para comenzar a gestionar variables de entorno</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projectsWithVariables.filter(project => project.id).map((project) => (
                              <Card key={project.id || `project-${Math.random()}`} className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <FolderOpen className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <p className="text-gray-400 text-sm">{project.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {project.variables.length} variables
                      </Badge>
                                             <Button
                         onClick={() => project.id && toggleProjectExpansion(project.id)}
                         variant="ghost"
                         size="sm"
                         className="text-gray-400 hover:text-white"
                       >
                         {project.id && expandedProjects.includes(project.id) ? 'Ocultar' : 'Ver'}
                       </Button>
                    </div>
                  </div>
                </CardHeader>
                
                                 {expandedProjects.includes(project.id) && (
                  <CardContent className="space-y-4">
                    {/* Variables List */}
                    <div className="space-y-2">
                      {project.variables.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                          <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No hay variables de entorno</p>
                        </div>
                      ) : (
                        project.variables.map((variable, index) => (
                          <div
                            key={`${project.id || 'unknown'}-${index}`}
                            className="flex items-center gap-3 p-3 bg-zinc-700 rounded-lg border border-zinc-600"
                          >
                            {/* Key */}
                            <div className="flex-1">
                              {editingVar === `${project.id || ''}-${index}` ? (
                                <Input
                                  value={variable.key}
                                  onChange={(e) => project.id && updateVariable(project.id, index, 'key', e.target.value)}
                                  className="bg-zinc-600 border-zinc-500 text-white text-sm"
                                  placeholder="KEY"
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Key className="h-3 w-3 text-gray-400" />
                                  <span className="font-mono text-sm">{variable.key}</span>
                                  {variable.isSensitive && (
                                    <Lock className="h-3 w-3 text-yellow-400" />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Value */}
                            <div className="flex-1">
                              {editingVar === `${project.id || ''}-${index}` ? (
                                <div className="flex gap-2">
                                  <Input
                                    value={variable.value}
                                    onChange={(e) => project.id && updateVariable(project.id, index, 'value', e.target.value)}
                                    type={variable.isSensitive && !showValues[`${project.id || ''}-${variable.key}`] ? 'password' : 'text'}
                                    className="bg-zinc-600 border-zinc-500 text-white text-sm"
                                    placeholder="VALUE"
                                  />
                                  <Button
                                    onClick={() => project.id && updateVariable(project.id, index, 'isSensitive', !variable.isSensitive)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-400 hover:text-white p-1"
                                  >
                                    {variable.isSensitive ? <Lock className="h-3 w-3" /> : <Key className="h-3 w-3" />}
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm">
                                    {variable.isSensitive && !showValues[`${project.id || ''}-${variable.key}`] 
                                      ? '•'.repeat(8) 
                                      : variable.value
                                    }
                                  </span>
                                  {variable.isSensitive && (
                                    <Button
                                      onClick={() => project.id && toggleValueVisibility(project.id, variable.key)}
                                      variant="ghost"
                                      size="sm"
                                      className="text-gray-400 hover:text-white p-1"
                                    >
                                      {showValues[`${project.id || ''}-${variable.key}`] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              {editingVar === `${project.id || ''}-${index}` ? (
                                <>
                                  <Button
                                    onClick={() => project.id && saveVariable(project.id, index)}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                  >
                                    ✓
                                  </Button>
                                  <Button
                                    onClick={() => setEditingVar(null)}
                                    variant="outline"
                                    size="sm"
                                    className="bg-zinc-600 border-zinc-500 text-white hover:bg-zinc-500 text-xs"
                                  >
                                    ✕
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    onClick={() => project.id && setEditingVar(`${project.id}-${index}`)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-400 hover:text-white p-1"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    onClick={() => project.id && deleteVariable(project.id, index)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-400 hover:text-red-300 p-1"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add New Variable */}
                    {editingVar?.startsWith(`${project.id || ''}-new-`) && (
                      <div className="flex items-center gap-3 p-3 bg-zinc-700 rounded-lg border border-zinc-600">
                        <div className="flex-1">
                          <Input
                            value={project.variables[project.variables.length - 1]?.key || ''}
                            onChange={(e) => project.id && updateVariable(project.id, project.variables.length - 1, 'key', e.target.value)}
                            className="bg-zinc-600 border-zinc-500 text-white text-sm"
                            placeholder="KEY"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex gap-2">
                            <Input
                              value={project.variables[project.variables.length - 1]?.value || ''}
                              onChange={(e) => project.id && updateVariable(project.id, project.variables.length - 1, 'value', e.target.value)}
                              type={project.variables[project.variables.length - 1]?.isSensitive ? 'password' : 'text'}
                              className="bg-zinc-600 border-zinc-500 text-white text-sm"
                              placeholder="VALUE"
                            />
                            <Button
                              onClick={() => project.id && updateVariable(project.id, project.variables.length - 1, 'isSensitive', !project.variables[project.variables.length - 1]?.isSensitive)}
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-white p-1"
                            >
                              {project.variables[project.variables.length - 1]?.isSensitive ? <Lock className="h-3 w-3" /> : <Key className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => project.id && saveVariable(project.id, project.variables.length - 1)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs"
                          >
                            ✓
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingVar(null);
                              setProjectsWithVariables(prev => prev.map(p => {
                                if (p.id === project.id) {
                                  return { ...p, variables: p.variables.slice(0, -1) };
                                }
                                return p;
                              }));
                            }}
                            variant="outline"
                            size="sm"
                            className="bg-zinc-600 border-zinc-500 text-white hover:bg-zinc-500 text-xs"
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Project Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-600">
                      <Button
                        onClick={() => project.id && addVariable(project.id)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar Variable
                      </Button>
                      <Button
                        onClick={() => exportProjectVariables(project)}
                        variant="outline"
                        size="sm"
                        className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Exportar
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Proyectos</p>
                  <p className="text-2xl font-bold">{projectsWithVariables.length}</p>
                </div>
                <FolderOpen className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Variables</p>
                  <p className="text-2xl font-bold">{projectsWithVariables.reduce((sum, p) => sum + p.variables.length, 0)}</p>
                </div>
                <Key className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Sensibles</p>
                  <p className="text-2xl font-bold">{projectsWithVariables.reduce((sum, p) => sum + p.variables.filter(v => v.isSensitive).length, 0)}</p>
                </div>
                <Lock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Entorno</p>
                  <p className="text-2xl font-bold capitalize">{selectedEnvironment}</p>
                </div>
                <Settings className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentVariables;
