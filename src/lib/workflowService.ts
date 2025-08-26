import { supabase } from './supabase';
import { ProjectVersion, ChangeLog } from '@/types/project.types';

export interface WorkflowTransition {
  from: string;
  to: string;
  requiresApproval: boolean;
  autoPromote: boolean;
  conditions: string[];
}

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
  files: string[];
  type: 'feature' | 'bugfix' | 'hotfix' | 'security' | 'refactor' | 'documentation';
  breakingChange: boolean;
}

export interface VersionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  isHealthy: boolean;
  errors: string[];
  responseTime: number;
  uptime: number;
}

export interface AutoRollbackResult {
  success: boolean;
  previousVersion: string;
  reason: string;
  timestamp: string;
}

export const workflowService = {
  // ===== DETECCIÓN AUTOMÁTICA DE COMMITS =====
  
          async detectNewCommits(projectId: string): Promise<{ newCommits: CommitInfo[], hasNewCommits: boolean }> {
    try {
      // Obtener información del proyecto para acceder al repositorio
      let project = null;
      try {
        console.log('🔍 Obteniendo información del proyecto:', projectId);
        const { data, error } = await supabase
          .from('projects')
          .select('github_repository_url')
          .eq('id', projectId)
          .single();

        if (error) {
          console.error('❌ Error obteniendo proyecto:', error);
          return { newCommits: [], hasNewCommits: false };
        }

        project = data;
        console.log('✅ Proyecto obtenido:', project?.github_repository_url || 'Sin repositorio');
      } catch (error) {
        console.error('💥 Exception obteniendo proyecto:', error);
        return { newCommits: [], hasNewCommits: false };
      }

      if (!project?.github_repository_url) {
        console.error('❌ No hay repositorio configurado para este proyecto');
        return { newCommits: [], hasNewCommits: false };
      }

      // Obtener commits reales de la base de datos
      let commits = [];
      try {
        console.log('🔍 Intentando obtener commits para proyecto:', projectId);
        
        const { data, error } = await supabase
          .from('commits')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('❌ Error fetching commits:', error);
          commits = [];
        } else {
          console.log('✅ Commits obtenidos:', data?.length || 0);
          commits = data || [];
        }
      } catch (error) {
        console.error('💥 Exception fetching commits:', error);
        commits = [];
      }

             // Obtener la última versión del proyecto para comparar
       let lastVersion = null;
       try {
         console.log('🔍 Obteniendo última versión del proyecto');
         const { data, error } = await supabase
           .from('project_versions')
           .select('created_at')
           .eq('project_id', projectId)
           .order('created_at', { ascending: false })
           .limit(1);

         if (error) {
           console.error('❌ Error obteniendo última versión:', error);
           lastVersion = null;
         } else {
           lastVersion = data && data.length > 0 ? data[0] : null;
           console.log('✅ Última versión obtenida:', lastVersion ? 'Sí' : 'No');
         }
       } catch (error) {
         console.error('💥 Exception obteniendo última versión:', error);
         lastVersion = null;
       }

             // Si es un proyecto nuevo (sin versiones), obtener el último commit del repositorio
       if (!lastVersion && (!commits || commits.length === 0)) {
         console.log('🆕 Proyecto nuevo detectado, obteniendo último commit del repositorio...');
         
         // Obtener el último commit real del repositorio
         const lastCommit = await this.getLastCommitFromRepository(project.github_repository_url);
         
         if (lastCommit) {
           console.log('📦 Último commit obtenido:', lastCommit.hash.substring(0, 8));
           
           // Guardar el commit real en la base de datos
           try {
             const { error: insertError } = await supabase
               .from('commits')
               .insert({
                 project_id: projectId,
                 commit_hash: lastCommit.hash,
                 message: lastCommit.message,
                 author: lastCommit.author,
                 branch: 'main',
                 files_changed: lastCommit.files || [],
                 created_at: lastCommit.date
               });

             if (!insertError) {
               console.log('✅ Commit guardado en base de datos:', lastCommit.hash);
               return {
                 newCommits: [lastCommit],
                 hasNewCommits: true
               };
             } else {
               console.error('❌ Error insertando commit:', insertError);
             }
           } catch (insertError) {
             console.error('💥 Exception insertando commit:', insertError);
           }
         } else {
           console.log('⚠️ No se pudo obtener el último commit del repositorio');
         }
       }

             // Filtrar commits nuevos (después de la última versión)
       const newCommits: CommitInfo[] = commits
         ?.filter(commit => {
           if (!lastVersion) return true; // Si no hay versiones, todos los commits son nuevos
           return new Date(commit.created_at) > new Date(lastVersion.created_at);
         })
         .map(commit => ({
           hash: commit.commit_hash,
           message: commit.message,
           author: commit.author,
           date: commit.created_at,
           files: commit.files_changed || [],
           type: this.parseCommitType(commit.message),
           breakingChange: commit.message.toLowerCase().includes('breaking') || commit.message.toLowerCase().includes('!feat')
         })) || [];

       console.log(`📊 Resultado: ${newCommits.length} commits nuevos encontrados`);
       
       return {
         newCommits,
         hasNewCommits: newCommits.length > 0
       };
    } catch (error) {
      console.error('Error detecting new commits:', error);
      return { newCommits: [], hasNewCommits: false };
    }
  },

  // Función para obtener el último commit del repositorio
  async getLastCommitFromRepository(repoUrl: string): Promise<CommitInfo | null> {
    try {
      // Extraer owner y repo de la URL de GitHub
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        console.error('URL de repositorio inválida:', repoUrl);
        return null;
      }

      const [, owner, repo] = match;
      const cleanRepo = repo.replace('.git', '');

      // Obtener el último commit usando la API pública de GitHub
      const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/commits?per_page=1`);
      
      if (!response.ok) {
        console.error('Error fetching commits from GitHub:', response.statusText);
        return null;
      }

      const commits = await response.json();
      
      if (commits.length === 0) {
        console.error('No se encontraron commits en el repositorio');
        return null;
      }

      const lastCommit = commits[0];
      
      // Obtener detalles del commit
      const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/commits/${lastCommit.sha}`);
      
      if (!commitResponse.ok) {
        console.error('Error fetching commit details:', commitResponse.statusText);
        return null;
      }

      const commitDetails = await commitResponse.json();

      const commitInfo: CommitInfo = {
        hash: lastCommit.sha,
        message: lastCommit.commit.message,
        author: lastCommit.commit.author.name || lastCommit.commit.author.email,
        date: lastCommit.commit.author.date,
        files: commitDetails.files?.map((file: any) => file.filename) || [],
        type: this.parseCommitType(lastCommit.commit.message),
        breakingChange: lastCommit.commit.message.toLowerCase().includes('breaking') || lastCommit.commit.message.toLowerCase().includes('!feat')
      };

      console.log(`📦 Último commit obtenido de ${owner}/${cleanRepo}: ${commitInfo.hash.substring(0, 8)}`);
      return commitInfo;
    } catch (error) {
      console.error('Error getting last commit from repository:', error);
      return null;
    }
  },

   parseCommitType(message: string): CommitInfo['type'] {
     const lowerMessage = message.toLowerCase();
     if (lowerMessage.startsWith('feat:')) return 'feature';
     if (lowerMessage.startsWith('fix:')) return 'bugfix';
     if (lowerMessage.startsWith('hotfix:')) return 'hotfix';
     if (lowerMessage.startsWith('security:')) return 'security';
     if (lowerMessage.startsWith('refactor:')) return 'refactor';
     if (lowerMessage.startsWith('docs:') || lowerMessage.startsWith('doc:')) return 'documentation';
     return 'feature'; // default
   },

  // ===== AUTO-GENERACIÓN DE CHANGELOG =====
  
  generateChangelogFromCommits(commits: CommitInfo[]): Omit<ChangeLog, 'id' | 'timestamp'>[] {
    return commits.map(commit => ({
      type: commit.type,
      title: this.extractTitleFromCommit(commit.message),
      description: commit.message,
      author: commit.author,
      breakingChange: commit.breakingChange,
      commitHash: commit.hash,
      commitMessage: commit.message,
      filesChanged: commit.files,
      autoGenerated: true
    }));
  },

  extractTitleFromCommit(message: string): string {
    // Extraer título del commit message (formato convencional)
    const lines = message.split('\n');
    const firstLine = lines[0];
    
    // Remover prefijos como "feat:", "fix:", etc.
    const title = firstLine.replace(/^(feat|fix|hotfix|security|refactor|docs|style|test|chore):\s*/i, '');
    
    return title.charAt(0).toUpperCase() + title.slice(1);
  },

  // ===== VALIDACIÓN DE VERSIONES SEMÁNTICAS =====
  
  validateSemanticVersion(version: string): VersionValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar formato semántico (MAJOR.MINOR.PATCH)
    const semanticRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
    
    if (!semanticRegex.test(version)) {
      errors.push('La versión debe seguir el formato semántico MAJOR.MINOR.PATCH');
    } else {
      const [, major, minor, patch] = version.match(semanticRegex) || [];
      
      // Validar que los números sean válidos
      if (parseInt(major) < 0 || parseInt(minor) < 0 || parseInt(patch) < 0) {
        errors.push('Los números de versión no pueden ser negativos');
      }
      
      // Advertencias para versiones importantes
      if (parseInt(major) > 0 && parseInt(minor) === 0 && parseInt(patch) === 0) {
        warnings.push('Esta es una versión mayor (MAJOR) - puede contener cambios incompatibles');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  },

  // ===== TRANSICIONES DE ESTADO =====
  
  async transitionVersionStatus(
    versionId: string, 
    newStatus: ProjectVersion['status'], 
    userId: string, 
    comments?: string
  ): Promise<boolean> {
    try {
      const { data: currentVersion } = await supabase
        .from('project_versions')
        .select('status, environment')
        .eq('id', versionId)
        .single();

      if (!currentVersion) {
        throw new Error('Versión no encontrada');
      }

      // Validar transición permitida
      const allowedTransitions = this.getAllowedTransitions(currentVersion.status);
      if (!allowedTransitions.includes(newStatus)) {
        throw new Error(`Transición no permitida de ${currentVersion.status} a ${newStatus}`);
      }

      // Actualizar estado
      const { error } = await supabase
        .from('project_versions')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'approved' && { reviewed_by: userId, reviewed_at: new Date().toISOString() }),
          ...(newStatus === 'deployed' && { deployed_by: userId, deployed_at: new Date().toISOString() })
        })
        .eq('id', versionId);

      if (error) throw error;

      // Registrar transición en el historial
      await this.logWorkflowTransition(versionId, currentVersion.status, newStatus, userId, comments);

      // Ejecutar acciones automáticas según el nuevo estado
      await this.executeAutoActions(versionId, newStatus, currentVersion.environment);

      return true;
    } catch (error) {
      console.error('Error transitioning version status:', error);
      return false;
    }
  },

  getAllowedTransitions(currentStatus: string): ProjectVersion['status'][] {
    const transitions: Record<string, ProjectVersion['status'][]> = {
      'draft': ['in_review', 'deployed'],
      'in_review': ['approved', 'failed', 'draft'],
      'approved': ['deployed', 'failed', 'in_review'],
      'deployed': ['rolled_back', 'failed'],
      'failed': ['draft', 'in_review'],
      'rolled_back': ['draft', 'in_review']
    };

    return transitions[currentStatus] || [];
  },

  // ===== ACCIONES AUTOMÁTICAS =====
  
  async executeAutoActions(versionId: string, status: string, environment: string): Promise<void> {
    switch (status) {
      case 'approved':
        // Auto-promotion entre entornos
        if (environment === 'development') {
          await this.autoPromoteToStaging(versionId);
        } else if (environment === 'staging') {
          await this.autoPromoteToProduction(versionId);
        }
        break;
        
      case 'deployed':
        // Health check automático después del deployment
        setTimeout(() => this.performHealthCheck(versionId), 30000); // 30 segundos
        break;
        
      case 'failed':
        // Auto-rollback en caso de fallo
        await this.triggerAutoRollback(versionId, 'Deployment falló automáticamente');
        break;
    }
  },

  async autoPromoteToStaging(versionId: string): Promise<void> {
    try {
      const { data: version } = await supabase
        .from('project_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (version) {
        // Crear nueva versión en staging
                 await supabase
           .from('project_versions')
           .insert({
             project_id: version.project_id,
             version: version.version,
             description: `Auto-promoted from development: ${version.description}`,
             changes: version.changes,
             environment: 'staging',
             status: 'in_review',
             commit_hash: version.commit_hash,
             branch: version.branch,
             build_number: version.build_number + 1
           });
      }
    } catch (error) {
      console.error('Error in auto-promotion to staging:', error);
    }
  },

  async autoPromoteToProduction(versionId: string): Promise<void> {
    try {
      const { data: version } = await supabase
        .from('project_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (version) {
        // Crear nueva versión en production
                 await supabase
           .from('project_versions')
           .insert({
             project_id: version.project_id,
             version: version.version,
             description: `Auto-promoted from staging: ${version.description}`,
             changes: version.changes,
             environment: 'production',
             status: 'in_review',
             commit_hash: version.commit_hash,
             branch: version.branch,
             build_number: version.build_number + 1
           });
      }
    } catch (error) {
      console.error('Error in auto-promotion to production:', error);
    }
  },

  // ===== HEALTH CHECK AUTOMÁTICO =====
  
     async performHealthCheck(versionId: string): Promise<HealthCheckResult> {
     try {
       // Obtener datos reales de health check de la base de datos
       const { data: healthData, error } = await supabase
         .from('deployments')
         .select('*')
         .eq('version_id', versionId)
         .order('created_at', { ascending: false })
         .limit(1)
         .single();

       if (error) {
         console.error('Error fetching health data:', error);
         return {
           status: 'unknown',
           isHealthy: false,
           errors: ['No se pudo obtener datos de health check'],
           responseTime: 0,
           uptime: 0
         };
       }

       // Calcular health check basado en datos reales
       const isHealthy = healthData?.status === 'success';
       const responseTime = healthData?.response_time || 0;
       const uptime = healthData?.uptime || 0;

       const result: HealthCheckResult = {
         status: isHealthy ? 'healthy' : 'unhealthy',
         isHealthy,
         errors: isHealthy ? [] : [healthData?.error_message || 'Error desconocido'],
         responseTime,
         uptime
       };

       // Actualizar estado de health check en la versión
       await supabase
         .from('project_versions')
         .update({
           health_check_status: result.status,
           last_health_check: new Date().toISOString()
         })
         .eq('id', versionId);

       return result;
     } catch (error) {
       console.error('Error performing health check:', error);
       return {
         status: 'unhealthy',
         isHealthy: false,
         errors: ['Error interno del health check'],
         responseTime: 0,
         uptime: 0
       };
     }
   },

  async checkDeploymentHealth(versionId: string): Promise<HealthCheckResult> {
    return this.performHealthCheck(versionId);
  },

  // ===== AUTO-ROLLBACK =====
  
  async triggerAutoRollback(versionId: string, reason: string): Promise<boolean> {
    try {
      // Obtener versión actual
      const { data: currentVersion } = await supabase
        .from('project_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (!currentVersion) return false;

      // Buscar versión anterior estable
      const { data: previousVersion } = await supabase
        .from('project_versions')
        .select('*')
        .eq('project_id', currentVersion.project_id)
        .eq('environment', currentVersion.environment)
        .eq('status', 'deployed')
        .neq('id', versionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!previousVersion) {
        console.log('No se encontró versión anterior para rollback');
        return false;
      }

      // Marcar versión actual como rollback
      await supabase
        .from('project_versions')
        .update({
          status: 'rolled_back',
          rollback_to: previousVersion.version,
          updated_at: new Date().toISOString()
        })
        .eq('id', versionId);

      // Registrar rollback
      await this.logWorkflowTransition(
        versionId, 
        'deployed', 
        'rolled_back', 
        'system', 
        `Auto-rollback: ${reason}. Revertido a ${previousVersion.version}`
      );

      return true;
    } catch (error) {
      console.error('Error in auto-rollback:', error);
      return false;
    }
  },

  // ===== CREACIÓN AUTOMÁTICA DE VERSIONES =====
  
  async createVersionFromCommits(
    projectId: string,
    version: string,
    environment: 'development' | 'staging' | 'production',
    userId: string
  ): Promise<ProjectVersion> {
    try {
      // Detectar commits nuevos
      const { newCommits } = await this.detectNewCommits(projectId);
      
      // Generar changelog automáticamente
      const changes = this.generateChangelogFromCommits(newCommits);
      
      // Validar versión semántica
      const validation = this.validateSemanticVersion(version);
      if (!validation.isValid) {
        throw new Error(`Versión inválida: ${validation.errors.join(', ')}`);
      }

                    // Obtener último build number
       const { data: lastVersions } = await supabase
         .from('project_versions')
         .select('*')
         .eq('project_id', projectId)
         .order('build_number', { ascending: false })
         .limit(1);

       const lastVersion = lastVersions && lastVersions.length > 0 ? lastVersions[0] : null;
       const buildNumber = (lastVersion?.build_number || 0) + 1;

             // Crear nueva versión
       const { data: newVersion, error } = await supabase
         .from('project_versions')
         .insert({
           project_id: projectId,
           version,
           description: `Auto-generated version from ${newCommits.length} commits`,
           changes,
           environment,
                       status: 'draft', // Usar 'draft' que debería estar permitido
           build_number: buildNumber,
           commit_hash: newCommits[0]?.hash,
           branch: 'main'
         })
         .select()
         .single();

      if (error) throw error;

      // Enviar notificación
      await this.sendVersionNotification(newVersion, 'created');

      return newVersion;
    } catch (error) {
      console.error('Error creating version from commits:', error);
      throw error;
    }
  },

  // ===== NOTIFICACIONES AUTOMÁTICAS =====
  
     async sendVersionNotification(version: ProjectVersion, event: 'created' | 'deployed' | 'failed'): Promise<void> {
     try {
       const message = this.generateNotificationMessage(version, event);
       
               // Guardar notificación real en la base de datos
        const { error } = await supabase
          .from('chat_messages')
          .insert({
            room_id: 'version-notifications', // Usar un room específico para notificaciones
            user_id: 'system',
            message: message,
            message_type: 'notification',
            metadata: {
              version_id: version.id,
              version: version.version,
              event: event,
              environment: version.environment
            }
            // Remover created_at ya que la tabla no tiene esa columna
          });

       if (error) {
         console.error('Error saving notification:', error);
       } else {
         console.log('🔔 Notificación guardada en base de datos:', message);
       }
     } catch (error) {
       console.error('Error sending notification:', error);
     }
   },

  generateNotificationMessage(version: ProjectVersion, event: string): string {
    const messages = {
      created: `🆕 Nueva versión ${version.version} creada automáticamente en ${version.environment}`,
      deployed: `✅ Versión ${version.version} desplegada exitosamente en ${version.environment}`,
      failed: `❌ Fallo en el deployment de la versión ${version.version} en ${version.environment}`
    };

    return messages[event as keyof typeof messages] || 'Notificación de versión';
  },

  // ===== LOGGING Y AUDITORÍA =====
  
     async logWorkflowTransition(
     versionId: string,
     fromStatus: string,
     toStatus: string,
     userId: string,
     comments?: string
   ): Promise<void> {
     try {
       // Guardar transición en la tabla de comentarios de versiones
       await supabase
         .from('version_comments')
         .insert({
           version_id: versionId,
           user_id: userId,
           comment: `Transición de workflow: ${fromStatus} → ${toStatus}${comments ? ` - ${comments}` : ''}`,
           comment_type: 'workflow_transition',
           created_at: new Date().toISOString()
         });
     } catch (error) {
       console.error('Error logging workflow transition:', error);
     }
   },

  // ===== UTILIDADES =====
  
     async getWorkflowHistory(versionId: string): Promise<any[]> {
     try {
       const { data } = await supabase
         .from('version_comments')
         .select('*')
         .eq('version_id', versionId)
         .eq('comment_type', 'workflow_transition')
         .order('created_at', { ascending: true });

       return data || [];
     } catch (error) {
       console.error('Error getting workflow history:', error);
       return [];
     }
   },

     async getPendingApprovals(): Promise<ProjectVersion[]> {
     try {
       const { data } = await supabase
         .from('project_versions')
         .select('*')
         .eq('status', 'in_review')
         .order('created_at', { ascending: false });

       return data || [];
     } catch (error) {
       console.error('Error getting pending approvals:', error);
       return [];
     }
   },


 };
