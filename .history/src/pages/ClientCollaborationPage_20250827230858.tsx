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
import { supabase } from '@/lib/supabase';

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

  // Collaboration state
  const [participants, setParticipants] = useState<string[]>([]);

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
        console.log('Cargando datos de colaboración para proyecto:', projectId);
        
        // Load chat room
        let roomId = '';
        
        // Buscar sala existente
        const { data: existingRooms, error: chatError } = await supabase
          .from('chatRooms')
          .select('*')
          .eq('projectId', projectId);
        
        if (chatError) {
          console.error('Error buscando salas de chat:', chatError);
          toast({
            title: 'Error',
            description: 'No se pudieron cargar las salas de chat',
            variant: 'destructive'
          });
          return;
        }
        
        if (existingRooms && existingRooms.length > 0) {
          // Usar la primera sala existente
          const room = existingRooms[0];
          roomId = room.id;
          setChatRoomId(roomId);
          console.log('Sala de chat encontrada:', roomId);
          
          // Actualizar participantes si es necesario
          if (!room.participants.includes(user.email)) {
            const { error: updateError } = await supabase
              .from('chatRooms')
              .update({
                participants: [...room.participants, user.email]
              })
              .eq('id', roomId);
            
            if (updateError) {
              console.error('Error actualizando participantes:', updateError);
            }
          }
        } else {
          // Crear nueva sala de chat
          const { data: newRoom, error: createError } = await supabase
            .from('chatRooms')
            .insert({
              projectId,
              participants: [user.email, 'tuwebai@gmail.com'],
              createdAt: new Date().toISOString(),
              unreadCount: 0,
              projectName: project.name
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creando sala de chat:', createError);
            toast({
              title: 'Error',
              description: 'No se pudo crear la sala de chat',
              variant: 'destructive'
            });
            return;
          }
          
          roomId = newRoom.id;
          setChatRoomId(roomId);
          console.log('Nueva sala de chat creada:', roomId);
        }
        
        // Escuchar mensajes en tiempo real
        if (roomId) {
          // Cargar mensajes iniciales
          const loadMessages = async () => {
            const { data: messagesData, error: messagesError } = await supabase
              .from('chatMessages')
              .select('*')
              .eq('chatRoomId', roomId)
              .order('timestamp', { ascending: true });
            
            if (messagesError) {
              console.error('Error cargando mensajes:', messagesError);
              toast({
                title: 'Error',
                description: 'No se pudieron cargar los mensajes',
                variant: 'destructive'
              });
              return;
            }
            
            if (messagesData) {
              const formattedMessages = messagesData.map(msg => ({
                id: msg.id,
                ...msg
              })) as ChatMessage[];
              
              console.log('Mensajes cargados:', formattedMessages.length);
              setMessages(formattedMessages);
              setCollaborationStats(prev => ({ ...prev, totalMessages: formattedMessages.length }));
            }
          };
          
          // Cargar mensajes iniciales
          loadMessages();
          
          // Suscribirse a cambios en tiempo real
          const channel = supabase
            .channel(`chat_messages_${roomId}`)
            .on('postgres_changes', 
              { 
                event: '*', 
                schema: 'public', 
                table: 'chatMessages',
                filter: `chatRoomId=eq.${roomId}`
              }, 
              (payload) => {
                console.log('Cambio en mensajes:', payload);
                loadMessages(); // Recargar mensajes cuando hay cambios
              }
            )
            .subscribe();
          
          // Cleanup function
          return () => {
            supabase.removeChannel(channel);
          };
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
    if (!newMessage.trim() || !chatRoomId) {
      console.log('No se puede enviar mensaje:', { message: newMessage.trim(), chatRoomId });
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage(''); // Limpiar input inmediatamente para mejor UX

    try {
      console.log('Enviando mensaje:', messageText);
      
      const messageData = {
        text: messageText,
        sender: user.email,
        senderName: user.name || user.email,
        timestamp: serverTimestamp(),
        type: 'text',
        projectId: projectId
      };

      const messageRef = await addDoc(collection(firestore, 'chatRooms', chatRoomId, 'messages'), messageData);
      console.log('Mensaje enviado exitosamente:', messageRef.id);
      
      // Actualizar contador de mensajes no leídos para otros participantes
      await updateDoc(doc(firestore, 'chatRooms', chatRoomId), {
        lastMessage: messageText,
        lastMessageTime: serverTimestamp(),
        unreadCount: increment(1)
      });
      
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      setNewMessage(messageText); // Restaurar mensaje si falla
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje. Inténtalo de nuevo.',
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

      // Simular subida de archivo (en producción usar Supabase Storage)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const fileData = {
        name: file.name,
        url: URL.createObjectURL(file), // En producción sería la URL de Supabase Storage
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

  // Función utilitaria para manejar timestamps de Supabase
  const formatSupabaseTimestamp = (timestamp: any, options?: Intl.DateTimeFormatOptions) => {
    try {
      if (!timestamp) return 'Ahora';
      
      // Supabase timestamp viene como string ISO
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', timestamp);
        return 'Ahora';
      }
      
      const defaultOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit'
      };
      
      return date.toLocaleTimeString('es-ES', options || defaultOptions);
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return 'Ahora';
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
                             <div className="h-96 overflow-y-auto space-y-4 border rounded-lg p-4 bg-muted/20">
                 {messages.length === 0 ? (
                   <div className="text-center py-8 text-muted-foreground">
                     <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                     <p>No hay mensajes aún. ¡Sé el primero en escribir!</p>
                   </div>
                 ) : (
                   messages.map((message) => (
                     <div
                       key={message.id}
                       className={`flex ${message.sender === user.email ? 'justify-end' : 'justify-start'}`}
                     >
                       <div
                         className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                           message.sender === user.email
                             ? 'bg-primary text-primary-foreground'
                             : 'bg-background border border-border'
                         }`}
                       >
                         <div className="flex items-center gap-2 mb-1">
                           <span className="text-xs font-medium">
                             {message.sender === user.email ? 'Tú' : message.senderName}
                           </span>
                           <span className="text-xs opacity-70">
                             {formatSupabaseTimestamp(message.timestamp)}
                           </span>
                         </div>
                         <p className="text-sm break-words">{message.text}</p>
                       </div>
                     </div>
                   ))
                 )}
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

      
    </div>
  );
}
