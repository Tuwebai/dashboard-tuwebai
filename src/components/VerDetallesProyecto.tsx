import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, BarChart3, Users, Edit, Calendar, Clock, CheckSquare, CheckCircle, User } from 'lucide-react';
import { formatDateSafe } from '@/utils/formatDateSafe';
import React from 'react';

export default function VerDetallesProyecto({ open, onOpenChange, proyecto, onEditar, onColaborar }: {
  open: boolean,
  onOpenChange: (v: boolean) => void,
  proyecto: any,
  onEditar: () => void,
  onColaborar: () => void
}) {
  if (!proyecto) return null;
  const getProjectStatus = (project: any) => {
    if (!project.fases || project.fases.length === 0) return 'Sin iniciar';
    const completedPhases = project.fases.filter((f: any) => f.estado === 'Terminado').length;
    const totalPhases = project.fases.length;
    if (completedPhases === 0) return 'Sin iniciar';
    if (completedPhases === totalPhases) return 'Completado';
    if (completedPhases > totalPhases / 2) return 'En progreso avanzado';
    return 'En progreso';
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completado': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'En progreso avanzado': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'En progreso': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Sin iniciar': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };
  const calculateProjectProgress = (project: any) => {
    if (!project.fases || project.fases.length === 0) return 0;
    const completedPhases = project.fases.filter((f: any) => f.estado === 'Terminado').length;
    return Math.round((completedPhases / project.fases.length) * 100);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full bg-zinc-900/95 rounded-2xl shadow-2xl border border-zinc-800 p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Lado izquierdo: Info principal */}
          <div className="flex-1 p-6 space-y-6 min-w-[260px]">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-primary/20 rounded-full p-3">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold leading-tight">{proyecto.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={getStatusColor(getProjectStatus(proyecto)) + ' text-xs'}>
                    {getProjectStatus(proyecto)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{proyecto.type}</span>
                </div>
              </div>
            </div>
            <div className="mb-2">
              <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Descripción</h4>
              <p className="text-sm text-muted-foreground">{proyecto.description || <span className="italic">Sin descripción</span>}</p>
            </div>
            <div className="mb-2">
              <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Progreso</h4>
              <div className="flex items-center gap-2">
                <Progress value={calculateProjectProgress(proyecto)} className="h-2 flex-1" />
                <span className="text-xs font-medium">{calculateProjectProgress(proyecto)}%</span>
              </div>
            </div>
            <div className="mb-2">
              <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><Users className="h-4 w-4" /> Funcionalidades</h4>
              <div className="flex flex-wrap gap-2">
                {(proyecto.funcionalidades && proyecto.funcionalidades.length > 0)
                  ? proyecto.funcionalidades.map((f: string, i: number) => (
                    <Badge key={i} variant="secondary">{f}</Badge>
                  ))
                  : <span className="text-xs text-muted-foreground italic">Sin funcionalidades</span>
                }
              </div>
            </div>
            <div className="mb-2">
              <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><Calendar className="h-4 w-4" /> Fechas</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Creado: {formatDateSafe(proyecto.createdAt)}</div>
                <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> Actualizado: {formatDateSafe(proyecto.updatedAt)}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={onColaborar}>
                <Users className="h-4 w-4 mr-2" /> Colaborar
              </Button>
              <Button variant="outline" className="flex-1" onClick={onEditar}>
                <Edit className="h-4 w-4 mr-2" /> Editar
              </Button>
            </div>
          </div>
          {/* Lado derecho: Fases y comentarios */}
          <div className="flex-1 bg-zinc-950/90 p-6 space-y-6 min-w-[260px] border-l border-zinc-800">
            <h4 className="font-semibold text-base mb-2 flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Fases del proyecto</h4>
            <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
              {proyecto.fases && proyecto.fases.length > 0 ? (
                proyecto.fases.map((fase: any, index: number) => (
                  <div key={fase.key} className="border rounded-lg p-3 bg-zinc-900/80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> {fase.descripcion}</span>
                      <Badge variant="outline" className={getStatusColor(fase.estado)}>{fase.estado}</Badge>
                    </div>
                    {fase.fechaEntrega && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" /> Entrega: {formatDateSafe(fase.fechaEntrega)}
                      </div>
                    )}
                    {fase.comentarios && fase.comentarios.length > 0 && (
                      <div className="mt-2">
                        <h6 className="text-xs font-medium mb-1 flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Comentarios ({fase.comentarios.length})</h6>
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {fase.comentarios.map((comentario: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 bg-zinc-800/80 p-2 rounded">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-xs">{comentario.autor}</span>
                                  <span className="text-xs text-muted-foreground">{formatDateSafe(comentario.fecha)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{comentario.texto}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground italic">Sin fases registradas</div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 