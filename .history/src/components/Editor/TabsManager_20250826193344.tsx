import React from 'react';
import { X, FileText, Save } from 'lucide-react';
import { useEditor } from '@/hooks/useEditor';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const TabsManager: React.FC = () => {
  const {
    tabs,
    activeTabId,
    setActiveTab,
    removeTab,
    saveFile,
  } = useEditor();

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    removeTab(tabId);
  };

  const handleSaveTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      saveFile(tab);
    }
  };

  if (tabs.length === 0) {
    return (
      <div className="flex items-center justify-center h-12 bg-zinc-800 border-b border-zinc-700">
        <span className="text-gray-400 text-sm">No hay archivos abiertos</span>
      </div>
    );
  }

  return (
    <div className="flex items-center bg-zinc-800 border-b border-zinc-700 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            "flex items-center gap-2 px-4 py-2 min-w-0 cursor-pointer border-r border-zinc-700 hover:bg-zinc-700 transition-colors",
            tab.isActive ? "bg-zinc-700 border-b-2 border-blue-500" : "bg-zinc-800"
          )}
          onClick={() => handleTabClick(tab.id)}
        >
          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
          
          <span className="text-sm text-gray-300 truncate max-w-32">
            {tab.name}
          </span>
          
          {tab.isDirty && (
            <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0" />
          )}
          
          <div className="flex items-center gap-1">
            {tab.isDirty && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-zinc-600"
                onClick={(e) => handleSaveTab(e, tab.id)}
              >
                <Save className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-red-600 hover:text-white"
              onClick={(e) => handleCloseTab(e, tab.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
