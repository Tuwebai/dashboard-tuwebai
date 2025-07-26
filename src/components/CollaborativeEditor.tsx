import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  deleteDoc,
  limit,
  getDocs
} from 'firebase/firestore';
import { 
  Code, 
  FileText, 
  Save, 
  Download, 
  Upload, 
  Share2, 
  Users, 
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Settings,
  Play,
  Square,
  RotateCcw,
  Copy,
  CheckCircle,
  AlertCircle,
  Zap,
  Activity,
  Clock,
  GitBranch,
  GitCommit,
  GitPullRequest,
  History,
  Search,
  Replace,
  Indent,
  Outdent,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link,
  Image,
  Table,
  Palette,
  Type,
  Languages,
  UserMinus
} from 'lucide-react';

interface EditorDocument {
  id: string;
  projectId: string;
  title: string;
  content: string;
  language: string;
  version: number;
  lastModified: string;
  lastModifiedBy: string;
  lastModifiedByName: string;
  collaborators: string[];
  isPublic: boolean;
  tags: string[];
}

interface EditorCursor {
  userId: string;
  userName: string;
  userRole: 'admin' | 'client';
  position: number;
  selectionStart?: number;
  selectionEnd?: number;
  color: string;
  timestamp: string;
}

interface EditorChange {
  id: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'client';
  type: 'insert' | 'delete' | 'replace';
  position: number;
  text?: string;
  deletedText?: string;
  timestamp: string;
}

interface EditorSession {
  id: string;
  documentId: string;
  participants: string[];
  startTime: string;
  isActive: boolean;
  sharedCursors: boolean;
  autoSave: boolean;
  versionControl: boolean;
}

export default function CollaborativeEditor({ 
  projectId, 
  documentId 
}: { 
  projectId: string;
  documentId?: string;
}) {
  const { user } = useApp();
  const [document, setDocument] = useState<EditorDocument | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [showCursors, setShowCursors] = useState(true);
  const [versionControl, setVersionControl] = useState(true);
  const [cursors, setCursors] = useState<EditorCursor[]>([]);
  const [changes, setChanges] = useState<EditorChange[]>([]);
  const [session, setSession] = useState<EditorSession | null>(null);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const cursorTimeoutRef = useRef<NodeJS.Timeout>();

  // Load document
  useEffect(() => {
    if (!projectId || !user) return;

    const loadDocument = async () => {
      try {
        if (documentId) {
          // Load existing document
          const docRef = doc(firestore, 'editorDocuments', documentId);
          const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              const docData = docSnap.data() as EditorDocument;
              setDocument(docData);
              setContent(docData.content);
              setTitle(docData.title);
              setLanguage(docData.language);
              setCollaborators(docData.collaborators);
              setIsPublic(docData.isPublic);
              setTags(docData.tags);
            }
          });

          return unsubscribe;
        } else {
          // Create new document
          const newDoc = await addDoc(collection(firestore, 'editorDocuments'), {
            projectId,
            title: 'Nuevo Documento',
            content: '',
            language: 'javascript',
            version: 1,
            lastModified: serverTimestamp(),
            lastModifiedBy: user.email,
            lastModifiedByName: user.name,
            collaborators: [user.email],
            isPublic: false,
            tags: []
          });

          setDocument({
            id: newDoc.id,
            projectId,
            title: 'Nuevo Documento',
            content: '',
            language: 'javascript',
            version: 1,
            lastModified: new Date().toISOString(),
            lastModifiedBy: user.email,
            lastModifiedByName: user.name,
            collaborators: [user.email],
            isPublic: false,
            tags: []
          });
        }
      } catch (error) {
        console.error('Error loading document:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar el documento',
          variant: 'destructive'
        });
      }
    };

    loadDocument();
  }, [projectId, documentId, user]);

  // Initialize editor session
  useEffect(() => {
    if (!document || !user) return;

    const initializeSession = async () => {
      try {
        const sessionsRef = collection(firestore, 'editorSessions');
        const sessionQuery = query(
          sessionsRef,
          where('documentId', '==', document.id),
          where('isActive', '==', true)
        );

        const sessionSnap = await getDocs(sessionQuery);
        
        if (sessionSnap.empty) {
          // Create new session
          const newSession = await addDoc(sessionsRef, {
            documentId: document.id,
            participants: [user.email],
            startTime: serverTimestamp(),
            isActive: true,
            sharedCursors: true,
            autoSave: true,
            versionControl: true
          });
          
          setSession({
            id: newSession.id,
            documentId: document.id,
            participants: [user.email],
            startTime: new Date().toISOString(),
            isActive: true,
            sharedCursors: true,
            autoSave: true,
            versionControl: true
          });
        } else {
          // Join existing session
          const existingSession = sessionSnap.docs[0];
          const sessionData = existingSession.data() as EditorSession;
          
          if (!sessionData.participants.includes(user.email)) {
            await updateDoc(existingSession.ref, {
              participants: [...sessionData.participants, user.email]
            });
          }
          
          setSession({
            id: existingSession.id,
            ...sessionData,
            participants: sessionData.participants.includes(user.email) 
              ? sessionData.participants 
              : [...sessionData.participants, user.email]
          });
        }
      } catch (error) {
        console.error('Error initializing editor session:', error);
      }
    };

    initializeSession();
  }, [document, user]);

  // Listen to cursors
  useEffect(() => {
    if (!document) return;

    const cursorQuery = query(
      collection(firestore, 'editorCursors'),
      where('documentId', '==', document.id)
    );

    const unsubscribe = onSnapshot(cursorQuery, (snapshot) => {
      const cursorsData = snapshot.docs.map(doc => doc.data() as EditorCursor);
      setCursors(cursorsData.filter(c => c.userId !== user?.email));
    });

    return unsubscribe;
  }, [document, user]);

  // Listen to changes
  useEffect(() => {
    if (!document) return;

    const changesQuery = query(
      collection(firestore, 'editorChanges'),
      where('documentId', '==', document.id),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(changesQuery, (snapshot) => {
      const changesData = snapshot.docs.map(doc => doc.data() as EditorChange);
      setChanges(changesData);
    });

    return unsubscribe;
  }, [document]);

  // Auto-save
  useEffect(() => {
    if (!autoSave || !document || !user) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDocument();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, autoSave, document, user]);

  // Cursor position tracking
  useEffect(() => {
    if (!showCursors || !document || !user || !editorRef.current) return;

    const updateCursorPosition = () => {
      const textarea = editorRef.current;
      if (!textarea) return;

      const cursorData: EditorCursor = {
        userId: user.email,
        userName: user.name,
        userRole: user.role as 'admin' | 'client',
        position: textarea.selectionStart,
        selectionStart: textarea.selectionStart,
        selectionEnd: textarea.selectionEnd,
        color: user.role === 'admin' ? '#ef4444' : '#3b82f6',
        timestamp: new Date().toISOString()
      };

      const cursorRef = doc(firestore, 'editorCursors', user.email);
      updateDoc(cursorRef, {
        ...cursorData,
        documentId: document.id
      });
    };

    const textarea = editorRef.current;
    textarea.addEventListener('keyup', updateCursorPosition);
    textarea.addEventListener('click', updateCursorPosition);
    textarea.addEventListener('select', updateCursorPosition);

    return () => {
      textarea.removeEventListener('keyup', updateCursorPosition);
      textarea.removeEventListener('click', updateCursorPosition);
      textarea.removeEventListener('select', updateCursorPosition);
    };
  }, [showCursors, document, user]);

  // Save document
  const saveDocument = async () => {
    if (!document || !user) return;

    try {
      setIsSaving(true);
      
      const docRef = doc(firestore, 'editorDocuments', document.id);
      await updateDoc(docRef, {
        title,
        content,
        language,
        version: document.version + 1,
        lastModified: serverTimestamp(),
        lastModifiedBy: user.email,
        lastModifiedByName: user.name,
        collaborators,
        isPublic,
        tags
      });

      setDocument(prev => prev ? {
        ...prev,
        title,
        content,
        language,
        version: prev.version + 1,
        lastModified: new Date().toISOString(),
        lastModifiedBy: user.email,
        lastModifiedByName: user.name,
        collaborators,
        isPublic,
        tags
      } : null);

      toast({
        title: 'Documento guardado',
        description: 'Los cambios han sido guardados exitosamente'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar el documento',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Record change
    if (document && user) {
      const change: EditorChange = {
        id: Date.now().toString(),
        userId: user.email,
        userName: user.name,
        userRole: user.role as 'admin' | 'client',
        type: 'replace',
        position: e.target.selectionStart,
        text: newContent,
        timestamp: new Date().toISOString()
      };

      addDoc(collection(firestore, 'editorChanges'), {
        ...change,
        documentId: document.id
      });
    }
  };

  // Add collaborator
  const addCollaborator = (email: string) => {
    if (!collaborators.includes(email)) {
      setCollaborators([...collaborators, email]);
      toast({
        title: 'Colaborador agregado',
        description: `${email} puede editar este documento`
      });
    }
  };

  // Remove collaborator
  const removeCollaborator = (email: string) => {
    setCollaborators(collaborators.filter(c => c !== email));
    toast({
      title: 'Colaborador removido',
      description: `${email} ya no puede editar este documento`
    });
  };

  // Toggle public access
  const togglePublicAccess = () => {
    setIsPublic(!isPublic);
    toast({
      title: isPublic ? 'Acceso privado' : 'Acceso público',
      description: isPublic 
        ? 'El documento es ahora privado' 
        : 'El documento es ahora público'
    });
  };

  // Search and replace
  const performSearch = () => {
    if (!searchTerm) return;
    
    const textarea = editorRef.current;
    if (!textarea) return;

    const index = content.indexOf(searchTerm);
    if (index !== -1) {
      textarea.setSelectionRange(index, index + searchTerm.length);
      textarea.focus();
    }
  };

  const performReplace = () => {
    if (!searchTerm || !replaceTerm) return;
    
    const newContent = content.replace(new RegExp(searchTerm, 'g'), replaceTerm);
    setContent(newContent);
    setSearchTerm('');
    setReplaceTerm('');
    setShowSearch(false);
    
    toast({
      title: 'Reemplazo completado',
      description: 'El texto ha sido reemplazado'
    });
  };

  // Copy content
  const copyContent = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Contenido copiado',
      description: 'El contenido ha sido copiado al portapapeles'
    });
  };

  // Download document
  const downloadDocument = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.${language}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get language extension
  const getLanguageExtension = (lang: string) => {
    const extensions: { [key: string]: string } = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      csharp: 'cs',
      php: 'php',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      sql: 'sql',
      markdown: 'md'
    };
    return extensions[lang] || 'txt';
  };

  if (!document) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Editor Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título del documento"
                className="max-w-xs"
              />
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="csharp">C#</SelectItem>
                  <SelectItem value="php">PHP</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline">
                v{document.version}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyContent}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadDocument}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={saveDocument}
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Replace */}
      {showSearch && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="w-48"
                />
                <Button size="sm" onClick={performSearch}>
                  Buscar
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Replace className="h-4 w-4" />
                <Input
                  value={replaceTerm}
                  onChange={(e) => setReplaceTerm(e.target.value)}
                  placeholder="Reemplazar con..."
                  className="w-48"
                />
                <Button size="sm" onClick={performReplace}>
                  Reemplazar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Textarea
              ref={editorRef}
              value={content}
              onChange={handleContentChange}
              placeholder="Escribe tu código aquí..."
              className="min-h-[400px] font-mono text-sm resize-none"
              onFocus={() => setIsEditing(true)}
              onBlur={() => setIsEditing(false)}
            />
            
            {/* Cursor indicators */}
            {showCursors && cursors.length > 0 && (
              <div className="absolute top-0 left-0 pointer-events-none">
                {cursors.map((cursor) => (
                  <div
                    key={cursor.userId}
                    className="absolute w-2 h-4 border-l-2 animate-pulse"
                    style={{
                      backgroundColor: cursor.color,
                      borderColor: cursor.color,
                      left: `${(cursor.position / content.length) * 100}%`,
                      top: '0px'
                    }}
                    title={`${cursor.userName} (${cursor.userRole})`}
                  >
                    <div 
                      className="absolute -top-6 left-0 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                      style={{ backgroundColor: cursor.color }}
                    >
                      {cursor.userName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Collaboration Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Collaborators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Colaboradores ({collaborators.length})
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={togglePublicAccess}
              >
                {isPublic ? <Lock className="h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
                {isPublic ? "Privado" : "Público"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {collaborators.map((collaborator) => (
                <div key={collaborator} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">{collaborator}</span>
                  </div>
                  {collaborator !== user?.email && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCollaborator(collaborator)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Changes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Cambios Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {changes.slice(0, 5).map((change) => (
                <div key={change.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{change.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {change.type} • {new Date(change.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Stats */}
      {session && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Estadísticas de Sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">{session.participants.length}</p>
                <p className="text-xs text-muted-foreground">Participantes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{changes.length}</p>
                <p className="text-xs text-muted-foreground">Cambios</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-500">{content.length}</p>
                <p className="text-xs text-muted-foreground">Caracteres</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500">{document.version}</p>
                <p className="text-xs text-muted-foreground">Versiones</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 