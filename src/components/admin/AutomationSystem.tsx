import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Play, 
  Pause, 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Zap, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Activity,
  GitBranch,
  GitCommit,
  GitPullRequest,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { workflowService } from '@/lib/workflowService';
import { triggerService } from '@/lib/triggerService';
import { automationTaskService } from '@/lib/automationTaskService';
import { supabase } from '@/lib/supabase';

// =====================================================
// COMPONENTE PRINCIPAL DEL SISTEMA DE AUTOMATIZACIÓN
// =====================================================

export default function AutomationSystem() {
  const [activeTab, setActiveTab] = useState('overview');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});

  // Estados para formularios
  const [showWorkflowForm, setShowWorkflowForm] = useState(false);
  const [showTriggerForm, setShowTriggerForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadAutomationData();
  }, []);

  // =====================================================
  // CARGA DE DATOS
  // =====================================================

  const loadAutomationData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      const [workflowsData, triggersData, tasksData, statsData] = await Promise.all([
        workflowService.getWorkflows(),
        triggerService.getTriggers(),
        automationTaskService.getTasks(),
        getAutomationStats()
      ]);

      setWorkflows(workflowsData);
      setTriggers(triggersData);
      setTasks(tasksData);
      setStats(statsData);
      
    } catch (error) {
      console.error('Error loading automation data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de automatización',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getAutomationStats = async () => {
    try {
      // Obtener estadísticas reales de la base de datos
      const [workflowsCount, triggersCount, tasksCount, executionsCount] = await Promise.all([
        workflowService.getWorkflows().then(w => w.length),
        triggerService.getTriggers().then(t => t.length),
        automationTaskService.getTasks().then(t => t.length),
        // Contar ejecuciones de workflows
        supabase
          .from('workflow_executions')
          .select('id', { count: 'exact' })
          .then(result => result.count || 0)
      ]);

      // Calcular tasa de éxito basada en ejecuciones completadas vs fallidas
      const { data: executionStats } = await supabase
        .from('workflow_executions')
        .select('status')
        .in('status', ['completed', 'failed']);

      const completed = executionStats?.filter(e => e.status === 'completed').length || 0;
      const failed = executionStats?.filter(e => e.status === 'failed').length || 0;
      const total = completed + failed;
      const success_rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        workflows: workflowsCount,
        triggers: triggersCount,
        tasks: tasksCount,
        executions: executionsCount,
        success_rate
      };
    } catch (error) {
      console.error('Error getting automation stats:', error);
      return {
        workflows: 0,
        triggers: 0,
        tasks: 0,
        executions: 0,
        success_rate: 0
      };
    }
  };

  // =====================================================
  // FUNCIONES DE ACTUALIZACIÓN
  // =====================================================

  const refreshData = async () => {
    await loadAutomationData();
    toast({
      title: 'Actualizado',
      description: 'Datos de automatización actualizados'
    });
  };

  // =====================================================
  // RENDERIZADO DEL COMPONENTE
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del Sistema de Automatización */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Sistema de Automatización</h1>
          <p className="text-gray-400">
            Workflows, triggers y tareas automatizadas para optimizar tu flujo de trabajo
          </p>
        </div>
        <div className="flex items-center space-x-3">
                     <Button onClick={refreshData} variant="outline" size="sm">
             <RefreshCw className="h-4 w-4 mr-2" />
             Actualizar
           </Button>
           <Button 
             onClick={async () => {
               try {
                 const results = await automationTaskService.executePendingTasks();
                 const successCount = results.filter(r => r.success).length;
                 toast({
                   title: 'Tareas Ejecutadas',
                   description: `${successCount}/${results.length} tareas ejecutadas exitosamente`
                 });
                 refreshData();
               } catch (error) {
                 toast({
                   title: 'Error',
                   description: 'Error ejecutando tareas pendientes',
                   variant: 'destructive'
                 });
               }
             }} 
             variant="outline" 
             size="sm"
             className="bg-yellow-600 hover:bg-yellow-700 text-white"
           >
             <Zap className="h-4 w-4 mr-2" />
             Ejecutar Tareas
           </Button>
          <Button onClick={() => setShowWorkflowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Workflow
          </Button>
          <Button onClick={() => setShowTriggerForm(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Trigger
          </Button>
          <Button onClick={() => setShowTaskForm(true)} className="bg-yellow-600 hover:bg-yellow-700">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Workflows Activos</CardTitle>
                         <GitBranch className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.workflows || 0}</div>
            <p className="text-xs text-gray-400">Flujos de trabajo automatizados</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Triggers Activos</CardTitle>
                         <GitPullRequest className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.triggers || 0}</div>
            <p className="text-xs text-gray-400">Eventos automáticos configurados</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Tareas Programadas</CardTitle>
                         <GitCommit className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.tasks || 0}</div>
            <p className="text-xs text-gray-400">Tareas automatizadas activas</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Tasa de Éxito</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.success_rate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-gray-400">Ejecuciones exitosas</p>
          </CardContent>
        </Card>
      </div>

             {/* Sistema de Pestañas */}
       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
         <TabsList className="flex flex-wrap w-full bg-zinc-800 gap-1 p-1">
           <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 flex-shrink-0">
             <BarChart3 className="h-4 w-4 mr-2" />
             Resumen
           </TabsTrigger>
           <TabsTrigger value="workflows" className="data-[state=active]:bg-blue-600 flex-shrink-0">
                          <GitBranch className="h-4 w-4 mr-2" />
             Workflows
           </TabsTrigger>
           <TabsTrigger value="triggers" className="data-[state=active]:bg-blue-600 flex-shrink-0">
                          <GitPullRequest className="h-4 w-4 mr-2" />
             Triggers
           </TabsTrigger>
           <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-600 flex-shrink-0">
                          <GitCommit className="h-4 w-4 mr-2" />
             Tareas
           </TabsTrigger>
                      <TabsTrigger value="pipelines" className="data-[state=active]:bg-blue-600 flex-shrink-0">
                              <GitBranch className="h-4 w-4 mr-2" />
              CI/CD
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-blue-600 flex-shrink-0">
              <Activity className="h-4 w-4 mr-2" />
              Logs
            </TabsTrigger>
         </TabsList>

        {/* Pestaña de Resumen */}
        <TabsContent value="overview" className="space-y-6">
          <OverviewTab 
            workflows={workflows}
            triggers={triggers}
            tasks={tasks}
            stats={stats}
          />
        </TabsContent>

                 {/* Pestaña de Workflows */}
         <TabsContent value="workflows" className="space-y-6">
           <WorkflowsTab 
             workflows={workflows}
             onRefresh={loadAutomationData}
             onShowWorkflowForm={() => setShowWorkflowForm(true)}
             onDeleteWorkflow={async (workflowId) => {
               if (confirm('¿Estás seguro de que quieres eliminar este workflow?')) {
                 try {
                   await workflowService.deleteWorkflow(workflowId);
                   await loadAutomationData();
                   toast({
                     title: 'Éxito',
                     description: 'Workflow eliminado correctamente'
                   });
                 } catch (error) {
                   toast({
                     title: 'Error',
                     description: 'No se pudo eliminar el workflow',
                     variant: 'destructive'
                   });
                 }
               }
             }}
           />
         </TabsContent>

                 {/* Pestaña de Triggers */}
         <TabsContent value="triggers" className="space-y-6">
           <TriggersTab 
             triggers={triggers}
             onRefresh={loadAutomationData}
             onShowTriggerForm={() => setShowTriggerForm(true)}
             onDeleteTrigger={async (triggerId) => {
               if (confirm('¿Estás seguro de que quieres eliminar este trigger?')) {
                 try {
                   await triggerService.deleteTrigger(triggerId);
                   await loadAutomationData();
                   toast({
                     title: 'Éxito',
                     description: 'Trigger eliminado correctamente'
                   });
                 } catch (error) {
                   toast({
                     title: 'Error',
                     description: 'No se pudo eliminar el trigger',
                     variant: 'destructive'
                   });
                 }
               }
             }}
           />
         </TabsContent>

                 {/* Pestaña de Tareas */}
         <TabsContent value="tasks" className="space-y-6">
           <TasksTab 
             tasks={tasks}
             onRefresh={loadAutomationData}
             onShowTaskForm={() => setShowTaskForm(true)}
             onDeleteTask={async (taskId) => {
               if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
                 try {
                   await automationTaskService.deleteTask(taskId);
                   await loadAutomationData();
                   toast({
                     title: 'Éxito',
                     description: 'Tarea eliminada correctamente'
                   });
                 } catch (error) {
                   toast({
                     title: 'Error',
                     description: 'No se pudo eliminar la tarea',
                     variant: 'destructive'
                   });
                 }
               }
             }}
           />
         </TabsContent>

                 {/* Pestaña de CI/CD */}
         <TabsContent value="pipelines" className="space-y-6">
           <PipelinesTab />
         </TabsContent>

         {/* Pestaña de Logs */}
         <TabsContent value="logs" className="space-y-6">
           <LogsTab />
         </TabsContent>
      </Tabs>

      {/* Formularios Modales */}
      {showWorkflowForm && (
        <WorkflowForm 
          onClose={() => setShowWorkflowForm(false)}
          onSuccess={() => {
            setShowWorkflowForm(false);
            loadAutomationData();
          }}
        />
      )}

      {showTriggerForm && (
        <TriggerForm 
          onClose={() => setShowTriggerForm(false)}
          onSuccess={() => {
            setShowTriggerForm(false);
            loadAutomationData();
          }}
        />
      )}

      {showTaskForm && (
        <TaskForm 
          onClose={() => setShowTaskForm(false)}
          onSuccess={() => {
            setShowTaskForm(false);
            loadAutomationData();
          }}
        />
      )}
    </div>
  );
}

// =====================================================
// COMPONENTES DE PESTAÑAS
// =====================================================

// Pestaña de Resumen
function OverviewTab({ workflows, triggers, tasks, stats }: any) {
  return (
    <div className="space-y-6">
             {/* Actividad Reciente */}
       <Card className="bg-zinc-800 border-zinc-700">
         <CardHeader>
           <CardTitle className="text-white">Actividad Reciente</CardTitle>
           <CardDescription className="text-gray-400">
             Últimas ejecuciones y eventos del sistema
           </CardDescription>
         </CardHeader>
         <CardContent>
           {workflows.length === 0 && triggers.length === 0 && tasks.length === 0 ? (
             <div className="text-center py-8">
               <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
               <p className="text-gray-400">No hay actividad reciente</p>
               <p className="text-gray-500 text-sm mt-2">
                 Crea workflows, triggers o tareas para ver actividad
               </p>
             </div>
           ) : (
             <div className="space-y-4">
               {workflows.slice(0, 3).map((workflow) => (
                 <div key={workflow.id} className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg">
                   <div className="flex items-center space-x-3">
                     <GitBranch className="h-5 w-5 text-blue-400" />
                     <div>
                       <p className="text-white font-medium">{workflow.name}</p>
                       <p className="text-gray-400 text-sm">
                         Creado {new Date(workflow.created_at).toLocaleDateString()}
                       </p>
                     </div>
                   </div>
                   <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                     {workflow.is_active ? 'Activo' : 'Inactivo'}
                   </Badge>
                 </div>
               ))}
               
               {triggers.slice(0, 2).map((trigger) => (
                 <div key={trigger.id} className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg">
                   <div className="flex items-center space-x-3">
                     <GitPullRequest className="h-5 w-5 text-green-400" />
                     <div>
                       <p className="text-white font-medium">{trigger.name}</p>
                       <p className="text-gray-400 text-sm">
                         {trigger.event_type} • {trigger.trigger_count || 0} ejecuciones
                       </p>
                     </div>
                   </div>
                   <Badge variant={trigger.is_active ? 'default' : 'secondary'}>
                     {trigger.is_active ? 'Activo' : 'Inactivo'}
                   </Badge>
                 </div>
               ))}
               
               {tasks.slice(0, 2).map((task) => (
                 <div key={task.id} className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg">
                   <div className="flex items-center space-x-3">
                     <GitCommit className="h-5 w-5 text-yellow-400" />
                     <div>
                       <p className="text-white font-medium">{task.name}</p>
                       <p className="text-gray-400 text-sm">
                         {task.type} • {task.run_count || 0} ejecuciones
                       </p>
                     </div>
                   </div>
                   <Badge variant={task.is_active ? 'default' : 'secondary'}>
                     {task.is_active ? 'Activa' : 'Inactiva'}
                   </Badge>
                 </div>
               ))}
             </div>
           )}
         </CardContent>
       </Card>

      {/* Métricas de Rendimiento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Rendimiento del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Tareas Activas</span>
                <Badge variant="secondary">{stats.tasks || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Triggers Activos</span>
                <Badge variant="secondary">{stats.triggers || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Workflows Activos</span>
                <Badge variant="secondary">{stats.workflows || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Tasa de Éxito</span>
                <Badge variant="default">{stats.success_rate?.toFixed(1) || 0}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

                 <Card className="bg-zinc-800 border-zinc-700">
           <CardHeader>
             <CardTitle className="text-white">Próximas Ejecuciones</CardTitle>
           </CardHeader>
           <CardContent>
             {tasks.filter(task => task.next_run && task.is_active).length === 0 ? (
               <div className="text-center py-8">
                 <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                 <p className="text-gray-400">No hay tareas programadas</p>
                 <p className="text-gray-500 text-sm mt-2">
                   Crea tareas automatizadas para ver programaciones
                 </p>
               </div>
             ) : (
               <div className="space-y-4">
                 {tasks
                   .filter(task => task.next_run && task.is_active)
                   .slice(0, 5)
                   .map((task) => (
                     <div key={task.id} className="flex items-center justify-between p-2 bg-zinc-700 rounded">
                       <div>
                         <p className="text-white text-sm">{task.name}</p>
                         <p className="text-gray-400 text-xs">
                           {task.next_run ? new Date(task.next_run).toLocaleDateString() : 'No programada'}
                         </p>
                       </div>
                       <Clock className="h-4 w-4 text-yellow-400" />
                     </div>
                   ))}
               </div>
             )}
           </CardContent>
         </Card>
      </div>
    </div>
  );
}

// Pestaña de Workflows
function WorkflowsTab({ workflows, onRefresh, onShowWorkflowForm, onDeleteWorkflow }: any) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);

  const executeWorkflow = async (workflowId: string, projectId: string) => {
    try {
      await workflowService.executeWorkflow(projectId, workflowId);
      toast({
        title: 'Éxito',
        description: 'Workflow ejecutado correctamente'
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo ejecutar el workflow',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
             <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-white">Workflows de Proyectos</h2>
         <Button 
           onClick={onShowWorkflowForm} 
           className="bg-blue-600 hover:bg-blue-700"
         >
           <Plus className="h-4 w-4 mr-2" />
           Nuevo Workflow
         </Button>
       </div>

      {workflows.length === 0 ? (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="text-center py-8">
                         <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No hay workflows configurados</p>
            <p className="text-gray-500 text-sm mt-2">
              Crea tu primer workflow para automatizar procesos de proyectos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">{workflow.name}</CardTitle>
                  <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                    {workflow.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <CardDescription className="text-gray-400">
                  {workflow.description || 'Sin descripción'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tipo:</span>
                    <span className="text-white">{workflow.project_type || 'General'}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Creado:</span>
                    <span className="text-white">
                      {new Date(workflow.created_at).toLocaleDateString()}
                    </span>
                  </div>

                                     <div className="flex space-x-2">
                     <Button 
                       size="sm" 
                       variant="outline"
                       onClick={() => executeWorkflow(workflow.id, 'demo-project')}
                     >
                       <Play className="h-4 w-4 mr-1" />
                       Ejecutar
                     </Button>
                     <Button 
                       size="sm" 
                       variant="destructive"
                       onClick={() => onDeleteWorkflow(workflow.id)}
                     >
                       <Trash2 className="h-4 w-4 mr-1" />
                       Eliminar
                     </Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Pestaña de Triggers
function TriggersTab({ triggers, onRefresh, onShowTriggerForm, onDeleteTrigger }: any) {
  const toggleTrigger = async (triggerId: string, isActive: boolean) => {
    try {
      await triggerService.toggleTrigger(triggerId, isActive);
      toast({
        title: 'Éxito',
        description: `Trigger ${isActive ? 'activado' : 'desactivado'} correctamente`
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado del trigger',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
             <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-white">Triggers del Sistema</h2>
         <Button 
           onClick={onShowTriggerForm}
           className="bg-green-600 hover:bg-green-700"
         >
           <Plus className="h-4 w-4 mr-2" />
           Nuevo Trigger
         </Button>
       </div>

      {triggers.length === 0 ? (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="text-center py-8">
                         <GitPullRequest className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No hay triggers configurados</p>
            <p className="text-gray-500 text-sm mt-2">
              Crea triggers para automatizar acciones basadas en eventos del sistema
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {triggers.map((trigger) => (
            <Card key={trigger.id} className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{trigger.name}</h3>
                      <Badge variant={trigger.is_active ? 'default' : 'secondary'}>
                        {trigger.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-400 mb-3">
                      {trigger.description || 'Sin descripción'}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Evento:</span>
                        <p className="text-white">{trigger.event_type}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Ejecuciones:</span>
                        <p className="text-white">{trigger.trigger_count}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Última:</span>
                        <p className="text-white">
                          {trigger.last_triggered ? 
                            new Date(trigger.last_triggered).toLocaleDateString() : 
                            'Nunca'
                          }
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">Creado:</span>
                        <p className="text-white">
                          {new Date(trigger.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                                         <Button 
                       size="sm" 
                       variant={trigger.is_active ? 'destructive' : 'default'}
                       onClick={() => toggleTrigger(trigger.id, !trigger.is_active)}
                     >
                       {trigger.is_active ? (
                         <>
                           <Pause className="h-4 w-4 mr-1" />
                           Pausar
                         </>
                       ) : (
                         <>
                           <Play className="h-4 w-4 mr-1" />
                           Activar
                         </>
                       )}
                     </Button>
                     
                                           <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => onDeleteTrigger(trigger.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Pestaña de Tareas
function TasksTab({ tasks, onRefresh, onShowTaskForm, onDeleteTask }: any) {
  const executeTask = async (taskId: string) => {
    try {
      await automationTaskService.executeTask(taskId);
      toast({
        title: 'Éxito',
        description: 'Tarea ejecutada correctamente'
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo ejecutar la tarea',
        variant: 'destructive'
      });
    }
  };

  const toggleTask = async (taskId: string, isActive: boolean) => {
    try {
      await automationTaskService.toggleTask(taskId, isActive);
      toast({
        title: 'Éxito',
        description: `Tarea ${isActive ? 'activada' : 'desactivada'} correctamente`
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado de la tarea',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
             <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-white">Tareas Automatizadas</h2>
         <Button 
           onClick={onShowTaskForm}
           className="bg-yellow-600 hover:bg-yellow-700"
         >
           <Plus className="h-4 w-4 mr-2" />
           Nueva Tarea
         </Button>
       </div>

      {tasks.length === 0 ? (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="text-center py-8">
                         <GitCommit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No hay tareas automatizadas configuradas</p>
            <p className="text-gray-500 text-sm mt-2">
              Crea tareas para automatizar procesos del sistema
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.id} className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{task.name}</h3>
                      <Badge variant={task.is_active ? 'default' : 'secondary'}>
                        {task.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                      <Badge variant="outline">{task.type}</Badge>
                    </div>
                    
                    <p className="text-gray-400 mb-3">
                      {task.description || 'Sin descripción'}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Tipo:</span>
                        <p className="text-white">{task.script_type}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Ejecuciones:</span>
                        <p className="text-white">{task.run_count}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Éxitos:</span>
                        <p className="text-white text-green-400">{task.success_count}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Errores:</span>
                        <p className="text-white text-red-400">{task.error_count}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Próxima:</span>
                        <p className="text-white">
                          {task.next_run ? 
                            new Date(task.next_run).toLocaleDateString() : 
                            'No programada'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => executeTask(task.id)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Ejecutar
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant={task.is_active ? 'destructive' : 'default'}
                      onClick={() => toggleTask(task.id, !task.is_active)}
                    >
                      {task.is_active ? (
                        <>
                          <Pause className="h-4 w-4 mr-1" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Activar
                        </>
                      )}
                    </Button>
                    
                                         <Button 
                       size="sm" 
                       variant="destructive"
                       onClick={() => onDeleteTask(task.id)}
                     >
                       <Trash2 className="h-4 w-4 mr-1" />
                       Eliminar
                     </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Pestaña de CI/CD
function PipelinesTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Pipelines CI/CD</h2>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pipeline
        </Button>
      </div>

      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="text-center py-8">
                           <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No hay pipelines CI/CD configurados</p>
          <p className="text-gray-500 text-sm mt-2">
            Configura pipelines para automatizar el deployment de tus proyectos
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Pestaña de Logs
function LogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    try {
      setLoading(true);
      // Por ahora, mostrar logs simulados hasta que se configure la base de datos
      const mockLogs = [
        {
          id: '1',
          action: 'Workflow ejecutado',
          automation_type: 'workflow',
          status: 'success',
          message: 'Workflow de aprobación completado exitosamente',
          created_at: new Date().toISOString(),
          execution_time_ms: 245
        },
        {
          id: '2',
          action: 'Trigger activado',
          automation_type: 'trigger',
          status: 'success',
          message: 'Notificación enviada al equipo',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          execution_time_ms: 120
        },
        {
          id: '3',
          action: 'Tarea programada',
          automation_type: 'task',
          status: 'warning',
          message: 'Tarea de backup programada para mañana',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          execution_time_ms: 89
        }
      ];
      
      setLogs(mockLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los logs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      default:
        return <Activity className="h-4 w-4 text-blue-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default">Éxito</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="secondary">Advertencia</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Logs de Automatización</h2>
        <Button onClick={loadLogs} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : logs.length === 0 ? (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No hay logs de automatización</p>
            <p className="text-gray-500 text-sm mt-2">
              Los logs aparecerán cuando ejecutes workflows, triggers o tareas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id} className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getStatusIcon(log.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-white font-medium">{log.action}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.automation_type}
                        </Badge>
                        {getStatusBadge(log.status)}
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{log.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                        {log.execution_time_ms && (
                          <span>{log.execution_time_ms}ms</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// FORMULARIOS MODALES
// =====================================================

// Formulario de Workflow
function WorkflowForm({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_type: '',
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validar datos antes de enviar
      if (!formData.name.trim()) {
        toast({
          title: 'Error',
          description: 'El nombre del workflow es obligatorio',
          variant: 'destructive'
        });
        return;
      }

      // Crear workflow con datos reales
      const newWorkflow = await workflowService.createWorkflow({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        project_type: formData.project_type || undefined,
        is_active: formData.is_active
      });

      toast({
        title: 'Éxito',
        description: `Workflow "${newWorkflow.name}" creado correctamente`
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating workflow:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el workflow',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Nuevo Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-zinc-700 border-zinc-600 text-white"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-white">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-zinc-700 border-zinc-600 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="project_type" className="text-white">Tipo de Proyecto</Label>
              <Select
                value={formData.project_type}
                onValueChange={(value) => setFormData({ ...formData, project_type: value })}
              >
                <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-700 border-zinc-600">
                  <SelectItem value="web_development">Desarrollo Web</SelectItem>
                  <SelectItem value="mobile_app">Aplicación Móvil</SelectItem>
                  <SelectItem value="desktop_app">Aplicación de Escritorio</SelectItem>
                  <SelectItem value="api_service">Servicio API</SelectItem>
                  <SelectItem value="database">Base de Datos</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active" className="text-white">Activo</Label>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 flex-1">
                Crear Workflow
              </Button>
              <Button type="button" onClick={onClose} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Formulario de Trigger
function TriggerForm({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_type: 'project_created' as any,
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validar datos antes de enviar
      if (!formData.name.trim()) {
        toast({
          title: 'Error',
          description: 'El nombre del trigger es obligatorio',
          variant: 'destructive'
        });
        return;
      }

      // Crear trigger con datos reales
      const newTrigger = await triggerService.createTrigger({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        event_type: formData.event_type,
        is_active: formData.is_active
      });

      toast({
        title: 'Éxito',
        description: `Trigger "${newTrigger.name}" creado correctamente`
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating trigger:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el trigger',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Nuevo Trigger</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-zinc-700 border-zinc-600 text-white"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-white">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-zinc-700 border-zinc-600 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="event_type" className="text-white">Tipo de Evento</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData({ ...formData, event_type: value })}
              >
                <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                  <SelectValue placeholder="Seleccionar evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project_created">Proyecto Creado</SelectItem>
                  <SelectItem value="project_status_changed">Estado de Proyecto Cambiado</SelectItem>
                  <SelectItem value="ticket_created">Ticket Creado</SelectItem>
                  <SelectItem value="payment_received">Pago Recibido</SelectItem>
                  <SelectItem value="user_registered">Usuario Registrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active" className="text-white">Activo</Label>
            </div>
            
            <div className="flex space-x-2">
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                Crear Trigger
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Formulario de Tarea
function TaskForm({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'daily' as any,
    script: '',
    script_type: 'sql' as any,
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validar datos antes de enviar
      if (!formData.name.trim()) {
        toast({
          title: 'Error',
          description: 'El nombre de la tarea es obligatorio',
          variant: 'destructive'
        });
        return;
      }

      if (!formData.script.trim()) {
        toast({
          title: 'Error',
          description: 'El script de la tarea es obligatorio',
          variant: 'destructive'
        });
        return;
      }

      // Crear tarea con datos reales
      const newTask = await automationTaskService.createTask({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        script: formData.script.trim(),
        script_type: formData.script_type,
        is_active: formData.is_active
      });

      toast({
        title: 'Éxito',
        description: `Tarea "${newTask.name}" creada correctamente`
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la tarea',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Nueva Tarea Automatizada</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-zinc-700 border-zinc-600 text-white"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-white">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-zinc-700 border-zinc-600 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="type" className="text-white">Tipo de Ejecución</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diaria</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="on_event">Por Evento</SelectItem>
                  <SelectItem value="custom">Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="script_type" className="text-white">Tipo de Script</Label>
              <Select
                value={formData.script_type}
                onValueChange={(value) => setFormData({ ...formData, script_type: value })}
              >
                <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sql">SQL</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="shell">Shell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="script" className="text-white">Script</Label>
              <Textarea
                id="script"
                value={formData.script}
                onChange={(e) => setFormData({ ...formData, script: e.target.value })}
                className="bg-zinc-700 border-zinc-600 text-white min-h-[100px]"
                placeholder="Escribe tu script aquí..."
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active" className="text-white">Activa</Label>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 flex-1">
                Crear Tarea
              </Button>
              <Button type="button" onClick={onClose} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
                
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
