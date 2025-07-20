import { useApp } from '@/contexts/AppContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProyectosNuevo() {
  const { user, createProject } = useApp();
  const navigate = useNavigate();
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [tipoSitio, setTipoSitio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [prioridad, setPrioridad] = useState('Media');
  const [adjuntos, setAdjuntos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="bg-background border-border">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Cargando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAdjuntos(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombreProyecto || !tipoSitio || !descripcion || !fechaInicio || !prioridad) {
      toast({ 
        title: 'Error', 
        description: 'Completá todos los campos obligatorios.', 
        variant: 'destructive' 
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Preparar datos del proyecto
      const projectData = {
        name: nombreProyecto,
        type: tipoSitio,
        description: descripcion,
        funcionalidades: [],
        prioridad,
        fechaInicio,
        adjuntos: adjuntos.map(file => ({ 
          name: file.name, 
          size: file.size, 
          type: file.type 
        })),
      };
      
      // Crear proyecto usando el contexto
      await createProject(projectData);
      
      toast({ 
        title: '¡Proyecto creado!', 
        description: 'Tu proyecto fue creado exitosamente.' 
      });
      
      // Limpiar formulario
      setNombreProyecto('');
      setTipoSitio('');
      setDescripcion('');
      setFechaInicio('');
      setPrioridad('Media');
      setAdjuntos([]);
      
      // Redirigir a proyectos
      navigate('/proyectos');
      
    } catch (error: any) {
      console.error('Error creando proyecto:', error);
      
      let errorMessage = 'No se pudo crear el proyecto.';
      
      // Mensajes de error más específicos
      if (error?.code === 'permission-denied') {
        errorMessage = 'No tienes permisos para crear proyectos. Contacta al administrador.';
      } else if (error?.code === 'unavailable') {
        errorMessage = 'Servicio temporalmente no disponible. Intenta nuevamente.';
      } else if (error?.code === 'unauthenticated') {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({ 
        title: 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card className="bg-background border-border">
        <CardHeader>
          <CardTitle>Crear nuevo proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm mb-1">Nombre del proyecto *</label>
              <Input 
                value={nombreProyecto} 
                onChange={e => setNombreProyecto(e.target.value)} 
                placeholder="Ej: Landing para Estudio Jurídico" 
                className="mb-4 p-2 rounded-xl" 
                required 
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm mb-1">Tipo de sitio web *</label>
              <Select value={tipoSitio} onValueChange={setTipoSitio} disabled={loading}>
                <SelectTrigger className="w-full bg-input border-border mb-4 p-2 rounded-xl">
                  <SelectValue placeholder="Seleccioná el tipo de sitio" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="Landing page">Landing page</SelectItem>
                  <SelectItem value="Sitio institucional">Sitio institucional</SelectItem>
                  <SelectItem value="Ecommerce">Ecommerce</SelectItem>
                  <SelectItem value="Blog">Blog</SelectItem>
                  <SelectItem value="Portfolio">Portfolio</SelectItem>
                  <SelectItem value="Web App">Web App</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Descripción o requerimientos iniciales *</label>
              <Textarea 
                value={descripcion} 
                onChange={e => setDescripcion(e.target.value)} 
                placeholder="Detallá lo que querés: colores, secciones, referencias, etc." 
                className="mb-4 p-2 rounded-xl min-h-[120px]" 
                required 
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm mb-1">Fecha de inicio estimada *</label>
              <Input 
                type="date" 
                value={fechaInicio} 
                onChange={e => setFechaInicio(e.target.value)} 
                className="mb-4 p-2 rounded-xl" 
                required 
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm mb-1">Nivel de urgencia o prioridad *</label>
              <Select value={prioridad} onValueChange={setPrioridad} disabled={loading}>
                <SelectTrigger className="w-full bg-input border-border mb-4 p-2 rounded-xl">
                  <SelectValue placeholder="Seleccioná la prioridad" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Adjuntar archivos (opcional)</label>
              <Input 
                type="file" 
                multiple 
                onChange={handleFileChange} 
                className="mb-4 p-2 rounded-xl" 
                disabled={loading}
              />
              {adjuntos.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Archivos seleccionados: {adjuntos.map(f => f.name).join(', ')}
                  </p>
                </div>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700" 
              disabled={loading}
            >
              {loading ? 'Creando proyecto...' : 'Crear proyecto'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 