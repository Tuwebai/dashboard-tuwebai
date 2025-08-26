import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GitBranch, 
  GitCommit, 
  Zap, 
  RefreshCw, 
  Plus,
  Clock,
  User,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { workflowService } from '@/lib/workflowService';
import { versionService } from '@/lib/versionService';
import { useToast } from '@/hooks/use-toast';

interface AutoVersionCreatorProps {
  projectId: string;
  currentVersions: any[];
  onVersionCreated: () => void;
}

export const AutoVersionCreator: React.FC<AutoVersionCreatorProps> = ({ 
  projectId, 
  currentVersions, 
  onVersionCreated 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [newCommits, setNewCommits] = useState<any[]>([]);
  const [hasNewCommits, setHasNewCommits] = useState(false);
  const [versionType, setVersionType] = useState<'patch' | 'minor' | 'major'>('patch');
  const [customVersion, setCustomVersion] = useState('');
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'production'>('development');

  const detectNewCommits = async () => {
    setDetecting(true);
    try {
      const lastVersion = currentVersions.length > 0 ? currentVersions[0] : null;
      const lastCommitHash = lastVersion?.commitHash;
      
      const { newCommits, hasNewCommits } = await workflowService.detectNewCommits(projectId, lastCommitHash);
      
      setNewCommits(newCommits);
      setHasNewCommits(hasNewCommits);
      
      if (hasNewCommits) {
        toast({
          title: 'Commits detectados',
          description: `Se encontraron ${newCommits.length} commits nuevos`,
        });
      } else {
        toast({
          title: 'Sin commits nuevos',
          description: 'No se detectaron commits nuevos desde la última versión',
        });
      }
    } catch (error) {
      toast({
        title: 'Error detectando commits',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDetecting(false);
    }
  };

  const generateNextVersion = () => {
    const lastVersion = currentVersions.length > 0 ? currentVersions[0].version : '0.0.0';
    const nextVersion = versionService.generateVersionNumber(lastVersion, versionType);
    setCustomVersion(nextVersion);
  };

  const createVersionFromCommits = async () => {
    if (!hasNewCommits) {
      toast({
        title: 'No hay commits nuevos',
        description: 'Primero detecta commits nuevos',
        variant: 'destructive',
      });
      return;
    }

    const versionToUse = customVersion || versionService.generateVersionNumber(
      currentVersions.length > 0 ? currentVersions[0].version : '0.0.0', 
      versionType
    );

    // Validar versión semántica
    const validation = workflowService.validateSemanticVersion(versionToUse);
    if (!validation.isValid) {
      toast({
        title: 'Versión inválida',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const newVersion = await workflowService.createVersionFromCommits(
        projectId,
        versionToUse,
        environment,
        'admin@example.com'
      );

      toast({
        title: 'Versión creada automáticamente',
        description: `Versión ${newVersion.version} creada con ${newCommits.length} commits`,
      });

      onVersionCreated();
      setNewCommits([]);
      setHasNewCommits(false);
      setCustomVersion('');
    } catch (error) {
      toast({
        title: 'Error creando versión',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getVersionTypeColor = (type: string) => {
    switch (type) {
      case 'major':
        return 'bg-red-500 text-white';
      case 'minor':
        return 'bg-yellow-500 text-white';
      case 'patch':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getVersionTypeDescription = (type: string) => {
    switch (type) {
      case 'major':
        return 'Cambios incompatibles con versiones anteriores';
      case 'minor':
        return 'Nuevas funcionalidades compatibles hacia atrás';
      case 'patch':
        return 'Correcciones de bugs compatibles hacia atrás';
      default:
        return '';
    }
  };

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Creación Automática de Versiones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Detección de commits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-white">Detección de Commits</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={detectNewCommits}
              disabled={detecting}
              className="flex items-center gap-2"
            >
              {detecting && <RefreshCw className="h-4 w-4 animate-spin" />}
              <GitCommit className="h-4 w-4" />
              {detecting ? 'Detectando...' : 'Detectar Commits'}
            </Button>
          </div>

          {hasNewCommits && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-400 text-sm">
                  {newCommits.length} commits nuevos detectados
                </span>
              </div>
              
              <div className="max-h-40 overflow-y-auto space-y-2">
                {newCommits.map((commit, index) => (
                  <div key={index} className="bg-zinc-700 rounded p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <GitCommit className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-300 font-mono">
                        {commit.hash.substring(0, 8)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(commit.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-white">{commit.message}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <User className="h-3 w-3" />
                      {commit.author}
                      {commit.files && commit.files.length > 0 && (
                        <>
                          <FileText className="h-3 w-3" />
                          {commit.files.length} archivos
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasNewCommits && newCommits.length === 0 && (
            <div className="flex items-center gap-2 text-gray-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">No hay commits nuevos detectados</span>
            </div>
          )}
        </div>

        {/* Configuración de versión */}
        <div className="space-y-4">
          <Label className="text-white">Configuración de Versión</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Tipo de Versión</Label>
              <Select value={versionType} onValueChange={(value: any) => setVersionType(value)}>
                <SelectTrigger className="bg-zinc-700 border-zinc-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patch">
                    <div className="flex items-center gap-2">
                      <Badge className={getVersionTypeColor('patch')}>Patch</Badge>
                      <span>Corrección de bugs</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="minor">
                    <div className="flex items-center gap-2">
                      <Badge className={getVersionTypeColor('minor')}>Minor</Badge>
                      <span>Nueva funcionalidad</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="major">
                    <div className="flex items-center gap-2">
                      <Badge className={getVersionTypeColor('major')}>Major</Badge>
                      <span>Cambio importante</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">
                {getVersionTypeDescription(versionType)}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Entorno</Label>
              <Select value={environment} onValueChange={(value: any) => setEnvironment(value)}>
                <SelectTrigger className="bg-zinc-700 border-zinc-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-400">Versión Personalizada</Label>
            <div className="flex gap-2">
              <Input
                value={customVersion}
                onChange={(e) => setCustomVersion(e.target.value)}
                placeholder="1.0.0"
                className="bg-zinc-700 border-zinc-600"
              />
              <Button
                variant="outline"
                onClick={generateNextVersion}
                className="flex items-center gap-2"
              >
                <GitBranch className="h-4 w-4" />
                Generar
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Deja vacío para usar la versión automática basada en el tipo seleccionado
            </p>
          </div>
        </div>

        {/* Botón de creación */}
        <Button
          onClick={createVersionFromCommits}
          disabled={loading || !hasNewCommits}
          className="w-full flex items-center gap-2"
        >
          {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
          <Plus className="h-4 w-4" />
          {loading ? 'Creando Versión...' : 'Crear Versión Automáticamente'}
        </Button>

        {/* Información adicional */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>• La versión se creará con estado "draft"</p>
          <p>• El changelog se generará automáticamente desde los commits</p>
          <p>• Se validará que la versión siga el formato semántico</p>
        </div>
      </CardContent>
    </Card>
  );
};
