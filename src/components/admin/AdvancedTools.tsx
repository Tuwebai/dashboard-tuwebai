import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { 
  Code, 
  Terminal, 
  FileText, 
  Database, 
  Server, 
  Settings, 
  Play, 
  Square, 
  Save, 
  Download, 
  Upload,
  Folder,
  File,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Info,
  HardDrive,
  Cpu,
  MemoryStick,
  Network
} from 'lucide-react';


interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified: string;
  content?: string;
}

interface ProcessInfo {
  id: string;
  name: string;
  cpu: number;
  memory: number;
  status: 'running' | 'stopped' | 'error';
  uptime: string;
}

interface DatabaseQuery {
  id: string;
  query: string;
  result: any;
  executionTime: number;
  timestamp: string;
}

export default function AdvancedTools() {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState('code');
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [terminalCommand, setTerminalCommand] = useState('');
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [databaseQueries, setDatabaseQueries] = useState<DatabaseQuery[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [systemStats, setSystemStats] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0
  });

  const terminalRef = useRef<HTMLDivElement>(null);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);

  // Simular archivos del sistema
  useEffect(() => {
    const mockFiles: FileItem[] = [
      {
        name: 'index.html',
        path: '/public/index.html',
        type: 'file',
        size: 2048,
        modified: new Date().toISOString(),
        content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>TuWebAI</title>\n</head>\n<body>\n  <h1>Welcome</h1>\n</body>\n</html>'
      },
      {
        name: 'styles.css',
        path: '/src/styles.css',
        type: 'file',
        size: 1024,
        modified: new Date().toISOString(),
        content: 'body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n}'
      },
      {
        name: 'app.js',
        path: '/src/app.js',
        type: 'file',
        size: 3072,
        modified: new Date().toISOString(),
        content: 'console.log("Hello World");\n\nfunction init() {\n  // Initialize app\n}'
      },
      {
        name: 'src',
        path: '/src',
        type: 'directory',
        modified: new Date().toISOString()
      },
      {
        name: 'public',
        path: '/public',
        type: 'directory',
        modified: new Date().toISOString()
      }
    ];
    setFileList(mockFiles);
  }, []);

  // Simular procesos del sistema
  useEffect(() => {
    const mockProcesses: ProcessInfo[] = [
      {
        id: '1',
        name: 'node server.js',
        cpu: 15.2,
        memory: 256,
        status: 'running',
        uptime: '2h 15m'
      },
      {
        id: '2',
        name: 'nginx',
        cpu: 2.1,
        memory: 128,
        status: 'running',
        uptime: '1d 3h'
      },
      {
        id: '3',
        name: 'mysql',
        cpu: 8.5,
        memory: 512,
        status: 'running',
        uptime: '5d 12h'
      }
    ];
    setProcesses(mockProcesses);
  }, []);

  // Simular estadísticas del sistema
  useEffect(() => {
    const updateStats = () => {
      setSystemStats({
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: Math.random() * 100
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Ejecutar comando en terminal
  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    const newOutput = `$ ${command}`;
    setTerminalOutput(prev => [...prev, newOutput]);

    // Simular ejecución de comandos reales
    let result = '';
    try {
      switch (command.toLowerCase()) {
        case 'ls':
        case 'dir':
          result = fileList.map(f => `${f.type === 'directory' ? '📁' : '📄'} ${f.name}`).join('\n');
          break;
        case 'pwd':
          result = '/dashboard-tuwebai';
          break;
        case 'ps':
          result = processes.map(p => `${p.id} ${p.name} ${p.cpu}% ${p.memory}MB`).join('\n');
          break;
        case 'top':
          result = 'CPU: ' + systemStats.cpu.toFixed(1) + '%\nMemory: ' + systemStats.memory.toFixed(1) + '%';
          break;
        case 'clear':
          setTerminalOutput([]);
          return;
        default:
          result = `Command not found: ${command}`;
      }
    } catch (error) {
      result = `Error: ${error}`;
    }

    setTerminalOutput(prev => [...prev, result]);
    setTerminalCommand('');

    // Scroll al final del terminal
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 100);
  };

  // Ejecutar consulta de base de datos
  const executeQuery = async () => {
    if (!currentQuery.trim()) return;

    const startTime = Date.now();
    
    try {
      // Ejecutar consulta real en Firestore
      let result;
      if (currentQuery.toLowerCase().includes('users')) {
        const usersSnap = await getDocs(collection(firestore, 'users'));
        result = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else if (currentQuery.toLowerCase().includes('projects')) {
        const projectsSnap = await getDocs(collection(firestore, 'projects'));
        result = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else if (currentQuery.toLowerCase().includes('payments')) {
        const paymentsSnap = await getDocs(collection(firestore, 'payments'));
        result = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else {
        result = { error: 'Query not supported. Use: users, projects, or payments' };
      }

      const executionTime = Date.now() - startTime;
      
      const newQuery: DatabaseQuery = {
        id: Date.now().toString(),
        query: currentQuery,
        result: result,
        executionTime,
        timestamp: new Date().toISOString()
      };

      setDatabaseQueries(prev => [newQuery, ...prev.slice(0, 9)]);
      setQueryResult(result);

      // Guardar en logs
      await addDoc(collection(firestore, 'admin_logs'), {
        action: 'database_query',
        user: user?.email,
        query: currentQuery,
        executionTime,
        timestamp: serverTimestamp(),
        result: typeof result === 'object' ? JSON.stringify(result) : result
      });

      toast({
        title: 'Query ejecutada',
        description: `Tiempo de ejecución: ${executionTime}ms`
      });

    } catch (error) {
      console.error('Error executing query:', error);
      toast({
        title: 'Error',
        description: 'No se pudo ejecutar la consulta',
        variant: 'destructive'
      });
    }
  };

  // Guardar archivo
  const saveFile = async () => {
    if (!currentFile) return;

    try {
      // En producción, aquí guardarías el archivo real
      const updatedFile = { ...currentFile, content: fileContent };
      setFileList(prev => prev.map(f => f.id === currentFile.id ? updatedFile : f));

      // Guardar en logs
      await addDoc(collection(firestore, 'admin_logs'), {
        action: 'file_saved',
        user: user?.email,
        file: currentFile.path,
        timestamp: serverTimestamp()
      });

      toast({
        title: 'Archivo guardado',
        description: `${currentFile.name} se guardó correctamente`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar el archivo',
        variant: 'destructive'
      });
    }
  };

  // Abrir archivo
  const openFile = (file: FileItem) => {
    if (file.type === 'directory') return;
    
    setCurrentFile(file);
    setFileContent(file.content || '');
  };

  // Crear nuevo archivo
  const createFile = () => {
    const fileName = prompt('Nombre del archivo:');
    if (!fileName) return;

    const newFile: FileItem = {
      name: fileName,
      path: `/new/${fileName}`,
      type: 'file',
      size: 0,
      modified: new Date().toISOString(),
      content: ''
    };

    setFileList(prev => [...prev, newFile]);
    setCurrentFile(newFile);
    setFileContent('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Herramientas Avanzadas</h2>
          <p className="text-muted-foreground">Editor de código, terminal y gestión del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
            <Check className="h-3 w-3 mr-1" />
            Sistema Activo
          </Badge>
        </div>
      </div>

      {/* Estadísticas del sistema */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Cpu className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">CPU</p>
                <p className="text-lg font-bold">{systemStats.cpu.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MemoryStick className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Memoria</p>
                <p className="text-lg font-bold">{systemStats.memory.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Disco</p>
                <p className="text-lg font-bold">{systemStats.disk.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Network className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Red</p>
                <p className="text-lg font-bold">{systemStats.network.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="code" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="terminal" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Terminal
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Base de Datos
          </TabsTrigger>
          <TabsTrigger value="processes" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Procesos
          </TabsTrigger>
        </TabsList>

        {/* Editor de Código */}
        <TabsContent value="code" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Explorador de archivos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    Archivos
                  </span>
                  <Button size="sm" onClick={createFile}>
                    <File className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    {fileList.map((file) => (
                      <div
                        key={file.path}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted ${
                          currentFile?.path === file.path ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => openFile(file)}
                      >
                        {file.type === 'directory' ? (
                          <Folder className="h-4 w-4 text-blue-500" />
                        ) : (
                          <File className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm truncate">{file.name}</span>
                        {file.size && (
                          <Badge variant="outline" className="ml-auto text-xs">
                            {file.size} B
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Editor */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      {currentFile ? currentFile.name : 'Editor'}
                    </span>
                    {currentFile && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveFile}>
                          <Save className="h-4 w-4 mr-1" />
                          Guardar
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentFile ? (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {currentFile.path} • {currentFile.size} bytes
                      </div>
                      <textarea
                        ref={codeEditorRef}
                        value={fileContent}
                        onChange={(e) => setFileContent(e.target.value)}
                        className="w-full h-64 p-4 bg-muted border rounded font-mono text-sm resize-none"
                        placeholder="Escribe tu código aquí..."
                      />
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      Selecciona un archivo para editar
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Terminal */}
        <TabsContent value="terminal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Terminal del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Output del terminal */}
                <div
                  ref={terminalRef}
                  className="h-64 bg-black text-green-400 p-4 rounded font-mono text-sm overflow-y-auto"
                >
                  {terminalOutput.map((line, index) => (
                    <div key={index} className="whitespace-pre-wrap">{line}</div>
                  ))}
                </div>

                {/* Input del terminal */}
                <div className="flex gap-2">
                  <Input
                    value={terminalCommand}
                    onChange={(e) => setTerminalCommand(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && executeCommand(terminalCommand)}
                    placeholder="Escribe un comando..."
                    className="font-mono"
                  />
                  <Button onClick={() => executeCommand(terminalCommand)}>
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setTerminalOutput([])}>
                    <Square className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Comandos disponibles: ls, pwd, ps, top, clear
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Base de Datos */}
        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Query Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Consulta de Base de Datos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Consulta Firestore</Label>
                    <textarea
                      value={currentQuery}
                      onChange={(e) => setCurrentQuery(e.target.value)}
                      className="w-full h-32 p-3 bg-muted border rounded font-mono text-sm resize-none"
                      placeholder="Ejemplo: users, projects, payments"
                    />
                  </div>
                  <Button onClick={executeQuery} className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Ejecutar Consulta
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resultado */}
            <Card>
              <CardHeader>
                <CardTitle>Resultado</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                    {queryResult ? JSON.stringify(queryResult, null, 2) : 'Ejecuta una consulta para ver el resultado'}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Historial de consultas */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Consultas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {databaseQueries.map((query) => (
                  <div key={query.id} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div>
                      <div className="font-mono text-sm">{query.query}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(query.timestamp).toLocaleString()} • {query.executionTime}ms
                      </div>
                    </div>
                    <Badge variant="outline">
                      {query.executionTime}ms
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Procesos */}
        <TabsContent value="processes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Procesos del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {processes.map((process) => (
                  <div key={process.id} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div>
                        <div className="font-semibold">{process.name}</div>
                        <div className="text-sm text-muted-foreground">PID: {process.id}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{process.cpu}% CPU</div>
                      <div className="text-xs text-muted-foreground">{process.memory} MB</div>
                      <div className="text-xs text-muted-foreground">{process.uptime}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
