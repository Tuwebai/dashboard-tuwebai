import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Copy, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

interface TerminalComponentProps {
  className?: string;
}

export default function TerminalComponent({ className }: TerminalComponentProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: '1',
      type: 'output',
      content: 'Terminal de TuWeb IDE v1.0.0',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'output',
      content: 'Escribe "help" para ver los comandos disponibles',
      timestamp: new Date()
    }
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new lines are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addLine = (content: string, type: TerminalLine['type'] = 'output') => {
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setLines(prev => [...prev, newLine]);
  };

  const executeCommand = (command: string) => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    // Add command to history
    setCommandHistory(prev => [...prev, trimmedCommand]);
    setHistoryIndex(-1);

    // Show command in terminal
    addLine(`$ ${trimmedCommand}`, 'command');

    // Execute command
    const args = trimmedCommand.split(' ');
    const cmd = args[0].toLowerCase();

    switch (cmd) {
      case 'help':
        addLine('Comandos disponibles:');
        addLine('  help - Muestra esta ayuda');
        addLine('  clear - Limpia la terminal');
        addLine('  echo <mensaje> - Imprime un mensaje');
        addLine('  date - Muestra la fecha y hora actual');
        addLine('  pwd - Muestra el directorio actual');
        addLine('  ls - Lista archivos');
        addLine('  cat <archivo> - Muestra el contenido de un archivo');
        addLine('  npm install <paquete> - Simula instalación de paquetes');
        addLine('  npm run <script> - Ejecuta scripts npm');
        addLine('  git status - Muestra estado del repositorio');
        addLine('  git add . - Añade archivos al stage');
        addLine('  git commit -m "<mensaje>" - Realiza commit');
        break;

      case 'clear':
        setLines([]);
        break;

      case 'echo':
        const message = args.slice(1).join(' ');
        addLine(message || '');
        break;

      case 'date':
        addLine(new Date().toLocaleString('es-ES'));
        break;

      case 'pwd':
        addLine('/workspace/mi-proyecto');
        break;

      case 'ls':
        addLine('No hay archivos en este directorio.');
        break;

      case 'cat':
        const fileName = args[1];
        if (!fileName) {
          addLine('Uso: cat <archivo>');
        } else {
          addLine(`Contenido del archivo ${fileName}:`);
          addLine('Este es un archivo de ejemplo.');
        }
        break;

      case 'npm':
        if (args[1] === 'install') {
          const packageName = args[2];
          if (packageName) {
            addLine(`Instalando ${packageName}...`);
            addLine(`✓ ${packageName} instalado correctamente`);
          } else {
            addLine('Uso: npm install <paquete>');
          }
        } else if (args[1] === 'run') {
          const script = args[2];
          if (script) {
            addLine(`Ejecutando script: ${script}`);
            addLine('Script completado exitosamente');
          } else {
            addLine('Uso: npm run <script>');
          }
        } else {
          addLine('Comandos npm disponibles: install, run');
        }
        break;

      case 'git':
        if (args[1] === 'status') {
          addLine('On branch main');
          addLine('Your branch is up to date with origin/main.');
          addLine('');
          addLine('nothing to commit, working tree clean');
        } else if (args[1] === 'add') {
          addLine('Changes staged for commit');
        } else if (args[1] === 'commit') {
          const message = args.slice(3).join(' ').replace(/"/g, '');
          if (message) {
            addLine(`[main ${Math.random().toString(16).substr(2, 7)}] ${message}`);
            addLine(' 1 file changed, 1 insertion(+)');
          } else {
            addLine('Uso: git commit -m "<mensaje>"');
          }
        } else {
          addLine('Comandos git disponibles: status, add, commit');
        }
        break;

      default:
        addLine(`Comando no reconocido: ${cmd}`, 'error');
        addLine('Escribe "help" para ver los comandos disponibles');
        break;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(currentCommand);
      setCurrentCommand('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand('');
      }
    }
  };

  const clearTerminal = () => {
    setLines([]);
  };

  const copyOutput = () => {
    const output = lines.map(line => line.content).join('\n');
    navigator.clipboard.writeText(output);
    toast({
      title: "Copiado",
      description: "La salida de la terminal ha sido copiada al portapapeles.",
    });
  };

  const getLineTypeColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command':
        return 'text-blue-400';
      case 'error':
        return 'text-red-400';
      case 'output':
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className={`flex flex-col h-full bg-black/90 text-green-400 font-mono text-sm rounded-lg border border-border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-muted/10 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-xs text-muted-foreground ml-2">Terminal</span>
          <Badge variant="outline" className="text-xs bg-green-900/20 text-green-400 border-green-600">
            Activo
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={copyOutput} className="h-6 w-6 p-0">
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={clearTerminal} className="h-6 w-6 p-0">
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Output */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-1">
          {lines.map(line => (
            <div
              key={line.id}
              className={`${getLineTypeColor(line.type)} whitespace-pre-wrap break-words`}
            >
              {line.content}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex items-center p-3 border-t border-border bg-black/50">
        <span className="text-green-400 mr-2">$</span>
        <Input
          ref={inputRef}
          value={currentCommand}
          onChange={(e) => setCurrentCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none text-green-400 font-mono text-sm p-0 focus:ring-0 focus:border-none"
          placeholder="Escribe un comando..."
          autoComplete="off"
        />
      </div>
    </div>
  );
}
