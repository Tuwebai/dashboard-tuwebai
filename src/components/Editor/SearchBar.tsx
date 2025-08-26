import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Replace, 
  X, 
  ChevronUp, 
  ChevronDown,
  CaseSensitive,
  WholeWord,
  Regex
} from 'lucide-react';
import { useEditor } from '@/hooks/useEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export const SearchBar: React.FC = () => {
  const {
    searchQuery,
    replaceQuery,
    isSearchVisible,
    isReplaceVisible,
    searchOptions,
    setSearchQuery,
    setReplaceQuery,
    toggleSearch,
    toggleReplace,
    setSearchOptions,
  } = useEditor();

  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);

  useEffect(() => {
    if (searchQuery) {
      // Simular conteo de coincidencias
      setMatchCount(Math.floor(Math.random() * 10) + 1);
      setCurrentMatch(1);
    } else {
      setMatchCount(0);
      setCurrentMatch(0);
    }
  }, [searchQuery]);

  if (!isSearchVisible) {
    return null;
  }

  return (
    <div className="bg-zinc-800 border-b border-zinc-700 p-4">
      <div className="flex items-center gap-4">
        {/* Búsqueda */}
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-zinc-700 border-zinc-600 text-white placeholder:text-gray-400"
            autoFocus
          />
          
          {searchQuery && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{currentMatch}</span>
              <span>/</span>
              <span>{matchCount}</span>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => {
                  setCurrentMatch(prev => prev > 1 ? prev - 1 : matchCount);
                }}
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => {
                  setCurrentMatch(prev => prev < matchCount ? prev + 1 : 1);
                }}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Reemplazo */}
        {isReplaceVisible && (
          <div className="flex items-center gap-2">
            <Replace className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Reemplazar con..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="bg-zinc-700 border-zinc-600 text-white placeholder:text-gray-400 w-48"
            />
            
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Reemplazar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Reemplazar Todo
            </Button>
          </div>
        )}

        {/* Opciones de búsqueda */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Checkbox
              id="caseSensitive"
              checked={searchOptions.caseSensitive}
              onCheckedChange={(checked) => 
                setSearchOptions({ caseSensitive: checked as boolean })
              }
            />
            <label htmlFor="caseSensitive" className="text-xs text-gray-400 cursor-pointer">
              <CaseSensitive className="h-3 w-3" />
            </label>
          </div>

          <div className="flex items-center gap-1">
            <Checkbox
              id="wholeWord"
              checked={searchOptions.wholeWord}
              onCheckedChange={(checked) => 
                setSearchOptions({ wholeWord: checked as boolean })
              }
            />
            <label htmlFor="wholeWord" className="text-xs text-gray-400 cursor-pointer">
              <WholeWord className="h-3 w-3" />
            </label>
          </div>

          <div className="flex items-center gap-1">
            <Checkbox
              id="regex"
              checked={searchOptions.regex}
              onCheckedChange={(checked) => 
                setSearchOptions({ regex: checked as boolean })
              }
            />
            <label htmlFor="regex" className="text-xs text-gray-400 cursor-pointer">
              <Regex className="h-3 w-3" />
            </label>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleReplace}
            className={cn(
              "text-xs",
              isReplaceVisible && "bg-blue-600 text-white"
            )}
          >
            <Replace className="h-3 w-3 mr-1" />
            Reemplazar
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSearch}
            className="text-xs"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
