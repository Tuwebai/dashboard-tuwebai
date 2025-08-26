import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Download, 
  Trash2, 
  Folder, 
  File, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Eye,
  Edit,
  Share,
  MoreVertical,
  Plus,
  RefreshCw,
  Image,
  FileText,
  Code,
  Archive,
  Video,
  Music,
  FolderPlus,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { fileService, ProjectFile, FileSearchFilters } from '@/lib/fileService';
import { supabase } from '@/lib/supabase';
import { formatBytes } from '@/utils/formatBytes';
import { formatDateSafe } from '@/utils/formatDateSafe';

interface FileManagerProps {
  projectId: string;
  isAdmin: boolean;
}

export default function FileManager({ projectId, isAdmin }: FileManagerProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FileSearchFilters>({});
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showFileDetails, setShowFileDetails] = useState<ProjectFile | null>(null);
  const [showFilePreview, setShowFilePreview] = useState<ProjectFile | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [fileStats, setFileStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    fileTypes: {} as Record<string, number>,
    recentUploads: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar archivos
  const loadFiles = async () => {
    try {
      setLoading(true);
      const projectFiles = await fileService.getProjectFiles(projectId, currentFolder, filters);
      setFiles(projectFiles);
      
      // Cargar estadísticas
      const stats = await fileService.getFileStats(projectId);
      setFileStats(stats);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  // Buscar archivos
  const searchFiles = async () => {
    if (!searchTerm.trim()) {
      loadFiles();
      return;
    }

    try {
      setLoading(true);
      const searchResults = await fileService.searchFiles(projectId, searchTerm, filters);
      setFiles(searchResults);
    } catch (error) {
      console.error('Error searching files:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subir archivos
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress({});
    const uploadPromises: Promise<void>[] = [];

    Array.from(selectedFiles).forEach((file) => {
      // Inicializar progreso
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: 0
      }));

      const uploadPromise = fileService.uploadFile(projectId, file, currentFolder)
        .then(() => {
          // Completar progreso
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));
          
          // Limpiar progreso después de un delay
          setTimeout(() => {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[file.name];
              return newProgress;
            });
          }, 1000);
        })
        .catch((error) => {
          console.error(`Error uploading ${file.name}:`, error);
          // Limpiar progreso en caso de error
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        });

      uploadPromises.push(uploadPromise);
      
      // Simular progreso real
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 90) {
          clearInterval(progressInterval);
        }
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: Math.min(progress, 90)
        }));
      }, 300);
    });

    try {
      await Promise.all(uploadPromises);
      loadFiles();
      setShowUploadDialog(false);
    } catch (error) {
      console.error('Error in file upload:', error);
    } finally {
      setUploading(false);
      // Limpiar progreso después de un delay adicional
      setTimeout(() => {
        setUploadProgress({});
      }, 2000);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Crear carpeta
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await fileService.createFolder(projectId, newFolderName, currentFolder);
      setNewFolderName('');
      setShowCreateFolderDialog(false);
      loadFiles();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  // Descargar archivo
  const handleDownloadFile = async (file: ProjectFile) => {
    try {
      const blob = await fileService.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Eliminar archivo
  const handleDeleteFile = async (fileId: string) => {
    try {
      await fileService.deleteFile(fileId);
      loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  // Obtener URL del archivo para vista previa
  const getFilePreviewUrl = async (file: ProjectFile): Promise<string> => {
    try {
      // Usar directamente la URL de Supabase configurada
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        console.error('VITE_SUPABASE_URL no está configurada');
        return '';
      }
      
      const bucketName = 'project-files';
      const filePath = file.path;
      
      // Método 1: URL directa para archivos públicos
      const directUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
      
      console.log('Intentando cargar imagen desde:', directUrl);
      
      // Método 2: Si la URL directa no funciona, intentar con signed URL
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(filePath, 3600); // 1 hora de expiración
        
        if (error) {
          console.log('Error con signed URL, usando directa:', error.message);
          return directUrl;
        }
        
        console.log('Usando signed URL:', data.signedUrl);
        return data.signedUrl;
      } catch (signedError) {
        console.log('Error con signed URL, usando directa:', signedError);
        return directUrl;
      }
    } catch (error) {
      console.error('Error getting file URL:', error);
      return '';
    }
  };

  // Manejar apertura de vista previa
  const handleOpenPreview = async (file: ProjectFile) => {
    setShowFilePreview(file);
    
    if (file.type === 'image') {
      try {
        const url = await getFilePreviewUrl(file);
        console.log('URL generada para vista previa:', url);
        setFilePreviewUrl(url);
        
                 // Pre-cargar la imagen para verificar que funciona
         const img = new window.Image();
         img.onload = () => {
           console.log('Imagen cargada correctamente');
         };
         img.onerror = () => {
           console.error('Error al cargar la imagen');
           setFilePreviewUrl('');
         };
         img.src = url;
      } catch (error) {
        console.error('Error loading preview URL:', error);
        setFilePreviewUrl('');
      }
    }
  };

  // Obtener icono del archivo
  const getFileIcon = (file: ProjectFile) => {
    switch (file.type) {
      case 'image':
        return <Image className="h-6 w-6 text-blue-400" />;
      case 'document':
        return <FileText className="h-6 w-6 text-green-400" />;
      case 'code':
        return <Code className="h-6 w-6 text-purple-400" />;
      case 'archive':
        return <Archive className="h-6 w-6 text-orange-400" />;
      case 'video':
        return <Video className="h-6 w-6 text-red-400" />;
      case 'audio':
        return <Music className="h-6 w-6 text-pink-400" />;
      case 'folder':
        return <Folder className="h-6 w-6 text-yellow-400" />;
      default:
        return <File className="h-6 w-6 text-gray-400" />;
    }
  };

  // Ordenar archivos
  const sortedFiles = [...files].sort((a, b) => {
    let comparison = 0;
    
         switch (sortBy) {
       case 'name':
         comparison = a.name.localeCompare(b.name);
         break;
       case 'size':
         comparison = a.size - b.size;
         break;
       case 'created_at':
         comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
         break;
     }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Efectos
  useEffect(() => {
    loadFiles();
  }, [projectId, currentFolder, filters, sortBy, sortOrder]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchFiles();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <File className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Total Archivos</p>
                <p className="text-xl font-bold text-white">{fileStats.totalFiles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Espacio Usado</p>
                <p className="text-xl font-bold text-white">{formatBytes(fileStats.totalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Recientes</p>
                <p className="text-xl font-bold text-white">{fileStats.recentUploads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Grid className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Tipos</p>
                <p className="text-xl font-bold text-white">{Object.keys(fileStats.fileTypes).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowUploadDialog(true)}
            disabled={!isAdmin}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Subir Archivos
          </Button>
          
          <Button
            onClick={() => setShowCreateFolderDialog(true)}
            disabled={!isAdmin}
            variant="outline"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Nueva Carpeta
          </Button>
          
          <Button
            onClick={loadFiles}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar archivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
        </div>
        
        <Select value={filters.type || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === 'all' ? undefined : value }))}>
          <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-white">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="image">Imágenes</SelectItem>
            <SelectItem value="document">Documentos</SelectItem>
            <SelectItem value="code">Código</SelectItem>
            <SelectItem value="archive">Archivos</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-white">
            <SelectValue />
          </SelectTrigger>
                     <SelectContent className="bg-zinc-800 border-zinc-700">
             <SelectItem value="name">Nombre</SelectItem>
             <SelectItem value="size">Tamaño</SelectItem>
             <SelectItem value="created_at">Fecha</SelectItem>
           </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
        </Button>
      </div>

      {/* Lista de archivos */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
              <span className="ml-2 text-gray-400">Cargando archivos...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-400">No hay archivos en esta carpeta</p>
              {isAdmin && (
                <Button
                  onClick={() => setShowUploadDialog(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir primer archivo
                </Button>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
              {sortedFiles.map((file) => (
                                 <div
                   key={file.id}
                   className={`group relative p-4 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors cursor-pointer ${
                     viewMode === 'grid' ? 'bg-zinc-800/50' : 'bg-zinc-800/30'
                   }`}
                   onClick={() => handleOpenPreview(file)}
                 >
                  <div className="flex items-center gap-3">
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                                             <p className="text-xs text-gray-500">{formatDateSafe(file.created_at)}</p>
                    </div>
                    
                                         <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={(e) => {
                           e.stopPropagation();
                           setShowFileDetails(file);
                         }}
                       >
                         <MoreVertical className="h-4 w-4" />
                       </Button>
                       
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleDownloadFile(file);
                         }}
                       >
                         <Download className="h-4 w-4" />
                       </Button>
                       
                       {isAdmin && (
                         <Button
                           size="sm"
                           variant="ghost"
                           onClick={(e) => {
                             e.stopPropagation();
                             handleDeleteFile(file.id);
                           }}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       )}
                     </div>
                  </div>
                  
                  {file.metadata?.tags && file.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {file.metadata.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progreso de subida */}
      {Object.keys(uploadProgress).length > 0 && (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-sm">Subiendo archivos...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">{fileName}</span>
                  <span className="text-gray-400">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Modal de subida de archivos */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-zinc-900/95">
          <DialogHeader>
            <DialogTitle>Subir archivos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-400 mb-2">Arrastra archivos aquí o haz clic para seleccionar</p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Seleccionar archivos
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de crear carpeta */}
      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <DialogContent className="bg-zinc-900/95">
          <DialogHeader>
            <DialogTitle>Crear nueva carpeta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nombre de la carpeta"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateFolderDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Crear carpeta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de detalles del archivo */}
      <Dialog open={!!showFileDetails} onOpenChange={() => setShowFileDetails(null)}>
        <DialogContent className="bg-zinc-900/95 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del archivo</DialogTitle>
          </DialogHeader>
          {showFileDetails && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {getFileIcon(showFileDetails)}
                <div>
                  <h3 className="text-lg font-semibold text-white">{showFileDetails.name}</h3>
                  <p className="text-sm text-gray-400">{showFileDetails.type}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Tamaño</p>
                  <p className="text-white">{formatBytes(showFileDetails.size)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Versión</p>
                  <p className="text-white">{showFileDetails.version}</p>
                </div>
                                 <div>
                   <p className="text-gray-400">Creado</p>
                   <p className="text-white">{formatDateSafe(showFileDetails.created_at)}</p>
                 </div>
                 <div>
                   <p className="text-gray-400">Actualizado</p>
                   <p className="text-white">{formatDateSafe(showFileDetails.updated_at)}</p>
                 </div>
              </div>
              
              {showFileDetails.metadata?.description && (
                <div>
                  <p className="text-gray-400 text-sm">Descripción</p>
                  <p className="text-white">{showFileDetails.metadata.description}</p>
                </div>
              )}
              
              {showFileDetails.metadata?.tags && showFileDetails.metadata.tags.length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Etiquetas</p>
                  <div className="flex flex-wrap gap-1">
                    {showFileDetails.metadata.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadFile(showFileDetails)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                {isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteFile(showFileDetails.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
          )}
                 </DialogContent>
       </Dialog>

               {/* Modal de vista previa del archivo */}
        <Dialog open={!!showFilePreview} onOpenChange={() => {
          setShowFilePreview(null);
          setFilePreviewUrl('');
        }}>
         <DialogContent className="bg-zinc-900/95 max-w-4xl max-h-[80vh] overflow-hidden">
           <DialogHeader>
             <DialogTitle>Vista previa: {showFilePreview?.name}</DialogTitle>
           </DialogHeader>
           {showFilePreview && (
             <div className="space-y-4">
               <div className="flex items-center gap-4 mb-4">
                 {getFileIcon(showFilePreview)}
                 <div>
                   <h3 className="text-lg font-semibold text-white">{showFilePreview.name}</h3>
                   <p className="text-sm text-gray-400">{formatBytes(showFilePreview.size)} • {showFilePreview.type}</p>
                 </div>
               </div>
               
                               <div className="flex-1 overflow-auto">
                  {showFilePreview.type === 'image' ? (
                    <div className="flex justify-center">
                                             {filePreviewUrl ? (
                         <img
                           src={filePreviewUrl}
                           alt={showFilePreview.name}
                           className="max-w-full max-h-[60vh] object-contain rounded-lg"
                           onError={(e) => {
                             console.error('Error al cargar imagen en modal');
                             const target = e.target as HTMLImageElement;
                             target.style.display = 'none';
                             target.nextElementSibling?.classList.remove('hidden');
                           }}
                         />
                       ) : (
                         <div className="flex items-center justify-center h-32 text-gray-400">
                           <p>Cargando imagen...</p>
                         </div>
                       )}
                       <div className="hidden flex items-center justify-center h-32 text-gray-400">
                         <div className="text-center">
                           <Image className="h-12 w-12 mx-auto mb-2 text-gray-500" />
                           <p>No se puede mostrar la vista previa de esta imagen</p>
                           <p className="text-sm text-gray-500 mt-1">Intenta descargar el archivo</p>
                         </div>
                       </div>
                    </div>
                  ) : showFilePreview.type === 'document' ? (
                   <div className="flex items-center justify-center h-32 text-gray-400">
                     <div className="text-center">
                       <FileText className="h-12 w-12 mx-auto mb-2" />
                       <p>Vista previa no disponible para este tipo de archivo</p>
                       <Button
                         onClick={() => handleDownloadFile(showFilePreview)}
                         className="mt-2"
                       >
                         <Download className="h-4 w-4 mr-2" />
                         Descargar archivo
                       </Button>
                     </div>
                   </div>
                 ) : (
                   <div className="flex items-center justify-center h-32 text-gray-400">
                     <div className="text-center">
                       <File className="h-12 w-12 mx-auto mb-2" />
                       <p>Vista previa no disponible para este tipo de archivo</p>
                       <Button
                         onClick={() => handleDownloadFile(showFilePreview)}
                         className="mt-2"
                       >
                         <Download className="h-4 w-4 mr-2" />
                         Descargar archivo
                       </Button>
                     </div>
                   </div>
                 )}
               </div>
               
               <div className="flex justify-end gap-2 pt-4 border-t border-zinc-700">
                 <Button
                   variant="outline"
                   onClick={() => handleDownloadFile(showFilePreview)}
                 >
                   <Download className="h-4 w-4 mr-2" />
                   Descargar
                 </Button>
                 <Button
                   variant="outline"
                   onClick={() => setShowFilePreview(null)}
                 >
                   Cerrar
                 </Button>
               </div>
             </div>
           )}
         </DialogContent>
       </Dialog>
     </div>
   );
 }
