import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  getDocs,
  limit,
  getDoc
} from 'firebase/firestore';
import { 
  MessageSquare, 
  FileText, 
  CheckSquare, 
  Users, 
  Calendar, 
  Upload, 
  Download, 
  Trash2, 
  Edit, 
  Plus, 
  Send,
  Video,
  Phone,
  Share2,
  Star,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Paperclip,
  Smile,
  Mic,
  ScreenShare,
  UserPlus,
  Settings,
  BarChart3,
  Activity,
  Zap,
  Code,
  Monitor,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  MousePointer,
  GitBranch,
  GitCommit,
  GitPullRequest,
  History,
  Search,
  Replace,
  Copy,
  Save,
  Languages,
  UserMinus,
  Home,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDateSafe } from '@/utils/formatDateSafe';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  assigneeName: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  phaseKey: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  senderName: string;
  timestamp: string;
  type: 'text' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
}

interface File {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  projectId: string;
}

interface CollaborationStats {
  totalMessages: number;
  totalComments: number;
  totalTasks: number;
  completedTasks: number;
  activeUsers: number;
  lastActivity: string;
  projectProgress: number;
  filesUploaded: number;
  timeSpent: number;
}

export default function ClientCollaborationPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, projects, loading, error, refreshData } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const [project, setProject] = useState<any>(null);
  const [collaborationStats, setCollaborationStats] = useState<CollaborationStats>({
    totalMessages: 0,
    totalComments: 0,
    totalTasks: 0,
    completedTasks: 0,
    activeUsers: 0,
    lastActivity: '',
    projectProgress: 0,
    filesUploaded: 0,
    timeSpent: 0
  });

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [chatRoomId, setChatRoomId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tasks state (solo lectura para clientes)
  const [tasks, setTasks] = useState<Task[]>([]);

  // Files state
  const [files, setFiles] = useState<File[]>([]);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const [openFileMenuId, setOpenFileMenuId] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<File | null>(null);

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentPhase, setCommentPhase] = useState('');

  // Voice/Video call state (solo para clientes)
  const [isCallActive, setIsCallActive] = useState(false);
  const [callParticipants, setCallParticipants] = useState<string[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Collaboration tools state
  const [participants, setParticipants] = useState<string[]>([]);
  const [isCursorSharing, setIsCursorSharing] = useState(false);
  const [isPresenceVisible, setIsPresenceVisible] = useState(true);
  const [notifications, setNotifications] = useState(true);

  // Session state
  const [sessionConfigOpen, setSessionConfigOpen] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('Activa');
  const [sessionParticipants, setSessionParticipants] = useState(participants);
  const sessionStart = project?.createdAt || new Date().toISOString();
  const sessionId = projectId;

  // Find project by ID
  useEffect(() => {
    async function fetchProjectById() {
      console.log('ClientCollaborationPage - Buscando proyecto:', projectId);
      console.log('ClientCollaborationPage - Proyectos disponibles:', projects);
      
      if (!projectId) return;
      
      // Buscar el proyecto en los proyectos del usuario
      const foundProject = projects.find(p => p.id === projectId);
      console.log('ClientCollaborationPage - Proyecto encontrado:', foundProject);
      
      if (foundProject) {
        setProject(foundProject);
      } else {
        setProject(null);
        console.log('ClientCollaborationPage - Proyecto no encontrado');
        toast({
          title: 'Error',
          description: 'Proyecto no encontrado o no tienes acceso',
          variant: 'destructive'
        });
        navigate('/dashboard');
      }
    }
    fetchProjectById();
  }, [projectId, projects, user, navigate]);

  // Load collaboration data
  useEffect(() => {
    if (!project || !user) return;

    const loadCollaborationData = async () => {
      try {
        // Load chat room
        const chatRoomsRef = collection(firestore, 'chatRooms');
        const chatQuery = query(
          chatRoomsRef, 
          where('projectId', '==', projectId),
          where('participants', 'array-contains', user.email)
        );
        
        const chatSnap = await getDocs(chatQuery);
        if (!chatSnap.empty) {
          const room = chatSnap.docs[0];
          setChatRoomId(room.id);
          
          // Listen to messages
          const messagesRef = collection(firestore, 'chatRooms', room.id, 'messages');
          const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
          
          onSnapshot(messagesQuery, (snapshot) => {
            const messagesData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as ChatMessage[];
            setMessages(messagesData);
            setCollaborationStats(prev => ({ ...prev, totalMessages: messagesData.length }));
          });
        } else {
          // Create new chat room
          const newRoom = await addDoc(chatRoomsRef, {
            projectId,
            participants: [user.email, 'tuwebai@gmail.com'],
            createdAt: serverTimestamp(),
            unreadCount: 0
          });
          setChatRoomId(newRoom.id);
        }

        // Load tasks (solo lectura para clientes)
        const tasksRef = collection(firestore, 'tasks');
        const tasksQuery = query(
          tasksRef, 
          where('projectId', '==', projectId),
          orderBy('createdAt', 'desc')
        );
        
        onSnapshot(tasksQuery, (snapshot) => {
          const tasksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Task[];
          setTasks(tasksData);
          
          const completed = tasksData.filter(t => t.status === 'completed').length;
          setCollaborationStats(prev => ({ 
            ...prev, 
            totalTasks: tasksData.length,
            completedTasks: completed
          }));
        });

        // Load files
        const filesRef = collection(firestore, 'projectFiles');
        const filesQuery = query(
          filesRef, 
          where('projectId', '==', projectId),
          orderBy('uploadedAt', 'desc')
        );
        
        onSnapshot(filesQuery, (snapshot) => {
          const filesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as File[];
          setFiles(filesData);
          setCollaborationStats(prev => ({ ...prev, filesUploaded: filesData.length }));
        });

        // Load comments
        const commentsRef = collection(firestore, 'comments');
        const commentsQuery = query(
          commentsRef, 
          where('projectId', '==', projectId),
          orderBy('timestamp', 'desc')
        );
        
        onSnapshot(commentsQuery, (snapshot) => {
          const commentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setComments(commentsData);
          setCollaborationStats(prev => ({ ...prev, totalComments: commentsData.length }));
        });

        // Initialize participants
        setParticipants([user.email, 'tuwebai@gmail.com']);

      } catch (error) {
        console.error('Error loading collaboration data:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos de colaboración',
          variant: 'destructive'
        });
      }
    };

    loadCollaborationData();
  }, [project, user, projectId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !chatRoomId) return;

    try {
      const messageData = {
        text: newMessage.trim(),
        sender: user.email,
        senderName: user.name,
        timestamp: serverTimestamp(),
        type: 'text'
      };

      await addDoc(collection(firestore, 'chatRooms', chatRoomId, 'messages'), messageData);
      setNewMessage('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive'
      });
    }
  };

  // Upload file
  const uploadFile = async (file: File) => {
    if (!projectId) return;

    setUploadingFile(file);
    setFileUploadProgress(0);

    try {
      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setFileUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Simular subida de archivo (en producción usar Firebase Storage)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const fileData = {
        name: file.name,
        url: URL.createObjectURL(file), // En producción sería la URL de Firebase Storage
        size: file.size,
        type: file.type,
        uploadedBy: user.email,
        uploadedByName: user.name,
        uploadedAt: serverTimestamp(),
        projectId
      };

      await addDoc(collection(firestore, 'projectFiles'), fileData);
      
      setFileUploadProgress(100);
      setUploadingFile(null);
      
      toast({
        title: 'Archivo subido',
        description: 'El archivo se ha subido correctamente'
      });

      setTimeout(() => setFileUploadProgress(0), 1000);
    } catch (error) {
      setUploadingFile(null);
      setFileUploadProgress(0);
      toast({
        title: 'Error',
        description: 'No se pudo subir el archivo',
        variant: 'destructive'
      });
    }
  };

  // Add comment to phase
  const addCommentToPhase = async (phaseKey: string) => {
    if (!newComment.trim() || !phaseKey || !projectId) return;

    try {
      const commentData = {
        text: newComment.trim(),
        author: user.email,
        authorName: user.name,
        phaseKey,
        projectId,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(firestore, 'comments'), commentData);
      setNewComment('');
      setCommentPhase('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar el comentario',
        variant: 'destructive'
      });
    }
  };

  // Call functions
  const handleCallToggle = (type: 'voice' | 'video') => {
    setIsCallActive(!isCallActive);
    toast({
      title: isCallActive ? 'Llamada terminada' : 'Llamada iniciada',
      description: `Llamada ${type} ${isCallActive ? 'terminada' : 'iniciada'}`
    });
  };

  const handleScreenShareToggle = () => {
    setIsScreenSharing(!isScreenSharing);
    toast({
      title: isScreenSharing ? 'Compartir pantalla detenido' : 'Compartir pantalla iniciado',
      description: isScreenSharing ? 'Ya no estás compartiendo tu pantalla' : 'Estás compartiendo tu pantalla'
    });
  };

  // Utility functions
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-green-500 text-white';
    }
  };

  // Validación de rol en useEffect para evitar warnings de React
  useEffect(() => {
    console.log('ClientCollaborationPage - User:', user);
    console.log('ClientCollaborationPage - User role:', user?.role);
    
    if (!user || (user.role !== 'client' && user.role !== 'user')) {
      console.log('Usuario no autorizado, redirigiendo a dashboard');
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  // Si no hay usuario o no es autorizado, mostrar loading
  if (!user || (user.role !== 'client' && user.role !== 'user')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Colaboración - {project.name}</h1>
            <p className="text-muted-foreground">Espacio de trabajo colaborativo para tu proyecto</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {participants.length} participantes
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {sessionStatus}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mensajes</p>
                <p className="text-2xl font-bold">{collaborationStats.totalMessages}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tareas</p>
                <p className="text-2xl font-bold">{collaborationStats.totalTasks}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completadas</p>
                <p className="text-2xl font-bold">{collaborationStats.completedTasks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Archivos</p>
                <p className="text-2xl font-bold">{collaborationStats.filesUploaded}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Comentarios</p>
                <p className="text-2xl font-bold">{collaborationStats.totalComments}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progreso</p>
                <p className="text-2xl font-bold">{collaborationStats.totalTasks > 0 ? Math.round((collaborationStats.completedTasks / collaborationStats.totalTasks) * 100) : 0}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collaboration Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Herramientas de Colaboración
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant={isCallActive ? "destructive" : "default"}
              onClick={() => handleCallToggle('voice')}
              className="flex items-center gap-2"
            >
              {isCallActive ? <Phone className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
              {isCallActive ? 'Terminar Llamada' : 'Llamada de Voz'}
            </Button>
            
            <Button
              variant={isCallActive ? "destructive" : "default"}
              onClick={() => handleCallToggle('video')}
              className="flex items-center gap-2"
            >
              {isCallActive ? <Video className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              {isCallActive ? 'Terminar Video' : 'Video Llamada'}
            </Button>
            
            <Button
              variant={isScreenSharing ? "destructive" : "outline"}
              onClick={handleScreenShareToggle}
              className="flex items-center gap-2"
            >
              <ScreenShare className="h-4 w-4" />
              {isScreenSharing ? 'Detener Compartir' : 'Compartir Pantalla'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setSessionConfigOpen(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Configuración
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Tareas
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Archivos
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comentarios
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat del Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-96 overflow-y-auto space-y-4 border rounded-lg p-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === user.email ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === user.email
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{message.senderName}</span>
                        <span className="text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Escribe un mensaje..."
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab - Solo lectura para clientes */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Tareas del Proyecto
              </CardTitle>
              <CardDescription>
                Vista de las tareas asignadas por el equipo de desarrollo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {tasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(task.status)}
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Asignado a: {task.assigneeName}</span>
                        <span>Vence: {formatDateSafe(task.dueDate)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-full justify-center">
                          {task.status === 'pending' && 'Pendiente'}
                          {task.status === 'in-progress' && 'En Progreso'}
                          {task.status === 'completed' && 'Completado'}
                          {task.status === 'cancelled' && 'Cancelado'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {tasks.length === 0 && (
                <div className="text-center py-8">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay tareas asignadas aún</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Archivos del Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile(file);
                  }}
                  className="w-64"
                />
                {uploadingFile && (
                  <div className="flex items-center gap-2">
                    <Progress value={fileUploadProgress} className="w-24" />
                    <span className="text-xs">{fileUploadProgress}%</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <Card key={file.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="h-8 w-8 text-blue-500" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Subido por {file.uploadedByName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => window.open(file.url, '_blank')}>
                            <Download className="h-4 w-4" />
                          </Button>
                          {user.email === file.uploadedBy && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={async () => {
                                await deleteDoc(doc(firestore, 'projectFiles', file.id));
                                toast({ title: 'Archivo eliminado' });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {files.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay archivos subidos aún</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comentarios por Fase
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Select value={commentPhase} onValueChange={setCommentPhase}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Seleccionar fase" />
                  </SelectTrigger>
                  <SelectContent>
                    {project.fases?.map((fase: any) => (
                      <SelectItem key={fase.key} value={fase.key}>
                        {fase.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => addCommentToPhase(commentPhase)}
                  disabled={!newComment.trim() || !commentPhase}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Comentar
                </Button>
              </div>

              {commentPhase && (
                <Card>
                  <CardContent className="p-4">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={`Agregar comentario en ${commentPhase}...`}
                      className="mb-4"
                    />
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {comments
                  .filter(comment => !commentPhase || comment.phaseKey === commentPhase)
                  .map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {comment.authorName?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{comment.authorName}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDateSafe(comment.timestamp)}
                              </span>
                              {comment.phaseKey && (
                                <Badge variant="outline" className="text-xs">
                                  {comment.phaseKey}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{comment.text}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
              
              {comments.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay comentarios aún</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de configuración de sesión */}
      <Dialog open={sessionConfigOpen} onOpenChange={setSessionConfigOpen}>
        <DialogContent className="max-w-md bg-zinc-900/95">
          <DialogHeader>
            <DialogTitle>Configuración de Sesión</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button className="w-full" onClick={() => { setSessionStatus('Finalizada'); setSessionConfigOpen(false); }}>
              Cerrar sesión actual
            </Button>
            <Button className="w-full" onClick={() => toast({ title: 'Historial', description: 'Función de historial real pendiente' })}>
              Ver historial de actividad
            </Button>
            <Button className="w-full" onClick={() => { setSessionStatus(sessionStatus === 'Activa' ? 'Finalizada' : 'Activa'); setSessionConfigOpen(false); }}>
              Cambiar estado de la sesión ({sessionStatus === 'Activa' ? 'Finalizada' : 'Activa'})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
