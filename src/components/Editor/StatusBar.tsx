import React from 'react';
import { useEditor } from '@/hooks/useEditor';
import { useEditorStore } from '@/stores/editorStore';
import { 
  GitBranch, 
  FileText, 
  Type, 
  Eye, 
  Settings,
  Save,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const StatusBar: React.FC = () => {
  const {
    activeTab,
    saveFile,
  } = useEditor();

  const {
    fontSize,
    theme,
    wordWrap,
    minimap,
    lineNumbers,
    autoSave,
    toggleMinimap,
    toggleAutoSave,
  } = useEditorStore();

  const handleSave = () => {
    if (activeTab) {
      saveFile(activeTab);
    }
  };

  if (!activeTab) {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-t border-zinc-700 text-sm text-gray-400">
        <div className="flex items-center gap-4">
          <span>Listo</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {fontSize}px
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {theme}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-t border-zinc-700 text-sm text-gray-400">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>{activeTab.name}</span>
          {activeTab.isDirty && (
            <span className="text-yellow-500">●</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4" />
          <span className="capitalize">{activeTab.language}</span>
        </div>

        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          <span>main</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={handleSave}
        >
          <Save className="h-3 w-3 mr-1" />
          Guardar
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={toggleMinimap}
        >
          <Eye className="h-3 w-3 mr-1" />
          {minimap ? 'Ocultar' : 'Mostrar'} Minimap
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={toggleAutoSave}
        >
          <Zap className="h-3 w-3 mr-1" />
          Auto-save {autoSave ? 'ON' : 'OFF'}
        </Button>

        <Badge variant="secondary" className="text-xs">
          {fontSize}px
        </Badge>

        <Badge variant="secondary" className="text-xs">
          {wordWrap === 'on' ? 'Wrap' : 'No Wrap'}
        </Badge>

        <Badge variant="secondary" className="text-xs">
          {lineNumbers === 'on' ? 'Líneas' : 'Sin líneas'}
        </Badge>
      </div>
    </div>
  );
};
