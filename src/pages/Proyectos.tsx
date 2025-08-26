import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Proyectos() {
  const { projects } = useApp();
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
