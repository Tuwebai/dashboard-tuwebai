import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

export function useRealtimeProjects() {
  const { user, projects, setProjects } = useApp();

  const handleProjectUpdate = useCallback((payload: any) => {

    
    if (payload.eventType === 'UPDATE' && payload.new) {
      const updatedProject = payload.new;
      const oldProject = payload.old;
      
      setProjects((currentProjects: any[]) => {
        const projectIndex = currentProjects.findIndex(p => p.id === updatedProject.id);
        
        if (projectIndex !== -1) {
          // Actualizar proyecto existente
          const newProjects = [...currentProjects];
          newProjects[projectIndex] = { ...newProjects[projectIndex], ...updatedProject };
          
          // Mostrar notificación si cambió el estado de aprobación
          if (oldProject?.approval_status !== updatedProject.approval_status) {
            const projectName = updatedProject.name || 'Proyecto';
            
            if (updatedProject.approval_status === 'approved') {
              toast({
                title: '🎉 Proyecto aprobado',
                description: `"${projectName}" ha sido aprobado por el administrador`,
                duration: 5000
              });
            } else if (updatedProject.approval_status === 'rejected') {
              toast({
                title: '❌ Proyecto rechazado',
                description: `"${projectName}" ha sido rechazado. Revisa los comentarios del administrador`,
                duration: 7000,
                variant: 'destructive'
              });
            }
          }
          

          return newProjects;
        }
        
        return currentProjects;
      });
    }
  }, [setProjects]);

  useEffect(() => {
    if (!user || !user.id) {

      return;
    }

    // Verificar si Realtime está disponible
    const isRealtimeEnabled = import.meta.env.VITE_ENABLE_REALTIME === 'true';
    
    if (!isRealtimeEnabled) {

      return;
    }
    




    let channel: any = null;
    let retryCount = 0;
    const maxRetries = 3;

    const setupChannel = () => {
      try {
        channel = supabase
          .channel(`projects-changes-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'projects',
              filter: user.role === 'admin' ? undefined : `created_by=eq.${user.id}`
            },
            (payload) => {

              handleProjectUpdate(payload);
            }
          )
          .subscribe((status) => {

            if (status === 'SUBSCRIBED') {

              retryCount = 0; // Reset retry count on success
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Error en listener de tiempo real');
              if (retryCount < maxRetries) {
                retryCount++;

                setTimeout(setupChannel, 2000 * retryCount);
              } else {
                console.error('❌ Máximo de reintentos alcanzado, deshabilitando Realtime');
              }
            } else if (status === 'CLOSED') {

            }
          });
      } catch (error) {
        console.error('❌ Error configurando canal de Realtime:', error);
      }
    };

    setupChannel();

    return () => {

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, user?.role, handleProjectUpdate]);

  return {
    // Función para forzar actualización manual si es necesario
    refreshProjects: useCallback(async () => {
      if (!user) return;
      
      try {
        const { projectService } = await import('@/lib/projectService');
        let projectData: any[] = [];
        
        if (user.role === 'admin') {
          const response = await projectService.getProjects();
          projectData = response?.projects || [];
        } else {
          projectData = await projectService.getProjectsByUser(user.id);
        }
        
        setProjects(projectData);

      } catch (error) {
        console.error('❌ Error actualizando proyectos:', error);
      }
    }, [user, setProjects])
  };
}
