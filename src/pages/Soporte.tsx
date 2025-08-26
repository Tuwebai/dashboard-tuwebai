import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { useEffect, useState } from 'react';

import { Navigate } from 'react-router-dom';
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, HelpCircle, FileText, Phone, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { sendSupportTicketEmail, sendTicketConfirmationEmail } from '@/lib/emailService';
import { formatDateSafe } from '@/utils/formatDateSafe';

interface Ticket {
  id: string;
  asunto: string;
  mensaje: string;
  email: string;
  fecha: string;
  estado: 'abierto' | 'respondido' | 'cerrado';
  prioridad: 'baja' | 'media' | 'alta';
  respuesta?: string;
  respondidoPor?: string;
  fechaRespuesta?: string;
}

export default function Soporte() {
  const { user } = useApp();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    asunto: '',
    mensaje: '',
    prioridad: 'media' as 'baja' | 'media' | 'alta'
  });

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const fetchTickets = async () => {
      try {
        const q = query(
          collection(firestore, 'tickets'), 
          where('email', '==', user.email),
          orderBy('fecha', 'desc')
        );
        const snap = await getDocs(q);
        const ticketsData: Ticket[] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
        setTickets(ticketsData);
      } catch (error) {
        console.error('Error cargando tickets:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [user]);

  if (!user) return <Navigate to="/login" />;

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.asunto.trim() || !formData.mensaje.trim()) {
      toast({ title: 'Error', description: 'Por favor completa todos los campos.', variant: 'destructive' });
      return;
    }

    // Confirmación instantánea y limpieza del formulario
    toast({ title: 'Ticket enviado', description: 'Tu ticket de soporte fue enviado. Procesando en segundo plano...' });
    setFormData({ asunto: '', mensaje: '', prioridad: 'media' });
    setShowForm(false);

    // Procesamiento real en segundo plano
    (async () => {
      try {
        const newTicket = {
          asunto: formData.asunto,
          mensaje: formData.mensaje,
          email: user.email,
          fecha: serverTimestamp(),
          estado: 'abierto' as const,
          prioridad: formData.prioridad
        };

        // Crear el ticket en Firestore
        const ticketRef = await addDoc(collection(firestore, 'tickets'), newTicket);
        const ticketId = ticketRef.id;
        
        // Enviar email al admin
        const adminEmailResult = await sendSupportTicketEmail({
          ...newTicket,
          fecha: new Date().toISOString()
        });
        
        // Enviar email de confirmación al cliente
        const clientEmailResult = await sendTicketConfirmationEmail({
          ...newTicket,
          fecha: new Date().toISOString(),
          ticketId: ticketId
        });
        
        // Actualizar lista local
        setTickets(prev => [{
          id: ticketId,
          ...newTicket,
          fecha: new Date().toISOString()
        }, ...prev]);
        // (No mostrar toast aquí, ya se mostró antes)
      } catch (error) {
        console.error('Error enviando ticket:', error);
        toast({ title: 'Error', description: 'No se pudo enviar el ticket.', variant: 'destructive' });
      }
    })();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cerrado': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'respondido': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'abierto': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'media': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'baja': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const ticketsAbiertos = tickets.filter(t => t.estado === 'abierto').length;
  const ticketsRespondidos = tickets.filter(t => t.estado === 'respondido').length;
  const ticketsCerrados = tickets.filter(t => t.estado === 'cerrado').length;

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Soporte Técnico</h1>
          <p className="text-muted-foreground">Obtén ayuda y resuelve tus dudas</p>
        </div>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">Soporte 24/7</span>
        </div>
      </div>

      {/* Métricas de tickets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tickets Abiertos</p>
                <p className="text-2xl font-bold">{ticketsAbiertos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Respondidos</p>
                <p className="text-2xl font-bold">{ticketsRespondidos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resueltos</p>
                <p className="text-2xl font-bold">{ticketsCerrados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información de contacto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
            <CardDescription>Múltiples formas de contactarnos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Email de Soporte</p>
                <p className="text-sm text-muted-foreground">admin@tuweb-ai.com</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Teléfono</p>
                <p className="text-sm text-muted-foreground">+5493571416044</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Horarios de Atención</p>
                <p className="text-sm text-muted-foreground">Lunes a Viernes 9:00 - 18:00</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle>Crear Nuevo Ticket</CardTitle>
            <CardDescription>Envía una consulta y te responderemos pronto</CardDescription>
          </CardHeader>
          <CardContent>
            {!showForm ? (
              <Button 
                onClick={() => setShowForm(true)}
                className="w-full"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Crear Ticket de Soporte
              </Button>
            ) : (
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Asunto</label>
                  <Input
                    value={formData.asunto}
                    onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                    placeholder="Describe brevemente tu problema"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Prioridad</label>
                  <Select 
                    value={formData.prioridad} 
                    onValueChange={(value: 'baja' | 'media' | 'alta') => setFormData({ ...formData, prioridad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Mensaje</label>
                  <Textarea
                    value={formData.mensaje}
                    onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                    placeholder="Describe detalladamente tu consulta o problema..."
                    className="min-h-[120px]"
                    required
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Ticket
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historial de tickets */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>Mis Tickets de Soporte</CardTitle>
          <CardDescription>Historial completo de tus consultas y respuestas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Cargando tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay tickets registrados</h3>
              <p className="text-muted-foreground">Cuando envíes tu primer ticket, aparecerá aquí.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 bg-muted/20 rounded-lg border border-border hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{ticket.asunto}</h3>
                      <p className="text-sm text-muted-foreground">{ticket.mensaje}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(ticket.estado)}>
                        {ticket.estado}
                      </Badge>
                      <Badge className={getPriorityColor(ticket.prioridad)}>
                        {ticket.prioridad}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Creado: {formatDateSafe(ticket.fecha)}</span>
                    <div className="flex items-center gap-4">
                      {ticket.respuesta && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Respondido por {ticket.respondidoPor}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {ticket.respuesta && (
                    <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-sm font-medium mb-1">Respuesta del soporte:</p>
                      <p className="text-sm">{ticket.respuesta}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Respondido el {formatDateSafe(ticket.fechaRespuesta || '')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
