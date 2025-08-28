import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { githubService } from '@/lib/githubService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CodeEditor } from '@/components/Editor/CodeEditor';
import { useEditor } from '@/hooks/useEditor';
import { 
  ArrowLeft, 
  GitBranch, 
  GitCommit, 
  FileText, 
  Folder, 
  File, 
  Save, 
  RefreshCw, 
  Search, 
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Expand,
  Minus
} from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  content?: string;
  sha?: string;
  children?: FileNode[];
  isExpanded?: boolean;
}

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export default function VSCodeEditor() {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects } = useApp();
  const navigate = useNavigate();
  const { loadFile } = useEditor();
  
  const [project, setProject] = useState<any>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('files');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Cargar proyecto
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const foundProject = projects.find(p => p.id === projectId);
      if (foundProject) {
        setProject(foundProject);
        loadRepositoryData(foundProject.github_repository_url);
      }
    }
  }, [projectId, projects]);

  const loadRepositoryData = async (repoUrl: string) => {
    if (!repoUrl) {
      toast({
        title: "❌ Error",
        description: "Este proyecto no tiene un repositorio de GitHub configurado.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      const [fileStructure, branchesData, commitsData] = await Promise.all([
        githubService.getDirectoryStructure(repoUrl, '', currentBranch),
        githubService.getBranches(repoUrl),
        githubService.getRecentCommits(repoUrl, currentBranch, 20)
      ]);

      setFileTree(buildFileTree(fileStructure));
      setBranches(branchesData.map((b: any) => b.name));
      setCommits(commitsData.map((c: any) => ({
        sha: c.sha.substring(0, 7),
        message: c.commit.message,
        author: c.commit.author.name,
        date: new Date(c.commit.author.date).toLocaleDateString('es-ES')
      })));

    } catch (error: any) {
      console.error('Error loading repository:', error);
      toast({
        title: "❌ Error",
        description: error.message || "Error al cargar el repositorio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const buildFileTree = (files: any[]): FileNode[] => {
    const tree: { [key: string]: FileNode } = {};

    files.forEach(file => {
      const pathParts = file.path.split('/');
      let currentPath = '';

      pathParts.forEach((part: string, index: number) => {
        const isLast = index === pathParts.length - 1;
        const fullPath = currentPath ? `${currentPath}/${part}` : part;

        if (!tree[fullPath]) {
          tree[fullPath] = {
            name: part,
            path: fullPath,
            type: isLast ? file.type : 'dir',
            children: isLast ? undefined : [],
            isExpanded: false, // Por defecto las carpetas están colapsadas
          };
        }

        if (currentPath && tree[currentPath]) {
          if (!tree[currentPath].children) {
            tree[currentPath].children = [];
          }
          if (!tree[currentPath].children!.find(child => child.path === fullPath)) {
            tree[currentPath].children!.push(tree[fullPath]);
          }
        }

        currentPath = fullPath;
      });
    });

    // Función recursiva para ordenar el árbol completo
    const sortTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
      }).map(node => ({
        ...node,
        children: node.children ? sortTree(node.children) : undefined
      }));
    };

    const rootNodes = Object.values(tree).filter(node => !node.path.includes('/'));
    return sortTree(rootNodes);
  };

  const handleFileClick = async (file: FileNode) => {
    if (file.type !== 'file' || !project?.github_repository_url) return;

    try {
      await loadFile(file, project.github_repository_url, currentBranch);
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: `Error al cargar ${file.name}: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleFolderToggle = (folder: FileNode) => {
    if (folder.type !== 'dir') return;

    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folder.path)) {
        newSet.delete(folder.path);
      } else {
        newSet.add(folder.path);
      }
      return newSet;
    });
  };

  const expandAllFolders = () => {
    const getAllFolderPaths = (nodes: FileNode[]): string[] => {
      const paths: string[] = [];
      nodes.forEach(node => {
        if (node.type === 'dir') {
          paths.push(node.path);
          if (node.children) {
            paths.push(...getAllFolderPaths(node.children));
          }
        }
      });
      return paths;
    };

    const allFolderPaths = getAllFolderPaths(fileTree);
    setExpandedFolders(new Set(allFolderPaths));
  };

  const collapseAllFolders = () => {
    setExpandedFolders(new Set());
  };

  const renderFileTree = (files: FileNode[], level = 0) => {
    // Ordenar: primero carpetas, luego archivos (como VSCode)
    const sortedFiles = [...files].sort((a, b) => {
      if (a.type === 'dir' && b.type !== 'dir') return -1;
      if (a.type !== 'dir' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name);
    });

    return sortedFiles.map((file) => {
      const isExpanded = expandedFolders.has(file.path);
      const hasChildren = file.children && file.children.length > 0;

      return (
        <div key={file.path}>
          <div
            className={`flex items-center gap-2 p-2 rounded text-gray-300 ${
              file.type === 'file' 
                ? 'cursor-pointer hover:bg-zinc-700/50' 
                : 'cursor-default'
            }`}
            style={{ paddingLeft: `${level * 20}px` }}
            onClick={() => file.type === 'file' ? handleFileClick(file) : null}
          >
            {/* Botón de expansión para carpetas */}
            {file.type === 'dir' && (
              <button
                className="w-4 h-4 flex items-center justify-center hover:bg-zinc-600 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFolderToggle(file);
                }}
              >
                {hasChildren ? (
                  isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                  )
                ) : (
                  <div className="w-3 h-3" />
                )}
              </button>
            )}
            
            {/* Espacio para archivos */}
            {file.type === 'file' && (
              <div className="w-4 h-4" />
            )}
            
            {/* Icono del archivo/carpeta */}
            {file.type === 'dir' ? (
              <Folder className="h-4 w-4 text-blue-400" />
            ) : (
              <File className="h-4 w-4 text-green-400" />
            )}
            
            <span className="text-sm">{file.name}</span>
          </div>
          
          {/* Renderizar subcarpetas si están expandidas */}
          {file.type === 'dir' && hasChildren && isExpanded && (
            <div>
              {renderFileTree(file.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Proyecto no encontrado</h2>
          <Button onClick={() => navigate('/code-editor')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-800">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/code-editor')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          
          <div>
            <h1 className="text-lg font-semibold text-white">{project.name}</h1>
            <p className="text-sm text-gray-400">Editor de Código</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Branch selector */}
          <Select value={currentBranch} onValueChange={setCurrentBranch}>
            <SelectTrigger className="w-40 bg-zinc-700 border-zinc-600 text-white">
              <GitBranch className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-700 border-zinc-600">
              {branches.map(branch => (
                <SelectItem key={branch} value={branch}>{branch}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Refresh button */}
          <Button
            variant="outline"
            onClick={() => loadRepositoryData(project.github_repository_url)}
            className="border-zinc-600 text-gray-400 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-zinc-800 border-r border-zinc-700 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 bg-zinc-700">
              <TabsTrigger value="files" className="text-xs">Archivos</TabsTrigger>
              <TabsTrigger value="git" className="text-xs">Git</TabsTrigger>
              <TabsTrigger value="search" className="text-xs">Buscar</TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="flex-1 p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-white">Explorador de archivos</h3>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={expandAllFolders}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                      title="Expandir todo"
                    >
                      <Expand className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={collapseAllFolders}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                      title="Colapsar todo"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {renderFileTree(fileTree)}
              </div>
            </TabsContent>

            <TabsContent value="git" className="flex-1 p-4">
              <div className="space-y-4">
                <h3 className="font-medium text-white">Commits recientes</h3>
                <div className="space-y-2">
                  {commits.map((commit) => (
                    <div key={commit.sha} className="p-2 bg-zinc-700 rounded text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <GitCommit className="h-3 w-3 text-green-400" />
                        <span className="text-green-400 font-mono">{commit.sha}</span>
                      </div>
                      <p className="text-white text-xs mb-1">{commit.message}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{commit.author}</span>
                        <span>{commit.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="search" className="flex-1 p-4">
              <div className="space-y-4">
                <h3 className="font-medium text-white">Buscar en archivos</h3>
                <Input
                  placeholder="Buscar archivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-zinc-700 border-zinc-600 text-white"
                />
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Editor */}
        <div className="flex-1">
          <CodeEditor />
        </div>
      </div>
    </div>
  );
}
