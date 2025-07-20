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
  Send,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const { user, projects, updateProject, addCommentToPhase } = useApp();
  const navigate = useNavigate();
  const [comentarioInput, setComentarioInput] = useState<Record<string, string>>({});
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [realTimeProjects, setRealTimeProjects] = useState<Project[]>([]);
  const [showUserInfoPanel, setShowUserInfoPanel] = useState(false);
  // Estado para mostrar el panel de info del admin
  const [showAdminInfoPanel, setShowAdminInfoPanel] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Escuchar cambios en tiempo real de los proyectos del usuario
  useEffect(() => {
    if (!user) return;

    const userProjects = projects.filter(p => p.ownerEmail === user.email);
    const unsubscribe = userProjects.map(project => 
      onSnapshot(doc(firestore, 'projects', project.id), (doc) => {
        if (doc.exists()) {
          const projectData = { id: doc.id, ...doc.data() } as Project;
          setRealTimeProjects(prev => {
            const filtered = prev.filter(p => p.id !== project.id);
            return [...filtered, projectData];
          });
        }
      })
    );

    return () => {
      unsubscribe.forEach(unsub => unsub());
    };
  }, [user, projects]);

  // Cargar datos del admin
  useEffect(() => {
    const fetchAdmin = async () => {
      const snap = await getDocs(query(collection(firestore, 'users'), where('role', '==', 'admin')));
      if (!snap.empty) setAdminUser({ id: snap.docs[0].id, ...snap.docs[0].data() });
    };
    fetchAdmin();
  }, []);

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
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  // Función para cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
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
    if (!project.fases || project.fases.length === 0) return 0;
    const completedPhases = project.fases.filter(fase => fase.estado === 'Terminado').length;
    return (completedPhases / project.fases.length) * 100;
  };

  // Función para obtener el estado general del proyecto
  const getProjectStatus = (project: Project) => {
    if (!project.fases || project.fases.length === 0) return 'Pendiente';
    if (project.fases.every(fase => fase.estado === 'Terminado')) return 'Completado';
    if (project.fases.some(fase => fase.estado === 'En Progreso')) return 'En Progreso';
    return 'Pendiente';
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  };

  const getProjectProgress = (project: Project) => {
    if (!project.fases || project.fases.length === 0) return 0;
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

  const userProjects = realTimeProjects.filter(p => p.ownerEmail === user?.email);

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido, {user?.name || user?.email}</p>
      </div>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowUserInfoPanel(true)}>
          <Avatar className="h-10 w-10">
            <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.name} />}
          </Avatar>
          <span className="font-semibold hidden md:block">{user?.name}</span>
          {/* Ícono de chat para abrir info del admin */}
          <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setShowAdminInfoPanel(true); }}>
            <MessageCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Proyectos</p>
                <p className="text-2xl font-bold">{userProjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-muted-foreground">En Progreso</p>
                <p className="text-2xl font-bold">
                  {userProjects.filter(p => getProjectStatus(p) === 'En Progreso').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completados</p>
                <p className="text-2xl font-bold">
                  {userProjects.filter(p => getProjectStatus(p) === 'Completado').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-muted-foreground">Comentarios</p>
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
      {userProjects.length === 0 ? (
        <Card className="bg-muted/20 border-border">
          <CardContent className="p-12 text-center">
      <div className="space-y-4">
              <div className="text-6xl">🚀</div>
              <h3 className="text-xl font-semibold">No tienes proyectos aún</h3>
              <p className="text-muted-foreground">
                Comienza creando tu primer proyecto web y verás el progreso en tiempo real.
              </p>
              <Button 
                className="bg-gradient-primary hover:opacity-90 transition-opacity"
                onClick={() => navigate('/proyectos/nuevo')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear mi primer proyecto
              </Button>
            </div>
            </CardContent>
          </Card>
        ) : (
        <div className="space-y-6">
          {userProjects.map(project => {
            const progress = getProjectProgress(project);
            const status = getProjectStatus(project);
            
            return (
              <Card key={project.id} className="bg-background border-border hover:border-primary/30 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-2xl font-bold">{project.name}</CardTitle>
                        <Badge className={getStatusColor(status)}>{status}</Badge>
                        <Badge variant="outline">{project.type}</Badge>
                      </div>
                      <p className="text-muted-foreground">{project.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProject(project)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </Button>

          </div>
      </div>

                  {/* Barra de progreso */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progreso general</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </CardHeader>
                
                <CardContent>
                                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {(project.fases || []).map((fase: ProjectPhase) => {
                       const faseConfig = FASES.find(f => f.key === fase.key);
                      return (
                        <Card key={fase.key} className="bg-muted/10 border border-border hover:border-primary/20 transition-all">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <span>{faseConfig?.icon}</span>
                                {faseConfig?.label}
                              </CardTitle>
                              <Badge 
                                variant="outline" 
                                className={
                                  fase.estado === 'Terminado' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                  fase.estado === 'En Progreso' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                  'bg-gray-500/10 text-gray-400 border-gray-500/20'
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
                                Entrega: {new Date(fase.fechaEntrega).toLocaleDateString('es-ES')}
            </div>
                            )}
                          </CardHeader>

                          <CardContent className="space-y-3">
                            {/* Archivos */}
                            {fase.archivos && fase.archivos.length > 0 && (
            <div className="space-y-2">
                                <Label className="text-xs font-medium">Archivos</Label>
                                <div className="flex flex-wrap gap-2">
                                                                     {fase.archivos.map((file, idx: number) => (
                                    <div key={idx} className="flex items-center gap-1 p-2 bg-muted/20 rounded text-xs">
                                      <FileText className="h-3 w-3" />
                                      <a 
                                        href={file.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                      >
                                        {file.name}
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
                                  Comentarios ({fase.comentarios?.length || 0})
                                </Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setComentarioInput(prev => ({ ...prev, [`${project.id}-${fase.key}`]: '' }))}
                                >
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Comentar
                                </Button>
            </div>

                              {/* Formulario de comentario */}
                              {comentarioInput[`${project.id}-${fase.key}`] !== undefined && (
                                <div className="space-y-2">
                                  <Textarea
                                    value={comentarioInput[`${project.id}-${fase.key}`] || ''}
                                    onChange={e => handleComentarioChange(project.id, fase.key, e.target.value)}
                                    placeholder="Escribe tu comentario..."
                                    className="min-h-[60px] text-xs"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleComentarioSubmit(project.id, fase.key)}
                                      disabled={!comentarioInput[`${project.id}-${fase.key}`]?.trim()}
                                    >
                                      Enviar
                                    </Button>
              <Button 
                variant="outline" 
                                      size="sm"
                                      onClick={() => setComentarioInput(prev => ({ ...prev, [`${project.id}-${fase.key}`]: undefined }))}
              >
                Cancelar
              </Button>
                                  </div>
                                </div>
                              )}

                              {/* Lista de comentarios */}
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {(fase.comentarios || []).map((comentario) => (
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
                                        {comentario.autor}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {new Date(comentario.fecha).toLocaleString('es-ES')}
                                      </span>
                                    </div>
                                    <p>{comentario.texto}</p>
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
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{selectedProject?.name}</DialogTitle>
            <DialogDescription>{selectedProject?.description}</DialogDescription>
          </DialogHeader>
          
          {selectedProject && (
            <div className="space-y-6">
              {/* Información del proyecto */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Tipo de proyecto</Label>
                  <Badge variant="outline">{selectedProject.type}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Fecha de creación</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedProject.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Estado general</Label>
                  <Badge className={getStatusColor(getProjectStatus(selectedProject))}>
                    {getProjectStatus(selectedProject)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Progreso</Label>
                  <div className="flex items-center gap-2">
                    <Progress value={getProjectProgress(selectedProject)} className="flex-1 h-2" />
                    <span className="text-sm">{Math.round(getProjectProgress(selectedProject))}%</span>
                  </div>
                </div>
              </div>

              {/* Fases detalladas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Fases del Proyecto</h3>
                <div className="space-y-4">
                   {(selectedProject.fases || []).map((fase: ProjectPhase, index: number) => {
                     const faseConfig = FASES.find(f => f.key === fase.key);
                    return (
                      <Card key={fase.key} className="bg-muted/10 border-border">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                  <span>{faseConfig?.icon}</span>
                                  {faseConfig?.label}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">{fase.descripcion}</p>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={
                                fase.estado === 'Terminado' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                fase.estado === 'En Progreso' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                'bg-gray-500/10 text-gray-400 border-gray-500/20'
                              }
                            >
                              {fase.estado || 'Pendiente'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Comentarios detallados */}
                          <div className="space-y-3">
                  <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">Comentarios ({fase.comentarios?.length || 0})</h4>
                    <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => setComentarioInput(prev => ({ ...prev, [`${selectedProject.id}-${fase.key}`]: '' }))}
                    >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Agregar comentario
                    </Button>
                  </div>
                  
                            {/* Formulario de comentario */}
                            {comentarioInput[`${selectedProject.id}-${fase.key}`] !== undefined && (
                              <div className="space-y-2">
                                <Textarea
                                  value={comentarioInput[`${selectedProject.id}-${fase.key}`] || ''}
                                  onChange={e => handleComentarioChange(selectedProject.id, fase.key, e.target.value)}
                                  placeholder="Escribe tu comentario..."
                                  className="min-h-[80px]"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleComentarioSubmit(selectedProject.id, fase.key)}
                                    disabled={!comentarioInput[`${selectedProject.id}-${fase.key}`]?.trim()}
                                  >
                                    Enviar comentario
                                  </Button>
                    <Button 
                      variant="outline" 
                                    onClick={() => setComentarioInput(prev => ({ ...prev, [`${selectedProject.id}-${fase.key}`]: undefined }))}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

                            {/* Lista de comentarios */}
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {(fase.comentarios || []).map((comentario) => (
                                <div
                                  key={comentario.id}
                                  className={`p-3 rounded-lg ${
                                    comentario.tipo === 'admin' 
                                      ? 'bg-primary/10 border border-primary/20' 
                                      : 'bg-muted/20 border border-border'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium">
                                      {comentario.autor}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(comentario.fecha).toLocaleString('es-ES')}
                                    </span>
                                  </div>
                                  <p className="text-sm">{comentario.texto}</p>
                                </div>
                              ))}
            </div>
              </div>

                          {/* Archivos */}
                          {fase.archivos && fase.archivos.length > 0 && (
              <div className="space-y-2">
                              <h4 className="text-sm font-medium">Archivos ({fase.archivos.length})</h4>
                              <div className="space-y-1">
                                                                 {fase.archivos.map((archivo, index: number) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                                    <span className="text-sm">{archivo.name}</span>
                                    <Button variant="ghost" size="sm">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
              </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {showUserInfoPanel && user && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex justify-end md:items-stretch items-end md:items-end"
            style={{ pointerEvents: 'auto' }}
            onClick={() => setShowUserInfoPanel(false)}
          >
            <div
              className="bg-card w-full h-full max-w-sm md:max-w-sm shadow-2xl flex flex-col md:rounded-none rounded-t-2xl md:h-full md:rounded-l-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                    {user.photoURL && <AvatarImage src={user.photoURL} alt={user.name} />}
                  </Avatar>
                  <div>
                    <div className="font-bold text-lg">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowUserInfoPanel(false)}>
                  ×
                </Button>
              </div>
              <div className="p-4 space-y-2">
                {user.phone && <div><span className="font-semibold">Teléfono:</span> {user.phone}</div>}
                {user.bio && <div><span className="font-semibold">Bio:</span> {user.bio}</div>}
                {user.company && <div><span className="font-semibold">Empresa:</span> {user.company}</div>}
                {user.position && <div><span className="font-semibold">Cargo:</span> {user.position}</div>}
                <div><span className="font-semibold">Rol:</span> {user.role}</div>
                <div><span className="font-semibold">Registrado:</span> {new Date(user.createdAt || Date.now()).toLocaleDateString('es-ES')}</div>
              </div>
            </div>
          </motion.div>
        )}
        {/* Panel de info del admin */}
        {showAdminInfoPanel && adminUser && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex justify-end md:items-stretch items-end md:items-end"
            style={{ pointerEvents: 'auto' }}
            onClick={() => setShowAdminInfoPanel(false)}
          >
            <div
              className="bg-card w-full h-full max-w-sm md:max-w-sm shadow-2xl flex flex-col md:rounded-none rounded-t-2xl md:h-full md:rounded-l-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16">
                    {adminUser.photoURL ? (
                      <AvatarImage src={adminUser.photoURL} alt={adminUser.name || 'Admin'} />
                    ) : (
                      <AvatarFallback>{adminUser.name?.charAt(0) || 'A'}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-bold text-lg">{adminUser.name}</div>
                    <div className="text-xs text-muted-foreground">{adminUser.email}</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowAdminInfoPanel(false)}>
                  ×
                </Button>
              </div>
              <div className="p-4 space-y-2">
                {adminUser.phone && <div><span className="font-semibold">Teléfono:</span> {adminUser.phone}</div>}
                {adminUser.bio && <div><span className="font-semibold">Bio:</span> {adminUser.bio}</div>}
                {adminUser.company && <div><span className="font-semibold">Empresa:</span> {adminUser.company}</div>}
                {adminUser.position && <div><span className="font-semibold">Cargo:</span> {adminUser.position}</div>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}