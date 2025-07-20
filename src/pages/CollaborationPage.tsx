import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  limit
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
  UserMinus
} from 'lucide-react';

// Import collaboration components
import CollaborationTools from '@/components/CollaborationTools';
import RealTimeCollaboration from '@/components/RealTimeCollaboration';
import CollaborativeEditor from '@/components/CollaborativeEditor';

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
  tags: string[];
  attachments: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  comments: Array<{
    id: string;
    text: string;
    author: string;
    authorName: string;
    timestamp: string;
  }>;
}

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'client';
  timestamp: string;
  read: boolean;
  type: 'text' | 'file' | 'image' | 'system';
  attachments?: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  reactions: {
    [key: string]: string[]; // emoji: [userId1, userId2]
  };
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
  phaseKey: string;
  version: number;
  description?: string;
  tags: string[];
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

export default function CollaborationPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, projects, loading, error, refreshData } = useApp();
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

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    assignee: '',
    dueDate: '',
    phaseKey: ''
  });
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Files state
  const [files, setFiles] = useState<File[]>([]);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentPhase, setCommentPhase] = useState('');

  // Voice/Video call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [callParticipants, setCallParticipants] = useState<string[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Collaboration tools state
  const [participants, setParticipants] = useState<string[]>([]);
  const [isCursorSharing, setIsCursorSharing] = useState(false);
  const [isPresenceVisible, setIsPresenceVisible] = useState(true);
  const [notifications, setNotifications] = useState(true);

  // Find project by ID
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const foundProject = projects.find(p => p.id === projectId);
      setProject(foundProject || null);
    }
  }, [projectId, projects]);

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

        // Load tasks
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
    if (!newMessage.trim() || !chatRoomId || !user) return;

    try {
      const messagesRef = collection(firestore, 'chatRooms', chatRoomId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: user.email,
        senderName: user.name,
        senderRole: user.role,
        timestamp: serverTimestamp(),
        read: false,
        type: 'text',
        reactions: {}
      });

      setNewMessage('');
      setIsTyping(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive'
      });
    }
  };

  // Create task
  const createTask = async () => {
    if (!newTask.title.trim() || !projectId || !user) return;

    try {
      const tasksRef = collection(firestore, 'tasks');
      await addDoc(tasksRef, {
        ...newTask,
        status: 'pending',
        projectId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tags: [],
        attachments: [],
        comments: []
      });

      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        assignee: '',
        dueDate: '',
        phaseKey: ''
      });
      setIsTaskModalOpen(false);

      toast({
        title: 'Tarea creada',
        description: 'La tarea ha sido creada exitosamente'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la tarea',
        variant: 'destructive'
      });
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const taskRef = doc(firestore, 'tasks', taskId);
      await updateDoc(taskRef, {
        status,
        updatedAt: serverTimestamp()
      });

      toast({
        title: 'Tarea actualizada',
        description: `La tarea ha sido marcada como ${status}`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la tarea',
        variant: 'destructive'
      });
    }
  };

  // Upload file
  const uploadFile = async (file: globalThis.File) => {
    if (!projectId || !user) return;

    try {
      setUploadingFile({
        id: '',
        name: file.name,
        url: '',
        size: file.size,
        type: file.type,
        uploadedBy: user.email,
        uploadedByName: user.name,
        uploadedAt: new Date().toISOString(),
        projectId: projectId,
        phaseKey: 'general',
        version: 1,
        description: '',
        tags: []
      });
      setFileUploadProgress(0);

      // Simulate file upload progress
      const interval = setInterval(() => {
        setFileUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      // Create file record in Firestore
      const filesRef = collection(firestore, 'projectFiles');
      await addDoc(filesRef, {
        name: file.name,
        url: URL.createObjectURL(file), // In production, upload to Firebase Storage
        size: file.size,
        type: file.type,
        uploadedBy: user.email,
        uploadedByName: user.name,
        uploadedAt: serverTimestamp(),
        projectId,
        phaseKey: 'general',
        version: 1,
        description: '',
        tags: []
      });

      setUploadingFile(null);
      setFileUploadProgress(0);

      toast({
        title: 'Archivo subido',
        description: 'El archivo ha sido subido exitosamente'
      });
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
    if (!newComment.trim() || !projectId || !user) return;

    try {
      const commentsRef = collection(firestore, 'comments');
      await addDoc(commentsRef, {
        text: newComment.trim(),
        authorId: user.email,
        authorName: user.name,
        authorRole: user.role,
        timestamp: serverTimestamp(),
        projectId,
        phaseKey,
        parentId: null,
        replies: [],
        reactions: {},
        mentions: [],
        isEdited: false
      });

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

  // Start voice/video call
  const startCall = async (type: 'voice' | 'video') => {
    try {
      setIsCallActive(true);
      setCallParticipants([user?.email || '']);
      
      toast({
        title: 'Llamada iniciada',
        description: `Llamada de ${type} iniciada`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la llamada',
        variant: 'destructive'
      });
    }
  };

  // Toggle screen sharing
  const toggleScreenSharing = () => {
    setIsScreenSharing(!isScreenSharing);
    toast({
      title: isScreenSharing ? 'Compartir pantalla detenido' : 'Compartir pantalla iniciado',
      description: isScreenSharing ? 'Ya no estás compartiendo tu pantalla' : 'Estás compartiendo tu pantalla'
    });
  };

  // Add participant
  const addParticipant = (email: string) => {
    if (!participants.includes(email)) {
      setParticipants([...participants, email]);
      toast({
        title: 'Participante agregado',
        description: `${email} se unió a la colaboración`
      });
    }
  };

  // Remove participant
  const removeParticipant = (email: string) => {
    setParticipants(participants.filter(p => p !== email));
    toast({
      title: 'Participante removido',
      description: `${email} fue removido de la colaboración`
    });
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando colaboración...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Proyecto no encontrado</h3>
          <p className="text-muted-foreground">El proyecto que buscas no existe o no tienes permisos para acceder.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Colaboración - {project.name}</h1>
          <p className="text-muted-foreground">Trabaja en equipo con tu proyecto</p>
        </div>
        
        {/* Call controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => startCall('voice')}
            disabled={isCallActive}
          >
            <Phone className="h-4 w-4 mr-2" />
            Llamada
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => startCall('video')}
            disabled={isCallActive}
          >
            <Video className="h-4 w-4 mr-2" />
            Video
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleScreenSharing}
            disabled={!isCallActive}
          >
            <ScreenShare className="h-4 w-4 mr-2" />
            Pantalla
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <p className="text-2xl font-bold">{collaborationStats.completedTasks}/{collaborationStats.totalTasks}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-green-500" />
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
                <p className="text-sm font-medium text-muted-foreground">Progreso</p>
                <p className="text-2xl font-bold">{collaborationStats.projectProgress}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Collaboration Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
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
            <Users className="h-4 w-4" />
            Comentarios
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Herramientas
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Actividad
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat del Proyecto
                {typingUsers.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {typingUsers.join(', ')} está escribiendo...
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto space-y-4 mb-4 p-4 border rounded-lg">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.email ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user?.email
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

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tareas del Proyecto</h3>
            <Button onClick={() => setIsTaskModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>

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
                    <span>Vence: {new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select
                      value={task.status}
                      onValueChange={(value: Task['status']) => updateTaskStatus(task.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="in-progress">En Progreso</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Archivos del Proyecto</h3>
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
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Comentarios por Fase</h3>
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
          </div>

          <div className="space-y-4">
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
                              {new Date(comment.timestamp).toLocaleString()}
                            </span>
                            {comment.phaseKey && (
                              <Badge variant="outline">{comment.phaseKey}</Badge>
                            )}
                          </div>
                          <p className="text-sm">{comment.text}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </TabsContent>

        {/* Editor Tab */}
        <TabsContent value="editor" className="space-y-4">
          <CollaborativeEditor projectId={projectId!} />
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <CollaborationTools
            projectId={projectId!}
            isCallActive={isCallActive}
            onCallToggle={startCall}
            onScreenShareToggle={toggleScreenSharing}
            participants={participants}
            onParticipantAdd={addParticipant}
            onParticipantRemove={removeParticipant}
          />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <RealTimeCollaboration projectId={projectId!} />
        </TabsContent>
      </Tabs>

      {/* Task Modal */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nueva Tarea</DialogTitle>
            <DialogDescription>
              Agrega una nueva tarea al proyecto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título de la tarea"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción de la tarea"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={newTask.priority} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="dueDate">Fecha límite</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="phase">Fase</Label>
              <Select value={newTask.phaseKey} onValueChange={(value) => setNewTask(prev => ({ ...prev, phaseKey: value }))}>
                <SelectTrigger>
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
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createTask} disabled={!newTask.title.trim()}>
                Crear Tarea
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 