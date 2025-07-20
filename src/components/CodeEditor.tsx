import { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
  Save, 
  Play, 
  Download, 
  Copy, 
  FileText, 
  Settings, 
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  FolderPlus,
  File,
  Folder,
  X,
  Plus
} from 'lucide-react';
import TerminalComponent from './Terminal';

interface CodeFile {
  id: string;
  name: string;
  content: string;
  language: string;
  type: 'file' | 'folder';
  parentId?: string;
}

interface CodeEditorProps {
  projectId?: string;
  onSave?: (files: CodeFile[]) => void;
}

export default function CodeEditor({ projectId, onSave }: CodeEditorProps) {
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'file' | 'folder'>('file');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(14);

  const getLanguageExtension = (language: string) => {
    switch (language) {
      case 'javascript':
        return [javascript()];
      case 'html':
        return [html()];
      case 'css':
        return [css()];
      default:
        return [];
    }
  };

  const handleCodeChange = (value: string) => {
    setFiles(prev => prev.map(file => 
      file.id === activeFile 
        ? { ...file, content: value }
        : file
    ));
  };

  const handleSave = () => {
    onSave?.(files);
    toast({
      title: "Archivos guardados",
      description: "Todos los cambios han sido guardados correctamente.",
    });
  };

  const handleRunCode = () => {
    if (isPreviewMode) {
      // Cerrar preview y volver al editor
      setIsPreviewMode(false);
      toast({
        title: "Vista previa cerrada",
        description: "Has vuelto al modo de edición.",
      });
    } else {
      // Abrir preview
      setIsPreviewMode(true);
      toast({
        title: "Vista previa activada",
        description: "Ahora puedes ver tu código en acción.",
      });
    }
  };

  const handleDownload = () => {
    files.forEach(file => {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    });
    toast({
      title: "Descarga iniciada",
      description: "Todos los archivos se están descargando.",
    });
  };

  const handleCopyCode = () => {
    const file = files.find(f => f.id === activeFile);
    if (file) {
      navigator.clipboard.writeText(file.content);
      toast({
        title: "Código copiado",
        description: "El código ha sido copiado al portapapeles.",
      });
    }
  };

  const addNewFile = () => {
    const fileName = prompt('Nombre del archivo:');
    if (fileName) {
      const extension = fileName.split('.').pop() || 'txt';
      let language = 'javascript';
      
      if (extension === 'html') language = 'html';
      else if (extension === 'css') language = 'css';
      else if (extension === 'js') language = 'javascript';

      const newFile: CodeFile = {
        id: Date.now().toString(),
        name: fileName,
        content: `// ${fileName}\n\n`,
        language,
        type: 'file'
      };

      setFiles(prev => [...prev, newFile]);
      setActiveFile(newFile.id);
    }
  };

  const deleteFile = (fileId: string) => {
    if (files.length > 1) {
      setFiles(prev => prev.filter(f => f.id !== fileId));
      if (activeFile === fileId) {
        setActiveFile(files.find(f => f.id !== fileId)?.id || null);
      }
    }
  };

  const generatePreviewHTML = () => {
    const htmlFile = files.find(f => f.language === 'html');
    const cssFile = files.find(f => f.language === 'css');
    const jsFile = files.find(f => f.language === 'javascript');

    let htmlContent = htmlFile?.content || '<html><body><h1>No hay archivo HTML</h1></body></html>';
    
    // Inyectar CSS y JS inline
    if (cssFile && cssFile.content.trim()) {
      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `<style>${cssFile.content}</style></head>`);
      } else {
        htmlContent = `<head><style>${cssFile.content}</style></head>` + htmlContent;
      }
    }
    
    if (jsFile && jsFile.content.trim()) {
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `<script>${jsFile.content}</script></body>`);
      } else {
        htmlContent += `<script>${jsFile.content}</script>`;
      }
    }

    return htmlContent;
  };

  // Busca el objeto del archivo activo:
  const activeFileObj = files.find(f => f.id === activeFile) || null;

  return (
    <div className={`h-full bg-background border border-border rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/10">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Editor de Código</h2>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {files.length} archivos
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={fontSize.toString()} onValueChange={(value) => setFontSize(Number(value))}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12px</SelectItem>
              <SelectItem value="14">14px</SelectItem>
              <SelectItem value="16">16px</SelectItem>
              <SelectItem value="18">18px</SelectItem>
              <SelectItem value="20">20px</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>

          <Button variant="outline" size="sm" onClick={addNewFile}>
            <Plus className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={handleCopyCode}>
            <Copy className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4" />
          </Button>

          <Button size="sm" onClick={handleRunCode} className="bg-gradient-primary hover:opacity-90">
            {isPreviewMode ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Editor
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Vista Previa
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100%-4rem)]">
        {/* File Explorer */}
        <div className="w-64 border-r border-border bg-muted/5 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Explorador</h3>
            <Button variant="ghost" size="sm" onClick={addNewFile}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-1">
            {files.map(file => (
              <div
                key={file.id}
                className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted/20 ${
                  activeFile === file.id ? 'bg-primary/10 text-primary' : ''
                }`}
                onClick={() => setActiveFile(file.id)}
              >
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  <span className="text-sm">{file.name}</span>
                </div>
                
                {files.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFile(file.id);
                    }}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col">
          {isPreviewMode ? (
            // Vista previa
            <div className="flex-1 bg-white">
              <div className="h-full overflow-auto">
                <iframe
                  className="w-full h-full border-0"
                  srcDoc={generatePreviewHTML()}
                  title="Vista previa"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          ) : (
            <>
              {/* File Tabs */}
              <div className="flex items-center border-b border-border bg-muted/5">
                {files.map(file => (
                  <div
                    key={file.id}
                    className={`flex items-center gap-2 px-4 py-2 border-r border-border cursor-pointer hover:bg-muted/20 ${
                      activeFile === file.id ? 'bg-background border-b-2 border-b-primary' : ''
                    }`}
                    onClick={() => setActiveFile(file.id)}
                  >
                    <File className="h-4 w-4" />
                    <span className="text-sm">{file.name}</span>
                    {files.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFile(file.id);
                        }}
                        className="h-4 w-4 p-0 ml-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Code Area */}
              <div className="flex-1">
                {activeFileObj && (
                  <CodeMirror
                    value={activeFileObj.content}
                    onChange={handleCodeChange}
                    extensions={getLanguageExtension(activeFileObj.language)}
                    basicSetup={{
                      lineNumbers: true,
                      foldGutter: true,
                      dropCursor: false,
                      allowMultipleSelections: false,
                      indentOnInput: true,
                      bracketMatching: true,
                      closeBrackets: true,
                      autocompletion: true,
                      highlightSelectionMatches: true,
                      completionKeymap: true,
                      searchKeymap: true,
                    }}
                    style={{
                      fontSize: `${fontSize}px`,
                      height: '100%',
                    }}
                    className="h-full"
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Terminal */}
        {!isPreviewMode && (
          <div className="w-80 border-l border-border bg-muted/5 flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium">Terminal</h3>
            </div>
            <div className="flex-1 p-4">
              <TerminalComponent />
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 border-t border-border bg-muted/5 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Líneas: {activeFileObj ? activeFileObj.content.split('\n').length : 0}</span>
          <span>Caracteres: {activeFileObj ? activeFileObj.content.length : 0}</span>
          <span>Idioma: {activeFileObj ? activeFileObj.language : ''}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            UTF-8
          </Badge>
          <Badge variant="outline" className="text-xs">
            LF
          </Badge>
        </div>
      </div>
    </div>
  );
}