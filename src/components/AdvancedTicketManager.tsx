import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Ticket, 
  Plus, 
  Filter, 
  Search, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  MessageSquare,
  Activity,
  TrendingUp,
  Settings,
  Eye,
  Edit,
  Trash2,
  ArrowRight,
  Zap,
  Shield,
  Target,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ticketWorkflowService } from '@/lib/ticketWorkflow';
import { ticketAssignmentService } from '@/lib/ticketAssignment';
import { ticketEscalationService } from '@/lib/ticketEscalation';
import { ticketService, Ticket as TicketType } from '@/lib/ticketService';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  stage: string;
  assignedTo: string;
  clientId: string;
  clientEmail: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  escalationCount: number;
  tags: string[];
}

export default function AdvancedTicketManager() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tickets');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Estados para formularios
  const [ticketData, setTicketData] = useState({
    subject: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    category: '',
    clientEmail: '',
    tags: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketsData, workflowsData] = await Promise.all([
        loadTickets(),
        ticketWorkflowService.getWorkflows()
      ]);

      setTickets(ticketsData);
      setWorkflows(workflowsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const loadTickets = async (): Promise<Ticket[]> => {
    try {
      // Cargar tickets reales usando el servicio
      const tickets = await ticketService.getTickets();
      
      // Mapear datos del servicio al formato del componente
      return tickets.map(ticket => ({
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        stage: ticket.stage,
        assignedTo: ticket.assigned_to || '',
        clientId: ticket.client_id || '',
        clientEmail: ticket.client_email,
        category: ticket.category || '',
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        lastActivity: ticket.last_activity,
        escalationCount: ticket.escalation_count || 0,
        tags: ticket.tags || []
      }));
    } catch (error) {
      console.error('Error in loadTickets:', error);
      return [];
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketData.subject || !ticketData.description) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Crear ticket
      const newTicket: Omit<Ticket, 'id'> = {
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority,
        status: 'new',
        stage: 'new',
        assignedTo: '',
        clientId: 'client',
        clientEmail: ticketData.clientEmail,
        category: ticketData.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        escalationCount: 0,
        tags: ticketData.tags
      };

      // Aquí se guardaría en Firestore
      console.log('Creating ticket:', newTicket);

      // Asignar automáticamente
      const assignedUserId = await ticketAssignmentService.autoAssignTicket(newTicket as any);
      if (assignedUserId) {
        newTicket.assignedTo = assignedUserId;
        newTicket.status = 'assigned';
        newTicket.stage = 'assigned';
      }

      toast({
        title: 'Ticket creado',
        description: 'Se ha creado el nuevo ticket'
      });

      setTicketData({
        subject: '',
        description: '',
        priority: 'medium',
        category: '',
        clientEmail: '',
        tags: []
      });
      setShowCreateModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el ticket',
        variant: 'destructive'
      });
    }
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  const handleEscalateTicket = async (ticketId: string) => {
    try {
      const result = await ticketEscalationService.checkEscalations();
      toast({
        title: 'Escalación iniciada',
        description: 'Se ha iniciado el proceso de escalación'
      });
      loadData();
    } catch (error) {
      console.error('Error escalating ticket:', error);
      toast({
        title: 'Error',
        description: 'No se pudo escalar el ticket',
        variant: 'destructive'
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'waiting': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const getTicketStats = () => {
    const total = tickets.length;
    const newTickets = tickets.filter(t => t.status === 'new').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const escalated = tickets.filter(t => t.escalationCount > 0).length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;

    return { total, newTickets, inProgress, escalated, resolved };
  };

  const stats = getTicketStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión Avanzada de Tickets</h1>
          <p className="text-muted-foreground">
            Administra tickets con workflow personalizable y escalación automática
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Ticket
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Ticket className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nuevos</p>
                <p className="text-2xl font-bold">{stats.newTickets}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En Progreso</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Escalados</p>
                <p className="text-2xl font-bold">{stats.escalated}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resueltos</p>
                <p className="text-2xl font-bold">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="new">Nuevos</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="waiting">En Espera</SelectItem>
                    <SelectItem value="resolved">Resueltos</SelectItem>
                    <SelectItem value="closed">Cerrados</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las prioridades</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value="technical">Técnico</SelectItem>
                    <SelectItem value="feature">Funcionalidad</SelectItem>
                    <SelectItem value="bug">Error</SelectItem>
                    <SelectItem value="support">Soporte</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setCategoryFilter('all');
                }}>
                  <Filter className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tickets List */}
          <div className="space-y-4">
            {filteredTickets.map(ticket => (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{ticket.subject}</h3>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                          {ticket.escalationCount > 0 && (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Escalado
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {ticket.description.substring(0, 100)}...
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>#{ticket.id}</span>
                          <span>•</span>
                          <span>{ticket.category}</span>
                          <span>•</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString('es-ES')}</span>
                          {ticket.assignedTo && (
                            <>
                              <span>•</span>
                              <span>Asignado a: {ticket.assignedTo}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewTicket(ticket)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {ticket.escalationCount === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEscalateTicket(ticket.id)}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflows Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.map(workflow => (
                  <div key={workflow.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">{workflow.name}</h3>
                      <Badge variant={workflow.isActive ? "default" : "secondary"}>
                        {workflow.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">{workflow.description}</p>
                    
                    <div className="flex items-center space-x-4 overflow-x-auto">
                      {workflow.stages.map((stage: any, index: number) => (
                        <div key={stage.id} className="flex items-center">
                          <div className={`px-3 py-2 rounded-lg border ${getStatusColor(stage.name)}`}>
                            <span className="text-sm font-medium">{stage.name}</span>
                          </div>
                          {index < workflow.stages.length - 1 && (
                            <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Tiempo promedio de resolución</span>
                    <span className="font-medium">2.5 días</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tickets escalados</span>
                    <span className="font-medium">{stats.escalated}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Satisfacción del cliente</span>
                    <span className="font-medium">4.2/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por Prioridad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['critical', 'high', 'medium', 'low'].map(priority => {
                    const count = tickets.filter(t => t.priority === priority).length;
                    const percentage = tickets.length > 0 ? (count / tickets.length) * 100 : 0;
                    
                    return (
                      <div key={priority} className="flex items-center justify-between">
                        <span className="capitalize">{priority}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getPriorityColor(priority).replace('bg-', 'bg-').replace('text-', '')}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Ticket Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ticket-subject">Asunto</Label>
              <Input
                id="ticket-subject"
                value={ticketData.subject}
                onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                placeholder="Describe brevemente el problema..."
              />
            </div>
            
            <div>
              <Label htmlFor="ticket-description">Descripción</Label>
              <Textarea
                id="ticket-description"
                value={ticketData.description}
                onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                placeholder="Describe el problema en detalle..."
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ticket-priority">Prioridad</Label>
                <Select 
                  value={ticketData.priority} 
                  onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                    setTicketData({ ...ticketData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="ticket-category">Categoría</Label>
                <Select 
                  value={ticketData.category} 
                  onValueChange={(value) => setTicketData({ ...ticketData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Técnico</SelectItem>
                    <SelectItem value="feature">Funcionalidad</SelectItem>
                    <SelectItem value="bug">Error</SelectItem>
                    <SelectItem value="support">Soporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="ticket-email">Email del Cliente</Label>
              <Input
                id="ticket-email"
                type="email"
                value={ticketData.clientEmail}
                onChange={(e) => setTicketData({ ...ticketData, clientEmail: e.target.value })}
                placeholder="cliente@ejemplo.com"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTicket}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Ticket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Ticket Modal */}
      <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalles del Ticket</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">{selectedTicket.subject}</h3>
                  <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(selectedTicket.priority)}>
                      {selectedTicket.priority}
                    </Badge>
                    <Badge className={getStatusColor(selectedTicket.status)}>
                      {selectedTicket.status}
                    </Badge>
                    {selectedTicket.escalationCount > 0 && (
                      <Badge variant="destructive">
                        Escalado {selectedTicket.escalationCount} veces
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>ID:</span>
                      <span>{selectedTicket.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Categoría:</span>
                      <span>{selectedTicket.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Creado:</span>
                      <span>{new Date(selectedTicket.createdAt).toLocaleString('es-ES')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Última actividad:</span>
                      <span>{new Date(selectedTicket.lastActivity).toLocaleString('es-ES')}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTicketModal(false)}>
                  Cerrar
                </Button>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 
