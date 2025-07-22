import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, query, where, deleteDoc, addDoc, serverTimestamp, getDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Eye, MessageSquare, Plus, Trash2, Download, FileText, Users, TrendingUp, Edit, Shield, Settings, Activity, Database, HardDrive, Cpu, Bell, Upload, CheckCircle, Search, Send } from 'lucide-react';
import { 
  AdminNotificationSystem, 
  AdminAnalytics, 
  AdminSystemLogs, 
  AdminBackupSystem, 
  AdminResourceMonitor, 
  AdminSettings,
  AdminControlPanel,
  AdminReportsSystem,
  AdminSecuritySystem,
  AdminPerformanceSystem
} from '@/components/AdminAdvancedFeatures';
import { initializeChatData, initializeCommentsData, initializeTasksData, initializeAdminSystemData, cleanSimulatedData } from '@/utils/initializeData';
import AdvancedTools from '@/components/admin/AdvancedTools';
import AdvancedAnalytics from '@/components/admin/AdvancedAnalytics';
import SecurityAudit from '@/components/admin/SecurityAudit';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useApp } from '@/contexts/AppContext';
import VerDetallesProyecto from '@/components/VerDetallesProyecto';
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function Admin() {
  const { user, addCommentToPhase } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comentario, setComentario] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [pagos, setPagos] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    
    // Detectar sección activa desde hash al cargar
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setActiveSection(hash);
    } else {
      setActiveSection('dashboard');
    }
    
    // Escuchar cambios en el hash
    const handleHashChange = () => {
      const newHash = window.location.hash.replace('#', '');
      if (newHash) {
        setActiveSection(newHash);
      } else {
        setActiveSection('dashboard');
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    setLoading(true);
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar usuarios reales
        const usersSnap = await getDocs(collection(firestore, 'users'));
        const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsuarios(usersData);
        
        // Cargar proyectos reales
        const projectsSnap = await getDocs(collection(firestore, 'projects'));
        const projectsData = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProyectos(projectsData);
        
        // Cargar tickets reales (solo si existen)
        const ticketsSnap = await getDocs(collection(firestore, 'tickets'));
        const ticketsData = ticketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filtrar tickets que no sean simulados
        const realTickets = ticketsData.filter(ticket => {
          const t = ticket as any;
          return t.userEmail &&
            !t.userEmail.includes('ejemplo.com') &&
            t.createdAt &&
            new Date(t.createdAt).toString() !== 'Invalid Date';
        });
        setTickets(realTickets);
        
        // Cargar pagos reales (solo si existen)
        const pagosSnap = await getDocs(collection(firestore, 'pagos'));
        const pagosData = pagosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filtrar pagos que no sean simulados
        const realPagos = pagosData.filter(pago => {
          const p = pago as any;
          return p.userEmail &&
            !p.userEmail.includes('ejemplo.com') &&
            p.fecha &&
            new Date(p.fecha).toString() !== 'Invalid Date';
        });
        setPagos(realPagos);
        
      } catch (error) {
        console.error('Error loading admin data:', error);
        // En caso de error, establecer arrays vacíos
        setUsuarios([]);
        setProyectos([]);
        setTickets([]);
        setPagos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [user, navigate]);

  // Función para navegar entre secciones
  const navigateToSection = (section: string) => {
    setActiveSection(section);
    if (section === 'dashboard') {
      window.location.hash = '';
    } else {
      window.location.hash = section;
    }
  };

  // MÉTRICAS
  const usuariosActivos = usuarios.length;
  const proyectosEnCurso = proyectos.filter(p => (p.fases || []).some((f: any) => f.estado !== 'Terminado')).length;
  const ingresosTotales = pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
  const ticketsAbiertos = tickets.filter(t => t.estado !== 'cerrado').length;
  const ticketsCerrados = tickets.filter(t => t.estado === 'cerrado').length;

  // GRÁFICOS DE CRECIMIENTO
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleString('es-ES', { month: 'short' });
  });
  function contarPorMes(arr: any[], campoFecha: string) {
    const counts = Array(6).fill(0);
    arr.forEach(item => {
      const fecha = item[campoFecha] ? new Date(item[campoFecha]) : null;
      if (!fecha) return;
      const now = new Date();
      for (let i = 0; i < 6; i++) {
        const mes = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        if (fecha.getFullYear() === mes.getFullYear() && fecha.getMonth() === mes.getMonth()) {
          counts[i]++;
        }
      }
    });
    return counts;
  }
  const usuariosPorMes = contarPorMes(usuarios, 'createdAt');
  const proyectosPorMes = contarPorMes(proyectos, 'createdAt');
  const pagosPorMes = contarPorMes(pagos, 'fecha');

  const handleEstadoChange = async (projectId: string, faseKey: string, estado: string) => {
    const proyecto = proyectos.find(p => p.id === projectId);
    if (!proyecto) return;
    const nuevasFases = (proyecto.fases || []).map((f: any) => f.key === faseKey ? { ...f, estado } : f);
    await updateDoc(doc(firestore, 'projects', projectId), { fases: nuevasFases });
    toast({ title: 'Estado actualizado', description: 'El estado de la fase fue actualizado.' });
    setProyectos(prev => prev.map(p => p.id === projectId ? { ...p, fases: nuevasFases } : p));
  };

  const handleAddComment = async (projectId: string, faseKey: string) => {
    if (!comentario.trim()) return;
    
    try {
      await addCommentToPhase(projectId, faseKey, {
        texto: comentario,
        autor: 'Admin',
        tipo: 'admin'
      });
      
      setComentario('');
      toast({ title: 'Comentario agregado', description: 'El comentario fue guardado correctamente.' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo agregar el comentario.', variant: 'destructive' });
    }
  };

  // Función para inicializar fases en proyectos que no las tengan
  const initializeProjectPhases = async (projectId: string) => {
    try {
      const proyecto = proyectos.find(p => p.id === projectId);
      if (!proyecto || proyecto.fases) return; // Solo si no tiene fases

      const fasesIniciales = [
        {
          key: 'ui',
          estado: 'Pendiente' as const,
          descripcion: 'Diseño de interfaz de usuario',
          fechaEntrega: '',
          archivos: [],
          comentarios: []
        },
        {
          key: 'maquetado',
          estado: 'Pendiente' as const,
          descripcion: 'Maquetado HTML/CSS',
          fechaEntrega: '',
          archivos: [],
          comentarios: []
        },
        {
          key: 'contenido',
          estado: 'Pendiente' as const,
          descripcion: 'Contenido y textos',
          fechaEntrega: '',
          archivos: [],
          comentarios: []
        },
        {
          key: 'funcionalidades',
          estado: 'Pendiente' as const,
          descripcion: 'Desarrollo de funcionalidades',
          fechaEntrega: '',
          archivos: [],
          comentarios: []
        },
        {
          key: 'seo',
          estado: 'Pendiente' as const,
          descripcion: 'Optimización SEO',
          fechaEntrega: '',
          archivos: [],
          comentarios: []
        },
        {
          key: 'deploy',
          estado: 'Pendiente' as const,
          descripcion: 'Despliegue final',
          fechaEntrega: '',
          archivos: [],
          comentarios: []
        }
      ];

      await updateDoc(doc(firestore, 'projects', projectId), { 
        fases: fasesIniciales,
        updatedAt: serverTimestamp()
      });
      
      toast({ title: 'Fases inicializadas', description: 'Se han creado las fases básicas del proyecto.' });
      
      // Recargar proyectos
      const projectsSnap = await getDocs(collection(firestore, 'projects'));
      setProyectos(projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron inicializar las fases.', variant: 'destructive' });
    }
  };

  // Funciones para gestión de usuarios
  const handleEditUser = async (userId: string, updates: any) => {
    try {
      await updateDoc(doc(firestore, 'users', userId), updates);
      toast({ title: 'Usuario actualizado', description: 'Los datos del usuario fueron actualizados.' });
      // Recargar usuarios
      const usersSnap = await getDocs(collection(firestore, 'users'));
      setUsuarios(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el usuario.', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        await deleteDoc(doc(firestore, 'users', userId));
        toast({ title: 'Usuario eliminado', description: 'El usuario fue eliminado correctamente.' });
        setUsuarios(prev => prev.filter(u => u.id !== userId));
      } catch (error) {
        toast({ title: 'Error', description: 'No se pudo eliminar el usuario.', variant: 'destructive' });
      }
    }
  };

  // Funciones para gestión de tickets
  const handleRespondTicket = async (ticketId: string, respuesta: string) => {
    try {
      await updateDoc(doc(firestore, 'tickets', ticketId), { 
        respuesta,
        respondidoPor: user?.email,
        fechaRespuesta: new Date().toISOString(),
        estado: 'respondido'
      });
      toast({ title: 'Respuesta enviada', description: 'La respuesta fue guardada.' });
      // Recargar tickets
      const ticketsSnap = await getDocs(collection(firestore, 'tickets'));
      setTickets(ticketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo enviar la respuesta.', variant: 'destructive' });
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      await updateDoc(doc(firestore, 'tickets', ticketId), { 
        estado: 'cerrado',
        fechaCierre: new Date().toISOString(),
        cerradoPor: user?.email
      });
      toast({ title: 'Ticket cerrado', description: 'El ticket fue cerrado correctamente.' });
      // Recargar tickets
      const ticketsSnap = await getDocs(collection(firestore, 'tickets'));
      setTickets(ticketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo cerrar el ticket.', variant: 'destructive' });
    }
  };

  // Funciones para gestión de pagos
  const handleDownloadInvoice = async (pagoId: string) => {
    try {
      // Simular descarga de factura (en producción, generar PDF real)
      const pago = pagos.find(p => p.id === pagoId);
      if (pago) {
        const invoiceData = {
          numero: `INV-${pagoId}`,
          fecha: pago.fecha,
          cliente: pago.clienteEmail,
          monto: pago.monto,
          concepto: pago.concepto || 'Servicio web'
        };
        
        // Crear contenido de factura
        const invoiceContent = `
          FACTURA
          Número: ${invoiceData.numero}
          Fecha: ${invoiceData.fecha}
          Cliente: ${invoiceData.cliente}
          Monto: $${invoiceData.monto}
          Concepto: ${invoiceData.concepto}
        `;
        
        // Simular descarga
        const blob = new Blob([invoiceContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factura-${pagoId}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast({ title: 'Factura descargada', description: 'La factura fue descargada correctamente.' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo descargar la factura.', variant: 'destructive' });
    }
  };

  // Funciones mejoradas para gestión de proyectos
  const handleComentario = async (projectId: string, faseKey: string) => {
    if (!comentario.trim()) return;
    
    const proyecto = proyectos.find(p => p.id === projectId);
    if (!proyecto) return;
    
    try {
      const nuevoComentario = {
        texto: comentario,
        autor: user?.email,
        fecha: new Date().toISOString(),
        tipo: 'admin'
      };
      
      const nuevasFases = (proyecto.fases || []).map((f: any) => 
        f.key === faseKey ? { 
          ...f, 
          comentarios: [...(f.comentarios || []), nuevoComentario] 
        } : f
      );
      
      await updateDoc(doc(firestore, 'projects', projectId), { fases: nuevasFases });
      toast({ title: 'Comentario agregado', description: 'El comentario fue guardado.' });
      setComentario('');
      setProyectos(prev => prev.map(p => p.id === projectId ? { ...p, fases: nuevasFases } : p));
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo agregar el comentario.', variant: 'destructive' });
    }
  };

  const handleArchivo = async (projectId: string, faseKey: string) => {
    if (!archivo) return;
    
    const proyecto = proyectos.find(p => p.id === projectId);
    if (!proyecto) return;
    
    try {
      // Simular subida de archivo (en producción, usar Firebase Storage)
      const archivoData = {
        url: URL.createObjectURL(archivo),
        name: archivo.name,
        size: archivo.size,
        tipo: archivo.type,
        subidoPor: user?.email,
        fecha: new Date().toISOString()
      };
      
      const nuevasFases = (proyecto.fases || []).map((f: any) => 
        f.key === faseKey ? { 
          ...f, 
          archivos: [...(f.archivos || []), archivoData] 
        } : f
      );
      
      await updateDoc(doc(firestore, 'projects', projectId), { fases: nuevasFases });
      toast({ title: 'Archivo subido', description: 'El archivo fue agregado a la fase.' });
      setArchivo(null);
      setProyectos(prev => prev.map(p => p.id === projectId ? { ...p, fases: nuevasFases } : p));
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo subir el archivo.', variant: 'destructive' });
    }
  };

  // Función para agregar nueva fase
  const addNewPhase = async (projectId: string, newPhase: any) => {
    try {
      const proyecto = proyectos.find(p => p.id === projectId);
      if (!proyecto) return;

      const nuevaFase = {
        key: newPhase.key,
        estado: 'Pendiente' as const,
        descripcion: newPhase.descripcion,
        fechaEntrega: newPhase.fechaEntrega,
        archivos: [],
        comentarios: []
      };

      const nuevasFases = [...(proyecto.fases || []), nuevaFase];
      
      await updateDoc(doc(firestore, 'projects', projectId), { 
        fases: nuevasFases,
        updatedAt: serverTimestamp()
      });
      
      toast({ title: 'Fase agregada', description: 'La nueva fase fue creada correctamente.' });
      setProyectos(prev => prev.map(p => p.id === projectId ? { ...p, fases: nuevasFases } : p));
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo agregar la fase.', variant: 'destructive' });
    }
  };

  // Función para eliminar fase
  const deletePhase = async (projectId: string, faseKey: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta fase?')) return;
    
    try {
      const proyecto = proyectos.find(p => p.id === projectId);
      if (!proyecto) return;

      const nuevasFases = (proyecto.fases || []).filter((f: any) => f.key !== faseKey);
      
      await updateDoc(doc(firestore, 'projects', projectId), { 
        fases: nuevasFases,
        updatedAt: serverTimestamp()
      });
      
      toast({ title: 'Fase eliminada', description: 'La fase fue eliminada correctamente.' });
      setProyectos(prev => prev.map(p => p.id === projectId ? { ...p, fases: nuevasFases } : p));
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar la fase.', variant: 'destructive' });
    }
  };

  // Función para actualizar fecha de entrega
  const handleUpdateDeliveryDate = async (projectId: string, faseKey: string, fecha: string) => {
    try {
      const proyecto = proyectos.find(p => p.id === projectId);
      if (!proyecto) return;

      const nuevasFases = (proyecto.fases || []).map((f: any) => 
        f.key === faseKey ? { ...f, fechaEntrega: fecha } : f
      );
      
      await updateDoc(doc(firestore, 'projects', projectId), { 
        fases: nuevasFases,
        updatedAt: serverTimestamp()
      });
      
      toast({ title: 'Fecha actualizada', description: 'La fecha de entrega fue actualizada.' });
      setProyectos(prev => prev.map(p => p.id === projectId ? { ...p, fases: nuevasFases } : p));
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar la fecha.', variant: 'destructive' });
    }
  };

  // Función para marcar pago como completado
  const handleMarkPaymentComplete = async (pagoId: string) => {
    try {
      await updateDoc(doc(firestore, 'pagos', pagoId), { 
        estado: 'completado',
        fechaCompletado: new Date().toISOString(),
        completadoPor: user?.email
      });
      
      toast({ title: 'Pago marcado como completado', description: 'El estado del pago fue actualizado.' });
      
      // Recargar pagos
      const pagosSnap = await getDocs(collection(firestore, 'pagos'));
      setPagos(pagosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el pago.', variant: 'destructive' });
    }
  };

  // Renderizar sección activa
  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection usuarios={usuarios} proyectos={proyectos} pagos={pagos} tickets={tickets} />;
      case 'usuarios':
        return <UsuariosSection usuarios={usuarios} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} />;
      case 'proyectos':
        return <ProyectosSection 
          proyectos={proyectos} 
          onEstadoChange={handleEstadoChange} 
          onComentario={handleAddComment} 
          onArchivo={handleArchivo}
          addCommentToPhase={addCommentToPhase}
          initializePhases={initializeProjectPhases}
          handleAddPhase={addNewPhase}
          handleDeletePhase={deletePhase}
          handleUpdateDeliveryDate={handleUpdateDeliveryDate}
          navigate={navigate}
        />;
      case 'tickets':
        return <TicketsSection tickets={tickets} onRespond={handleRespondTicket} onClose={handleCloseTicket} />;
      case 'pagos':
        return <PagosSection pagos={pagos} onDownloadInvoice={handleDownloadInvoice} onMarkComplete={handleMarkPaymentComplete} />;
      case 'notifications':
        return <AdminNotificationSystem />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'logs':
        return <AdminSystemLogs />;
      case 'backup':
        return <AdminBackupSystem />;
      case 'settings':
        return <AdminSettings />;
      case 'metricas':
        return <MetricasSection usuarios={usuarios} proyectos={proyectos} pagos={pagos} tickets={tickets} />;
      case 'reports':
        return <AdminReportsSystem />;
      case 'security':
        return <AdminSecuritySystem />;
      case 'performance':
        return <AdminPerformanceSystem />;
      case 'tools':
        return <AdvancedTools />;
      case 'advanced-analytics':
        return <AdvancedAnalytics />;
      case 'security-audit':
        return <SecurityAudit />;
      default:
        return <DashboardSection usuarios={usuarios} proyectos={proyectos} pagos={pagos} tickets={tickets} />;
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-400 text-transparent bg-clip-text">Panel de Administración</h1>
        <span className="ml-2 px-2 py-0.5 rounded bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold uppercase">ADMIN</span>
        <span className="text-xs text-zinc-400 ml-2">{user?.email}</span>
      </div>

      {renderSection()}
    </div>
  );
}

// Componentes de secciones
function DashboardSection({ usuarios, proyectos, pagos, tickets }: any) {
  const usuariosActivos = usuarios.length;
  const proyectosEnCurso = proyectos.filter((p: any) => (p.fases || []).some((f: any) => f.estado !== 'Terminado')).length;
  const ingresosTotales = pagos.reduce((acc: number, p: any) => acc + (Number(p.monto) || 0), 0);
  const ticketsAbiertos = tickets.filter((t: any) => t.estado !== 'cerrado').length;
  const ticketsCerrados = tickets.filter((t: any) => t.estado === 'cerrado').length;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="rounded-xl shadow-lg p-6 bg-gradient-to-br from-blue-700 to-purple-700 text-white flex flex-col items-center">
          <span className="text-lg font-semibold">Usuarios activos</span>
          <span className="text-4xl font-bold mt-2">{usuariosActivos}</span>
        </div>
        <div className="rounded-xl shadow-lg p-6 bg-gradient-to-br from-purple-700 to-blue-700 text-white flex flex-col items-center">
          <span className="text-lg font-semibold">Proyectos en curso</span>
          <span className="text-4xl font-bold mt-2">{proyectosEnCurso}</span>
        </div>
        <div className="rounded-xl shadow-lg p-6 bg-gradient-to-br from-blue-600 to-purple-500 text-white flex flex-col items-center">
          <span className="text-lg font-semibold">Ingresos totales</span>
          <span className="text-4xl font-bold mt-2">${ingresosTotales.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</span>
        </div>
        <div className="rounded-xl shadow-lg p-6 bg-gradient-to-br from-purple-600 to-blue-500 text-white flex flex-col items-center">
          <span className="text-lg font-semibold">Tickets abiertos</span>
          <span className="text-4xl font-bold mt-2">{ticketsAbiertos}</span>
          <span className="text-xs mt-1">Cerrados: {ticketsCerrados}</span>
        </div>
      </div>
      <MetricasSection usuarios={usuarios} proyectos={proyectos} pagos={pagos} tickets={tickets} />
    </>
  );
}

function UsuariosSection({ usuarios, onEditUser, onDeleteUser }: any) {
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserInfoPanel, setShowUserInfoPanel] = useState(false);

  const handleEdit = (usuario: any) => {
    setEditingUser(usuario);
    setIsModalOpen(true);
  };

  const handleShowUserInfo = (usuario: any) => {
    setSelectedUser(usuario);
    setShowUserInfoPanel(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    
    try {
      await onEditUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role
      });
      setEditingUser(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error actualizando usuario:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'user': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">Administra usuarios y permisos de la plataforma</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{usuarios.length}</div>
            <div className="text-sm text-muted-foreground">Usuarios totales</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {usuarios.map((usuario: any) => (
          <Card key={usuario.id} className="bg-gradient-card border-border hover:border-primary/30 transition-all cursor-pointer" onClick={() => handleShowUserInfo(usuario)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{usuario.name?.charAt(0) || 'U'}</AvatarFallback>
                  {usuario.photoURL && <AvatarImage src={usuario.photoURL} alt={usuario.name} />}
                </Avatar>
                <div>
                  <CardTitle className="text-lg font-bold">{usuario.name}</CardTitle>
                  <CardDescription className="text-xs">{usuario.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Registrado: {new Date(usuario.createdAt || Date.now()).toLocaleDateString('es-ES')}</span>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>Proyectos: {usuario.projectCount || 0}</span>
                </div>
              </div>
              {usuario.company && <div className="text-xs"><span className="font-semibold">Empresa:</span> {usuario.company}</div>}
              {usuario.position && <div className="text-xs"><span className="font-semibold">Cargo:</span> {usuario.position}</div>}
              {usuario.phone && <div className="text-xs"><span className="font-semibold">Teléfono:</span> {usuario.phone}</div>}
              {usuario.bio && <div className="text-xs"><span className="font-semibold">Bio:</span> {usuario.bio}</div>}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={usuario.role === 'admin' ? 'destructive' : 'secondary'}>{usuario.role || 'user'}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Panel lateral de información del usuario */}
      <AnimatePresence>
        {showUserInfoPanel && selectedUser && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex justify-end md:items-stretch items-end md:items-end"
            style={{ pointerEvents: 'auto' }}
            onClick={() => setShowUserInfoPanel(false)}
          >
            <div
              className="bg-card w-full h-full max-w-sm md:max-w-sm shadow-2xl flex flex-col md:rounded-none rounded-t-2xl md:h-full md:rounded-l-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>{selectedUser.name?.charAt(0) || 'U'}</AvatarFallback>
                    {selectedUser.photoURL && <AvatarImage src={selectedUser.photoURL} alt={selectedUser.name} />}
                  </Avatar>
                  <div>
                    <div className="font-bold text-lg">{selectedUser.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowUserInfoPanel(false)}>
                  ×
                </Button>
              </div>
              <div className="p-4 space-y-2">
                {selectedUser.phone && <div><span className="font-semibold">Teléfono:</span> {selectedUser.phone}</div>}
                {selectedUser.bio && <div><span className="font-semibold">Bio:</span> {selectedUser.bio}</div>}
                {selectedUser.company && <div><span className="font-semibold">Empresa:</span> {selectedUser.company}</div>}
                {selectedUser.position && <div><span className="font-semibold">Cargo:</span> {selectedUser.position}</div>}
                <div><span className="font-semibold">Rol:</span> {selectedUser.role}</div>
                <div><span className="font-semibold">Registrado:</span> {new Date(selectedUser.createdAt || Date.now()).toLocaleDateString('es-ES')}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Modal de edición de usuario */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información del usuario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={editingUser?.name || ''}
                onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={editingUser?.email || ''}
                onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select value={editingUser?.role || 'user'} onValueChange={(value) => setEditingUser(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProyectosSection(props: any) {
  const { proyectos, onEstadoChange, onComentario, onArchivo, addCommentToPhase, initializePhases, handleAddPhase, handleDeletePhase, handleUpdateDeliveryDate, navigate } = props;
  const [comentario, setComentario] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [showDetalles, setShowDetalles] = useState(false);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<any>(null);

  const handleAddComment = async (projectId: string, faseKey: string) => {
    if (!comentario.trim()) return;
    
    try {
      await addCommentToPhase(projectId, faseKey, {
        texto: comentario,
        autor: 'Admin',
        tipo: 'admin'
      });
      
      setComentario('');
      toast({ title: 'Comentario agregado', description: 'El comentario fue guardado correctamente.' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo agregar el comentario.', variant: 'destructive' });
    }
  };

  const addPhaseToProject = async (projectId: string) => {
    const newPhase = {
      key: 'nueva-fase',
      descripcion: 'Descripción de la nueva fase',
      fechaEntrega: ''
    };
    await handleAddPhase(projectId, newPhase);
  };

  const deletePhaseFromProject = async (projectId: string, faseKey: string) => {
    await handleDeletePhase(projectId, faseKey);
  };

  const handleFileUpload = async (projectId: string, faseKey: string) => {
    if (!archivo) return;
    await onArchivo(projectId, faseKey);
  };

  const handleDeliveryDateChange = async (projectId: string, faseKey: string, fecha: string) => {
    await handleUpdateDeliveryDate(projectId, faseKey, fecha);
  };

  const handleViewProject = (proyecto: any) => {
    setProyectoSeleccionado(proyecto);
    setShowDetalles(true);
  };
  const handleEditarProyecto = () => {
    if (proyectoSeleccionado) navigate(`/proyectos/${proyectoSeleccionado.id}`);
  };
  const handleColaborarProyecto = () => {
    if (proyectoSeleccionado) navigate(`/proyectos/${proyectoSeleccionado.id}/colaboracion`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Proyectos</h2>
          <p className="text-muted-foreground">Administra y supervisa todos los proyectos</p>
        </div>
        <div className="flex items-center gap-4 mt-2 md:mt-0">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{proyectos.length}</div>
            <div className="text-sm text-muted-foreground">Proyectos totales</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {proyectos.map((proyecto: any) => (
          <Card key={proyecto.id} className="bg-gradient-card border-border w-full overflow-x-auto">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-0 w-full">
                <div>
                  <CardTitle className="text-xl">{proyecto.name}</CardTitle>
                  <p className="text-muted-foreground">{proyecto.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{proyecto.type}</Badge>
                    <Badge variant="outline">{proyecto.ownerEmail}</Badge>
                  </div>
                </div>
                <div className="text-right mt-2 md:mt-0 min-w-0 break-words flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    Creado: {new Date(proyecto.createdAt || Date.now()).toLocaleDateString('es-ES')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Actualizado: {new Date(proyecto.updatedAt || Date.now()).toLocaleDateString('es-ES')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 mt-2"
                    onClick={() => handleColaborarProyecto()}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Colaborar
                  </Button>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => handleViewProject(proyecto)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver detalles
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => navigate(`/proyectos/${proyecto.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Fases del proyecto */}
                <div>
                  <h3 className="font-semibold mb-3">Fases del Proyecto</h3>
                  <div className="space-y-3">
                    {(proyecto.fases || []).map((fase: any) => (
                      <div key={fase.key} className="p-4 border rounded-lg w-full overflow-x-auto">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-medium">{fase.descripcion}</h4>
                            <p className="text-sm text-muted-foreground">Clave: {fase.key}</p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                            <Select value={fase.estado} onValueChange={(value) => onEstadoChange(proyecto.id, fase.key, value)}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                <SelectItem value="En Progreso">En Progreso</SelectItem>
                                <SelectItem value="Terminado">Terminado</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePhaseFromProject(proyecto.id, fase.key)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Fecha de entrega */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3 w-full">
                          <span className="text-sm">Fecha de entrega:</span>
                          <Input
                            type="date"
                            value={fase.fechaEntrega || ''}
                            onChange={(e) => handleDeliveryDateChange(proyecto.id, fase.key, e.target.value)}
                            className="w-full sm:w-40 min-w-0"
                          />
                        </div>

                        {/* Comentarios */}
                        <div className="space-y-2 w-full">
                          <h5 className="text-sm font-medium">Comentarios</h5>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {(fase.comentarios || []).map((comentario: any, index: number) => (
                              <div key={index} className="p-2 bg-muted rounded text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{comentario.autor}</span>
                                  <span className="text-xs text-muted-foreground">{comentario.fecha}</span>
                                </div>
                                <p>{comentario.texto}</p>
                              </div>
                            ))}
                          </div>
                          
                          {/* Agregar comentario */}
                          <div className="flex flex-col sm:flex-row gap-2 w-full">
                            <Input
                              placeholder="Agregar comentario..."
                              value={comentario}
                              onChange={(e) => setComentario(e.target.value)}
                              className="flex-1 min-w-0"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAddComment(proyecto.id, fase.key)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Archivos */}
                        <div className="mt-3 w-full">
                          <h5 className="text-sm font-medium mb-2">Archivos</h5>
                          <div className="space-y-2 w-full">
                            {(fase.archivos || []).map((archivo: any, index: number) => (
                              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 bg-muted rounded w-full overflow-x-auto">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">{archivo.name}</span>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          
                          {/* Subir archivo */}
                          <div className="flex gap-2 mt-2">
                            <Input
                              type="file"
                              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleFileUpload(proyecto.id, fase.key)}
                              disabled={!archivo}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Botón para agregar fase */}
                  <Button
                    variant="outline"
                    onClick={() => addPhaseToProject(proyecto.id)}
                    className="mt-3"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Fase
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <VerDetallesProyecto
        open={showDetalles}
        onOpenChange={setShowDetalles}
        proyecto={proyectoSeleccionado}
        onEditar={handleEditarProyecto}
        onColaborar={handleColaborarProyecto}
      />
    </div>
  );
}

function TicketsSection({ tickets, onRespond, onClose }: any) {
  const [respuesta, setRespuesta] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const handleRespond = async (ticketId: string) => {
    if (!respuesta.trim()) return;
    
    try {
      await onRespond(ticketId, respuesta);
      setRespuesta('');
      setSelectedTicket(null);
      toast({ title: 'Respuesta enviada', description: 'La respuesta fue enviada correctamente.' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo enviar la respuesta.', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'abierto': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'en_revision': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'cerrado': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-500 text-white';
      case 'media': return 'bg-yellow-500 text-white';
      case 'baja': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Tickets</h2>
          <p className="text-muted-foreground">Administra tickets de soporte y solicitudes</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{tickets.length}</div>
            <div className="text-sm text-muted-foreground">Tickets totales</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tickets.map((ticket: any) => (
          <Card key={ticket.id} className="bg-gradient-card border-border hover:border-primary/30 transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{ticket.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getStatusColor(ticket.estado)}>
                      {ticket.estado}
                    </Badge>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <Badge variant="outline">{ticket.category}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  {ticket.estado !== 'cerrado' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onClose(ticket.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Usuario: {ticket.userEmail}</span>
                  <span>Creado: {new Date(ticket.createdAt || Date.now()).toLocaleDateString('es-ES')}</span>
                </div>
                
                {ticket.respuesta && (
                  <div className="p-3 bg-muted rounded text-sm">
                    <div className="font-medium mb-1">Respuesta del Admin:</div>
                    <p>{ticket.respuesta}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal para responder ticket */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder Ticket</DialogTitle>
            <DialogDescription>
              Responde al ticket: {selectedTicket?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="respuesta">Respuesta</Label>
              <Textarea
                id="respuesta"
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Escribe tu respuesta..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                Cancelar
              </Button>
              <Button onClick={() => handleRespond(selectedTicket?.id)}>
                Enviar Respuesta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PagosSection({ pagos, onDownloadInvoice, onMarkComplete }: any) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completado': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pendiente': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'cancelado': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Pagos</h2>
          <p className="text-muted-foreground">Administra pagos y facturación</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{pagos.length}</div>
            <div className="text-sm text-muted-foreground">Pagos totales</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {pagos.map((pago: any) => (
          <Card key={pago.id} className="bg-gradient-card border-border hover:border-primary/30 transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{pago.concepto}</CardTitle>
                  <p className="text-sm text-muted-foreground">{pago.userEmail}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getStatusColor(pago.estado)}>
                      {pago.estado}
                    </Badge>
                    <Badge variant="outline">{pago.metodo}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(pago.monto)}
                  </div>
                  <p className="text-xs text-muted-foreground">{pago.moneda}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Factura: {pago.factura}</span>
                  <span>Fecha: {new Date(pago.fecha || Date.now()).toLocaleDateString('es-ES')}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownloadInvoice(pago.id)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                  {pago.estado === 'pendiente' && (
                    <Button
                      size="sm"
                      onClick={() => onMarkComplete(pago.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Completar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MetricasSection({ usuarios, proyectos, pagos, tickets }: any) {
  function contarPorMes(arr: any[], campoFecha: string) {
    const counts = Array(6).fill(0);
    arr.forEach(item => {
      const fecha = item[campoFecha] ? new Date(item[campoFecha]) : null;
      if (!fecha) return;
      const now = new Date();
      for (let i = 0; i < 6; i++) {
        const mes = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        if (fecha.getFullYear() === mes.getFullYear() && fecha.getMonth() === mes.getMonth()) {
          counts[i]++;
        }
      }
    });
    return counts;
  }

  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleString('es-ES', { month: 'short' });
  });

  const usuariosPorMes = contarPorMes(usuarios, 'createdAt');
  const proyectosPorMes = contarPorMes(proyectos, 'createdAt');
  const pagosPorMes = contarPorMes(pagos, 'fecha');

  const chartData = {
    labels: meses,
    datasets: [
      {
        label: 'Usuarios',
        data: usuariosPorMes,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2
      },
      {
        label: 'Proyectos',
        data: proyectosPorMes,
        backgroundColor: 'rgba(147, 51, 234, 0.5)',
        borderColor: 'rgb(147, 51, 234)',
        borderWidth: 2
      },
      {
        label: 'Pagos',
        data: pagosPorMes,
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Crecimiento Mensual'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const ingresosTotales = pagos.reduce((acc: number, p: any) => acc + (Number(p.monto) || 0), 0);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Métricas y Análisis</h2>
        <p className="text-muted-foreground">Análisis detallado del crecimiento y rendimiento</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gráfico de Crecimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar data={chartData} options={chartOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen Financiero</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-green-500">{formatCurrency(ingresosTotales)}</div>
                <div className="text-sm text-muted-foreground">Ingresos Totales</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 border rounded">
                  <div className="text-xl font-bold text-blue-500">{usuarios.length}</div>
                  <div className="text-xs text-muted-foreground">Usuarios</div>
                </div>
                <div className="text-center p-3 border rounded">
                  <div className="text-xl font-bold text-purple-500">{proyectos.length}</div>
                  <div className="text-xs text-muted-foreground">Proyectos</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 