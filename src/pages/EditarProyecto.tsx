import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
import { FileText, MessageSquare, BarChart3, Users, Calendar, Clock, Edit, CheckSquare, CheckCircle, User, Pencil, Plus, Trash2, Copy, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatDateSafe } from '@/utils/formatDateSafe';

export default function EditarProyecto() {
  const { id } = useParams();
  const { projects, user, updateProject, addLog, createProject } = useApp();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('basico');
  const [saving, setSaving] = useState(false);
  const { getProjectLogs } = useApp();
  const [showHistorial, setShowHistorial] = useState(false);
  const logs = project ? getProjectLogs(project.id) : [];
  const [filtroAccion, setFiltroAccion] = useState('');

  useEffect(() => {
    if (id && projects.length > 0) {
      const found = projects.find((p: any) => p.id === id);
      setProject(found || null);
      setForm(found ? { ...found } : null);
    }
  }, [id, projects]);

  if (!form) return <div className="p-6">Cargando datos del proyecto...</div>;

  const isAdmin = user?.role === 'admin';
  const isCliente = !isAdmin;

  // Handlers básicos
  const handleChange = (field: string, value: any) => setForm((prev: any) => ({ ...prev, [field]: value }));

  // FASES CRUD
  const handleAddFase = () => {
    if (!isAdmin) return;
    const newFase = { key: `fase${Date.now()}`, estado: 'Pendiente', descripcion: '', fechaEntrega: '', archivos: [], comentarios: [] };
    setForm((prev: any) => ({ ...prev, fases: [...(prev.fases || []), newFase] }));
  };
  const handleUpdateFase = (idx: number, field: string, value: any) => {
    if (!isAdmin) return;
    const newFases = [...(form.fases || [])];
    newFases[idx][field] = value;
    setForm((prev: any) => ({ ...prev, fases: newFases }));
  };
  const handleDeleteFase = (idx: number) => {
    if (!isAdmin) return;
    const newFases = [...(form.fases || [])];
    newFases.splice(idx, 1);
    setForm((prev: any) => ({ ...prev, fases: newFases }));
  };

  // FUNCIONALIDADES CRUD
  const handleAddFunc = () => {
    if (!isAdmin) return;
    setForm((prev: any) => ({ ...prev, funcionalidades: [...(prev.funcionalidades || []), ''] }));
  };
  const handleUpdateFunc = (idx: number, value: string) => {
    if (!isAdmin) return;
    const newFuncs = [...(form.funcionalidades || [])];
    newFuncs[idx] = value;
    setForm((prev: any) => ({ ...prev, funcionalidades: newFuncs }));
  };
  const handleDeleteFunc = (idx: number) => {
    if (!isAdmin) return;
    const newFuncs = [...(form.funcionalidades || [])];
    newFuncs.splice(idx, 1);
    setForm((prev: any) => ({ ...prev, funcionalidades: newFuncs }));
  };

  // COLABORADORES CRUD
  const handleAddColab = () => {
    if (!isAdmin) return;
    setForm((prev: any) => ({ ...prev, colaboradores: [...(prev.colaboradores || []), ''] }));
  };
  const handleUpdateColab = (idx: number, value: string) => {
    if (!isAdmin) return;
    const newCols = [...(form.colaboradores || [])];
    newCols[idx] = value;
    setForm((prev: any) => ({ ...prev, colaboradores: newCols }));
  };
  const handleDeleteColab = (idx: number) => {
    if (!isAdmin) return;
    const newCols = [...(form.colaboradores || [])];
    newCols.splice(idx, 1);
    setForm((prev: any) => ({ ...prev, colaboradores: newCols }));
  };

  // GUARDAR CAMBIOS REALES
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProject(id!, {
        name: form.name,
        description: form.description,
        type: form.type,
        estado: form.estado,
        prioridad: form.prioridad,
        color: form.color,
        icono: form.icono,
        fases: form.fases,
        funcionalidades: form.funcionalidades,
        colaboradores: form.colaboradores,
      });
      await addLog({
        user: user?.email,
        projectId: id!,
        action: 'update'
      });
      toast({ title: 'Proyecto actualizado', description: 'Los cambios han sido guardados.' });
      setProject({ ...form });
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo guardar el proyecto', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // RESTAURAR
  const handleRestore = () => setForm(project);

  // CLONAR PROYECTO
  const handleClonarProyecto = async () => {
    if (!project) return;
    try {
      // Copia profunda y elimina id
      const { id: _omit, ...cloneBase } = project;
      const clone = {
        ...cloneBase,
        name: `Copia de ${project.name}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fases: (project.fases || []).map(f => ({ ...f, key: `fase${Date.now()}${Math.random()}` })),
        funcionalidades: [...(project.funcionalidades || [])],
        colaboradores: [...(project.colaboradores || [])],
      };
      await createProject(clone);
      toast({ title: 'Proyecto clonado', description: 'La copia fue creada correctamente.' });
      setTimeout(() => {
        const nuevo = projects.find(p => p.name === clone.name && p.createdAt === clone.createdAt);
        if (nuevo) {
          navigate(`/proyectos/${nuevo.id}`);
        } else {
          navigate('/proyectos');
        }
      }, 1200);
      await addLog({
        user: user?.email,
        projectId: project.id,
        action: 'clone',
      });
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo clonar el proyecto', variant: 'destructive' });
    }
  };

  // Mapeo de acciones a iconos y descripciones
  const actionDetails = {
    update: { icon: <Pencil className="h-4 w-4 text-blue-400" />, desc: 'Actualización del proyecto' },
    create: { icon: <Plus className="h-4 w-4 text-green-400" />, desc: 'Creación del proyecto' },
    delete: { icon: <Trash2 className="h-4 w-4 text-red-400" />, desc: 'Eliminación del proyecto' },
    clone: { icon: <Copy className="h-4 w-4 text-purple-400" />, desc: 'Clonación del proyecto' },
    default: { icon: <FileText className="h-4 w-4 text-zinc-400" />, desc: 'Acción sobre el proyecto' },
  };
  const accionesUnicas = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <Card className="bg-zinc-900/95 rounded-2xl shadow-2xl border border-zinc-800 p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-8 md:gap-0">
          {/* Lado izquierdo: Info principal y edición básica */}
          <div className="flex-1 p-4 sm:p-8 space-y-8 min-w-[220px]">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <div className="bg-primary/20 rounded-full p-3">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div className="flex flex-col gap-1 items-center sm:items-start">
                <h2 className="text-2xl font-bold leading-tight text-center sm:text-left">Editar Proyecto</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground break-all">ID: {id}</span>
                  {form.estado && <span className="text-xs"><Badge variant="outline">{form.estado}</Badge></span>}
                </div>
              </div>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mb-6 gap-2">
                <TabsTrigger value="basico">Básico</TabsTrigger>
                <TabsTrigger value="fases">Fases</TabsTrigger>
                <TabsTrigger value="funcionalidades">Funcionalidades</TabsTrigger>
                <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
                <TabsTrigger value="archivos">Archivos</TabsTrigger>
                <TabsTrigger value="avanzado">Avanzado</TabsTrigger>
              </TabsList>
              {/* BASICO */}
              <TabsContent value="basico">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-semibold flex items-center gap-2 mb-1"><Edit className="h-4 w-4" /> Nombre</label>
                    <Input value={form.name || ''} onChange={e => handleChange('name', e.target.value)} disabled={isCliente} placeholder="Nombre del proyecto" className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold flex items-center gap-2 mb-1"><MessageSquare className="h-4 w-4" /> Descripción</label>
                    <Textarea value={form.description || ''} onChange={e => handleChange('description', e.target.value)} disabled={isCliente} placeholder="Descripción del proyecto" className="w-full min-h-[80px]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold flex items-center gap-2 mb-1"><BarChart3 className="h-4 w-4" /> Progreso</label>
                    <div className="flex items-center gap-2">
                      <Progress value={form.fases && form.fases.length > 0 ? Math.round((form.fases.filter((f: any) => f.estado === 'Terminado').length / form.fases.length) * 100) : 0} className="h-2 flex-1" />
                      <span className="text-xs font-medium">{form.fases && form.fases.length > 0 ? Math.round((form.fases.filter((f: any) => f.estado === 'Terminado').length / form.fases.length) * 100) : 0}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold flex items-center gap-2 mb-1"><Calendar className="h-4 w-4" /> Fechas</label>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Creado: {formatDateSafe(form.createdAt)}</div>
                      <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> Actualizado: {formatDateSafe(form.updatedAt)}</div>
                    </div>
                  </div>
                  <Textarea value={form.notas || ''} onChange={e => handleChange('notas', e.target.value)} disabled={isCliente} placeholder="Notas internas (solo admin)" className="w-full min-h-[60px]" />
                  {isAdmin && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input value={form.type || ''} onChange={e => handleChange('type', e.target.value)} placeholder="Tipo de proyecto" className="w-full" />
                      <Input value={form.estado || ''} onChange={e => handleChange('estado', e.target.value)} placeholder="Estado" className="w-full" />
                      <Input value={form.prioridad || ''} onChange={e => handleChange('prioridad', e.target.value)} placeholder="Prioridad" className="w-full" />
                      <Input value={form.color || ''} onChange={e => handleChange('color', e.target.value)} placeholder="Color" className="w-full" />
                      <Input value={form.icono || ''} onChange={e => handleChange('icono', e.target.value)} placeholder="Icono personalizado" className="w-full" />
                    </div>
                  )}
                </div>
              </TabsContent>
              {/* FASES */}
              <TabsContent value="fases">
                <div className="space-y-6">
                  {form.fases && form.fases.map((fase: any, idx: number) => (
                    <div key={fase.key || idx} className="flex flex-col md:flex-row gap-2 items-center bg-zinc-800/80 p-3 rounded">
                      <Input value={fase.descripcion || ''} onChange={e => handleUpdateFase(idx, 'descripcion', e.target.value)} disabled={!isAdmin} placeholder="Descripción de la fase" className="flex-1" />
                      <Input type="date" value={fase.fechaEntrega || ''} onChange={e => handleUpdateFase(idx, 'fechaEntrega', e.target.value)} disabled={!isAdmin} placeholder="Fecha de entrega" className="flex-1" />
                      <Input value={fase.estado || ''} onChange={e => handleUpdateFase(idx, 'estado', e.target.value)} disabled={!isAdmin} placeholder="Estado" className="flex-1" />
                      {isAdmin && <Button size="sm" variant="ghost" onClick={() => handleDeleteFase(idx)}>Eliminar</Button>}
                    </div>
                  ))}
                  {isAdmin && <Button size="sm" onClick={handleAddFase}>Agregar Fase</Button>}
                </div>
              </TabsContent>
              {/* FUNCIONALIDADES */}
              <TabsContent value="funcionalidades">
                <div className="space-y-6">
                  {form.funcionalidades && form.funcionalidades.map((f: string, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center bg-zinc-800/80 p-2 rounded">
                      <Input value={f || ''} onChange={e => handleUpdateFunc(idx, e.target.value)} disabled={!isAdmin} placeholder="Funcionalidad" className="w-full" />
                      {isAdmin && <Button size="sm" variant="ghost" onClick={() => handleDeleteFunc(idx)}>Eliminar</Button>}
                    </div>
                  ))}
                  {isAdmin && <Button size="sm" onClick={handleAddFunc}>Agregar Funcionalidad</Button>}
                </div>
              </TabsContent>
              {/* COLABORADORES */}
              <TabsContent value="colaboradores">
                <div className="space-y-6">
                  {form.colaboradores && form.colaboradores.map((c: string, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center bg-zinc-800/80 p-2 rounded">
                      <Input value={c || ''} onChange={e => handleUpdateColab(idx, e.target.value)} disabled={!isAdmin} placeholder="Email del colaborador" className="w-full" />
                      {isAdmin && <Button size="sm" variant="ghost" onClick={() => handleDeleteColab(idx)}>Eliminar</Button>}
                    </div>
                  ))}
                  {isAdmin && <Button size="sm" onClick={handleAddColab}>Agregar Colaborador</Button>}
                </div>
              </TabsContent>
              {/* ARCHIVOS */}
              <TabsContent value="archivos">
                <div className="space-y-2">
                  <p>Gestión avanzada de archivos (subida, listado, permisos, versiones, etc). (Sin Firebase Storage)</p>
                  <p>Próximamente: integración real de archivos.</p>
                </div>
              </TabsContent>
              {/* AVANZADO */}
              <TabsContent value="avanzado">
                <div className="space-y-4">
                  <p className="font-bold">Acciones avanzadas solo para admin:</p>
                  {isAdmin ? (
                    <>
                      <Button variant="outline" onClick={handleClonarProyecto}>Clonar proyecto</Button>
                      <Button variant="outline" onClick={() => toast({ title: 'Archivar', description: 'Función de archivado real pendiente' })}>Archivar proyecto</Button>
                      <Button variant="outline" onClick={() => toast({ title: 'Eliminar', description: 'Función de eliminación real pendiente' })}>Eliminar proyecto</Button>
                      <Button variant="outline" onClick={() => toast({ title: 'Restaurar', description: 'Función de restaurar real pendiente' })}>Restaurar proyecto</Button>
                      <Button variant="outline" onClick={() => toast({ title: 'Exportar', description: 'Función de exportar real pendiente' })}>Exportar (PDF, Excel, JSON)</Button>
                      <Button variant="outline" onClick={() => setShowHistorial(true)}>Ver historial de cambios</Button>
                      <Button variant="outline" onClick={() => toast({ title: 'Logs', description: 'Función de logs real pendiente' })}>Ver logs de auditoría</Button>
                      <Button variant="outline" onClick={() => toast({ title: 'Facturación', description: 'Función de facturación real pendiente' })}>Gestionar facturación</Button>
                      <Button variant="outline" onClick={() => toast({ title: 'Permisos', description: 'Función de permisos real pendiente' })}>Gestionar permisos</Button>
                      <Button variant="outline" onClick={() => toast({ title: 'Integraciones', description: 'Función de integraciones real pendiente' })}>Integraciones externas</Button>
                      <Button variant="outline" onClick={() => toast({ title: 'Automatizaciones', description: 'Función de automatizaciones real pendiente' })}>Automatizaciones y webhooks</Button>
                    </>
                  ) : (
                    <p>No tienes permisos para acciones avanzadas.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <div className="mt-8 flex flex-col sm:flex-row justify-end gap-4">
              <Button variant="outline" onClick={handleRestore} disabled={saving} className="w-full sm:w-auto">Restaurar cambios</Button>
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
            </div>
          </div>
        </div>
      </Card>
      {/* Modal de historial de cambios */}
      <Dialog open={showHistorial} onOpenChange={setShowHistorial}>
        <DialogContent className="max-w-2xl bg-zinc-900/95">
          <DialogTitle>Historial de cambios</DialogTitle>
          <DialogDescription>Registro completo de acciones realizadas sobre este proyecto.</DialogDescription>
          {/* Filtro por tipo de acción */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="bg-zinc-800 text-sm rounded px-2 py-1 text-white border border-zinc-700"
              value={filtroAccion}
              onChange={e => setFiltroAccion(e.target.value)}
            >
              <option value="">Todas las acciones</option>
              {accionesUnicas.map(a => (
                <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto mt-2">
            {logs.length === 0 ? (
              <div className="text-muted-foreground text-sm italic">No hay historial de cambios para este proyecto.</div>
            ) : (
              logs
                .filter(log => !filtroAccion || log.action === filtroAccion)
                .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
                .map(log => {
                  const details = actionDetails[log.action] || actionDetails.default;
                  return (
                    <div key={log.id} className="bg-zinc-800/80 rounded p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {details.icon}
                        <span className="font-semibold text-primary">{log.user}</span>
                        <span className="mx-2 text-xs text-muted-foreground">{details.desc}</span>
                        <span className="mx-2 text-xs text-muted-foreground">({log.action})</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{formatDateSafe(log.timestamp)}</div>
                    </div>
                  );
                })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 