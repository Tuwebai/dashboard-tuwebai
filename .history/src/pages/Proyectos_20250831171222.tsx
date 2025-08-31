import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Proyectos() {
  const { projects } = useApp();
  const [searchParams] = useSearchParams();
  const [filteredProjects, setFilteredProjects] = useState(projects);
  const [loading, setLoading] = useState(false);
  const [userFilter, setUserFilter] = useState<string | null>(null);

  // Obtener parámetro de usuario de la URL
  useEffect(() => {
    const userId = searchParams.get('user');
    if (userId) {
      setUserFilter(userId);
      loadUserProjects(userId);
    } else {
      setFilteredProjects(projects);
      setUserFilter(null);
    }
  }, [searchParams, projects]);

  const loadUserProjects = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFilteredProjects(data || []);
    } catch (error) {
      console.error('Error loading user projects:', error);
      setFilteredProjects([]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mis Proyectos</h1>
      {projects.length === 0 ? (
        <Card className="bg-muted/20 border-border mb-4">
          <CardContent className="p-6 text-center text-muted-foreground">
            No tienes proyectos contratados aún.
          </CardContent>
        </Card>
      ) : (
        projects.map(project => (
          <Card key={project.id} className="mb-4">
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm mb-2">{project.description}</div>
              <div className="text-xs text-muted-foreground mb-2">Tipo: {project.type}</div>
              <div className="text-xs text-muted-foreground">Progreso: {project.funcionalidades?.length || 0} funcionalidades</div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
} 
