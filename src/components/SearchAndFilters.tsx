import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  ChevronDown,
  SortAsc,
  SortDesc,
  Download,
  RefreshCw
} from 'lucide-react';
import { useDebounce } from '@/hooks/usePerformance';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SearchAndFiltersProps {
  projects: any[];
  onFilteredProjects: (projects: any[]) => void;
  onExport?: (projects: any[]) => void;
  onRefresh?: () => void;
}

export default function SearchAndFilters({ 
  projects, 
  onFilteredProjects, 
  onExport,
  onRefresh 
}: SearchAndFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  } | undefined>({ from: undefined, to: undefined });
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [progressRange, setProgressRange] = useState<[number, number]>([0, 100]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Obtener tipos únicos de proyectos
  const projectTypes = useMemo(() => {
    const types = projects.map(p => p.type).filter(Boolean);
    return [...new Set(types)];
  }, [projects]);

  // Obtener tags únicos
  const allTags = useMemo(() => {
    const tags = projects.flatMap(p => p.tags || []).filter(Boolean);
    return [...new Set(tags)];
  }, [projects]);

  // Función para obtener el estado del proyecto
  const getProjectStatus = (project: any) => {
    if (!project.fases || project.fases.length === 0) return 'Sin iniciar';
    
    const completedPhases = project.fases.filter((f: any) => f.estado === 'Terminado').length;
    const totalPhases = project.fases.length;
    
    if (completedPhases === 0) return 'Sin iniciar';
    if (completedPhases === totalPhases) return 'Completado';
    if (completedPhases > totalPhases / 2) return 'En progreso avanzado';
    return 'En progreso';
  };

  // Obtener estados únicos
  const projectStatuses = useMemo(() => {
    const statuses = projects.map(getProjectStatus);
    return [...new Set(statuses)];
  }, [projects]);

  // Función para calcular progreso
  const calculateProgress = (project: any) => {
    if (!project.fases || project.fases.length === 0) return 0;
    
    const completedPhases = project.fases.filter((f: any) => f.estado === 'Terminado').length;
    return Math.round((completedPhases / project.fases.length) * 100);
  };

  // Filtrar y ordenar proyectos
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // Filtro por búsqueda
    if (debouncedSearchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        project.funcionalidades?.some((f: string) => 
          f.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        )
      );
    }

    // Filtro por tipo
    if (selectedType !== 'all') {
      filtered = filtered.filter(project => project.type === selectedType);
    }

    // Filtro por estado
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(project => getProjectStatus(project) === selectedStatus);
    }

    // Filtro por rango de fechas
    if (selectedDateRange.from || selectedDateRange.to) {
      filtered = filtered.filter(project => {
        const projectDate = new Date(project.createdAt);
        const fromDate = selectedDateRange.from;
        const toDate = selectedDateRange.to;
        
        if (fromDate && projectDate < fromDate) return false;
        if (toDate && projectDate > toDate) return false;
        return true;
      });
    }

    // Filtro por tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(project =>
        selectedTags.some(tag => project.tags?.includes(tag))
      );
    }

    // Filtro por progreso
    filtered = filtered.filter(project => {
      const progress = calculateProgress(project);
      return progress >= progressRange[0] && progress <= progressRange[1];
    });

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case 'progress':
          aValue = calculateProgress(a);
          bValue = calculateProgress(b);
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [
    projects,
    debouncedSearchTerm,
    selectedType,
    selectedStatus,
    selectedDateRange,
    selectedTags,
    progressRange,
    sortBy,
    sortOrder
  ]);

  // Actualizar proyectos filtrados
  useEffect(() => {
    onFilteredProjects(filteredProjects);
  }, [filteredProjects, onFilteredProjects]);

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedDateRange({ from: undefined, to: undefined });
    setSelectedTags([]);
    setProgressRange([0, 100]);
    setSortBy('updatedAt');
    setSortOrder('desc');
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = 
    searchTerm ||
    selectedType !== 'all' ||
    selectedStatus !== 'all' ||
    selectedDateRange.from ||
    selectedDateRange.to ||
    selectedTags.length > 0 ||
    progressRange[0] > 0 ||
    progressRange[1] < 100;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Búsqueda y Filtros
          </CardTitle>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={() => onExport(filteredProjects)}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            )}
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Búsqueda principal */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar proyectos por nombre, descripción o funcionalidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Filtros básicos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-sm font-medium">Tipo de proyecto</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {projectTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Estado</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {projectStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Ordenar por</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt">Última actualización</SelectItem>
                <SelectItem value="createdAt">Fecha de creación</SelectItem>
                <SelectItem value="name">Nombre</SelectItem>
                <SelectItem value="progress">Progreso</SelectItem>
                <SelectItem value="type">Tipo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Orden</Label>
            <div className="flex gap-2">
              <Button
                variant={sortOrder === 'asc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortOrder('asc')}
              >
                <SortAsc className="h-4 w-4" />
              </Button>
              <Button
                variant={sortOrder === 'desc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortOrder('desc')}
              >
                <SortDesc className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filtros avanzados */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rango de fechas */}
              <div>
                <Label className="text-sm font-medium">Rango de fechas</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDateRange.from ? (
                        selectedDateRange.to ? (
                          <>
                            {format(selectedDateRange.from, "LLL dd, y", { locale: es })} -{" "}
                            {format(selectedDateRange.to, "LLL dd, y", { locale: es })}
                          </>
                        ) : (
                          format(selectedDateRange.from, "LLL dd, y", { locale: es })
                        )
                      ) : (
                        <span>Seleccionar fechas</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={selectedDateRange.from}
                      selected={selectedDateRange}
                                              onSelect={(range) => {
                          if (range?.from) {
                            setSelectedDateRange({
                              from: range.from,
                              to: range.to || undefined
                            });
                          } else {
                            setSelectedDateRange({ from: undefined, to: undefined });
                          }
                        }}
                      numberOfMonths={2}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Rango de progreso */}
              <div>
                <Label className="text-sm font-medium">
                  Progreso: {progressRange[0]}% - {progressRange[1]}%
                </Label>
                <Slider
                  value={progressRange}
                  onValueChange={(value) => setProgressRange(value as [number, number])}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {allTags.map(tag => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={tag}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTags([...selectedTags, tag]);
                          } else {
                            setSelectedTags(selectedTags.filter(t => t !== tag));
                          }
                        }}
                      />
                      <Label htmlFor={tag} className="text-sm cursor-pointer">
                        {tag}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resumen de filtros */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Filtros activos:</span>
              {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Búsqueda: "{searchTerm}"
                </Badge>
              )}
              {selectedType !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Tipo: {selectedType}
                </Badge>
              )}
              {selectedStatus !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Estado: {selectedStatus}
                </Badge>
              )}
              {selectedDateRange.from && (
                <Badge variant="secondary" className="text-xs">
                  Desde: {format(selectedDateRange.from, "dd/MM/yyyy", { locale: es })}
                </Badge>
              )}
              {selectedDateRange.to && (
                <Badge variant="secondary" className="text-xs">
                  Hasta: {format(selectedDateRange.to, "dd/MM/yyyy", { locale: es })}
                </Badge>
              )}
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Tags: {selectedTags.length}
                </Badge>
              )}
              {(progressRange[0] > 0 || progressRange[1] < 100) && (
                <Badge variant="secondary" className="text-xs">
                  Progreso: {progressRange[0]}%-{progressRange[1]}%
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Resultados */}
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredProjects.length} de {projects.length} proyectos
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 
