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
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  FileText, 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Settings,
  Download,
  MessageSquare,
  CheckCircle,
  Paperclip,
  X,
  History as HistoryIcon,
  Activity
} from 'lucide-react';
import { 
  AdminNotificationSystem, 
  AdminAnalytics, 
  AdminSettings
} from '@/components/AdminAdvancedFeatures';
import { initializeChatData, initializeCommentsData, initializeTasksData, initializeAdminSystemData, cleanSimulatedData } from '@/utils/initializeData';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useApp } from '@/contexts/AppContext';
import VerDetallesProyecto from '@/components/VerDetallesProyecto';
import { jsPDF } from 'jspdf';

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
    
    // Escuchar tickets en tiempo real
    const unsubTickets = onSnapshot(collection(firestore, 'tickets'), (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const realTickets = ticketsData.filter(ticket => {
        const t = ticket as any;
        return t.userEmail &&
          !t.userEmail.includes('ejemplo.com') &&
          t.createdAt &&
          new Date(t.createdAt).toString() !== 'Invalid Date';
      });
      setTickets(realTickets);
    });
    
    // Escuchar pagos en tiempo real
    const unsubPagos = onSnapshot(collection(firestore, 'pagos'), (snapshot) => {
      const pagosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPagos(pagosData);
    });
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      unsubTickets();
      unsubPagos();
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
          setProyectos={setProyectos}
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
        return <TicketsSection tickets={tickets} usuarios={usuarios} onRespond={handleRespondTicket} onClose={handleCloseTicket} />;
      case 'pagos':
        return <PagosSection pagos={pagos} onDownloadInvoice={handleDownloadInvoice} onMarkComplete={handleMarkPaymentComplete} />;
      case 'notifications':
        return <AdminNotificationSystem />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'settings':
        return <AdminSettings />;
      case 'metricas':
        return <MetricasSection usuarios={usuarios} proyectos={proyectos} pagos={pagos} tickets={tickets} />;
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
  const { proyectos, navigate } = props;
  const [showDetalles, setShowDetalles] = useState(false);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<any>(null);



  const handleViewProject = (proyecto: any) => {
    setProyectoSeleccionado(proyecto);
    setShowDetalles(true);
  };
  const handleEditarProyecto = () => {
    if (proyectoSeleccionado) navigate(`/proyectos/${proyectoSeleccionado.id}`);
  };
  const handleColaborarProyecto = (proyecto: any) => {
    navigate(`/proyectos/${proyecto.id}/colaboracion`);
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
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/analytics')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard-custom')}>
              <Settings className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
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
                    onClick={() => handleColaborarProyecto(proyecto)}
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
                {/* Información básica del proyecto */}
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    Para gestionar las fases del proyecto, haz clic en "Ver detalles"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {showDetalles && proyectoSeleccionado && (
      <VerDetallesProyecto
        proyecto={proyectoSeleccionado}
          onClose={() => setShowDetalles(false)}
          onUpdate={(proyectoActualizado) => {
            props.setProyectos(prev => prev.map((p: any) => 
              p.id === proyectoActualizado.id ? proyectoActualizado : p
            ));
          }}
        />
      )}
    </div>
  );
}

function TicketsSection({ tickets, usuarios, onRespond, onClose }: any) {
  const [respuesta, setRespuesta] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [pagina, setPagina] = useState(1);
  const [showHistorial, setShowHistorial] = useState(false);
  const [historialTicket, setHistorialTicket] = useState<any[]>([]);
  const [showAdjuntos, setShowAdjuntos] = useState(false);
  const [adjuntosTicket, setAdjuntosTicket] = useState<any[]>([]);
  const [showAsignar, setShowAsignar] = useState(false);
  const [asignarTicket, setAsignarTicket] = useState<any>(null);
  const [asignadoA, setAsignadoA] = useState('');
  const [showComentarios, setShowComentarios] = useState(false);
  const [comentariosTicket, setComentariosTicket] = useState<any[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [editandoComentario, setEditandoComentario] = useState<any>(null);
  const [comentarioEditado, setComentarioEditado] = useState('');
  
  // Nuevas funcionalidades avanzadas
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const [showAutoAssignment, setShowAutoAssignment] = useState(false);
  const [workflowStages, setWorkflowStages] = useState([
    { id: 'new', name: 'Nuevo', color: 'blue' },
    { id: 'assigned', name: 'Asignado', color: 'yellow' },
    { id: 'in_progress', name: 'En Progreso', color: 'orange' },
    { id: 'waiting', name: 'En Espera', color: 'purple' },
    { id: 'escalated', name: 'Escalado', color: 'red' },
    { id: 'resolved', name: 'Resuelto', color: 'green' },
    { id: 'closed', name: 'Cerrado', color: 'gray' }
  ]);
  const [escalationRules, setEscalationRules] = useState([
    { id: 1, name: 'Escalación por tiempo', trigger: 'time', delay: 60, active: true },
    { id: 2, name: 'Escalación por prioridad', trigger: 'priority', delay: 30, active: true },
    { id: 3, name: 'Escalación por etapa', trigger: 'stage', delay: 120, active: true }
  ]);
  const [assignmentRules, setAssignmentRules] = useState([
    { id: 1, name: 'Round Robin', type: 'round_robin', active: true },
    { id: 2, name: 'Menor carga', type: 'least_busy', active: true },
    { id: 3, name: 'Por expertise', type: 'expertise', active: true }
  ]);

  const ticketsPorPagina = 8;
  
  // Filtros avanzados
  const ticketsFiltrados = tickets
    .filter(t => !filtroEstado || t.estado === filtroEstado)
    .filter(t => !filtroPrioridad || t.priority === filtroPrioridad)
    .filter(t => !filtroTexto || (t.userEmail && t.userEmail.toLowerCase().includes(filtroTexto.toLowerCase())) || (t.title && t.title.toLowerCase().includes(filtroTexto.toLowerCase())));
  
  const totalPaginas = Math.ceil(ticketsFiltrados.length / ticketsPorPagina);
  const ticketsPagina = ticketsFiltrados.slice((pagina - 1) * ticketsPorPagina, pagina * ticketsPorPagina);

  // Funciones avanzadas de workflow
  const handleWorkflowStageChange = async (ticketId: string, newStage: string) => {
    try {
      await updateDoc(doc(firestore, 'tickets', ticketId), { 
        estado: newStage,
        updatedAt: new Date().toISOString()
      });
      
      // Verificar escalación automática
      await checkAutoEscalation(ticketId, newStage);
      
      toast({ 
        title: 'Estado actualizado', 
        description: `Ticket movido a etapa: ${newStage}` 
      });
    } catch (error) {
      console.error('Error updating ticket stage:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo actualizar el estado del ticket',
        variant: 'destructive'
      });
    }
  };

  // Verificar escalación automática
  const checkAutoEscalation = async (ticketId: string, stage: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    // Escalación por tiempo
    const timeSinceCreation = Date.now() - new Date(ticket.createdAt).getTime();
    const hoursSinceCreation = timeSinceCreation / (1000 * 60 * 60);
    
    if (hoursSinceCreation > 2 && stage === 'in_progress') {
      await escalateTicket(ticketId, 'Escalación automática por tiempo');
    }
    
    // Escalación por prioridad
    if (ticket.priority === 'critical' && stage === 'new') {
      await escalateTicket(ticketId, 'Escalación automática por prioridad crítica');
    }
  };

  // Escalar ticket
  const escalateTicket = async (ticketId: string, reason: string) => {
    try {
      await updateDoc(doc(firestore, 'tickets', ticketId), {
        estado: 'escalated',
        escalationReason: reason,
        escalatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      toast({ 
        title: 'Ticket escalado', 
        description: reason,
        variant: 'destructive'
      });
    } catch (error) {
      console.error('Error escalating ticket:', error);
    }
  };

  // Asignación automática
  const handleAutoAssign = async (ticketId: string) => {
    try {
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) return;

      // Lógica de asignación automática
      const availableUsers = usuarios.filter((u: any) => u.role === 'admin' || u.role === 'support');
      if (availableUsers.length === 0) return;

      // Round Robin simple
      const assignedUser = availableUsers[ticket.id.length % availableUsers.length];
      
      await updateDoc(doc(firestore, 'tickets', ticketId), {
        asignadoA: assignedUser.email,
        estado: 'assigned',
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      toast({ 
        title: 'Ticket asignado automáticamente', 
        description: `Asignado a: ${assignedUser.email}` 
      });
    } catch (error) {
      console.error('Error auto-assigning ticket:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo asignar automáticamente el ticket',
        variant: 'destructive'
      });
    }
  };

  // Eliminar ticket
  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este ticket?')) return;
    await deleteDoc(doc(firestore, 'tickets', ticketId));
    toast({ title: 'Ticket eliminado', description: 'El ticket fue eliminado correctamente.' });
  };

  // Exportar ticket
  const handleExportTicket = (ticket: any, formato: 'pdf' | 'txt' | 'json') => {
    if (formato === 'json') {
      const blob = new Blob([JSON.stringify(ticket, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${ticket.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (formato === 'txt') {
      const content = `TICKET\nID: ${ticket.id}\nTítulo: ${ticket.title}\nDescripción: ${ticket.description}\nUsuario: ${ticket.userEmail}\nPrioridad: ${ticket.priority}\nEstado: ${ticket.estado}\nCreado: ${ticket.createdAt}\nRespuesta: ${ticket.respuesta || ''}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${ticket.id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (formato === 'pdf') {
      const docu = new jsPDF();
      docu.text(`TICKET\nID: ${ticket.id}\nTítulo: ${ticket.title}\nDescripción: ${ticket.description}\nUsuario: ${ticket.userEmail}\nPrioridad: ${ticket.priority}\nEstado: ${ticket.estado}\nCreado: ${ticket.createdAt}\nRespuesta: ${ticket.respuesta || ''}`, 10, 10);
      docu.save(`ticket-${ticket.id}.pdf`);
    }
    toast({ title: 'Ticket exportado', description: `El ticket fue exportado como ${formato.toUpperCase()}.` });
  };

  // Historial de cambios (simulado)
  const handleShowHistorial = (ticket: any) => {
    setHistorialTicket([
      { id: 1, action: 'create', user: ticket.userEmail, fecha: ticket.createdAt },
      ...(ticket.respuesta ? [{ id: 2, action: 'respond', user: ticket.respondidoPor, fecha: ticket.fechaRespuesta }] : []),
      ...(ticket.estado === 'cerrado' ? [{ id: 3, action: 'close', user: ticket.cerradoPor, fecha: ticket.fechaCierre }] : []),
      ...(ticket.escalatedAt ? [{ id: 4, action: 'escalate', user: 'Sistema', fecha: ticket.escalatedAt, reason: ticket.escalationReason }] : []),
    ]);
    setShowHistorial(true);
  };

  // Adjuntos (simulado)
  const handleShowAdjuntos = (ticket: any) => {
    setAdjuntosTicket(ticket.adjuntos || []);
    setShowAdjuntos(true);
  };

  // Asignar ticket
  const handleShowAsignar = (ticket: any) => {
    setAsignarTicket(ticket);
    setAsignadoA(ticket.asignadoA || '');
    setShowAsignar(true);
  };
  
  const handleAsignar = async () => {
    if (!asignarTicket) return;
    await updateDoc(doc(firestore, 'tickets', asignarTicket.id), { 
      asignadoA,
      estado: 'assigned',
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setShowAsignar(false);
    toast({ title: 'Ticket asignado', description: `El ticket fue asignado a ${asignadoA}` });
  };

  // Comentarios internos
  const handleShowComentarios = (ticket: any) => {
    setComentariosTicket(ticket.comentariosInternos || []);
    setShowComentarios(true);
  };
  
  const handleAgregarComentario = async () => {
    if (!nuevoComentario.trim() || !selectedTicket) return;
    const nuevos = [...(selectedTicket.comentariosInternos || []), { 
      texto: nuevoComentario, 
      fecha: new Date().toISOString(),
      user: 'Admin'
    }];
    await updateDoc(doc(firestore, 'tickets', selectedTicket.id), { comentariosInternos: nuevos });
    setComentariosTicket(nuevos);
    setNuevoComentario('');
  };

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestión Avanzada de Tickets</h2>
          <p className="text-muted-foreground">Administra tickets con workflow, escalación y asignación automática</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-end md:items-center">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowWorkflow(true)}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Workflow
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowEscalation(true)}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Escalación
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAutoAssignment(true)}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Asignación
            </Button>
          </div>
          <div className="flex gap-2">
            <select className="bg-zinc-800 text-sm rounded px-2 py-1 text-white border border-zinc-700" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="new">Nuevo</option>
              <option value="assigned">Asignado</option>
              <option value="in_progress">En Progreso</option>
              <option value="waiting">En Espera</option>
              <option value="escalated">Escalado</option>
              <option value="resolved">Resuelto</option>
              <option value="closed">Cerrado</option>
            </select>
            <select className="bg-zinc-800 text-sm rounded px-2 py-1 text-white border border-zinc-700" value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)}>
              <option value="">Todas las prioridades</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>
          <input
            className="bg-zinc-800 text-sm rounded px-2 py-1 text-white border border-zinc-700"
            placeholder="Buscar por usuario, email o título..."
            value={filtroTexto}
            onChange={e => setFiltroTexto(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ticketsPagina.map((ticket: any) => (
          <Card key={ticket.id} className="bg-gradient-card border-border hover:border-primary/30 transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {ticket.priority === 'alta' && <span className="text-red-500 font-bold animate-pulse">●</span>}
                    {ticket.title}
                </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={getStatusColor(ticket.estado)}>{ticket.estado}</Badge>
                    <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                    <Badge variant="outline">{ticket.category}</Badge>
                    {ticket.asignadoA && <Badge variant="secondary">Asignado: {ticket.asignadoA}</Badge>}
                    {ticket.urgente && <Badge className="bg-red-700 text-white">Urgente</Badge>}
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(ticket)}><MessageSquare className="h-4 w-4" /></Button>
                  {ticket.estado !== 'cerrado' && <Button variant="ghost" size="sm" onClick={() => onClose(ticket.id)}><CheckCircle className="h-4 w-4" /></Button>}
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteTicket(ticket.id)}><Trash2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExportTicket(ticket, 'json')}><Download className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExportTicket(ticket, 'txt')}><FileText className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExportTicket(ticket, 'pdf')}><Paperclip className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleShowHistorial(ticket)}><HistoryIcon className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleShowAdjuntos(ticket)}><Paperclip className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleShowAsignar(ticket)}><Users className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleShowComentarios(ticket)}><MessageSquare className="h-4 w-4" /></Button>
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
                {/* TODO: historial de cambios, archivos adjuntos, comentarios internos, logs, etc. */}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button size="sm" variant="outline" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {pagina} de {totalPaginas}</span>
          <Button size="sm" variant="outline" disabled={pagina === totalPaginas} onClick={() => setPagina(pagina + 1)}>Siguiente</Button>
        </div>
      )}
      {/* Modal para responder ticket */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder Ticket</DialogTitle>
            <DialogDescription>Responde al ticket: {selectedTicket?.title}</DialogDescription>
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
              <Button variant="outline" onClick={() => setSelectedTicket(null)}>Cancelar</Button>
              <Button onClick={() => handleRespond(selectedTicket?.id)}>Enviar Respuesta</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Historial de Cambios */}
      <Dialog open={showHistorial} onOpenChange={setShowHistorial}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Historial de Cambios para Ticket: {selectedTicket?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {historialTicket.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={h.action === 'create' ? 'bg-blue-500 text-white' : h.action === 'respond' ? 'bg-green-500 text-white' : 'bg-purple-500 text-white'}>
                    {h.action === 'create' ? 'Creado' : h.action === 'respond' ? 'Respondido' : 'Cerrado'}
                  </Badge>
                  <span>{h.user}</span>
                  <span>({new Date(h.fecha).toLocaleDateString('es-ES')})</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowHistorial(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Adjuntos */}
      <Dialog open={showAdjuntos} onOpenChange={setShowAdjuntos}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjuntos para Ticket: {selectedTicket?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {adjuntosTicket.map((adjunto, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  <a href={adjunto.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    {adjunto.name}
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowAdjuntos(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Asignar Ticket */}
      <Dialog open={showAsignar} onOpenChange={setShowAsignar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Ticket: {asignarTicket?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="asignadoA">Asignar a:</Label>
              <Select value={asignadoA} onValueChange={setAsignadoA}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map(user => (
                    <SelectItem key={user.id} value={user.email}>{user.name} ({user.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAsignar(false)}>Cancelar</Button>
              <Button onClick={handleAsignar}>Guardar Asignación</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Comentarios Internos */}
      <Dialog open={showComentarios} onOpenChange={setShowComentarios}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comentarios Internos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2">
              {comentariosTicket.map((c, idx) => (
                <div key={idx} className="p-2 bg-muted rounded text-sm">
                  <div className="font-medium">{c.user}</div>
                  <p>{c.texto}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(c.fecha).toLocaleString('es-ES')}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                placeholder="Agregar comentario interno..."
              />
              <Button onClick={handleAgregarComentario}>Agregar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Workflow */}
      <Dialog open={showWorkflow} onOpenChange={setShowWorkflow}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Configuración de Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-4">Etapas del Workflow</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {workflowStages.map((stage) => (
                  <div key={stage.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full bg-${stage.color}-500`}></div>
                      <span className="font-medium">{stage.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">ID: {stage.id}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Transiciones Automáticas</h3>
              <div className="space-y-2">
                <div className="p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <span>Nuevo → Asignado (Auto-asignación)</span>
                    <Badge variant="outline">Automático</Badge>
                  </div>
                </div>
                <div className="p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <span>En Progreso → Escalado (2+ horas)</span>
                    <Badge variant="outline">Automático</Badge>
                  </div>
                </div>
                <div className="p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <span>Crítico → Escalado (Inmediato)</span>
                    <Badge variant="outline">Automático</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Escalación */}
      <Dialog open={showEscalation} onOpenChange={setShowEscalation}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reglas de Escalación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {escalationRules.map((rule) => (
              <div key={rule.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{rule.name}</h4>
                  <Badge variant={rule.active ? "default" : "secondary"}>
                    {rule.active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Trigger: {rule.trigger}</div>
                  <div>Delay: {rule.delay} minutos</div>
                </div>
              </div>
            ))}
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Estadísticas de Escalación</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tickets escalados hoy:</span>
                  <span className="ml-2 font-medium">
                    {tickets.filter(t => t.escalatedAt && new Date(t.escalatedAt).toDateString() === new Date().toDateString()).length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total escalados:</span>
                  <span className="ml-2 font-medium">
                    {tickets.filter(t => t.estado === 'escalated').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Asignación Automática */}
      <Dialog open={showAutoAssignment} onOpenChange={setShowAutoAssignment}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configuración de Asignación Automática</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {assignmentRules.map((rule) => (
              <div key={rule.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{rule.name}</h4>
                  <Badge variant={rule.active ? "default" : "secondary"}>
                    {rule.active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Tipo: {rule.type}
                </div>
              </div>
            ))}
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Agentes Disponibles</h4>
              <div className="space-y-2">
                {usuarios.filter((u: any) => u.role === 'admin' || u.role === 'support').map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between text-sm">
                    <span>{user.email}</span>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Estadísticas de Asignación</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tickets sin asignar:</span>
                  <span className="ml-2 font-medium">
                    {tickets.filter(t => !t.asignadoA && t.estado !== 'closed').length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Asignaciones automáticas:</span>
                  <span className="ml-2 font-medium">
                    {tickets.filter(t => t.assignedAt && !t.asignadoA).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PagosSection({ pagos, onDownloadInvoice, onMarkComplete }: any) {
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [pagina, setPagina] = useState(1);
  const [showHistorial, setShowHistorial] = useState(false);
  const [historialPago, setHistorialPago] = useState<any[]>([]);
  const [showDetalles, setShowDetalles] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<any>(null);
  const [showNotas, setShowNotas] = useState(false);
  const [notas, setNotas] = useState('');
  const pagosPorPagina = 8;
  // Filtros avanzados
  const pagosFiltrados = pagos
    .filter(p => !filtroEstado || p.estado === filtroEstado)
    .filter(p => !filtroMetodo || p.metodo === filtroMetodo)
    .filter(p => !filtroTexto || (p.userEmail && p.userEmail.toLowerCase().includes(filtroTexto.toLowerCase())) || (p.concepto && p.concepto.toLowerCase().includes(filtroTexto.toLowerCase())) || (p.factura && p.factura.toLowerCase().includes(filtroTexto.toLowerCase())))
    .filter(p => {
      if (!filtroFechaInicio && !filtroFechaFin) return true;
      const fecha = new Date(p.fecha);
      if (filtroFechaInicio && fecha < new Date(filtroFechaInicio)) return false;
      if (filtroFechaFin && fecha > new Date(filtroFechaFin)) return false;
      return true;
    });
  const totalPaginas = Math.ceil(pagosFiltrados.length / pagosPorPagina);
  const pagosPagina = pagosFiltrados.slice((pagina - 1) * pagosPorPagina, pagina * pagosPorPagina);

  // Acciones rápidas
  const handleDeletePago = async (pagoId: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este pago?')) return;
    await deleteDoc(doc(firestore, 'pagos', pagoId));
    toast({ title: 'Pago eliminado', description: 'El pago fue eliminado correctamente.' });
  };
  const handleExportPago = (pago: any, formato: 'pdf' | 'txt' | 'json') => {
    if (formato === 'json') {
      const blob = new Blob([JSON.stringify(pago, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pago-${pago.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (formato === 'txt') {
      const content = `PAGO\nID: ${pago.id}\nConcepto: ${pago.concepto}\nUsuario: ${pago.userEmail}\nMonto: ${pago.monto}\nEstado: ${pago.estado}\nFecha: ${pago.fecha}\nFactura: ${pago.factura}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pago-${pago.id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (formato === 'pdf') {
      const docu = new jsPDF();
      docu.text(`PAGO\nID: ${pago.id}\nConcepto: ${pago.concepto}\nUsuario: ${pago.userEmail}\nMonto: ${pago.monto}\nEstado: ${pago.estado}\nFecha: ${pago.fecha}\nFactura: ${pago.factura}`, 10, 10);
      docu.save(`pago-${pago.id}.pdf`);
    }
    toast({ title: 'Pago exportado', description: `El pago fue exportado como ${formato.toUpperCase()}.` });
  };
  const handleShowHistorial = (pago: any) => {
    setHistorialPago([
      { id: 1, action: 'create', user: pago.userEmail, fecha: pago.fecha },
      ...(pago.estado === 'completado' ? [{ id: 2, action: 'complete', user: pago.completadoPor, fecha: pago.fechaCompletado }] : []),
      ...(pago.estado === 'cancelado' ? [{ id: 3, action: 'cancel', user: pago.canceladoPor, fecha: pago.fechaCancelado }] : []),
    ]);
    setShowHistorial(true);
  };
  const handleShowDetalles = (pago: any) => {
    setPagoSeleccionado(pago);
    setShowDetalles(true);
  };
  const handleShowNotas = (pago: any) => {
    setPagoSeleccionado(pago);
    setNotas(pago.notas || '');
    setShowNotas(true);
  };
  const handleGuardarNotas = async () => {
    if (!pagoSeleccionado) return;
    await updateDoc(doc(firestore, 'pagos', pagoSeleccionado.id), { notas });
    setShowNotas(false);
    toast({ title: 'Notas guardadas', description: 'Las notas internas fueron actualizadas.' });
  };

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Pagos</h2>
          <p className="text-muted-foreground">Administra pagos y facturación</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-end md:items-center">
          <div className="flex gap-2">
            <select className="bg-zinc-800 text-sm rounded px-2 py-1 text-white border border-zinc-700" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="completado">Completado</option>
              <option value="pendiente">Pendiente</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <select className="bg-zinc-800 text-sm rounded px-2 py-1 text-white border border-zinc-700" value={filtroMetodo} onChange={e => setFiltroMetodo(e.target.value)}>
              <option value="">Todos los métodos</option>
              <option value="tarjeta">Tarjeta de Crédito</option>
              <option value="transferencia">Transferencia Bancaria</option>
              <option value="efectivo">Efectivo</option>
            </select>
          </div>
          <input
            className="bg-zinc-800 text-sm rounded px-2 py-1 text-white border border-zinc-700"
            placeholder="Buscar por usuario, email, concepto, factura..."
            value={filtroTexto}
            onChange={e => setFiltroTexto(e.target.value)}
          />
          <div className="flex gap-2">
            <input type="date" className="bg-zinc-800 text-sm rounded px-2 py-1 text-white border border-zinc-700" value={filtroFechaInicio} onChange={e => setFiltroFechaInicio(e.target.value)} />
            <input type="date" className="bg-zinc-800 text-sm rounded px-2 py-1 text-white border border-zinc-700" value={filtroFechaFin} onChange={e => setFiltroFechaFin(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {pagosPagina.map((pago: any) => (
          <Card key={pago.id} className="bg-gradient-card border-border hover:border-primary/30 transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{pago.concepto}</CardTitle>
                  <p className="text-sm text-muted-foreground">{pago.userEmail}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={getStatusColor(pago.estado)}>{pago.estado}</Badge>
                    <Badge variant="outline">{pago.metodo}</Badge>
                    <Badge variant="outline">{pago.moneda}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{formatCurrency(pago.monto)}</div>
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
                <div className="flex gap-2 flex-wrap">
                  <Button variant="ghost" size="sm" onClick={() => onDownloadInvoice(pago.id)}><Download className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExportPago(pago, 'json')}><FileText className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExportPago(pago, 'txt')}><FileText className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExportPago(pago, 'pdf')}><FileText className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleShowHistorial(pago)}><HistoryIcon className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleShowDetalles(pago)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleShowNotas(pago)}><MessageSquare className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeletePago(pago.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  {pago.estado === 'pendiente' && (
                    <Button size="sm" onClick={() => onMarkComplete(pago.id)} className="flex-1"><CheckCircle className="h-4 w-4 mr-2" />Completar</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button size="sm" variant="outline" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {pagina} de {totalPaginas}</span>
          <Button size="sm" variant="outline" disabled={pagina === totalPaginas} onClick={() => setPagina(pagina + 1)}>Siguiente</Button>
        </div>
      )}
      {/* Modal para editar pago */}
      <Dialog open={!!pagoSeleccionado} onOpenChange={() => setPagoSeleccionado(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pago</DialogTitle>
            <DialogDescription>
              Modifica la información del pago
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="concepto">Concepto</Label>
              <Input
                id="concepto"
                value={pagoSeleccionado?.concepto || ''}
                onChange={(e) => setPagoSeleccionado(prev => ({ ...prev, concepto: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="monto">Monto</Label>
              <Input
                id="monto"
                type="number"
                value={pagoSeleccionado?.monto || ''}
                onChange={(e) => setPagoSeleccionado(prev => ({ ...prev, monto: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="metodo">Método de Pago</Label>
              <Select value={pagoSeleccionado?.metodo || ''} onValueChange={(value) => setPagoSeleccionado(prev => ({ ...prev, metodo: value }))} defaultValue={pagoSeleccionado?.metodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tarjeta">Tarjeta de Crédito</SelectItem>
                  <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="moneda">Moneda</Label>
              <Select value={pagoSeleccionado?.moneda || ''} onValueChange={(value) => setPagoSeleccionado(prev => ({ ...prev, moneda: value }))} defaultValue={pagoSeleccionado?.moneda}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
                  <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="factura">Número de Factura</Label>
              <Input
                id="factura"
                value={pagoSeleccionado?.factura || ''}
                onChange={(e) => setPagoSeleccionado(prev => ({ ...prev, factura: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={pagoSeleccionado?.notas || ''}
                onChange={(e) => setPagoSeleccionado(prev => ({ ...prev, notas: e.target.value }))}
                placeholder="Escribe cualquier nota adicional..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPagoSeleccionado(null)}>Cancelar</Button>
              <Button onClick={() => setPagoSeleccionado(pagoSeleccionado)}>Guardar Cambios</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal de Historial de Cambios */}
      <Dialog open={showHistorial} onOpenChange={setShowHistorial}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Historial de Cambios para Pago: {pagoSeleccionado?.concepto}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {historialPago.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={h.action === 'create' ? 'bg-blue-500 text-white' : h.action === 'complete' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                    {h.action === 'create' ? 'Creado' : h.action === 'complete' ? 'Completado' : 'Cancelado'}
                  </Badge>
                  <span>{h.user}</span>
                  <span>({new Date(h.fecha).toLocaleDateString('es-ES')})</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowHistorial(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal de Detalles del Pago */}
      <Dialog open={showDetalles} onOpenChange={setShowDetalles}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Pago</DialogTitle>
            <DialogDescription>
              Información detallada del pago
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="concepto">Concepto</Label>
              <Input
                id="concepto"
                value={pagoSeleccionado?.concepto || ''}
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="monto">Monto</Label>
              <Input
                id="monto"
                type="number"
                value={pagoSeleccionado?.monto || ''}
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="metodo">Método de Pago</Label>
              <Input
                id="metodo"
                value={pagoSeleccionado?.metodo || ''}
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="moneda">Moneda</Label>
              <Input
                id="moneda"
                value={pagoSeleccionado?.moneda || ''}
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="factura">Número de Factura</Label>
              <Input
                id="factura"
                value={pagoSeleccionado?.factura || ''}
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={pagoSeleccionado?.notas || ''}
                readOnly
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDetalles(false)}>Cerrar</Button>
              <Button onClick={handleShowNotas}>Ver Notas</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal de Notas */}
      <Dialog open={showNotas} onOpenChange={setShowNotas}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notas del Pago</DialogTitle>
            <DialogDescription>
              Notas internas sobre el pago
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Escribe cualquier nota adicional..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNotas(false)}>Cancelar</Button>
              <Button onClick={handleGuardarNotas}>Guardar Notas</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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