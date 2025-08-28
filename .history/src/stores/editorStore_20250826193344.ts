import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface EditorTab {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
  isActive: boolean;
  sha?: string;
}

export interface EditorState {
  // Tabs management
  tabs: EditorTab[];
  activeTabId: string | null;
  
  // Editor settings
  fontSize: number;
  theme: 'vs-dark' | 'vs-light' | 'hc-black';
  wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
  autoSave: boolean;
  
  // Editor state
  isFullscreen: boolean;
  sidebarVisible: boolean;
  statusBarVisible: boolean;
  
  // Search & replace
  searchQuery: string;
  replaceQuery: string;
  isSearchVisible: boolean;
  isReplaceVisible: boolean;
  searchOptions: {
    caseSensitive: boolean;
    wholeWord: boolean;
    regex: boolean;
  };
  
  // Actions
  addTab: (tab: Omit<EditorTab, 'id' | 'isDirty' | 'isActive'>) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  updateTabDirty: (tabId: string, isDirty: boolean) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;
  
  // Editor settings actions
  setFontSize: (size: number) => void;
  setTheme: (theme: 'vs-dark' | 'vs-light' | 'hc-black') => void;
  setWordWrap: (wrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded') => void;
  toggleMinimap: () => void;
  setLineNumbers: (lineNumbers: 'on' | 'off' | 'relative') => void;
  toggleAutoSave: () => void;
  
  // UI actions
  toggleFullscreen: () => void;
  toggleSidebar: () => void;
  toggleStatusBar: () => void;
  
  // Search actions
  setSearchQuery: (query: string) => void;
  setReplaceQuery: (query: string) => void;
  toggleSearch: () => void;
  toggleReplace: () => void;
  setSearchOptions: (options: Partial<EditorState['searchOptions']>) => void;
  
  // Utility actions
  getActiveTab: () => EditorTab | null;
  getTabById: (tabId: string) => EditorTab | null;
  getDirtyTabs: () => EditorTab[];
}

export const useEditorStore = create<EditorState>()(
  devtools(
    (set, get) => ({
      // Initial state
      tabs: [],
      activeTabId: null,
      fontSize: 14,
      theme: 'vs-dark',
      wordWrap: 'off',
      minimap: true,
      lineNumbers: 'on',
      autoSave: true,
      isFullscreen: false,
      sidebarVisible: true,
      statusBarVisible: true,
      searchQuery: '',
      replaceQuery: '',
      isSearchVisible: false,
      isReplaceVisible: false,
      searchOptions: {
        caseSensitive: false,
        wholeWord: false,
        regex: false,
      },

      // Tab management actions
      addTab: (tabData) => {
        const newTab: EditorTab = {
          ...tabData,
          id: `${tabData.path}-${Date.now()}`,
          isDirty: false,
          isActive: false,
        };

        set((state) => {
          const existingTabIndex = state.tabs.findIndex(tab => tab.path === tabData.path);
          
          if (existingTabIndex >= 0) {
            // Tab already exists, just activate it
            const updatedTabs = state.tabs.map((tab, index) => ({
              ...tab,
              isActive: index === existingTabIndex,
            }));
            
            return {
              tabs: updatedTabs,
              activeTabId: state.tabs[existingTabIndex].id,
            };
          }

          // Add new tab and activate it
          const updatedTabs = state.tabs.map(tab => ({ ...tab, isActive: false }));
          return {
            tabs: [...updatedTabs, { ...newTab, isActive: true }],
            activeTabId: newTab.id,
          };
        });
      },

      removeTab: (tabId) => {
        set((state) => {
          const tabIndex = state.tabs.findIndex(tab => tab.id === tabId);
          if (tabIndex === -1) return state;

          const updatedTabs = state.tabs.filter(tab => tab.id !== tabId);
          let newActiveTabId = state.activeTabId;

          // If we're removing the active tab, activate the next one
          if (state.activeTabId === tabId) {
            if (updatedTabs.length > 0) {
              const nextTabIndex = Math.min(tabIndex, updatedTabs.length - 1);
              newActiveTabId = updatedTabs[nextTabIndex].id;
              updatedTabs[nextTabIndex].isActive = true;
            } else {
              newActiveTabId = null;
            }
          }

          return {
            tabs: updatedTabs,
            activeTabId: newActiveTabId,
          };
        });
      },

      setActiveTab: (tabId) => {
        set((state) => ({
          tabs: state.tabs.map(tab => ({
            ...tab,
            isActive: tab.id === tabId,
          })),
          activeTabId: tabId,
        }));
      },

      updateTabContent: (tabId, content) => {
        set((state) => ({
          tabs: state.tabs.map(tab =>
            tab.id === tabId
              ? { ...tab, content, isDirty: true }
              : tab
          ),
        }));
      },

      updateTabDirty: (tabId, isDirty) => {
        set((state) => ({
          tabs: state.tabs.map(tab =>
            tab.id === tabId ? { ...tab, isDirty } : tab
          ),
        }));
      },

      closeAllTabs: () => {
        set({
          tabs: [],
          activeTabId: null,
        });
      },

      closeOtherTabs: (tabId) => {
        set((state) => ({
          tabs: state.tabs.filter(tab => tab.id === tabId),
          activeTabId: tabId,
        }));
      },

      // Editor settings actions
      setFontSize: (fontSize) => set({ fontSize }),
      setTheme: (theme) => set({ theme }),
      setWordWrap: (wordWrap) => set({ wordWrap }),
      toggleMinimap: () => set((state) => ({ minimap: !state.minimap })),
      setLineNumbers: (lineNumbers) => set({ lineNumbers }),
      toggleAutoSave: () => set((state) => ({ autoSave: !state.autoSave })),

      // UI actions
      toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
      toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
      toggleStatusBar: () => set((state) => ({ statusBarVisible: !state.statusBarVisible })),

      // Search actions
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setReplaceQuery: (replaceQuery) => set({ replaceQuery }),
      toggleSearch: () => set((state) => ({ isSearchVisible: !state.isSearchVisible })),
      toggleReplace: () => set((state) => ({ isReplaceVisible: !state.isReplaceVisible })),
      setSearchOptions: (options) => set((state) => ({
        searchOptions: { ...state.searchOptions, ...options },
      })),

      // Utility actions
      getActiveTab: () => {
        const state = get();
        return state.tabs.find(tab => tab.id === state.activeTabId) || null;
      },

      getTabById: (tabId) => {
        const state = get();
        return state.tabs.find(tab => tab.id === tabId) || null;
      },

      getDirtyTabs: () => {
        const state = get();
        return state.tabs.filter(tab => tab.isDirty);
      },
    }),
    {
      name: 'editor-store',
    }
  )
);
