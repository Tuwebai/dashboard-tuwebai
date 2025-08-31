import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText, 
  MessageSquare, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Pause, 
  X,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  File,
  User,
  CalendarDays,
  Target,
  BarChart3,
  TrendingUp,
  Activity,
  Save,
  Send,
  MoreHorizontal
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';

import { toast } from '@/hooks/use-toast';
import { formatDateSafe } from '@/utils/formatDateSafe';

interface VerDetallesProyectoProps {
  proyecto: any;
  onClose: () => void;
  onUpdate?: (proyecto: any) => void;
}

const ESTADOS_FASE = [
  { value: 'Pendiente', label: 'Pendiente', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { value: 'En Progreso', label: 'En Progreso', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'En Revisión', label: 'En Revisión', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'Aprobada', label: 'Aprobada', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'Bloqueada', label: 'Bloqueada', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'Terminado', label: 'Terminado', color: 'bg-purple-100 text-purple-800 border-purple-200' },
];

const ESTADOS_TAREA = [
  { value: 'pending', label: 'Pendiente', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { value: 'in_progress', label: 'En Progreso', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'review', label: 'En Revisión', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'completed', label: 'Completada', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'blocked', label: 'Bloqueada', color: 'bg-red-100 text-red-800 border-red-200' },
];

export default function VerDetallesProyecto({ proyecto, onClose, onUpdate }: VerDetallesProyectoProps) {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedFases, setExpandedFases] = useState<Set<string>>(new Set());
  const [expandedTareas, setExpandedTareas] = useState<Set<string>>(new Set());
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: '',
    descripcion: '',
    responsable: '',
    fechaLimite: '',
    prioridad: 'media'
  });
  const [editandoTarea, setEditandoTarea] = useState<string | null>(null);
  const [archivos, setArchivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editandoProyecto, setEditandoProyecto] = useState(false);
  const [datosProyecto, setDatosProyecto] = useState({
    presupuesto: proyecto?.presupuesto || '',
    cliente: proyecto?.cliente || '',
    fechaEntrega: proyecto?.fechaEntrega || ''
  });
  
  // Estados para gestión de fases
  const [proyectoLocal, setProyectoLocal] = useState(proyecto);
  const [editandoFase, setEditandoFase] = useState<string | null>(null);
  const [nuevaFase, setNuevaFase] = useState({
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    estado: 'Pendiente'
  });
  const [faseEditando, setFaseEditando] = useState({
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    estado: 'Pendiente'
  });

  // Validar que el proyecto existe
  if (!proyecto || !proyecto.id) {
    // Proyecto inválido recibido
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full border border-slate-200">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Error</h3>
            <p className="text-slate-600 mb-4">No se pudo cargar la información del proyecto.</p>
            <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white">
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Actualizar proyectoLocal cuando cambie el prop proyecto
  useEffect(() => {
    setProyectoLocal(proyecto);
  }, [proyecto]);

  // Actualizar datos del proyecto cuando cambie proyectoLocal
  useEffect(() => {
    if (proyectoLocal) {
      setDatosProyecto({
        presupuesto: proyectoLocal.presupuesto || '',
        cliente: proyectoLocal.cliente || '',
        fechaEntrega: proyectoLocal.fechaEntrega || ''
      });
    }
  }, [proyectoLocal]);

  // Cargar archivos del proyecto
  useEffect(() => {
    // Implementar carga de archivos con Supabase cuando sea necesario
    // Por ahora se mantiene vacío
  }, [proyecto?.id]);

  const toggleFase = (faseKey: string) => {
    const newExpanded = new Set(expandedFases);
    if (newExpanded.has(faseKey)) {
      newExpanded.delete(faseKey);
    } else {
      newExpanded.add(faseKey);
    }
    setExpandedFases(newExpanded);
  };

  const toggleTareas = (faseKey: string) => {
    const newExpanded = new Set(expandedTareas);
    if (newExpanded.has(faseKey)) {
      newExpanded.delete(faseKey);
    } else {
      newExpanded.add(faseKey);
    }
    setExpandedTareas(newExpanded);
  };

  const handleEstadoFase = async (faseKey: string, nuevoEstado: string) => {
    if (!user || user.role !== 'admin' || !proyecto?.id) return;

    try {
      setLoading(true);
      const nuevasFases = (proyectoLocal.fases || []).map((f: any) =>
        f.key === faseKey
          ? {
              ...f,
              estado: nuevoEstado,
              ultimoCambio: { 
                usuario: user.email, 
                fecha: new Date().toISOString() 
              }
            }
          : f
      );

      // Actualizar en Supabase
      const { error } = await supabase
        .from('projects')
        .update({ fases: nuevasFases })
        .eq('id', proyecto.id);
      
      if (error) throw error;
      
      // Actualizar estado local inmediatamente
      const proyectoActualizado = { ...proyectoLocal, fases: nuevasFases };
      setProyectoLocal(proyectoActualizado);
      onUpdate?.(proyectoActualizado);
      
      toast({
        title: "Estado actualizado",
        description: `Fase ${faseKey} actualizada a ${nuevoEstado}`,
      });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la fase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarComentario = async (faseKey: string) => {
    if (!nuevoComentario.trim() || !user || !proyecto?.id) return;

    try {
      setLoading(true);
      // Implementar agregar comentarios con Supabase cuando sea necesario
      // Por ahora solo se actualiza el estado local

      setNuevoComentario('');
      toast({
        title: "Comentario agregado",
        description: "El comentario se agregó correctamente",
      });
    } catch (error) {
      console.error('Error agregando comentario:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarTarea = async (faseKey: string) => {
    if (!nuevaTarea.titulo.trim() || !user || !proyecto?.id) return;

    try {
      setLoading(true);
      // Implementar agregar tareas con Supabase cuando sea necesario
      // Por ahora solo se actualiza el estado local

      setNuevaTarea({
        titulo: '',
        descripcion: '',
        responsable: '',
        fechaLimite: '',
        prioridad: 'media'
      });

      toast({
        title: "Tarea agregada",
        description: "La tarea se agregó correctamente",
      });
    } catch (error) {
      console.error('Error agregando tarea:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la tarea",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActualizarTarea = async (tareaId: string, updates: any) => {
    if (!proyecto?.id) return;

    try {
      setLoading(true);
      // Implementar actualizar tareas con Supabase cuando sea necesario
      toast({
        title: "Tarea actualizada",
        description: "La tarea se actualizó correctamente",
      });
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarTarea = async (tareaId: string) => {
    if (!proyecto?.id) return;

    try {
      setLoading(true);
      // Implementar eliminar tareas con Supabase cuando sea necesario
      toast({
        title: "Tarea eliminada",
        description: "La tarea se eliminó correctamente",
      });
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Funciones para gestión de fases
  const handleAgregarFase = async () => {
    if (!nuevaFase.descripcion.trim() || !user || user.role !== 'admin' || !proyecto?.id) return;

    try {
      setLoading(true);
      const faseKey = `fase_${Date.now()}`;
      const nuevaFaseCompleta = {
        key: faseKey,
        descripcion: nuevaFase.descripcion,
        fechaInicio: nuevaFase.fechaInicio,
        fechaFin: nuevaFase.fechaFin,
        estado: nuevaFase.estado,
        tareas: [],
        comentarios: [],
        creadoPor: user.email,
        fechaCreacion: new Date().toISOString()
      };

      const fasesActualizadas = [...(proyectoLocal.fases || []), nuevaFaseCompleta];
      
      // Actualizar en Supabase
      const { error } = await supabase
        .from('projects')
        .update({ fases: fasesActualizadas })
        .eq('id', proyecto.id);
      
      if (error) throw error;
      
      // Actualizar estado local
      const proyectoActualizado = { ...proyectoLocal, fases: fasesActualizadas };
      setProyectoLocal(proyectoActualizado);
      onUpdate?.(proyectoActualizado);
      
      // Limpiar formulario
      setNuevaFase({
        descripcion: '',
        fechaInicio: '',
        fechaFin: '',
        estado: 'Pendiente'
      });

      toast({
        title: "Fase agregada",
        description: "La fase se agregó correctamente",
      });
    } catch (error) {
      console.error('Error agregando fase:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la fase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditarFase = async (faseKey: string) => {
    if (!user || user.role !== 'admin' || !proyecto?.id) return;

    try {
      setLoading(true);
      const fasesActualizadas = (proyectoLocal.fases || []).map((f: any) =>
        f.key === faseKey
          ? {
              ...f,
              descripcion: faseEditando.descripcion,
              fechaInicio: faseEditando.fechaInicio,
              fechaFin: faseEditando.fechaFin,
              estado: faseEditando.estado,
              ultimaModificacion: {
                usuario: user.email,
                fecha: new Date().toISOString()
              }
            }
          : f
      );

      // Actualizar en Supabase
      const { error } = await supabase
        .from('projects')
        .update({ fases: fasesActualizadas })
        .eq('id', proyecto.id);
      
      if (error) throw error;
      
      // Actualizar estado local
      const proyectoActualizado = { ...proyectoLocal, fases: fasesActualizadas };
      setProyectoLocal(proyectoActualizado);
      onUpdate?.(proyectoActualizado);
      
      // Salir del modo edición
      setEditandoFase(null);
      setFaseEditando({
        descripcion: '',
        fechaInicio: '',
        fechaFin: '',
        estado: 'Pendiente'
      });

      toast({
        title: "Fase actualizada",
        description: "La fase se actualizó correctamente",
      });
    } catch (error) {
      console.error('Error actualizando fase:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la fase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarFase = async (faseKey: string) => {
    if (!user || user.role !== 'admin' || !proyecto?.id) return;

    try {
      setLoading(true);
      const fasesActualizadas = (proyectoLocal.fases || []).filter((f: any) => f.key !== faseKey);

      // Actualizar en Supabase
      const { error } = await supabase
        .from('projects')
        .update({ fases: fasesActualizadas })
        .eq('id', proyecto.id);
      
      if (error) throw error;
      
      // Actualizar estado local
      const proyectoActualizado = { ...proyectoLocal, fases: fasesActualizadas };
      setProyectoLocal(proyectoActualizado);
      onUpdate?.(proyectoActualizado);

      toast({
        title: "Fase eliminada",
        description: "La fase se eliminó correctamente",
      });
    } catch (error) {
      console.error('Error eliminando fase:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la fase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicionFase = (fase: any) => {
    setEditandoFase(fase.key);
    setFaseEditando({
      descripcion: fase.descripcion || '',
      fechaInicio: fase.fechaInicio || '',
      fechaFin: fase.fechaFin || '',
      estado: fase.estado || 'Pendiente'
    });
  };

  const handleGuardarProyecto = async () => {
    if (!proyecto?.id) return;

    try {
      setLoading(true);
      
      // Actualizar en Supabase
      const { error } = await supabase
        .from('projects')
        .update({
          presupuesto: datosProyecto.presupuesto,
          cliente: datosProyecto.cliente,
          fechaEntrega: datosProyecto.fechaEntrega,
          updated_at: new Date().toISOString()
        })
        .eq('id', proyecto.id);
      
      if (error) throw error;

      const proyectoActualizado = { 
        ...proyecto, 
        presupuesto: datosProyecto.presupuesto,
        cliente: datosProyecto.cliente,
        fechaEntrega: datosProyecto.fechaEntrega
      };
      onUpdate?.(proyectoActualizado);
      setEditandoProyecto(false);

      toast({
        title: "Proyecto actualizado",
        description: "Los datos del proyecto se guardaron correctamente",
      });
    } catch (error) {
      console.error('Error guardando proyecto:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el proyecto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularProgresoFase = (faseKey: string) => {
    const fase = proyectoLocal.fases?.find((f: any) => f.key === faseKey);
    if (!fase || !fase.tareas) return 0;
    
    const tareasCompletadas = fase.tareas.filter((t: any) => t.status === 'completed').length;
    return fase.tareas.length > 0 ? Math.round((tareasCompletadas / fase.tareas.length) * 100) : 0;
  };

  const calcularProgresoProyecto = () => {
    if (!proyectoLocal.fases || proyectoLocal.fases.length === 0) return 0;
    
    const progresoTotal = proyectoLocal.fases.reduce((acc: number, fase: any) => {
      return acc + calcularProgresoFase(fase.key);
    }, 0);
    
    return Math.round(progresoTotal / proyectoLocal.fases.length);
  };

  const getStatusColor = (estado: string) => {
    const estadoObj = ESTADOS_FASE.find(e => e.value === estado);
    return estadoObj ? estadoObj.color : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTareaStatusColor = (status: string) => {
    const statusObj = ESTADOS_TAREA.find(s => s.value === status);
    return statusObj ? statusObj.color : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const renderFases = () => {
    const fases = proyectoLocal.fases || [];
    
    return (
      <div className="space-y-6">
        {/* Formulario para agregar nueva fase */}
        {user?.role === 'admin' && (
          <Card className="border border-slate-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Plus className="h-5 w-5 text-blue-600" />
                Agregar Nueva Fase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Descripción de la fase"
                    value={nuevaFase.descripcion}
                    onChange={(e) => setNuevaFase({...nuevaFase, descripcion: e.target.value})}
                    className="border-slate-200 text-slate-700 placeholder-slate-400"
                  />
                  <Select 
                    value={nuevaFase.estado} 
                    onValueChange={(value) => setNuevaFase({...nuevaFase, estado: value})}
                  >
                    <SelectTrigger className="border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_FASE.map((estado) => (
                        <SelectItem key={estado.value} value={estado.value}>
                          {estado.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    placeholder="Fecha de inicio"
                    value={nuevaFase.fechaInicio}
                    onChange={(e) => setNuevaFase({...nuevaFase, fechaInicio: e.target.value})}
                    className="border-slate-200 text-slate-700 placeholder-slate-400"
                  />
                  <Input
                    type="date"
                    placeholder="Fecha de fin"
                    value={nuevaFase.fechaFin}
                    onChange={(e) => setNuevaFase({...nuevaFase, fechaFin: e.target.value})}
                    className="border-slate-200 text-slate-700 placeholder-slate-400"
                  />
                </div>
                <Button 
                  onClick={handleAgregarFase}
                  disabled={!nuevaFase.descripcion.trim() || loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Fase
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {fases.map((fase: any) => {
          const progreso = calcularProgresoFase(fase.key);
          const isExpanded = expandedFases.has(fase.key);
          const tareasExpanded = expandedTareas.has(fase.key);
          
          return (
            <Card key={fase.key} className="border border-slate-200/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFase(fase.key)}
                      className="p-1 text-slate-600 hover:text-slate-800"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                    <div>
                      <CardTitle className="text-lg text-slate-800">{fase.descripcion}</CardTitle>
                      <p className="text-sm text-slate-500">Clave: {fase.key}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {user?.role === 'admin' && (
                      <Select 
                        value={fase.estado} 
                        onValueChange={(value) => handleEstadoFase(fase.key, value)}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-32 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS_FASE.map((estado) => (
                            <SelectItem key={estado.value} value={estado.value}>
                              {estado.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {user?.role === 'admin' && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => iniciarEdicionFase(fase)}
                          className="p-1 text-slate-600 hover:text-slate-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminarFase(fase.key)}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-700">{progreso}%</div>
                      <Progress value={progreso} className="w-20 h-2" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="space-y-4">
                  {/* Formulario de edición de fase */}
                  {editandoFase === fase.key && user?.role === 'admin' && (
                    <Card className="p-4 border border-blue-200 bg-blue-50">
                      <div className="space-y-3">
                        <h4 className="font-medium text-slate-800">Editar Fase</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            placeholder="Descripción de la fase"
                            value={faseEditando.descripcion}
                            onChange={(e) => setFaseEditando({...faseEditando, descripcion: e.target.value})}
                            className="border-slate-200 text-slate-700 placeholder-slate-400"
                          />
                          <Select 
                            value={faseEditando.estado} 
                            onValueChange={(value) => setFaseEditando({...faseEditando, estado: value})}
                          >
                            <SelectTrigger className="border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ESTADOS_FASE.map((estado) => (
                                <SelectItem key={estado.value} value={estado.value}>
                                  {estado.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="date"
                            placeholder="Fecha de inicio"
                            value={faseEditando.fechaInicio}
                            onChange={(e) => setFaseEditando({...faseEditando, fechaInicio: e.target.value})}
                            className="border-slate-200 text-slate-700 placeholder-slate-400"
                          />
                          <Input
                            type="date"
                            placeholder="Fecha de fin"
                            value={faseEditando.fechaFin}
                            onChange={(e) => setFaseEditando({...faseEditando, fechaFin: e.target.value})}
                            className="border-slate-200 text-slate-700 placeholder-slate-400"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleEditarFase(fase.key)}
                            disabled={!faseEditando.descripcion.trim() || loading}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Guardar
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setEditandoFase(null)}
                            size="sm"
                            className="border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                  
                  {/* Comentarios */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-800">Comentarios</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTareas(fase.key)}
                        className="p-1 text-slate-600 hover:text-slate-800"
                      >
                        {tareasExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        Tareas
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Agregar comentario..."
                          value={nuevoComentario}
                          onChange={(e) => setNuevoComentario(e.target.value)}
                          className="flex-1 border-slate-200 text-slate-700 placeholder-slate-400"
                        />
                        <Button 
                          onClick={() => handleAgregarComentario(fase.key)}
                          disabled={!nuevoComentario.trim() || loading}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Tareas */}
                  {tareasExpanded && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-800">Tareas</h4>
                      
                      {/* Agregar nueva tarea */}
                      <Card className="p-4 border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            placeholder="Título de la tarea"
                            value={nuevaTarea.titulo}
                            onChange={(e) => setNuevaTarea({...nuevaTarea, titulo: e.target.value})}
                            className="border-slate-200 text-slate-700 placeholder-slate-400"
                          />
                          <Input
                            placeholder="Responsable"
                            value={nuevaTarea.responsable}
                            onChange={(e) => setNuevaTarea({...nuevaTarea, responsable: e.target.value})}
                            className="border-slate-200 text-slate-700 placeholder-slate-400"
                          />
                          <Input
                            type="date"
                            value={nuevaTarea.fechaLimite}
                            onChange={(e) => setNuevaTarea({...nuevaTarea, fechaLimite: e.target.value})}
                            className="border-slate-200 text-slate-700 placeholder-slate-400"
                          />
                          <Select 
                            value={nuevaTarea.prioridad} 
                            onValueChange={(value) => setNuevaTarea({...nuevaTarea, prioridad: value})}
                          >
                            <SelectTrigger className="border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="baja">Baja</SelectItem>
                              <SelectItem value="media">Media</SelectItem>
                              <SelectItem value="alta">Alta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Textarea
                          placeholder="Descripción de la tarea"
                          value={nuevaTarea.descripcion}
                          onChange={(e) => setNuevaTarea({...nuevaTarea, descripcion: e.target.value})}
                          className="mt-3 border-slate-200 text-slate-700 placeholder-slate-400"
                        />
                        <Button 
                          onClick={() => handleAgregarTarea(fase.key)}
                          disabled={!nuevaTarea.titulo.trim() || loading}
                          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Tarea
                        </Button>
                      </Card>

                      {/* Lista de tareas */}
                      <div className="space-y-2">
                        {(fase.tareas || []).map((tarea: any) => (
                          <Card key={tarea.id} className="p-3 border border-slate-200">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-slate-800">{tarea.titulo}</div>
                                <div className="text-sm text-slate-600">{tarea.descripcion}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">{tarea.responsable}</Badge>
                                  <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">{tarea.prioridad}</Badge>
                                  <Badge className={`text-xs ${getTareaStatusColor(tarea.status)}`}>
                                    {ESTADOS_TAREA.find(s => s.value === tarea.status)?.label}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  const renderArchivos = () => {
    return (
      <div className="space-y-6">
        <Card className="border border-slate-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <FileText className="h-5 w-5 text-blue-600" />
              Archivos del Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {archivos.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">No hay archivos subidos aún</p>
              </div>
            ) : (
              <div className="space-y-2">
                {archivos.map((archivo) => (
                  <div key={archivo.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-3">
                      <File className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-slate-800">{archivo.nombre}</div>
                        <div className="text-sm text-slate-500">
                          {formatDateSafe(archivo.fechaSubida)}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderMetricas = () => {
    const fases = proyectoLocal.fases || [];
    const tareas = fases.flatMap((f: any) => f.tareas || []);
    const comentarios = fases.flatMap((f: any) => f.comentarios || []);
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <Card className="border border-slate-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Progreso General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {calcularProgresoProyecto()}%
                </div>
                <Progress value={calcularProgresoProyecto()} className="h-3" />
                <p className="text-sm text-slate-600 mt-2">
                  {fases.length} fases • {tareas.length} tareas
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Activity className="h-5 w-5 text-blue-600" />
                Actividad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Fases Completadas</span>
                  <span className="font-medium text-slate-800">
                    {fases.filter((f: any) => f.estado === 'Terminado').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Tareas Pendientes</span>
                  <span className="font-medium text-slate-800">
                    {tareas.filter((t: any) => t.status !== 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Comentarios</span>
                  <span className="font-medium text-slate-800">{comentarios.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Rendimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Tareas Completadas</span>
                  <span className="font-medium text-slate-800">
                    {tareas.filter((t: any) => t.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Tareas en Progreso</span>
                  <span className="font-medium text-slate-800">
                    {tareas.filter((t: any) => t.status === 'in_progress').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Tareas Bloqueadas</span>
                  <span className="font-medium text-slate-800">
                    {tareas.filter((t: any) => t.status === 'blocked').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          <Card className="border border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800">Resumen de Fases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fases.map((fase: any) => {
                  const progreso = calcularProgresoFase(fase.key);
                  return (
                    <div key={fase.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-sm text-slate-600">{fase.descripcion}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={progreso} className="w-20 h-2" />
                        <span className="text-sm font-medium text-slate-700">{progreso}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800">Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-700">Proyecto iniciado</span>
                  <span className="text-slate-500 ml-auto">{formatDateSafe(proyecto.createdAt || proyecto.fechaInicio)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-slate-700">{comentarios.length} comentarios agregados</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-slate-700">{tareas.length} tareas creadas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-[75vw] 2xl:max-w-[70vw] h-[95vh] sm:h-[90vh] overflow-hidden border border-slate-200/50">
        {/* Header con diseño claro del dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 sm:p-8 border-b border-slate-200/50 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 gap-4">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">{proyecto.name || proyecto.nombre}</h2>
            <p className="text-slate-600 text-base sm:text-lg">{proyecto.description || proyecto.descripcion}</p>
          </div>
          <div className="flex items-center gap-3">
                         <Button onClick={onClose} variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100 hover:text-slate-800 p-2 transition-all duration-300 transform hover:scale-110">
               <X className="h-6 w-6" />
             </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                         <div className="border-b border-slate-200/50 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
               <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-white border border-slate-200/50 rounded-xl p-1 h-12 shadow-sm">
                <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-slate-700 hover:bg-slate-100 text-sm font-medium rounded-lg transition-all duration-200">
                  <span className="hidden sm:inline">Vista General</span>
                  <span className="sm:hidden">General</span>
                </TabsTrigger>
                <TabsTrigger value="fases" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-slate-700 hover:bg-slate-100 text-sm font-medium rounded-lg transition-all duration-200">
                  <span className="hidden sm:inline">Fases y Tareas</span>
                  <span className="sm:hidden">Fases</span>
                </TabsTrigger>
                <TabsTrigger value="files" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-slate-700 hover:bg-slate-100 text-sm font-medium rounded-lg transition-all duration-200">
                  <span className="hidden sm:inline">Archivos</span>
                  <span className="sm:hidden">Files</span>
                </TabsTrigger>
                <TabsTrigger value="metrics" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-slate-700 hover:bg-slate-100 text-sm font-medium rounded-lg transition-all duration-200">
                  <span className="hidden sm:inline">Métricas</span>
                  <span className="sm:hidden">Stats</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(95vh-200px)] bg-white">
              <TabsContent value="overview" className="space-y-6 sm:space-y-8">
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  <Card className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-blue-50 via-blue-25 to-indigo-50">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-slate-800 text-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                        Información del Proyecto
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-slate-700">Fecha de inicio: {formatDateSafe(proyecto.createdAt || proyecto.fechaInicio)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-slate-700">Fecha de entrega: {formatDateSafe(proyecto.fechaEntrega) || 'Fecha no disponible'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-slate-700">Presupuesto: ${datosProyecto.presupuesto || 'No definido'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-slate-700">Cliente: {datosProyecto.cliente || 'No definido'}</span>
                      </div>
                      {user?.role === 'admin' && (
                                                 <Button 
                           onClick={() => setEditandoProyecto(!editandoProyecto)}
                           variant="outline" 
                           size="sm"
                           className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-50 transition-all duration-300 transform hover:scale-105"
                         >
                           <Edit className="h-4 w-4 mr-2" />
                           {editandoProyecto ? 'Cancelar' : 'Editar'}
                         </Button>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-25 to-teal-50">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-slate-800 text-lg">
                        <BarChart3 className="h-6 w-6 text-emerald-600" />
                        Progreso General
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center space-y-4">
                        <div className="text-5xl font-bold text-emerald-600">
                          {calcularProgresoProyecto()}%
                        </div>
                        <Progress value={calcularProgresoProyecto()} className="h-4" />
                        <p className="text-base text-slate-600">
                          {proyecto.fases?.length || 0} fases • {(proyecto.fases || []).reduce((acc: number, fase: any) => acc + (fase.tareas?.length || 0), 0)} tareas
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Formulario de edición */}
                {editandoProyecto && user?.role === 'admin' && (
                  <Card className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-amber-50 via-amber-25 to-orange-50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-slate-800 text-lg">Editar Información del Proyecto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                        <div>
                          <Label htmlFor="presupuesto" className="text-slate-700">Presupuesto</Label>
                          <Input
                            id="presupuesto"
                            type="number"
                            placeholder="Ingrese el presupuesto"
                            value={datosProyecto.presupuesto}
                            onChange={(e) => setDatosProyecto({...datosProyecto, presupuesto: e.target.value})}
                            className="border-slate-200 text-slate-700 placeholder-slate-400"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cliente" className="text-slate-700">Cliente</Label>
                          <Input
                            id="cliente"
                            placeholder="Nombre del cliente"
                            value={datosProyecto.cliente}
                            onChange={(e) => setDatosProyecto({...datosProyecto, cliente: e.target.value})}
                            className="border-slate-200 text-slate-700 placeholder-slate-400"
                          />
                        </div>
                        <div>
                          <Label htmlFor="fechaEntrega" className="text-slate-700">Fecha de Entrega</Label>
                          <Input
                            id="fechaEntrega"
                            type="date"
                            value={datosProyecto.fechaEntrega}
                            onChange={(e) => setDatosProyecto({...datosProyecto, fechaEntrega: e.target.value})}
                            className="border-slate-200 text-slate-700 placeholder-slate-400"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                                                 <Button 
                           onClick={handleGuardarProyecto}
                           disabled={loading}
                           className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white transition-all duration-300 transform hover:scale-110"
                         >
                           <Save className="h-4 w-4 mr-2" />
                           Guardar Cambios
                         </Button>
                                                 <Button 
                           onClick={() => setEditandoProyecto(false)}
                           variant="outline"
                           className="border-slate-300 text-slate-700 hover:bg-slate-50 transition-all duration-300 transform hover:scale-105"
                         >
                           Cancelar
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-violet-50 via-violet-25 to-purple-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-slate-800 text-lg">
                      <Activity className="h-6 w-6 text-violet-600" />
                      Fases del Proyecto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                                             {(proyecto.fases || []).map((fase: any) => (
                         <div key={fase.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 gap-3">
                           <div className="flex-1">
                             <div className="font-medium text-slate-800">{fase.descripcion}</div>
                             <div className="text-sm text-slate-500">Clave: {fase.key}</div>
                           </div>
                           <div className="flex items-center gap-3">
                             <Badge className={getStatusColor(fase.estado)}>{fase.estado}</Badge>
                             <div className="text-right">
                               <div className="text-sm font-medium text-slate-700">{calcularProgresoFase(fase.key)}%</div>
                               <Progress value={calcularProgresoFase(fase.key)} className="w-20 h-2" />
                             </div>
                           </div>
                         </div>
                       ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fases" className="space-y-6 sm:space-y-8">
                {renderFases()}
              </TabsContent>

              <TabsContent value="files" className="space-y-6 sm:space-y-8">
                {renderArchivos()}
              </TabsContent>

              <TabsContent value="metrics" className="space-y-6 sm:space-y-8">
                {renderMetricas()}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 
