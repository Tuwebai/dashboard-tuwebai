import { supabase } from './supabase';

// =====================================================
// TIPOS Y INTERFACES PARA WORKFLOWS
// =====================================================

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  project_type?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  name: string;
  type: 'approval' | 'notification' | 'status_change' | 'email' | 'assignment' | 'condition';
  order_index: number;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  timeout_seconds: number;
  retry_count: number;
  created_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  project_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  current_step_id?: string;
  step_results: any[];
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  error_message?: string;
  created_by?: string;
}

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  project_type?: string;
  is_active?: boolean;
}

export interface CreateWorkflowStepDto {
  workflow_id: string;
  name: string;
  type: WorkflowStep['type'];
  order_index: number;
  conditions?: Record<string, any>;
  actions?: Record<string, any>;
  timeout_seconds?: number;
  retry_count?: number;
}

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  project_type?: string;
  is_active?: boolean;
}

// =====================================================
// SERVICIO PRINCIPAL DE WORKFLOWS
// =====================================================

export class WorkflowService {
  
  // =====================================================
  // GESTIÓN DE WORKFLOWS
  // =====================================================

  /**
   * Crear un nuevo workflow
   */
  async createWorkflow(workflow: CreateWorkflowDto): Promise<Workflow> {
    try {
      const { data, error } = await supabase
        .from('project_workflows')
        .insert({
          ...workflow,
          is_active: workflow.is_active ?? true
        })
        .select()
        .single();

      if (error) throw error;
      
      // Log de la creación
      await this.logWorkflowAction('workflow', data.id, 'create', 'success', 'Workflow creado exitosamente');
      
      return data;
    } catch (error) {
      await this.logWorkflowAction('workflow', 'unknown', 'create', 'error', `Error creando workflow: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener todos los workflows
   */
  async getWorkflows(): Promise<Workflow[]> {
    try {
      const { data, error } = await supabase
        .from('project_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting workflows:', error);
      return [];
    }
  }

  /**
   * Obtener workflow por ID
   */
  async getWorkflow(id: string): Promise<Workflow | null> {
    try {
      const { data, error } = await supabase
        .from('project_workflows')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting workflow:', error);
      return null;
    }
  }

  /**
   * Actualizar workflow
   */
  async updateWorkflow(id: string, updates: UpdateWorkflowDto): Promise<Workflow> {
    try {
      const { data, error } = await supabase
        .from('project_workflows')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await this.logWorkflowAction('workflow', id, 'update', 'success', 'Workflow actualizado exitosamente');
      
      return data;
    } catch (error) {
      await this.logWorkflowAction('workflow', id, 'update', 'error', `Error actualizando workflow: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('project_workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await this.logWorkflowAction('workflow', id, 'delete', 'success', 'Workflow eliminado exitosamente');
    } catch (error) {
      await this.logWorkflowAction('workflow', id, 'delete', 'error', `Error eliminando workflow: ${error.message}`);
      throw error;
    }
  }

  // =====================================================
  // GESTIÓN DE PASOS DE WORKFLOW
  // =====================================================

  /**
   * Crear paso de workflow
   */
  async createWorkflowStep(step: CreateWorkflowStepDto): Promise<WorkflowStep> {
    try {
      const { data, error } = await supabase
        .from('workflow_steps')
        .insert({
          ...step,
          conditions: step.conditions || {},
          actions: step.actions || {},
          timeout_seconds: step.timeout_seconds || 3600,
          retry_count: step.retry_count || 0
        })
        .select()
        .single();

      if (error) throw error;
      
      await this.logWorkflowAction('workflow_step', data.id, 'create', 'success', 'Paso de workflow creado exitosamente');
      
      return data;
    } catch (error) {
      await this.logWorkflowAction('workflow_step', 'unknown', 'create', 'error', `Error creando paso: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener pasos de un workflow
   */
  async getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_steps')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting workflow steps:', error);
      return [];
    }
  }

  /**
   * Actualizar paso de workflow
   */
  async updateWorkflowStep(id: string, updates: Partial<WorkflowStep>): Promise<WorkflowStep> {
    try {
      const { data, error } = await supabase
        .from('workflow_steps')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await this.logWorkflowAction('workflow_step', id, 'update', 'success', 'Paso de workflow actualizado exitosamente');
      
      return data;
    } catch (error) {
      await this.logWorkflowAction('workflow_step', id, 'update', 'error', `Error actualizando paso: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar paso de workflow
   */
  async deleteWorkflowStep(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_steps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await this.logWorkflowAction('workflow_step', id, 'delete', 'success', 'Paso de workflow eliminado exitosamente');
    } catch (error) {
      await this.logWorkflowAction('workflow_step', id, 'delete', 'error', `Error eliminando paso: ${error.message}`);
      throw error;
    }
  }

  // =====================================================
  // EJECUCIÓN DE WORKFLOWS
  // =====================================================

  /**
   * Ejecutar workflow para un proyecto
   */
  async executeWorkflow(projectId: string, workflowId: string): Promise<WorkflowExecution> {
    try {
      // Crear ejecución
      const execution = await this.createWorkflowExecution(projectId, workflowId);
      
      // Obtener pasos del workflow
      const steps = await this.getWorkflowSteps(workflowId);
      
      if (steps.length === 0) {
        await this.completeWorkflowExecution(execution.id, 'completed');
        return execution;
      }

      // Ejecutar primer paso
      const firstStep = steps[0];
      await this.executeWorkflowStep(execution.id, firstStep, projectId);
      
      return execution;
    } catch (error) {
      console.error('Error executing workflow:', error);
      throw error;
    }
  }

  /**
   * Ejecutar paso específico de workflow
   */
  async executeWorkflowStep(executionId: string, step: WorkflowStep, projectId: string): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Evaluar condiciones
      if (step.conditions && Object.keys(step.conditions).length > 0) {
        const conditionsMet = await this.evaluateConditions(step.conditions, projectId);
        if (!conditionsMet) {
          await this.logWorkflowAction('workflow_step', step.id, 'execute', 'warning', 'Condiciones no cumplidas, saltando paso');
          return;
        }
      }

      // Ejecutar acciones
      if (step.actions && Object.keys(step.actions).length > 0) {
        await this.executeActions(step.actions, projectId);
      }

      // Registrar resultado
      const executionTime = Date.now() - startTime;
      await this.recordStepResult(executionId, step.id, 'success', executionTime);

      // Determinar siguiente paso
      await this.moveToNextStep(executionId, step, projectId);

    } catch (error) {
      console.error('Error executing workflow step:', error);
      await this.recordStepResult(executionId, step.id, 'error', 0, error.message);
      
      // Reintentar si es posible
      if (step.retry_count > 0) {
        await this.retryWorkflowStep(executionId, step, projectId);
      }
    }
  }

  /**
   * Evaluar condiciones del paso
   */
  private async evaluateConditions(conditions: Record<string, any>, projectId: string): Promise<boolean> {
    try {
      // Obtener datos del proyecto
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (!project) return false;

      // Evaluar cada condición
      for (const [field, condition] of Object.entries(conditions)) {
        const value = project[field];
        const operator = condition.operator;
        const expectedValue = condition.value;

        switch (operator) {
          case 'equals':
            if (value !== expectedValue) return false;
            break;
          case 'contains':
            if (!String(value).includes(String(expectedValue))) return false;
            break;
          case 'greater_than':
            if (Number(value) <= Number(expectedValue)) return false;
            break;
          case 'less_than':
            if (Number(value) >= Number(expectedValue)) return false;
            break;
          case 'not_equals':
            if (value === expectedValue) return false;
            break;
          default:
            console.warn(`Operador no soportado: ${operator}`);
            return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error evaluating conditions:', error);
      return false;
    }
  }

  /**
   * Ejecutar acciones del paso
   */
  private async executeActions(actions: Record<string, any>, projectId: string): Promise<void> {
    try {
      for (const [actionType, actionData] of Object.entries(actions)) {
        switch (actionType) {
          case 'notify_team':
            await this.executeNotificationAction(actionData, projectId);
            break;
          case 'update_status':
            await this.executeStatusUpdateAction(actionData, projectId);
            break;
          case 'send_email':
            await this.executeEmailAction(actionData, projectId);
            break;
          case 'assign_user':
            await this.executeAssignmentAction(actionData, projectId);
            break;
          default:
            console.warn(`Acción no soportada: ${actionType}`);
        }
      }
    } catch (error) {
      console.error('Error executing actions:', error);
      throw error;
    }
  }

  // =====================================================
  // ACCIONES ESPECÍFICAS
  // =====================================================

  /**
   * Ejecutar acción de notificación
   */
  private async executeNotificationAction(actionData: any, projectId: string): Promise<void> {
    try {
      // Aquí integrarías con tu sistema de notificaciones
      console.log('Ejecutando notificación:', actionData);
      
      // Ejemplo: crear notificación en la base de datos
      const { error } = await supabase
        .from('notifications')
        .insert({
          title: actionData.title || 'Notificación del Workflow',
          message: actionData.message || 'Acción automática ejecutada',
          type: 'info',
          category: 'workflow',
          project_id: projectId,
          is_system: true
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error executing notification action:', error);
      throw error;
    }
  }

  /**
   * Ejecutar acción de actualización de estado
   */
  private async executeStatusUpdateAction(actionData: any, projectId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: actionData.new_status })
        .eq('id', projectId);

      if (error) throw error;
    } catch (error) {
      console.error('Error executing status update action:', error);
      throw error;
    }
  }

  /**
   * Ejecutar acción de email
   */
  private async executeEmailAction(actionData: any, projectId: string): Promise<void> {
    try {
      // Aquí integrarías con tu servicio de email
      console.log('Ejecutando envío de email:', actionData);
      
      // Por ahora solo log
      await this.logWorkflowAction('workflow', projectId, 'email', 'info', `Email enviado a: ${actionData.recipients}`);
    } catch (error) {
      console.error('Error executing email action:', error);
      throw error;
    }
  }

  /**
   * Ejecutar acción de asignación
   */
  private async executeAssignmentAction(actionData: any, projectId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ assigned_to: actionData.user_id })
        .eq('id', projectId);

      if (error) throw error;
    } catch (error) {
      console.error('Error executing assignment action:', error);
      throw error;
    }
  }

  // =====================================================
  // GESTIÓN DE EJECUCIONES
  // =====================================================

  /**
   * Crear ejecución de workflow
   */
  private async createWorkflowExecution(projectId: string, workflowId: string): Promise<WorkflowExecution> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .insert({
          workflow_id: workflowId,
          project_id: projectId,
          status: 'running',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating workflow execution:', error);
      throw error;
    }
  }

  /**
   * Completar ejecución de workflow
   */
  private async completeWorkflowExecution(executionId: string, status: 'completed' | 'failed' | 'cancelled'): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_executions')
        .update({
          status,
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error completing workflow execution:', error);
      throw error;
    }
  }

  /**
   * Registrar resultado de paso
   */
  private async recordStepResult(executionId: string, stepId: string, status: string, executionTime: number, errorMessage?: string): Promise<void> {
    try {
      // Actualizar ejecución con resultado del paso
      const { error } = await supabase
        .from('workflow_executions')
        .update({
          step_results: supabase.sql`array_append(step_results, ${JSON.stringify({
            step_id: stepId,
            status,
            execution_time_ms: executionTime,
            error_message: errorMessage,
            completed_at: new Date().toISOString()
          })})`
        })
        .eq('id', executionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error recording step result:', error);
    }
  }

  /**
   * Mover al siguiente paso
   */
  private async moveToNextStep(executionId: string, currentStep: WorkflowStep, projectId: string): Promise<void> {
    try {
      const steps = await this.getWorkflowSteps(currentStep.workflow_id);
      const currentIndex = steps.findIndex(s => s.id === currentStep.id);
      const nextStep = steps[currentIndex + 1];

      if (nextStep) {
        // Actualizar ejecución con siguiente paso
        const { error } = await supabase
          .from('workflow_executions')
          .update({ current_step_id: nextStep.id })
          .eq('id', executionId);

        if (error) throw error;

        // Ejecutar siguiente paso
        await this.executeWorkflowStep(executionId, nextStep, projectId);
      } else {
        // Workflow completado
        await this.completeWorkflowExecution(executionId, 'completed');
      }
    } catch (error) {
      console.error('Error moving to next step:', error);
      await this.completeWorkflowExecution(executionId, 'failed');
    }
  }

  /**
   * Reintentar paso de workflow
   */
  private async retryWorkflowStep(executionId: string, step: WorkflowStep, projectId: string): Promise<void> {
    try {
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Ejecutar paso nuevamente
      await this.executeWorkflowStep(executionId, step, projectId);
    } catch (error) {
      console.error('Error retrying workflow step:', error);
      await this.completeWorkflowExecution(executionId, 'failed');
    }
  }

  // =====================================================
  // LOGGING Y MONITOREO
  // =====================================================

  /**
   * Log de acciones de workflow
   */
  private async logWorkflowAction(
    automationType: string,
    automationId: string,
    action: string,
    status: 'success' | 'error' | 'warning' | 'info',
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('automation_logs')
        .insert({
          automation_type: automationType,
          automation_id: automationId,
          action,
          status,
          message,
          details: details || {},
          execution_time_ms: 0
        });

      if (error) console.error('Error logging workflow action:', error);
    } catch (error) {
      console.error('Error logging workflow action:', error);
    }
  }

  /**
   * Obtener logs de workflow
   */
  async getWorkflowLogs(workflowId?: string, limit: number = 100): Promise<any[]> {
    try {
      let query = supabase
        .from('automation_logs')
        .select('*')
        .eq('automation_type', 'workflow')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (workflowId) {
        query = query.eq('automation_id', workflowId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting workflow logs:', error);
      return [];
    }
  }
}

// Instancia singleton del servicio
export const workflowService = new WorkflowService();
