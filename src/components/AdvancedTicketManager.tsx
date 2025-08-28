import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { SupabaseService, type Ticket } from '@/lib/supabaseService';
import { 
  Ticket as TicketIcon, 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  Calendar,
  User,
  Tag,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  Eye,
  RefreshCw
} from 'lucide-react';

interface TicketFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  assigned_to: string;
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  highPriority: number;
  urgentPriority: number;
}

interface AdvancedTicketManagerProps {
  tickets?: Ticket[];
  updateTicketStatus?: (ticketId: string, status: string) => void;
  updateUserRole?: (userId: string, role: string) => void;
  refreshData?: () => void;
  lastUpdate?: Date;
}

export default function AdvancedTicketManager({ 
  tickets: externalTickets,
  updateTicketStatus,
  refreshData,
  lastUpdate
}: AdvancedTicketManagerProps) {
  const { user } = useApp();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [formData, setFormData] = useState<TicketFormData>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'open',
    category: '',
    assigned_to: ''
  });

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Stats
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    highPriority: 0,
    urgentPriority: 0
  });

  // Load tickets - use external tickets if provided, otherwise load from Supabase
  useEffect(() => {
    if (externalTickets) {
      setTickets(externalTickets);
      setLoading(false);
    } else if (user) {
      loadTickets();
    }
  }, [externalTickets, user]);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...tickets];

    // Search
    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.assigned_to?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Ticket];
      let bValue: any = b[sortBy as keyof Ticket];

      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTickets(filtered);
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter, sortBy, sortOrder]);

  // Calculate stats
  useEffect(() => {
    const newStats: TicketStats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length,
      highPriority: tickets.filter(t => t.priority === 'high').length,
      urgentPriority: tickets.filter(t => t.priority === 'urgent').length
    };

    setStats(newStats);
  }, [tickets]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const ticketsData = await SupabaseService.getTickets();
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los tickets.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos obligatorios.',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingTicket) {
        // Update existing ticket
        await SupabaseService.updateTicket(editingTicket.id, {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          status: formData.status,
          category: formData.category,
          assigned_to: formData.assigned_to
        });

        toast({
          title: 'Ticket actualizado',
          description: 'El ticket ha sido actualizado correctamente.'
        });
      } else {
        // Create new ticket
        await SupabaseService.createTicket({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          status: formData.status,
          user_id: user?.email || '',
          assigned_to: formData.assigned_to,
          category: formData.category
        });

        toast({
          title: 'Ticket creado',
          description: 'El ticket ha sido creado correctamente.'
        });
      }

      // Reset form and reload tickets
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'open',
        category: '',
        assigned_to: ''
      });
      setShowForm(false);
      setEditingTicket(null);
      
      // Refresh data if callback provided
      if (refreshData) {
        refreshData();
      } else {
        loadTickets();
      }
    } catch (error) {
      console.error('Error saving ticket:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el ticket.',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description || '',
      priority: ticket.priority as any,
      status: ticket.status as any,
      category: ticket.category || '',
      assigned_to: ticket.assigned_to || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (ticketId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este ticket?')) return;

    try {
      await SupabaseService.updateTicket(ticketId, { status: 'closed' });
      toast({
        title: 'Ticket cerrado',
        description: 'El ticket ha sido cerrado.'
      });
      
      // Refresh data if callback provided
      if (refreshData) {
        refreshData();
      } else {
        loadTickets();
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el ticket.',
        variant: 'destructive'
      });
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      if (updateTicketStatus) {
        // Use external callback if provided
        updateTicketStatus(ticketId, newStatus);
      } else {
        // Update directly in Supabase
        await SupabaseService.updateTicket(ticketId, { status: newStatus });
        toast({
          title: 'Estado actualizado',
          description: 'El estado del ticket ha sido actualizado.'
        });
      }
      
      // Refresh data
      if (refreshData) {
        refreshData();
      } else {
        loadTickets();
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del ticket.',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-3 text-muted-foreground">Cargando tickets...</p>
      </div>
    );
  }

  // Si no hay tickets, mostrar mensaje apropiado
  if (tickets.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Tickets</h1>
            <p className="text-muted-foreground">Administra y rastrea todos los tickets del sistema</p>
            {lastUpdate && (
              <p className="text-sm text-muted-foreground mt-1">
                Última actualización: {lastUpdate.toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {refreshData && (
              <Button variant="outline" onClick={refreshData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            )}
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Ticket
            </Button>
          </div>
        </div>

        {/* Stats Cards - Empty State */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <TicketIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Abiertos</p>
                  <p className="text-2xl font-bold text-blue-500">0</p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En Progreso</p>
                  <p className="text-2xl font-bold text-yellow-500">0</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resueltos</p>
                  <p className="text-2xl font-bold text-green-500">0</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="p-12 text-center">
            <TicketIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No hay tickets registrados</h3>
            <p className="text-muted-foreground mb-4">
              Cuando se creen tickets de soporte, aparecerán aquí para su gestión.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Ticket
            </Button>
          </CardContent>
        </Card>

        {/* Ticket Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingTicket ? 'Editar Ticket' : 'Nuevo Ticket'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTicket(null);
                    setFormData({
                      title: '',
                      description: '',
                      priority: 'medium',
                      status: 'open',
                      category: '',
                      assigned_to: ''
                    });
                  }}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Título del ticket"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Estado</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Abierto</SelectItem>
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="resolved">Resuelto</SelectItem>
                        <SelectItem value="closed">Cerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="assigned_to">Asignado a</Label>
                    <Input
                      id="assigned_to"
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      placeholder="Email del usuario"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Categoría del ticket"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descripción *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción detallada del ticket"
                    rows={4}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingTicket(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingTicket ? 'Actualizar' : 'Crear'} Ticket
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Tickets</h1>
          <p className="text-muted-foreground">Administra y rastrea todos los tickets del sistema</p>
          {lastUpdate && (
            <p className="text-sm text-muted-foreground mt-1">
              Última actualización: {lastUpdate.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {refreshData && (
            <Button variant="outline" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          )}
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Ticket
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <TicketIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Abiertos</p>
                <p className="text-2xl font-bold text-blue-500">{stats.open}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En Progreso</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resueltos</p>
                <p className="text-2xl font-bold text-green-500">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Abierto</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="resolved">Resuelto</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridad</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="order">Orden</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-full"
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TicketIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron tickets</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <div key={ticket.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{ticket.title}</h3>
                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusIcon(ticket.status)}
                            {ticket.status === 'open' && 'Abierto'}
                            {ticket.status === 'in_progress' && 'En Progreso'}
                            {ticket.status === 'resolved' && 'Resuelto'}
                            {ticket.status === 'closed' && 'Cerrado'}
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority === 'low' && 'Baja'}
                            {ticket.priority === 'medium' && 'Media'}
                            {ticket.priority === 'high' && 'Alta'}
                            {ticket.priority === 'urgent' && 'Urgente'}
                          </Badge>
                        </div>
                        
                        {ticket.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {ticket.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {ticket.assigned_to || 'Sin asignar'}
                          </span>
                          {ticket.category && (
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {ticket.category}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={ticket.status}
                          onValueChange={(value) => handleStatusChange(ticket.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Abierto</SelectItem>
                            <SelectItem value="in_progress">En Progreso</SelectItem>
                            <SelectItem value="resolved">Resuelto</SelectItem>
                            <SelectItem value="closed">Cerrado</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(ticket)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(ticket.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Ticket Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingTicket ? 'Editar Ticket' : 'Nuevo Ticket'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setEditingTicket(null);
                  setFormData({
                    title: '',
                    description: '',
                    priority: 'medium',
                    status: 'open',
                    category: '',
                    assigned_to: ''
                  });
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título del ticket"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Estado</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Abierto</SelectItem>
                      <SelectItem value="in_progress">En Progreso</SelectItem>
                      <SelectItem value="resolved">Resuelto</SelectItem>
                      <SelectItem value="closed">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assigned_to">Asignado a</Label>
                  <Input
                    id="assigned_to"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    placeholder="Email del usuario"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Categoría del ticket"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción detallada del ticket"
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTicket(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTicket ? 'Actualizar' : 'Crear'} Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
