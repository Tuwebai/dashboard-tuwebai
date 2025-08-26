import { useCallback, useEffect, useRef } from 'react';
import { useEditorStore, EditorTab } from '@/stores/editorStore';
import { githubService } from '@/lib/githubService';
import { toast } from '@/hooks/use-toast';

export const useEditor = () => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  
  const {
    tabs,
    activeTabId,
    fontSize,
    theme,
    wordWrap,
    minimap,
    lineNumbers,
    autoSave,
    searchQuery,
    replaceQuery,
    isSearchVisible,
    isReplaceVisible,
    searchOptions,
    addTab,
    removeTab,
    setActiveTab,
    updateTabContent,
    updateTabDirty,
    setSearchQuery,
    setReplaceQuery,
    toggleSearch,
    toggleReplace,
  } = useEditorStore();

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !activeTabId) return;

    const timeoutId = setTimeout(() => {
      const activeTab = tabs.find(tab => tab.id === activeTabId);
      if (activeTab && activeTab.isDirty) {
        saveFile(activeTab);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [autoSave, activeTabId, tabs]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + S: Save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        const activeTab = tabs.find(tab => tab.id === activeTabId);
        if (activeTab) {
          saveFile(activeTab);
        }
      }

      // Ctrl/Cmd + F: Find
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        toggleSearch();
      }

      // Ctrl/Cmd + H: Replace
      if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
        event.preventDefault();
        toggleReplace();
      }

      // Ctrl/Cmd + W: Close tab
      if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
        event.preventDefault();
        if (activeTabId) {
          removeTab(activeTabId);
        }
      }

      // Ctrl/Cmd + Tab: Next tab
      if ((event.ctrlKey || event.metaKey) && event.key === 'Tab') {
        event.preventDefault();
        const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
        if (currentIndex >= 0) {
          const nextIndex = (currentIndex + 1) % tabs.length;
          setActiveTab(tabs[nextIndex].id);
        }
      }

      // Ctrl/Cmd + Shift + Tab: Previous tab
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Tab') {
        event.preventDefault();
        const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
        if (currentIndex >= 0) {
          const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
          setActiveTab(tabs[prevIndex].id);
        }
      }

      // Ctrl/Cmd + Plus: Increase font size
      if ((event.ctrlKey || event.metaKey) && event.key === '=') {
        event.preventDefault();
        useEditorStore.getState().setFontSize(Math.min(fontSize + 1, 24));
      }

      // Ctrl/Cmd + Minus: Decrease font size
      if ((event.ctrlKey || event.metaKey) && event.key === '-') {
        event.preventDefault();
        useEditorStore.getState().setFontSize(Math.max(fontSize - 1, 8));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, tabs, fontSize, toggleSearch, toggleReplace]);

  // Load file content from GitHub
  const loadFile = useCallback(async (file: any, projectRepoUrl: string, branch: string = 'main') => {
    try {
      const content = await githubService.getFileContent(projectRepoUrl, file.path, branch);
      
      addTab({
        name: file.name,
        path: file.path,
        content: content.content || '',
        language: getLanguageFromFileName(file.name),
        sha: content.sha,
      });
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: `Error al cargar ${file.name}: ${error.message}`,
        variant: "destructive"
      });
    }
  }, [addTab]);

  // Save file to GitHub
  const saveFile = useCallback(async (tab: EditorTab) => {
    if (!tab.sha) {
      toast({
        title: "❌ Error",
        description: "No se puede guardar: archivo no sincronizado con GitHub",
        variant: "destructive"
      });
      return;
    }

    try {
      // This would need the project repository URL
      // For now, we'll just mark as not dirty
      updateTabDirty(tab.id, false);
      
      toast({
        title: "✅ Guardado",
        description: `${tab.name} se ha guardado correctamente.`,
      });
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: `Error al guardar: ${error.message}`,
        variant: "destructive"
      });
    }
  }, [updateTabDirty]);

  // Get Monaco editor options
  const getEditorOptions = useCallback(() => ({
    fontSize,
    theme,
    wordWrap,
    minimap: {
      enabled: minimap,
    },
    lineNumbers,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    selectOnLineNumbers: true,
    glyphMargin: true,
    folding: true,
    lineDecorationsWidth: 10,
    lineNumbersMinChars: 3,
    renderLineHighlight: 'all',
    useTabStops: false,
    fontFamily: 'Consolas, "Courier New", monospace',
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: true,
    trimAutoWhitespace: true,
    largeFileOptimizations: true,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnCommitCharacter: true,
    acceptSuggestionOnEnter: 'on',
    wordBasedSuggestions: true,
    parameterHints: {
      enabled: true,
    },
    autoIndent: 'full',
    formatOnPaste: true,
    formatOnType: true,
    dragAndDrop: true,
    links: true,
    colorDecorators: true,
    lightbulb: {
      enabled: true,
    },
    codeActionsOnSave: {
      'source.fixAll': true,
      'source.organizeImports': true,
    },
  }), [fontSize, theme, wordWrap, minimap, lineNumbers]);

  // Handle editor change
  const handleEditorChange = useCallback((value: string | undefined, event: any) => {
    if (!activeTabId || !value) return;
    updateTabContent(activeTabId, value);
  }, [activeTabId, updateTabContent]);

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure Monaco
    monaco.editor.defineTheme('vs-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2a2d2e',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
      },
    });

    // Set up search functionality
    if (isSearchVisible && searchQuery) {
      editor.getAction('actions.find').run();
    }
  }, [isSearchVisible, searchQuery]);

  // Get language from file name
  const getLanguageFromFileName = useCallback((fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'html':
      case 'htm':
        return 'html';
      case 'css':
      case 'scss':
      case 'sass':
        return 'css';
      case 'json':
        return 'json';
      case 'py':
        return 'python';
      case 'php':
        return 'php';
      case 'md':
        return 'markdown';
      case 'xml':
        return 'xml';
      case 'yaml':
      case 'yml':
        return 'yaml';
      case 'sql':
        return 'sql';
      case 'sh':
      case 'bash':
        return 'shell';
      case 'java':
        return 'java';
      case 'c':
        return 'c';
      case 'cpp':
      case 'cc':
      case 'cxx':
        return 'cpp';
      case 'cs':
        return 'csharp';
      case 'go':
        return 'go';
      case 'rs':
        return 'rust';
      case 'rb':
        return 'ruby';
      case 'pl':
        return 'perl';
      case 'r':
        return 'r';
      case 'kt':
        return 'kotlin';
      case 'swift':
        return 'swift';
      case 'dart':
        return 'dart';
      default:
        return 'plaintext';
    }
  }, []);

  return {
    // State
    tabs,
    activeTabId,
    activeTab: tabs.find(tab => tab.id === activeTabId),
    
    // Refs
    editorRef,
    monacoRef,
    
    // Actions
    loadFile,
    saveFile,
    addTab,
    removeTab,
    setActiveTab,
    updateTabContent,
    updateTabDirty,
    
    // Search
    searchQuery,
    replaceQuery,
    isSearchVisible,
    isReplaceVisible,
    searchOptions,
    setSearchQuery,
    setReplaceQuery,
    toggleSearch,
    toggleReplace,
    
    // Editor options
    getEditorOptions,
    handleEditorChange,
    handleEditorDidMount,
    getLanguageFromFileName,
  };
};
