import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabaseService, type EditorDocument } from '@/lib/supabaseService';

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

interface EditorCursor {
  userId: string;
  userName: string;
  position: number;
  color: string;
}

interface EditorChange {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  timestamp: string;
  changeType: 'insert' | 'delete' | 'replace';
  position: number;
  oldText?: string;
  newText?: string;
  length: number;
}

interface EditorSession {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  joinedAt: string;
  lastActivity: string;
  isActive: boolean;
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
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCollaborators, setActiveCollaborators] = useState<EditorSession[]>([]);
  const [cursors, setCursors] = useState<EditorCursor[]>([]);
  const [showCollaborators, setShowCollaborators] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(1);

  const cursorTimeoutRef = useRef<NodeJS.Timeout>();

  // Load document
  useEffect(() => {
    if (!projectId || !user) return;

    const loadDocument = async () => {
      try {
        if (documentId) {
          // Load existing document
          const docData = await supabaseService.getEditorDocuments(projectId);
          const existingDoc = docData.find(doc => doc.id === documentId);
          
          if (existingDoc) {
            setDocument(existingDoc);
            setContent(existingDoc.content);
            setTitle(existingDoc.title);
            setLanguage(existingDoc.language);
            setCollaborators(existingDoc.collaborators);
            setIsPublic(existingDoc.is_public);
            setTags(existingDoc.tags);
            setCurrentVersion(existingDoc.version);
          }
        } else {
          // Create new document
          const newDoc = await supabaseService.createEditorDocument({
            project_id: projectId,
            title: 'Nuevo Documento',
            content: '',
            language: 'javascript',
            version: 1,
            last_modified: new Date().toISOString(),
            last_modified_by: user.email,
            last_modified_by_name: user.name || user.email,
            collaborators: [user.email],
            is_public: false,
            tags: []
          });

          setDocument(newDoc);
          setContent(newDoc.content);
          setTitle(newDoc.title);
          setLanguage(newDoc.language);
          setCollaborators(newDoc.collaborators);
          setIsPublic(newDoc.is_public);
          setTags(newDoc.tags);
        }
      } catch (error) {
        console.error('Error loading document:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar el documento.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [projectId, documentId, user]);

  // Join collaboration session
  useEffect(() => {
    if (!document || !user) return;

    const joinSession = async () => {
      try {
        const sessionData: Omit<EditorSession, 'id'> = {
          document_id: document.id,
          user_id: user.email,
          user_name: user.name || user.email,
          joined_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          is_active: true
        };

        // Aquí se implementaría la lógica para unirse a la sesión
        // Por ahora solo simulamos
        console.log('Joined collaboration session:', sessionData);
      } catch (error) {
        console.error('Error joining session:', error);
      }
    };

    joinSession();

    // Cleanup on unmount
    return () => {
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
    };
  }, [document, user]);

  // Update cursor position
  const updateCursorPosition = (position: number) => {
    if (!user || !document) return;

    const cursorData: Omit<EditorCursor, 'id'> = {
      userId: user.email,
      userName: user.name || user.email,
      position,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    };

    // Aquí se implementaría la actualización de la posición del cursor
    // Por ahora solo simulamos
    console.log('Cursor position updated:', cursorData);
  };

  // Save document
  const handleSave = async () => {
    if (!document || !user) return;

    setIsSaving(true);
    try {
      const updates = {
        content,
        title,
        language,
        collaborators,
        is_public: isPublic,
        tags,
        version: currentVersion + 1,
        last_modified: new Date().toISOString(),
        last_modified_by: user.email,
        last_modified_by_name: user.name || user.email
      };

      await supabaseService.updateEditorDocument(document.id, updates);
      
      setCurrentVersion(prev => prev + 1);
      setDocument(prev => prev ? { ...prev, ...updates } : null);

      toast({
        title: 'Documento guardado',
        description: 'Los cambios han sido guardados correctamente.'
      });
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el documento.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    updateCursorPosition(newContent.length);
  };

  // Handle search and replace
  const handleSearch = () => {
    if (!searchTerm) return;
    
    const index = content.indexOf(searchTerm);
    if (index !== -1) {
      // Aquí se implementaría la lógica de búsqueda en el editor
      toast({
        title: 'Búsqueda',
        description: `Encontrado en la posición ${index}`
      });
    } else {
      toast({
        title: 'Búsqueda',
        description: 'No se encontró el término buscado',
        variant: 'destructive'
      });
    }
  };

  const handleReplace = () => {
    if (!searchTerm || !replaceTerm) return;
    
    const newContent = content.replace(new RegExp(searchTerm, 'g'), replaceTerm);
    setContent(newContent);
    
    toast({
      title: 'Reemplazo',
      description: 'Texto reemplazado correctamente'
    });
  };

  // Handle file operations
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'documento'}.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.js,.ts,.jsx,.tsx,.html,.css,.py,.java,.cpp,.c,.php,.rb,.go,.rs,.swift,.kt,.dart,.r,.sql,.sh,.bat,.ps1';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setContent(content);
          setTitle(file.name.split('.')[0]);
          setLanguage(getLanguageFromExtension(file.name));
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Utility functions
  const getFileExtension = (lang: string): string => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      jsx: 'jsx',
      tsx: 'tsx',
      html: 'html',
      css: 'css',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      php: 'php',
      ruby: 'rb',
      go: 'go',
      rust: 'rs',
      swift: 'swift',
      kotlin: 'kt',
      dart: 'dart',
      r: 'r',
      sql: 'sql',
      bash: 'sh',
      powershell: 'ps1'
    };
    return extensions[lang] || 'txt';
  };

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languages: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'jsx',
      tsx: 'tsx',
      html: 'html',
      css: 'css',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      swift: 'swift',
      kt: 'kotlin',
      dart: 'dart',
      r: 'r',
      sql: 'sql',
      sh: 'bash',
      ps1: 'powershell'
    };
    return languages[ext || ''] || 'text';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título del documento"
              className="w-64"
            />
            
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="jsx">JSX</SelectItem>
                <SelectItem value="tsx">TSX</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="css">CSS</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="c">C</SelectItem>
                <SelectItem value="php">PHP</SelectItem>
                <SelectItem value="ruby">Ruby</SelectItem>
                <SelectItem value="go">Go</SelectItem>
                <SelectItem value="rust">Rust</SelectItem>
                <SelectItem value="swift">Swift</SelectItem>
                <SelectItem value="kotlin">Kotlin</SelectItem>
                <SelectItem value="dart">Dart</SelectItem>
                <SelectItem value="r">R</SelectItem>
                <SelectItem value="sql">SQL</SelectItem>
                <SelectItem value="bash">Bash</SelectItem>
                <SelectItem value="powershell">PowerShell</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPublic(!isPublic)}
            >
              {isPublic ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              {isPublic ? 'Público' : 'Privado'}
            </Button>
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
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4 mr-2" />
              Historial
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCollaborators(!showCollaborators)}
            >
              <Users className="h-4 w-4 mr-2" />
              Colaboradores
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleUpload}
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="ml-2"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar
            </Button>
          </div>
        </div>

        {/* Search and Replace Bar */}
        {showSearch && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-lg">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="w-64"
            />
            <Input
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              placeholder="Reemplazar con..."
              className="w-64"
            />
            <Button size="sm" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Button size="sm" onClick={handleReplace}>
              <Replace className="h-4 w-4 mr-2" />
              Reemplazar
            </Button>
          </div>
        )}

        {/* Document Info */}
        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span>Versión: {currentVersion}</span>
          <span>Última modificación: {document?.last_modified ? new Date(document.last_modified).toLocaleString() : 'N/A'}</span>
          <span>Por: {document?.last_modified_by_name || 'N/A'}</span>
          <span>Colaboradores: {collaborators.length}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Editor */}
        <div className="flex-1 p-4">
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={`Escribe tu código ${language} aquí...`}
            className="h-full min-h-[500px] font-mono text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                const start = e.currentTarget.selectionStart;
                const end = e.currentTarget.selectionEnd;
                const newContent = content.substring(0, start) + '  ' + content.substring(end);
                setContent(newContent);
                e.currentTarget.setSelectionRange(start + 2, start + 2);
              }
            }}
          />
        </div>

        {/* Sidebar */}
        {(showCollaborators || showHistory) && (
          <div className="w-80 border-l bg-muted/30 p-4 space-y-4">
            {/* Collaborators */}
            {showCollaborators && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Colaboradores Activos
                </h3>
                <div className="space-y-2">
                  {activeCollaborators.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay colaboradores activos</p>
                  ) : (
                    activeCollaborators.map((collaborator) => (
                      <div key={collaborator.id} className="flex items-center gap-2 p-2 bg-background rounded">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">{collaborator.user_name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {collaborator.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* History */}
            {showHistory && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Historial de Cambios
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Historial en desarrollo</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
