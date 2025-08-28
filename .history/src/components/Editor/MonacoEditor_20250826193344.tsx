import React, { useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { useEditor } from '@/hooks/useEditor';

interface MonacoEditorProps {
  className?: string;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({ className }) => {
  const {
    activeTab,
    getEditorOptions,
    handleEditorChange,
    handleEditorDidMount,
  } = useEditor();

  const editorOptions = useMemo(() => getEditorOptions(), [getEditorOptions]);

  if (!activeTab) {
    return (
      <div className={`flex items-center justify-center h-full bg-zinc-900 ${className}`}>
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium mb-2">Selecciona un archivo</h3>
          <p>Elige un archivo del explorador para comenzar a editar</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full ${className}`}>
      <Editor
        height="100%"
        language={activeTab.language}
        value={activeTab.content}
        theme="vs-dark"
        options={editorOptions}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        path={activeTab.path}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        }
      />
    </div>
  );
};
