import React from 'react';
import { MonacoEditor } from './MonacoEditor';
import { TabsManager } from './TabsManager';
import { StatusBar } from './StatusBar';
import { SearchBar } from './SearchBar';

interface CodeEditorProps {
  className?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ className }) => {
  return (
    <div className={`flex flex-col h-full bg-zinc-900 ${className}`}>
      {/* Barra de tabs */}
      <TabsManager />
      
      {/* Barra de búsqueda */}
      <SearchBar />
      
      {/* Editor principal */}
      <div className="flex-1 min-h-0">
        <MonacoEditor />
      </div>
      
      {/* Barra de estado */}
      <StatusBar />
    </div>
  );
};
