import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Code, 
  FolderOpen, 
  Search, 
  Filter, 
  GitBranch,
  GitCommit,
  Clock,
  User,
  ExternalLink,
  Play,
  Settings,
  FileText,
  Database,
  Globe,
  Smartphone
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ProjectWithRepo {
  id: string;
  name: string;
  description?: string;
  github_repository_url?: string;
  status: string;
  technologies: string[];
  created_at: string;
  updated_at: string;
  customicon?: string;
}

export default function CodeEditorPage() {
  const { projects, user, loading } = useApp();
  const navigate = useNavigate();
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithRepo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [technologyFilter, setTechnologyFilter] = useState<string>('all');

  // Filtrar proyectos que tienen repositorio de GitHub
  const projectsWithRepo = projects.filter(project => 
    project.github_repository_url && project.github_repository_url.trim() !== ''
  );

  useEffect(() => {
    let filtered = projectsWithRepo;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Filtro por tecnología
    if (technologyFilter !== 'all') {
      filtered = filtered.filter(project =>
        project.technologies.some(tech => tech.toLowerCase().includes(technologyFilter.toLowerCase()))
      );
    }

    setFilteredProjects(filtered);
  }, [projectsWithRepo, searchTerm, statusFilter, technologyFilter]);

  const handleOpenEditor = (project: ProjectWithRepo) => {
    if (!project.github_repository_url) {
      toast({
        title: "❌ Sin repositorio",
        description: "Este proyecto no tiene un repositorio de GitHub configurado.",
        variant: "destructive"
      });
      return;
    }

    // Navegar al editor con el ID del proyecto
    navigate(`/code-editor/${project.id}`);
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

  const getTechnologyIcon = (technologies: string[]) => {
    if (technologies.includes('React') || technologies.includes('react')) return <Globe className="h-4 w-4" />;
    if (technologies.includes('Node.js') || technologies.includes('node')) return <Database className="h-4 w-4" />;
    if (technologies.includes('Mobile') || technologies.includes('React Native')) return <Smartphone className="h-4 w-4" />;
    return <Code className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Code className="h-8 w-8 text-blue-500" />
            Editor de Código
          </h1>
          <p className="text-gray-400 mt-2">
            Gestiona y edita el código de tus proyectos directamente desde el dashboard
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
            {projectsWithRepo.length} proyectos con repositorio
          </Badge>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar proyectos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
              />
            </div>

            {/* Filtro por estado */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-700 border-zinc-600">
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="development">Desarrollo</SelectItem>
                <SelectItem value="production">Producción</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por tecnología */}
            <Select value={technologyFilter} onValueChange={setTechnologyFilter}>
              <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                <SelectValue placeholder="Tecnología" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-700 border-zinc-600">
                <SelectItem value="all">Todas las tecnologías</SelectItem>
                <SelectItem value="react">React</SelectItem>
                <SelectItem value="node">Node.js</SelectItem>
                <SelectItem value="vue">Vue.js</SelectItem>
                <SelectItem value="angular">Angular</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="php">PHP</SelectItem>
              </SelectContent>
            </Select>

            {/* Botón de limpiar filtros */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTechnologyFilter('all');
              }}
              className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600"
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de proyectos */}
      {projectsWithRepo.length === 0 ? (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="p-8">
            <div className="text-center">
              <Code className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                No hay proyectos con repositorio
              </h3>
              <p className="text-gray-400 mb-4">
                Para usar el editor de código, necesitas configurar un repositorio de GitHub en tus proyectos.
              </p>
              <Button
                onClick={() => navigate('/admin')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Gestionar Proyectos
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="p-8">
            <div className="text-center">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                No se encontraron proyectos
              </h3>
              <p className="text-gray-400">
                Intenta ajustar los filtros de búsqueda.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className="bg-zinc-800 border-zinc-700 hover:border-blue-500/50 transition-all duration-200 cursor-pointer group"
              onClick={() => handleOpenEditor(project)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getTechnologyIcon(project.technologies)}
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {project.name}
                      </h3>
                      <Badge className={`${getStatusColor(project.status)} text-xs`}>
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                </div>

                {project.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="space-y-3">
                  {/* Tecnologías */}
                  <div className="flex flex-wrap gap-1">
                    {project.technologies.slice(0, 3).map((tech, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-zinc-700 border-zinc-600 text-gray-300">
                        {tech}
                      </Badge>
                    ))}
                    {project.technologies.length > 3 && (
                      <Badge variant="outline" className="text-xs bg-zinc-700 border-zinc-600 text-gray-300">
                        +{project.technologies.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Información adicional */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(project.updated_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      <span>main</span>
                    </div>
                  </div>
                </div>

                {/* Botón de acción */}
                <Button 
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white group-hover:bg-blue-500 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditor(project);
                  }}
                >
                  <Code className="h-4 w-4 mr-2" />
                  Abrir Editor
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estadísticas */}
      {projectsWithRepo.length > 0 && (
        <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
            <CardTitle className="text-white">Estadísticas de Repositorios</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{projectsWithRepo.length}</div>
                <div className="text-sm text-gray-400">Total de repositorios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {projectsWithRepo.filter(p => p.status === 'production').length}
                </div>
                <div className="text-sm text-gray-400">En producción</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {projectsWithRepo.filter(p => p.status === 'development').length}
                </div>
                <div className="text-sm text-gray-400">En desarrollo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">
                  {projectsWithRepo.filter(p => p.status === 'maintenance').length}
                </div>
                <div className="text-sm text-gray-400">En mantenimiento</div>
              </div>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
