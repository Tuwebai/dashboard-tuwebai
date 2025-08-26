import { supabase } from './supabase';
import type { User, Project, Ticket, Payment } from './supabase';

// Servicio de usuarios
export const userService = {
  // Crear o actualizar usuario
  async upsertUser(userData: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .upsert(userData, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Obtener usuario por ID
  async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Obtener usuario por email
  async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Actualizar usuario
  async updateUser(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Eliminar usuario
  async deleteUser(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Servicio de proyectos
export const projectService = {
  // Crear proyecto
  async createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Obtener proyectos de un usuario
  async getUserProjects(userId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Obtener proyecto por ID
  async getProjectById(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Actualizar proyecto
  async updateProject(id: string, updates: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Eliminar proyecto
  async deleteProject(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Suscribirse a cambios en tiempo real
  subscribeToProjects(userId: string, callback: (projects: Project[]) => void) {
    return supabase
      .channel('projects')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `created_by=eq.${userId}`
        },
        () => {
          this.getUserProjects(userId).then(callback);
        }
      )
      .subscribe();
  }
};

// Servicio de tickets
export const ticketService = {
  // Crear ticket
  async createTicket(ticketData: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Obtener tickets de un usuario
  async getUserTickets(userId: string) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('created_by', userId) // Cambiar a created_by o la columna correcta
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Tickets table may not exist or have different schema:', error);
        return [];
      }
      return data;
    } catch (error) {
      console.warn('Error getting user tickets:', error);
      return [];
    }
  },

  // Obtener tickets asignados a un usuario
  async getAssignedTickets(userId: string) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Obtener ticket por ID
  async getTicketById(id: string) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Actualizar ticket
  async updateTicket(id: string, updates: Partial<Ticket>) {
    const { data, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Eliminar ticket
  async deleteTicket(id: string) {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Suscribirse a cambios en tiempo real
  subscribeToTickets(userId: string, callback: (tickets: Ticket[]) => void) {
    return supabase
      .channel('tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `created_by=eq.${userId}`
        },
        () => {
          this.getUserTickets(userId).then(callback);
        }
      )
      .subscribe();
  }
};

// Servicio de pagos
export const paymentService = {
  // Crear pago
  async createPayment(paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Obtener pagos de un usuario
  async getUserPayments(userId: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId) // Mantener user_id para payments si es correcto
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Payments table may not exist or have different schema:', error);
        return [];
      }
      return data;
    } catch (error) {
      console.warn('Error getting user payments:', error);
      return [];
    }
  },

  // Obtener pago por ID
  async getPaymentById(id: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Actualizar pago
  async updatePayment(id: string, updates: Partial<Payment>) {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Eliminar pago
  async deletePayment(id: string) {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Servicio de almacenamiento
export const storageService = {
  // Subir archivo
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    
    if (error) throw error;
    return data;
  },

  // Obtener URL pública
  async getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  // Eliminar archivo
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
  },

  // Listar archivos
  async listFiles(bucket: string, path?: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path);
    
    if (error) throw error;
    return data;
  }
};
