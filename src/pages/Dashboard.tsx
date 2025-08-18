import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot, collection, getDocs, query, where } from 'firebase/firestore';
import { 
  Plus, 
  MessageSquare, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Eye,
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { formatDateSafe } from '@/utils/formatDateSafe';
import VerDetallesProyecto from '@/components/VerDetallesProyecto';

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
  description: string;
  type: string;
  ownerEmail: string;
  createdAt: string;
  fases?: ProjectPhase[];
}

const FASES = [
  { key: 'ui', label: 'UI Design', icon: '🎨' },
  { key: 'maquetado', label: 'Maquetado', icon: '📱' },
  { key: 'contenido', label: 'Contenido', icon: '📝' },
  { key: 'funcionalidades', label: 'Funcionalidades', icon: '⚙️' },
  { key: 'seo', label: 'SEO', icon: '🔍' },
  { key: 'deploy', label: 'Deploy', icon: '🚀' },
];

export default function Dashboard() {
  const { user, projects, updateProject, addCommentToPhase, loading } = useApp();
  const navigate = useNavigate();
  const [comentarioInput, setComentarioInput] = useState<Record<string, string>>({});
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialized, setModalInitialized] = useState(false);
  const [realTimeProjects, setRealTimeProjects] = useState<Project[]>([]);
  const { t } = useTranslation();


  // Proyectos visibles para el usuario actual y validación temprana
  const userProjects = realTimeProjects.filter(p => p.ownerEmail === user?.email && p.id);
  const hasValidProjects = userProjects.length > 0;

  // Escuchar cambios en tiempo real de los proyectos del usuario
  useEffect(() => {
    if (!user) {
      setRealTimeProjects([]);
      return;
    }

    const userProjects = projects.filter(p => p.ownerEmail === user.email);
    
    if (userProjects.length === 0) {
      setRealTimeProjects([]);
      return;
    }

    const unsubscribe = userProjects.map(project => 
      onSnapshot(doc(firestore, 'projects', project.id), (doc) => {
        if (doc.exists()) {
          const projectData = { id: doc.id, ...doc.data() } as Project;
          setRealTimeProjects(prev => {
            const filtered = prev.filter(p => p.id !== project.id);
            return [...filtered, projectData];
          });
        }
      }, (error) => {
        console.warn('Error cargando proyecto en tiempo real:', error);
      })
    );

    return () => {
      unsubscribe.forEach(unsub => unsub());
    };
  }, [user, projects]);

  // Limpiar estado del modal cuando se desmonte el componente
  useEffect(() => {
    return () => {
      setIsModalOpen(false);
      setSelectedProject(null);
      setModalInitialized(false);
    };
  }, []);

  // Verificar que el modal no se abra automáticamente
  useEffect(() => {
    if (isModalOpen && !modalInitialized) {
      console.warn('Modal se abrió automáticamente, cerrando...');
      setIsModalOpen(false);
      setSelectedProject(null);
    }
  }, [isModalOpen, modalInitialized]);

  // Verificar que el modal no se abra cuando no hay proyectos válidos
  useEffect(() => {
    if (isModalOpen && !hasValidProjects) {
      console.warn('Modal abierto sin proyectos válidos, cerrando...');
      setIsModalOpen(false);
      setSelectedProject(null);
      setModalInitialized(false);
    }
  }, [isModalOpen, hasValidProjects]);



  const handleComentarioChange = (projectId: string, faseKey: string, value: string) => {
    setComentarioInput(prev => ({ ...prev, [`${projectId}-${faseKey}`]: value }));
  };

  const handleComentarioSubmit = async (projectId: string, faseKey: string) => {
    if (!comentarioInput[`${projectId}-${faseKey}`]?.trim()) return;

    try {
      await addCommentToPhase(projectId, faseKey, {
        texto: comentarioInput[`${projectId}-${faseKey}`],
        autor: user?.name || user?.email || 'Cliente',
        tipo: 'cliente'
      });
      
      setComentarioInput(prev => ({ ...prev, [`${projectId}-${faseKey}`]: '' }));
      toast({ title: 'Comentario enviado', description: 'Tu comentario fue guardado y el admin será notificado.' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo enviar el comentario.', variant: 'destructive' });
    }
  };

  // Función para crear nuevo proyecto
  const handleCreateProject = () => {
    navigate('/proyectos/nuevo');
  };

  // Función para ver detalles del proyecto
  const handleViewProject = (project: Project) => {
    if (project && project.id) {
      setSelectedProject(project);
      setIsModalOpen(true);
      setModalInitialized(true);
    } else {
      console.warn('Proyecto inválido:', project);
      toast({ 
        title: 'Error', 
        description: 'No se pudo cargar la información del proyecto.', 
        variant: 'destructive' 
      });
    }
  };

  // Función para cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
    setModalInitialized(false);
  };

  // Función para descargar archivos
  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para calcular progreso del proyecto
  const calculateProjectProgress = (project: Project) => {
    if (!project || !project.fases || project.fases.length === 0) return 0;
    const completedPhases = project.fases.filter(fase => fase.estado === 'Terminado').length;
    return (completedPhases / project.fases.length) * 100;
  };

  // Función para obtener el estado general del proyecto
  const getProjectStatus = (project: Project) => {
    if (!project || !project.fases || project.fases.length === 0) return 'Pendiente';
    if (project.fases.every(fase => fase.estado === 'Terminado')) return 'Completado';
    if (project.fases.some(fase => fase.estado === 'En Progreso')) return 'En Progreso';
    return 'Pendiente';
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  };

  const getProjectProgress = (project: Project) => {
    if (!project || !project.fases || project.fases.length === 0) return 0;
    const completed = project.fases.filter((f: ProjectPhase) => f.estado === 'Terminado').length;
    return (completed / project.fases.length) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completado': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'En Progreso': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  // Si es admin, redirigir al panel de admin
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Mostrar loading mientras se cargan los datos
  if (loading) {
    return (
      <div className="p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6 md:space-y-8 max-w-full overflow-x-hidden">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando proyectos...</p>
          </div>
        </div>
      </div>
    );
  }

  

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6 md:space-y-8 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('Dashboard')}</h1>
          <p className="text-muted-foreground">{t('Bienvenido, {name}', { name: user?.name || user?.email })}</p>
        </div>

      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card className="bg-gradient-card border-border transition-all duration-200 hover:scale-105 hover:shadow-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('Proyectos')}</p>
                <p className="text-2xl font-bold">{hasValidProjects ? userProjects.length : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border transition-all duration-200 hover:scale-105 hover:shadow-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-muted-foreground">{t('En Progreso')}</p>
                <p className="text-2xl font-bold">
                  {userProjects.filter(p => getProjectStatus(p) === 'En Progreso').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border transition-all duration-200 hover:scale-105 hover:shadow-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('Completados')}</p>
                <p className="text-2xl font-bold">
                  {userProjects.filter(p => getProjectStatus(p) === 'Completado').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border transition-all duration-200 hover:scale-105 hover:shadow-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-muted-foreground">{t('Comentarios')}</p>
                <p className="text-2xl font-bold">
                                         {userProjects.reduce((acc, p) => 
                       acc + (p.fases?.reduce((sum: number, f: ProjectPhase) => 
                         sum + (f.comentarios?.length || 0), 0) || 0), 0
                     )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vista de proyectos */}
      {!hasValidProjects ? (
        <Card className="bg-muted/20 border-border transition-all duration-200 hover:scale-105 hover:shadow-2xl">
                          <CardContent className="p-6 sm:p-12 text-center">
      <div className="space-y-4">
              <div className="text-4xl sm:text-6xl">🚀</div>
              <h3 className="text-lg sm:text-xl font-semibold">{t('No tienes proyectos aún')}</h3>
              <p className="text-muted-foreground text-sm sm:text-base">
                {t('Comienza creando tu primer proyecto web y verás el progreso en tiempo real.')}
              </p>
              <Button 
                className="btn-gradient-electric transition-all duration-200 hover:scale-105 hover:shadow-lg"
                onClick={() => navigate('/proyectos/nuevo')}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('Crear mi primer proyecto')}
              </Button>
            </div>
            </CardContent>
          </Card>
        ) : (
        <div className="space-y-6">
          {userProjects.filter(project => project && project.id).map(project => {
            const progress = getProjectProgress(project);
            const status = getProjectStatus(project);
            
            return (
              <Card
                key={project.id}
                className="relative bg-[#181824]/80 backdrop-blur-md border border-[#23263a] rounded-2xl shadow-2xl hover:scale-[1.02] hover:shadow-3xl transition-all overflow-hidden cursor-pointer"
                onClick={() => {
                  if (project && project.id) {
                    navigate(`/proyectos/${project.id}`);
                  } else {
                    toast({ 
                      title: 'Error', 
                      description: 'Proyecto inválido', 
                      variant: 'destructive' 
                    });
                  }
                }}
              >
                {/* Barra superior de gradiente animado */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x rounded-t-2xl" />
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <CardTitle className="text-xl sm:text-2xl font-bold">{project.name || 'Proyecto sin nombre'}</CardTitle>
                        <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusColor(status)}>{status}</Badge>
                        <Badge variant="outline">{project.type || 'Sin tipo'}</Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm sm:text-base">{project.description || 'Sin descripción'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={e => { 
                          e.stopPropagation(); 
                          if (project && project.id) {
                            handleViewProject(project);
                          } else {
                            toast({ 
                              title: 'Error', 
                              description: 'Proyecto inválido', 
                              variant: 'destructive' 
                            });
                          }
                        }}
                        className="btn-gradient-electric transition-all duration-200 hover:scale-105 hover:shadow-lg"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t('Ver Detalles')}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={e => { 
                          e.stopPropagation(); 
                          console.log('Botón Colaborar clickeado, proyecto:', project);
                          if (project && project.id) {
                            const url = `/proyectos/${project.id}/colaboracion-cliente`;
                            console.log('Navegando a:', url);
                            navigate(url);
                          } else {
                            console.error('Proyecto inválido:', project);
                            toast({ 
                              title: 'Error', 
                              description: 'Proyecto inválido', 
                              variant: 'destructive' 
                            });
                          }
                        }}
                        className="btn-gradient-electric transition-all duration-200 hover:scale-105 hover:shadow-lg"
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Colaborar
                      </Button>
          </div>
      </div>

                  {/* Barra de progreso */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{t('Progreso general')}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 progress-gradient-electric" />
                  </div>
                </CardHeader>
                
                <CardContent>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                     {(project.fases || []).filter(fase => fase && fase.key).map((fase: ProjectPhase) => {
                       const faseConfig = FASES.find(f => f.key === fase.key);
                      return (
                        <Card
                          key={fase.key}
                          className={`relative bg-[#181824]/80 backdrop-blur-md border border-[#23263a] rounded-2xl shadow-2xl hover:scale-[1.02] hover:shadow-3xl transition-all overflow-hidden`}
                        >
                          {/* Barra superior de gradiente animado según estado */}
                          <div className={`absolute top-0 left-0 w-full h-1.5 rounded-t-2xl animate-gradient-x ${
                            fase.estado === 'Terminado'
                              ? 'bg-gradient-to-r from-green-400 via-blue-500 to-blue-700'
                              : fase.estado === 'En Progreso'
                              ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
                              : 'bg-gradient-to-r from-gray-500 via-blue-500 to-blue-700'
                          }`} />
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base font-semibold flex items-center gap-2">
                                {/* Icono animado según estado */}
                                {fase.estado === 'Terminado' && (
                                  <svg className="w-6 h-6 text-green-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                )}
                                {fase.estado === 'En Progreso' && (
                                  <svg className="w-6 h-6 text-blue-400 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" /></svg>
                                )}
                                {fase.estado === 'Pendiente' && (
                                  <svg className="w-6 h-6 text-gray-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
                                )}
                                <span>{faseConfig?.icon || '📋'}</span>
                                {faseConfig?.label || fase.descripcion || 'Fase'}
                              </CardTitle>
                              <Badge 
                                variant="outline" 
                                className={
                                  fase.estado === 'Terminado' ? 'bg-gradient-gold text-[#181824] border-none' :
                                  fase.estado === 'En Progreso' ? 'bg-gradient-electric text-white border-none' :
                                  'bg-gradient-to-r from-[#a259ff] to-[#23263a] text-white border-none'
                                }
                              >
                                {fase.estado || 'Pendiente'}
                              </Badge>
                            </div>
                                                          {fase.descripcion && (
                                <p className="text-xs text-muted-foreground">{fase.descripcion}</p>
                              )}
                                                          {fase.fechaEntrega && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {t('Entrega:')} {formatDateSafe(fase.fechaEntrega)}
                                </div>
                              )}
                          </CardHeader>

                          <CardContent className="space-y-3">
                            {/* Archivos */}
                            {fase.archivos && fase.archivos.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-xs font-medium">{t('Archivos')}</Label>
                                <div className="flex flex-wrap gap-2">
                                  {fase.archivos.filter(file => file && file.url && file.name).map((file, idx: number) => (
                                    <div key={idx} className="flex items-center gap-1 p-2 bg-muted/20 rounded text-xs">
                                      <FileText className="h-3 w-3" />
                                      <a 
                                        href={file.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {file.name || 'Archivo sin nombre'}
                                      </a>
                                    </div>
                                  ))}
                                </div>
            </div>
                            )}

                                                          {/* Comentarios */}
                              <div className="space-y-2">
                                                              <div className="flex items-center justify-between">
                                  <Label className="text-xs font-medium">
                                    {t('Comentarios')} ({(fase.comentarios || []).filter(c => c && c.id).length})
                                  </Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setComentarioInput(prev => ({ ...prev, [`${project.id}-${fase.key}`]: '' }))}
                                  className="btn-gradient-electric transition-all duration-200 hover:scale-105 hover:shadow-lg"
                                >
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  {t('Comentar')}
                                </Button>
            </div>

                              {/* Formulario de comentario */}
                              {comentarioInput[`${project.id}-${fase.key}`] !== undefined && (
                                <div className="space-y-2">
                                  <Textarea
                                    value={comentarioInput[`${project.id}-${fase.key}`] || ''}
                                    onChange={e => handleComentarioChange(project.id, fase.key, e.target.value)}
                                    placeholder={t('Escribe tu comentario...')}
                                    className="min-h-[60px] text-xs"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleComentarioSubmit(project.id, fase.key)}
                                      disabled={!comentarioInput[`${project.id}-${fase.key}`]?.trim()}
                                    >
                                      {t('Enviar')}
                                    </Button>
              <Button 
                variant="outline" 
                                      size="sm"
                                      onClick={() => setComentarioInput(prev => ({ ...prev, [`${project.id}-${fase.key}`]: undefined }))}
              >
                {t('Cancelar')}
              </Button>
                                  </div>
                                </div>
                              )}

                              {/* Lista de comentarios */}
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {(fase.comentarios || []).filter(comentario => comentario && comentario.id).map((comentario) => (
                                  <div
                                    key={comentario.id}
                                    className={`p-2 rounded text-xs ${
                                      comentario.tipo === 'admin' 
                                        ? 'bg-primary/10 border border-primary/20' 
                                        : 'bg-muted/20 border border-border'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium">
                                        {comentario.autor || 'Usuario anónimo'}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {formatDateSafe(comentario.fecha)}
                                      </span>
                                    </div>
                                    <p>{comentario.texto || 'Comentario sin texto'}</p>
                                  </div>
                                ))}
            </div>
          </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de detalle del proyecto */}
      {isModalOpen && modalInitialized && selectedProject && selectedProject.id && hasValidProjects && (
        <VerDetallesProyecto
          proyecto={selectedProject}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProject(null);
            setModalInitialized(false);
          }}
          onUpdate={(updatedProject) => {
            // Actualizar el proyecto en el estado local
            setRealTimeProjects(prev => 
              prev.map(p => p.id === updatedProject.id ? updatedProject : p)
            );
            updateProject(updatedProject);
          }}
        />
      )}


    </div>
  );
}