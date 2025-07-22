import { useApp } from '@/contexts/AppContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, FileText, Calendar, UploadCloud, AlertCircle, Info, Star, Trash2 } from 'lucide-react';
import { useRef } from 'react';

export default function ProyectosNuevoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, createProject } = useApp();
  const navigate = useNavigate();
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [tipoSitio, setTipoSitio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [prioridad, setPrioridad] = useState('Media');
  const [adjuntos, setAdjuntos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const steps = [
    { label: 'Datos', icon: FileText },
    { label: 'Fechas', icon: Calendar },
    { label: 'Archivos', icon: UploadCloud },
  ];
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [dragActive, setDragActive] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (adjuntos.length > 0) {
      Promise.all(adjuntos.map(file => {
        if (file.type.startsWith('image/')) {
          return new Promise<string>(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        } else {
          return Promise.resolve('');
        }
      })).then(setPreviews);
    } else {
      setPreviews([]);
      setPreviewIndex(0);
    }
  }, [adjuntos]);

  const handlePrevPreview = () => setPreviewIndex(i => (i === 0 ? previews.length - 1 : i - 1));
  const handleNextPreview = () => setPreviewIndex(i => (i === previews.length - 1 ? 0 : i + 1));

  const handleRemoveFile = (index: number) => {
    setAdjuntos(prev => prev.filter((_, i) => i !== index));
    setPreviewIndex(i => {
      if (index === 0) return 0;
      if (i >= index && i > 0) return i - 1;
      return i;
    });
  };

  if (!user) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAdjuntos(Array.from(e.target.files));
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setAdjuntos(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
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

  // Validaciones por campo
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!nombreProyecto) newErrors.nombreProyecto = 'El nombre es obligatorio';
    if (!tipoSitio) newErrors.tipoSitio = 'Seleccioná el tipo de sitio';
    if (!descripcion) newErrors.descripcion = 'La descripción es obligatoria';
    if (!fechaInicio) newErrors.fechaInicio = 'La fecha es obligatoria';
    if (!prioridad) newErrors.prioridad = 'Seleccioná la prioridad';
    setErrors(newErrors);
    return newErrors;
  };

  const isStepValid = () => {
    const newErrors = validate();
    if (step === 0) return !newErrors.nombreProyecto && !newErrors.tipoSitio && !newErrors.descripcion;
    if (step === 1) return !newErrors.fechaInicio && !newErrors.prioridad;
    return true;
  };
  const handleNext = () => { if (isStepValid()) setStep(s => s + 1); else toast({ title: 'Completa los campos obligatorios', variant: 'destructive' }); };
  const handlePrev = () => setStep(s => s - 1);

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
          <DialogContent
            className="max-w-lg w-full p-0 bg-white/10 backdrop-blur-xl border-4 border-transparent shadow-2xl rounded-2xl animate-in fade-in-0 zoom-in-95 relative flex items-center justify-center min-h-[60vh] sm:min-h-[60vh] md:min-h-[60vh]"
            style={{
              boxShadow: '0 8px 40px 0 rgba(80, 63, 205, 0.25), 0 1.5px 8px 0 rgba(80, 63, 205, 0.10)',
              borderImage: 'linear-gradient(90deg, #6366f1 0%, #a21caf 100%) 1',
              background: 'linear-gradient(120deg, rgba(30,34,54,0.85) 60%, rgba(99,102,241,0.12) 100%)',
              backdropFilter: 'blur(18px) saturate(1.2)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="w-full flex flex-col items-center justify-center px-2 sm:px-6 py-4"
            >
              <DialogHeader className="w-full flex flex-col items-center justify-center">
                <DialogTitle className="text-center w-full">Crear nuevo proyecto</DialogTitle>
                <DialogDescription className="text-center w-full">Completá los datos para tu nuevo proyecto</DialogDescription>
              </DialogHeader>
              {/* Stepper visual */}
              <div className="flex items-center justify-center gap-4 mb-8 mt-2 w-full">
                {steps.map((s, i) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all duration-300
                      ${i < step ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-purple-600 text-white' : ''}
                      ${i === step ? 'bg-gradient-to-r from-blue-500 to-fuchsia-600 border-fuchsia-600 text-white scale-110 shadow-lg' : 'bg-background border-zinc-400 text-zinc-400'}
                    `}>
                      {i < step ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`w-8 h-1 rounded-full ${i < step ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-zinc-300/40'}`}></div>
                    )}
                  </div>
                ))}
              </div>
              <CardContent className="w-full max-w-md mx-auto p-2 sm:p-6 bg-transparent flex flex-col items-center justify-center">
                <form className="space-y-4 w-full" onSubmit={handleSubmit} autoComplete="off">
                  <AnimatePresence mode="wait">
                    {step === 0 && (
                      <motion.div key="step1" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.3 }}>
                        {/* Nombre del proyecto */}
                        <div className="relative mb-2">
                          <label className="block text-sm mb-1">Nombre del proyecto *</label>
                          <div className="relative">
                            <Input
                              value={nombreProyecto}
                              onChange={e => setNombreProyecto(e.target.value)}
                              onBlur={() => setTouched(t => ({ ...t, nombreProyecto: true }))}
                              placeholder="Ej: Landing para Estudio Jurídico"
                              className={`mb-0 p-2 rounded-xl pl-10 ${touched.nombreProyecto && (errors.nombreProyecto ? 'border-red-500 focus:border-red-500' : 'border-green-500 focus:border-green-500')}`}
                              required
                              disabled={loading}
                            />
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                          </div>
                          {touched.nombreProyecto && errors.nombreProyecto && (
                            <div className="flex items-center gap-1 text-xs text-red-500 mt-1"><AlertCircle className="w-4 h-4" />{errors.nombreProyecto}</div>
                          )}
                        </div>
                        {/* Tipo de sitio */}
                        <div className="relative mb-2">
                          <label className="block text-sm mb-1">Tipo de sitio web *</label>
                          <div className="relative">
                            <Select value={tipoSitio} onValueChange={v => { setTipoSitio(v); setTouched(t => ({ ...t, tipoSitio: true })); }} disabled={loading}>
                              <SelectTrigger className={`w-full bg-input border-border mb-0 p-2 rounded-xl pl-10 ${touched.tipoSitio && (errors.tipoSitio ? 'border-red-500 focus:border-red-500' : 'border-green-500 focus:border-green-500')}`}>
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
                            <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                          </div>
                          {touched.tipoSitio && errors.tipoSitio && (
                            <div className="flex items-center gap-1 text-xs text-red-500 mt-1"><AlertCircle className="w-4 h-4" />{errors.tipoSitio}</div>
                          )}
                        </div>
                        {/* Descripción */}
                        <div className="relative mb-2">
                          <label className="block text-sm mb-1">Descripción o requerimientos iniciales *</label>
                          <div className="relative">
                            <Textarea
                              value={descripcion}
                              onChange={e => setDescripcion(e.target.value)}
                              onBlur={() => setTouched(t => ({ ...t, descripcion: true }))}
                              placeholder="Detallá lo que querés: colores, secciones, referencias, etc."
                              className={`mb-0 p-2 rounded-xl pl-10 min-h-[120px] ${touched.descripcion && (errors.descripcion ? 'border-red-500 focus:border-red-500' : 'border-green-500 focus:border-green-500')}`}
                              required
                              disabled={loading}
                            />
                            <Info className="absolute left-3 top-3 w-5 h-5 text-zinc-400 pointer-events-none" />
                          </div>
                          {touched.descripcion && errors.descripcion && (
                            <div className="flex items-center gap-1 text-xs text-red-500 mt-1"><AlertCircle className="w-4 h-4" />{errors.descripcion}</div>
                          )}
                        </div>
                      </motion.div>
                    )}
                    {step === 1 && (
                      <motion.div key="step2" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.3 }}>
                        {/* Fecha de inicio */}
                        <div className="relative mb-2">
                          <label className="block text-sm mb-1">Fecha de inicio estimada *</label>
                          <div className="relative">
                            <Input
                              type="date"
                              value={fechaInicio}
                              onChange={e => setFechaInicio(e.target.value)}
                              onBlur={() => setTouched(t => ({ ...t, fechaInicio: true }))}
                              className={`mb-0 p-2 rounded-xl pl-10 ${touched.fechaInicio && (errors.fechaInicio ? 'border-red-500 focus:border-red-500' : 'border-green-500 focus:border-green-500')}`}
                              required
                              disabled={loading}
                            />
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                          </div>
                          {touched.fechaInicio && errors.fechaInicio && (
                            <div className="flex items-center gap-1 text-xs text-red-500 mt-1"><AlertCircle className="w-4 h-4" />{errors.fechaInicio}</div>
                          )}
                        </div>
                        {/* Prioridad */}
                        <div className="relative mb-2">
                          <label className="block text-sm mb-1">Nivel de urgencia o prioridad *</label>
                          <div className="relative">
                            <Select value={prioridad} onValueChange={v => { setPrioridad(v); setTouched(t => ({ ...t, prioridad: true })); }} disabled={loading}>
                              <SelectTrigger className={`w-full bg-input border-border mb-0 p-2 rounded-xl pl-10 ${touched.prioridad && (errors.prioridad ? 'border-red-500 focus:border-red-500' : 'border-green-500 focus:border-green-500')}`}>
                                <SelectValue placeholder="Seleccioná la prioridad" />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border-border">
                                <SelectItem value="Alta">Alta</SelectItem>
                                <SelectItem value="Media">Media</SelectItem>
                                <SelectItem value="Baja">Baja</SelectItem>
                              </SelectContent>
                            </Select>
                            <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                          </div>
                          {touched.prioridad && errors.prioridad && (
                            <div className="flex items-center gap-1 text-xs text-red-500 mt-1"><AlertCircle className="w-4 h-4" />{errors.prioridad}</div>
                          )}
                        </div>
                      </motion.div>
                    )}
                    {step === 2 && (
                      <motion.div key="step3" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.3 }}>
                        {/* Adjuntar archivos con drag & drop */}
                        <div className="relative mb-2">
                          <label className="block text-sm mb-1">Adjuntar archivos (opcional)</label>
                          <div
                            ref={dropRef}
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer p-6 mb-2
                              ${dragActive ? 'border-blue-500 bg-blue-500/10 shadow-lg scale-105' : 'border-zinc-400 bg-zinc-900/40'}`}
                          >
                            <UploadCloud className={`w-10 h-10 mb-2 transition-transform duration-300 ${dragActive ? 'text-blue-500 scale-125 animate-bounce' : 'text-zinc-400'}`} />
                            <span className="text-sm text-zinc-300 mb-1">Arrastrá y soltá archivos aquí</span>
                            <span className="text-xs text-zinc-500">o haz clic para seleccionar</span>
                            <input
                              type="file"
                              multiple
                              onChange={handleFileChange}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              disabled={loading}
                              tabIndex={-1}
                            />
                          </div>
                          {/* Preview de archivos subidos */}
                          {adjuntos.length > 0 && (
                            <div className="mb-4 mt-2 w-full flex flex-col items-center">
                              <div className="w-full flex items-center justify-center gap-2">
                                {adjuntos.length > 1 && (
                                  <button type="button" onClick={handlePrevPreview} className="p-1 rounded-full bg-zinc-800 hover:bg-blue-600 transition-colors">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                                  </button>
                                )}
                                <div className="w-32 h-32 flex items-center justify-center bg-zinc-900/60 rounded-xl border border-zinc-700 overflow-hidden relative group">
                                  {previews[previewIndex] ? (
                                    <img src={previews[previewIndex]} alt={adjuntos[previewIndex].name} className="object-contain w-full h-full transition-all duration-300" />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center w-full h-full text-zinc-400">
                                      <FileText className="w-10 h-10 mb-2" />
                                      <span className="text-xs">{adjuntos[previewIndex].type.split('/')[1]?.toUpperCase() || 'ARCHIVO'}</span>
                                    </div>
                                  )}
                                  <span className="absolute bottom-1 left-1 bg-zinc-800/80 text-xs px-2 py-0.5 rounded text-white max-w-[90%] truncate">{adjuntos[previewIndex].name}</span>
                                  {/* Botón eliminar archivo */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFile(previewIndex)}
                                    className="absolute top-1 right-1 p-1 rounded-full bg-red-600/80 hover:bg-red-700 text-white opacity-80 hover:opacity-100 transition-all shadow-lg group-hover:scale-110"
                                    title="Eliminar archivo"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                {adjuntos.length > 1 && (
                                  <button type="button" onClick={handleNextPreview} className="p-1 rounded-full bg-zinc-800 hover:bg-blue-600 transition-colors">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                                  </button>
                                )}
                              </div>
                              <div className="text-xs text-zinc-400 mt-2">
                                {adjuntos[previewIndex]?.name} &middot; {adjuntos[previewIndex] ? (adjuntos[previewIndex].size / 1024).toFixed(1) : 0} KB
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Resumen visual final */}
                        <div className="bg-gradient-to-r from-blue-500/10 to-fuchsia-600/10 border border-blue-500/10 rounded-xl p-4 mb-4">
                          <h4 className="font-semibold mb-4 text-blue-600 text-lg flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-400 animate-pulse" /> Resumen final
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-blue-400" />
                              <span className="font-medium">Nombre:</span>
                              <span className="truncate">{nombreProyecto}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="w-5 h-5 text-yellow-400" />
                              <span className="font-medium">Tipo:</span>
                              <span>{tipoSitio}</span>
                            </div>
                            <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
                              <Info className="w-5 h-5 text-cyan-400" />
                              <span className="font-medium">Descripción:</span>
                              <span className="truncate">{descripcion}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-purple-400" />
                              <span className="font-medium">Fecha inicio:</span>
                              <span>{fechaInicio}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-5 h-5 text-pink-400" />
                              <span className="font-medium">Prioridad:</span>
                              <span>{prioridad}</span>
                            </div>
                            <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
                              <UploadCloud className="w-5 h-5 text-fuchsia-400" />
                              <span className="font-medium">Archivos:</span>
                              <span>{adjuntos.length > 0 ? adjuntos.map(f => f.name).join(', ') : 'Ninguno'}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex gap-2 pt-2">
                    {step > 0 && (
                      <Button type="button" variant="outline" className="flex-1" onClick={handlePrev} disabled={loading}>Anterior</Button>
                    )}
                    {step < 2 && (
                      <Button type="button" className="flex-1 bg-gradient-to-r from-blue-500 via-purple-600 to-fuchsia-600 hover:from-blue-600 hover:to-fuchsia-700 shadow-xl" onClick={handleNext} disabled={loading}>Siguiente</Button>
                    )}
                    {step === 2 && (
                      <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 via-purple-600 to-fuchsia-600 hover:from-blue-600 hover:to-fuchsia-700 shadow-xl" disabled={loading}>{loading ? 'Creando proyecto...' : 'Confirmar y crear'}</Button>
                    )}
                    <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={loading}>Cancelar</Button>
                  </div>
                </form>
              </CardContent>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
} 