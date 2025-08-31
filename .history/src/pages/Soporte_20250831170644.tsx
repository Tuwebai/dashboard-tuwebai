import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

import { Navigate } from 'react-router-dom';
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, HelpCircle, FileText, Phone, Mail, Plus, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { sendSupportTicketEmail, sendTicketConfirmationEmail } from '@/lib/emailService';
import { formatDateSafe } from '@/utils/formatDateSafe';

interface Ticket {
  id: string;
  asunto: string;
  mensaje: string;
  email: string;
  fecha: string;
  estado: 'abierto' | 'respondido' | 'cerrado' | 'en_conversacion';
  prioridad: 'baja' | 'media' | 'alta';
  respuesta?: string;
  respondido_por?: string;
  fecha_respuesta?: string;
  respuesta_cliente?: string;
  fecha_respuesta_cliente?: string;
}

export default function Soporte() {
  const { user, projects } = useApp();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    asunto: '',
    mensaje: '',
    prioridad: 'media' as 'baja' | 'media' | 'alta'
  });

  // Sistema de respuestas del cliente
  const [respondingTicket, setRespondingTicket] = useState<Ticket | null>(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const fetchTickets = async () => {
      try {
        const { data: ticketsData, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('email', user.email)
          .order('fecha', { ascending: false });
        
        if (error) throw error;
        
        const tickets = ticketsData || [];
        setTickets(tickets);
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
          fecha: new Date().toISOString(),
          estado: 'abierto' as const,
          prioridad: formData.prioridad
        };

        // Crear el ticket en Supabase
        const { data: ticketData, error } = await supabase
          .from('tickets')
          .insert(newTicket)
          .select()
          .single();
        
        if (error) throw error;
        const ticketId = ticketData.id;
        
        // Enviar email de confirmación
        await sendTicketConfirmationEmail(user.email, ticketId, formData.asunto);
        
        // Enviar email al equipo de soporte
        await sendSupportTicketEmail(newTicket);
        
        // Actualizar la lista de tickets
        setTickets(prev => [ticketData, ...prev]);
        
        toast({ title: 'Ticket procesado', description: 'Tu ticket ha sido procesado correctamente.' });
      } catch (error) {
        console.error('Error procesando ticket:', error);
        toast({ title: 'Error', description: 'Hubo un problema procesando tu ticket. Contacta al equipo de soporte.', variant: 'destructive' });
      }
    })();
  };

  // Función para responder a un ticket del admin
  const handleClientResponse = async () => {
    if (!respondingTicket || !responseText.trim()) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          respuesta_cliente: responseText,
          fecha_respuesta_cliente: new Date().toISOString(),
          estado: 'en_conversacion'
        })
        .eq('id', respondingTicket.id);

      if (error) throw error;

      // Actualizar estado local
      const updatedTickets = tickets.map(ticket => 
        ticket.id === respondingTicket.id 
          ? { 
              ...ticket, 
              respuesta_cliente: responseText,
              fecha_respuesta_cliente: new Date().toISOString(),
              estado: 'en_conversacion'
            }
          : ticket
      );

      setTickets(updatedTickets);

      toast({
        title: 'Respuesta enviada',
        description: 'Tu respuesta se ha enviado correctamente',
        variant: 'default'
      });

      setRespondingTicket(null);
      setResponseText('');
    } catch (error) {
      console.error('Error sending response:', error);
      toast({
        title: 'Error',
        description: 'Error al enviar la respuesta',
        variant: 'destructive'
      });
    }
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'media': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'baja': return 'bg-green-500/10 text-green-600 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'abierto': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'respondido': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'en_conversacion': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'cerrado': return 'bg-green-500/10 text-green-600 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado) {
      case 'abierto': return 'Abierto';
      case 'respondido': return 'Respondido';
      case 'en_conversacion': return 'En Conversación';
      case 'cerrado': return 'Cerrado';
      default: return 'Desconocido';
    }
  };

  const ticketsAbiertos = tickets.filter(t => t.estado === 'abierto').length;
  const ticketsRespondidos = tickets.filter(t => t.estado === 'respondido').length;
  const ticketsResueltos = tickets.filter(t => t.estado === 'cerrado').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header con diseño claro */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Soporte</h1>
              <p className="text-slate-600 mt-2">
                Obtén ayuda y resuelve tus consultas
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <FileText className="h-4 w-4" />
                <span>Proyectos: {projects?.length || 0}</span>
              </div>
              <Button
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Soporte 24/7
              </Button>
            </div>
          </div>
        </div>

        {/* Resumen de tickets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Tickets Abiertos</p>
                  <p className="text-2xl font-bold text-slate-800">{ticketsAbiertos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Respondidos</p>
                  <p className="text-2xl font-bold text-slate-800">{ticketsRespondidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Resueltos</p>
                  <p className="text-2xl font-bold text-slate-800">{ticketsResueltos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información de contacto */}
          <Card className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Múltiples formas de contactarnos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Email</p>
                  <p className="text-sm text-slate-600">admin@tuweb-ai.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Phone className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Teléfono</p>
                  <p className="text-sm text-slate-600">+5493571416044</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Horarios de atención</p>
                  <p className="text-sm text-slate-600">Lunes a Viernes 9:00 - 18:00</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulario de nuevo ticket */}
          <Card className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Envía una consulta y te responderemos pronto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="asunto" className="text-sm font-medium text-slate-700">
                    Asunto
                  </label>
                  <Input
                    id="asunto"
                    value={formData.asunto}
                    onChange={(e) => setFormData({...formData, asunto: e.target.value})}
                    placeholder="Describe brevemente tu consulta"
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="mensaje" className="text-sm font-medium text-slate-700">
                    Mensaje
                  </label>
                  <Textarea
                    id="mensaje"
                    value={formData.mensaje}
                    onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
                    placeholder="Explica detalladamente tu consulta o problema"
                    rows={4}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="prioridad" className="text-sm font-medium text-slate-700">
                    Prioridad
                  </label>
                  <Select
                    value={formData.prioridad}
                    onValueChange={(value: 'baja' | 'media' | 'alta') => 
                      setFormData({...formData, prioridad: value})
                    }
                  >
                    <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 via-purple-600 to-fuchsia-600 hover:from-blue-600 hover:to-fuchsia-700 shadow-lg text-white font-medium"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Crear Ticket de Soporte
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Historial de tickets */}
        <Card className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">
              Historial completo de tus consultas y respuestas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-slate-600">Cargando tickets...</p>
                </div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-800">No hay tickets</h3>
                <p className="text-slate-600">
                  Cuando envíes tu primer ticket, aparecerá aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 mb-1">{ticket.asunto}</h4>
                        <p className="text-sm text-slate-600 mb-2">{ticket.mensaje}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>{formatDateSafe(ticket.fecha)}</span>
                          <span>•</span>
                          <span>{ticket.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge className={getPriorityColor(ticket.prioridad)}>
                          {ticket.prioridad}
                        </Badge>
                        <Badge className={getStatusColor(ticket.estado)}>
                          {getStatusText(ticket.estado)}
                        </Badge>
                      </div>
                    </div>
                    
                    {ticket.respuesta && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Respuesta del equipo</span>
                        </div>
                        <p className="text-sm text-blue-700">{ticket.respuesta}</p>
                        {ticket.respondidoPor && (
                          <p className="text-xs text-blue-600 mt-2">
                            Respondido por: {ticket.respondidoPor}
                          </p>
                        )}
                        {ticket.fechaRespuesta && (
                          <p className="text-xs text-blue-600">
                            {formatDateSafe(ticket.fechaRespuesta)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
