
import { supabase } from './supabase';
import { UserProfile, UserRole, Permission, Invitation, AuditLog, UserFilters, UserSort } from '../types/user.types';
import { realAvatarService, AvatarResult } from './avatarProviders';

// =====================================================
// SERVICIO DE GESTIÓN DE USUARIOS COMPLETAMENTE INTEGRADO CON SUPABASE
// =====================================================

// Permisos del sistema
const PERMISSIONS: Permission[] = [
  { id: 'all', name: 'Todos los permisos', description: 'Acceso completo al sistema' },
  { id: 'users', name: 'Gestión de usuarios', description: 'Crear, editar y eliminar usuarios' },
  { id: 'roles', name: 'Gestión de roles', description: 'Crear, editar y eliminar roles' },
  { id: 'projects', name: 'Gestión de proyectos', description: 'Crear, editar y eliminar proyectos' },
  { id: 'teams', name: 'Gestión de equipos', description: 'Crear, editar y eliminar equipos' },
  { id: 'analytics', name: 'Analytics', description: 'Acceso a reportes y estadísticas' },
  { id: 'collaboration', name: 'Colaboración', description: 'Chat, comentarios y archivos' },
  { id: 'files', name: 'Gestión de archivos', description: 'Subir, descargar y gestionar archivos' },
  { id: 'billing', name: 'Facturación', description: 'Acceso a facturas y pagos' },
  { id: 'settings', name: 'Configuración', description: 'Configuración del sistema' }
];

export class UserManagementService {
  private permissions: Permission[] = PERMISSIONS;

  constructor() {
    this.initializeRoles();
  }

  private async initializeRoles() {
    try {
      // Verificar si ya existen roles en la tabla user_roles
      const { data: existingRoles, error } = await supabase
        .from('user_roles')
        .select('*')
        .limit(1);

      if (error) {
        console.error('Error checking existing roles:', error);
        // Si hay error, probablemente la tabla no existe, crear roles por defecto
        await this.createDefaultRoles();
      } else if (!existingRoles || existingRoles.length === 0) {
        // Si no hay roles, crear los por defecto
        await this.createDefaultRoles();
      } else {
        console.log('✅ Roles existentes encontrados en Supabase');
      }
    } catch (error) {
      console.error('Error initializing roles:', error);
      await this.createDefaultRoles();
    }
  }

  private async createDefaultRoles() {
    try {
      const defaultRoles = [
        {
          name: 'admin',
          display_name: 'Administrador',
          description: 'Acceso completo al sistema',
          permissions: ['all'],
          is_system: true,
          can_delete: false,
          can_edit: false
        },
        {
          name: 'manager',
          display_name: 'Gerente',
          description: 'Gestión de proyectos y equipos',
          permissions: ['projects', 'teams', 'users', 'analytics'],
          is_system: false,
          can_delete: true,
          can_edit: true
        },
        {
          name: 'developer',
          display_name: 'Desarrollador',
          description: 'Desarrollo y colaboración en proyectos',
          permissions: ['projects', 'collaboration', 'files'],
          is_system: false,
          can_delete: true,
          can_edit: true
        },
        {
          name: 'client',
          display_name: 'Cliente',
          description: 'Acceso a proyectos asignados',
          permissions: ['projects', 'collaboration'],
          is_system: false,
          can_delete: true,
          can_edit: true
        }
      ];

      const { error } = await supabase
        .from('user_roles')
        .insert(defaultRoles);

      if (error) {
        console.error('Error creating default roles:', error);
      } else {
        console.log('✅ Roles por defecto creados exitosamente en Supabase');
      }
    } catch (error) {
      console.error('Error creating default roles:', error);
    }
  }

  // =====================================================
  // MÉTODOS DE USUARIOS
  // =====================================================

  // =====================================================
  // MÉTODOS DE AVATAR REAL DEL CORREO REGISTRADO
  // =====================================================

  private async getRealAvatarForUser(email: string): Promise<string> {
    try {
      console.log(`🖼️ Obteniendo avatar REAL del correo registrado para: ${email}`);
      
      // Usar el nuevo servicio de avatares reales
      const avatarResult: AvatarResult = await realAvatarService.getRealAvatar(email);
      
      // Log del resultado
      if (avatarResult.isReal) {
        console.log(`✅ Avatar REAL obtenido de ${avatarResult.provider}: ${avatarResult.url}`);
      } else {
        console.log(`⚠️ Avatar temporal de ${avatarResult.provider}: ${avatarResult.url} - Razón: ${(avatarResult as any).reason || 'No especificada'}`);
      }
      
      return avatarResult.url;
    } catch (error) {
      console.error('❌ Error obteniendo avatar real:', error);
      // Fallback a avatar temporal
      return this.generateTemporaryAvatar(email);
    }
  }

  private generateTemporaryAvatar(email: string): string {
    // Usar ui-avatars.com en lugar de DiceBear como solicitaste
    const emailHash = this.hashCode(email);
    const colors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Generar iniciales del email
    const initials = email.substring(0, 2).toUpperCase();
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${randomColor}&color=fff&size=200&font-size=0.8&bold=true&format=svg`;
  }

  private hashCode(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
  }

  public async getUsers(filters?: UserFilters, sort?: UserSort, page: number = 1, limit: number = 50): Promise<{ users: UserProfile[]; total: number; page: number; totalPages: number }> {
    try {
      console.log('🔍 Cargando usuarios desde Supabase...');
      
      // Obtener usuarios de Supabase con la estructura real de la tabla
      const { data: allUsers, error: countError } = await supabase
        .from('users')
        .select('id, email, full_name, role, avatar_url, created_at, updated_at');

      if (countError) {
        console.error('❌ Error obteniendo usuarios de Supabase:', countError);
        throw new Error(`Error de Supabase: ${countError.message}`);
      }

      console.log(`📊 Total de usuarios en Supabase: ${allUsers?.length || 0}`);

      if (!allUsers || allUsers.length === 0) {
        console.log('⚠️ No hay usuarios en la base de datos');
        return { users: [], total: 0, page: 1, totalPages: 0 };
      }

      // Aplicar filtros
      let filteredUsers = allUsers;
      
      if (filters?.role && filters.role !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === filters.role);
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.email.toLowerCase().includes(searchLower) ||
          (user.full_name && user.full_name.toLowerCase().includes(searchLower))
        );
      }

      // Aplicar ordenamiento
      if (sort?.field && sort?.direction) {
        filteredUsers.sort((a, b) => {
          const aValue = a[sort.field as keyof typeof a];
          const bValue = b[sort.field as keyof typeof b];
          
          if (sort.direction === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      } else {
        filteredUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      // Aplicar paginación
      const total = filteredUsers.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      // Convertir a UserProfile usando solo los campos disponibles en Supabase
      const users: UserProfile[] = await Promise.all(paginatedUsers.map(async (user) => {
        // Obtener avatar REAL del correo registrado usando el nuevo servicio:
        // 1. Avatar guardado en la base de datos (si ya se sincronizó)
        // 2. Avatar del usuario autenticado (si es el mismo email)
        // 3. Avatar REAL del proveedor de email (Google, Microsoft, etc.)
        // 4. Avatar de Gravatar como fallback
        // 5. Avatar temporal generado (SOLO si no hay avatar real)
        
        let avatar = user.avatar_url;
        
        if (!avatar) {
          // Obtener avatar REAL del correo registrado usando el nuevo servicio
          avatar = await this.getRealAvatarForUser(user.email);
        }

        console.log(`🖼️ Avatar para ${user.email}: ${avatar} ${!avatar.includes('ui-avatars') ? '(REAL del correo registrado)' : '(TEMPORAL generado)'}`);

        return {
          id: user.id,
          email: user.email,
          display_name: user.full_name || user.email,
          role: user.role || 'user', // Valor por defecto si no hay role
          status: 'active',
          phone: '',
          department: '',
          position: '',
          bio: '',
          skills: [],
          avatar: avatar, // Avatar único para cada usuario
          created_at: user.created_at,
          updated_at: user.updated_at
        };
      }));

      console.log(`✅ Usuarios cargados exitosamente: ${users.length} de ${total} total`);
      console.log('📋 Usuarios cargados:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));

      return { users, total, page, totalPages };
    } catch (error) {
      console.error('❌ Error fatal cargando usuarios:', error);
      throw error; // Re-lanzar el error para que se maneje en el componente
    }
  }



  public async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      console.log(`🔍 Buscando usuario con ID: ${userId}`);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, avatar_url, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.log('❌ Usuario no encontrado en Supabase');
        return null;
      }

      console.log(`✅ Usuario encontrado en Supabase: ${data.email}`);

      // Obtener avatar REAL del correo registrado usando el nuevo servicio:
      // 1. Avatar guardado en la base de datos (si ya se sincronizó)
      // 2. Avatar del usuario autenticado (si es el mismo email)
      // 3. Avatar REAL del proveedor de email (Google, Microsoft, etc.)
      // 4. Avatar de Gravatar como fallback
      // 5. Avatar temporal generado (SOLO si no hay avatar real)
      
      let avatar = data.avatar_url;
      
              if (!avatar) {
          // Obtener avatar REAL del correo registrado usando el nuevo servicio
          avatar = await this.getRealAvatarForUser(data.email);
        }

        console.log(`🖼️ Avatar para ${data.email}: ${avatar} ${!avatar.includes('ui-avatars') ? '(REAL del correo registrado)' : '(TEMPORAL generado)'}`);

      return {
        id: data.id,
        email: data.email,
        display_name: data.full_name || data.email,
        role: data.role || 'user',
        status: 'active',
        phone: '',
        department: '',
        position: '',
        bio: '',
        skills: [],
        avatar: avatar, // Usar avatar de Auth, luego de DB, luego generado
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('❌ Error getting user by id:', error);
      return null;
    }
  }

  public async createUser(userData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          full_name: userData.display_name,
          role: userData.role,
                     avatar_url: userData.avatar || await this.getRealAvatarForUser(userData.email),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error || !data) {
        console.error('Error creating user:', error);
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        display_name: data.full_name || data.email,
        role: data.role,
        status: 'active',
        phone: userData.phone,
        department: userData.department,
        position: userData.position,
        bio: userData.bio,
        skills: userData.skills,
        avatar: userData.avatar,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  public async updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      console.log(`🔧 Actualizando usuario con ID: ${userId}`, updates);
      
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.email) updateData.email = updates.email;
      if (updates.display_name) updateData.full_name = updates.display_name;
      if (updates.role) updateData.role = updates.role;
      if (updates.avatar) updateData.avatar_url = updates.avatar;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error || !data) {
        console.error('❌ Error actualizando usuario en Supabase:', error);
        throw new Error(`Error de Supabase: ${error?.message || 'Error desconocido'}`);
      }

      console.log(`✅ Usuario actualizado exitosamente en Supabase`);
      return this.getUserById(userId);
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }

  public async deleteUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  public async updateUserRole(userId: string, newRole: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  }

  // =====================================================
  // MÉTODOS DE ROLES (REALES DESDE SUPABASE)
  // =====================================================

  public async getRoles(): Promise<UserRole[]> {
    try {
      // Intentar obtener roles de la tabla user_roles
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error getting roles from user_roles table:', error);
        // Si la tabla no existe, retornar roles por defecto
        return this.getDefaultRoles();
      }

      return data || [];
    } catch (error) {
      console.error('Error getting roles:', error);
      // En caso de error, retornar roles por defecto
      return this.getDefaultRoles();
    }
  }

  private getDefaultRoles(): UserRole[] {
    return [
      {
        id: 'role_1',
        name: 'admin',
        display_name: 'Administrador',
        description: 'Acceso completo al sistema',
        permissions: ['all'],
        is_system: true,
        can_delete: false,
        can_edit: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'role_2',
        name: 'manager',
        display_name: 'Gerente',
        description: 'Gestión de proyectos y equipos',
        permissions: ['projects', 'teams', 'users', 'analytics'],
        is_system: false,
        can_delete: true,
        can_edit: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'role_3',
        name: 'developer',
        display_name: 'Desarrollador',
        description: 'Desarrollo y colaboración en proyectos',
        permissions: ['projects', 'collaboration', 'files'],
        is_system: false,
        can_delete: true,
        can_edit: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'role_4',
        name: 'client',
        display_name: 'Cliente',
        description: 'Acceso a proyectos asignados',
        permissions: ['projects', 'collaboration'],
        is_system: false,
        can_delete: true,
        can_edit: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  public async createRole(roleData: Omit<UserRole, 'id' | 'created_at' | 'updated_at'>): Promise<UserRole | null> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          ...roleData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error || !data) {
        console.error('Error creating role:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating role:', error);
      return null;
    }
  }

  public async updateRole(roleId: string, updates: Partial<UserRole>): Promise<UserRole | null> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .update({
        ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId)
        .select()
        .single();

      if (error || !data) {
        console.error('Error updating role:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error updating role:', error);
      return null;
    }
  }

  public async deleteRole(roleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) {
        console.error('Error deleting role:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting role:', error);
      return false;
    }
  }

  // =====================================================
  // MÉTODOS DE INVITACIONES (REALES DESDE SUPABASE)
  // =====================================================

  public async getInvitations(): Promise<Invitation[]> {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select(`
          *,
          user_roles!inner(name, display_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting invitations:', error);
        return [];
      }

      // Convertir a formato Invitation
      return (data || []).map(inv => ({
        id: inv.id,
        email: inv.email,
        role: inv.role_id,
        invited_by: inv.invited_by,
        status: inv.status,
        token: inv.token,
        expires_at: inv.expires_at,
        message: inv.message,
        accepted_at: inv.accepted_at,
        created_at: inv.created_at,
        updated_at: inv.updated_at
      }));
    } catch (error) {
      console.error('Error getting invitations:', error);
      return [];
    }
  }

  public async createInvitation(invitationData: Omit<Invitation, 'id' | 'created_at' | 'updated_at'>): Promise<Invitation | null> {
    try {
              const { data, error } = await supabase
          .from('user_invitations')
          .insert({
            email: invitationData.email,
            role_id: invitationData.role,
            invited_by: invitationData.invited_by,
            status: invitationData.status,
            token: invitationData.token,
            expires_at: invitationData.expires_at,
            message: invitationData.message,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

      if (error || !data) {
        console.error('Error creating invitation:', error);
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        role: data.role_id,
        invited_by: data.invited_by,
        status: data.status,
        token: data.token,
        expires_at: data.expires_at,
        message: data.message,
        accepted_at: data.accepted_at,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error creating invitation:', error);
      return null;
    }
  }

  public async updateInvitation(invitationId: string, updates: Partial<Invitation>): Promise<Invitation | null> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.status) updateData.status = updates.status;
      if (updates.accepted_at) updateData.accepted_at = updates.accepted_at;

      const { data, error } = await supabase
        .from('user_invitations')
        .update(updateData)
        .eq('id', invitationId)
        .select()
        .single();

      if (error || !data) {
        console.error('Error updating invitation:', error);
      return null;
      }

      return {
        id: data.id,
        email: data.email,
        role: data.role_id,
        invited_by: data.invited_by,
        status: data.status,
        token: data.token,
        expires_at: data.expires_at,
        message: data.message,
        accepted_at: data.accepted_at,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error updating invitation:', error);
      return null;
    }
  }

  public async deleteInvitation(invitationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('Error deleting invitation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting invitation:', error);
      return false;
    }
  }

  // =====================================================
  // MÉTODOS DE AUDITORÍA (REALES DESDE SUPABASE)
  // =====================================================

  public async getAuditLogs(filters?: any, page: number = 1, limit: number = 50): Promise<{ logs: AuditLog[]; total: number; page: number; totalPages: number }> {
    try {
      let query = supabase
        .from('security_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Aplicar filtros si existen
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      if (filters?.resource) {
        query = query.eq('resource', filters.resource);
      }

      // Aplicar paginación
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error getting audit logs:', error);
        return { logs: [], total: 0, page, totalPages: 0 };
      }

      // Convertir a formato AuditLog
      const logs: AuditLog[] = (data || []).map(log => ({
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        resource: log.resource,
        resource_id: log.resource_id,
        details: log.details,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at
      }));

      const total = count || logs.length;
      const totalPages = Math.ceil(total / limit);

      return { logs, total, page, totalPages };
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return { logs: [], total: 0, page, totalPages: 0 };
    }
  }

  public async createAuditLog(logData: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog | null> {
    try {
      const { data, error } = await supabase
        .from('security_logs')
        .insert({
          user_id: logData.user_id,
          action: logData.action,
          resource: logData.resource,
          resource_id: logData.resource_id,
          details: logData.details,
          ip_address: logData.ip_address,
          user_agent: logData.user_agent,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error || !data) {
        console.error('Error creating audit log:', error);
        return null;
      }

      return {
        id: data.id,
        user_id: data.user_id,
        action: data.action,
        resource: data.resource,
        resource_id: data.resource_id,
        details: data.details,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        created_at: data.created_at
      };
    } catch (error) {
      console.error('Error creating audit log:', error);
      return null;
    }
  }

  // =====================================================
  // MÉTODOS DE ESTADÍSTICAS
  // =====================================================

  public async getUserStats(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role');

      if (error) {
        console.error('Error getting user stats:', error);
        return {};
      }

      const roles = data || [];
      return {
        total: roles.length,
        admin: roles.filter(u => u.role === 'admin').length,
        manager: roles.filter(u => u.role === 'manager').length,
        developer: roles.filter(u => u.role === 'developer').length,
        client: roles.filter(u => u.role === 'client').length
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {};
    }
  }

  public async getRoleStats(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');

      if (error) {
        console.error('Error getting role stats:', error);
        return {};
      }

      return {
        total: data?.length || 0,
        system: data?.filter(r => r.is_system).length || 0,
        custom: data?.filter(r => !r.is_system).length || 0,
        roles: data || []
      };
    } catch (error) {
      console.error('Error getting role stats:', error);
      return {};
    }
  }

  public async getInvitationStats(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('status');

      if (error) {
        console.error('Error getting invitation stats:', error);
        return {};
      }

      return {
        total: data?.length || 0,
        pending: data?.filter(i => i.status === 'pending').length || 0,
        accepted: data?.filter(i => i.status === 'accepted').length || 0,
        expired: data?.filter(i => i.status === 'expired').length || 0,
        declined: data?.filter(i => i.status === 'declined').length || 0
      };
    } catch (error) {
      console.error('Error getting invitation stats:', error);
      return {};
    }
  }

  // =====================================================
  // MÉTODOS DE PERMISOS
  // =====================================================

  public async updateUserAvatar(userId: string, avatarUrl: string): Promise<boolean> {
    try {
      console.log(`🖼️ Actualizando avatar del usuario ${userId} con URL: ${avatarUrl}`);
      
      const { error } = await supabase
        .from('users')
        .update({ 
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error actualizando avatar en Supabase:', error);
        return false;
      }

      console.log(`✅ Avatar actualizado exitosamente en Supabase`);
      return true;
    } catch (error) {
      console.error('❌ Error updating user avatar:', error);
      return false;
    }
  }

  public async syncAuthUserAvatar(email: string): Promise<boolean> {
    try {
      console.log(`🔄 Sincronizando avatar de Auth para: ${email}`);
      
             // Obtener avatar del perfil de Auth usando el nuevo servicio
       const avatarResult = await realAvatarService.getRealAvatar(email);
       const authAvatar = avatarResult.isReal ? avatarResult.url : null;
      
      if (!authAvatar) {
        console.log('❌ No se encontró avatar en Auth');
        return false;
      }

      // Buscar usuario en la base de datos
      const { data: user, error: findError } = await supabase
        .from('users')
        .select('id, avatar_url')
        .eq('email', email)
        .single();

      if (findError || !user) {
        console.log('❌ Usuario no encontrado en la base de datos');
        return false;
      }

      // Si el avatar es diferente, actualizarlo
      if (user.avatar_url !== authAvatar) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            avatar_url: authAvatar,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('❌ Error sincronizando avatar:', updateError);
          return false;
        }

        console.log(`✅ Avatar sincronizado exitosamente: ${authAvatar}`);
        return true;
      }

      console.log('✅ Avatar ya está sincronizado');
      return true;
    } catch (error) {
      console.error('❌ Error sincronizando avatar:', error);
      return false;
    }
  }

  public async syncAllUserAvatars(): Promise<void> {
    try {
      console.log('🔄 Sincronizando avatares de todos los usuarios...');
      
      // Obtener todos los usuarios
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, avatar_url')
        .order('created_at', { ascending: true });

      if (error || !users) {
        console.error('❌ Error obteniendo usuarios para sincronización:', error);
        return;
      }

      console.log(`📊 Sincronizando ${users.length} usuarios...`);

      // Sincronizar avatares uno por uno
      for (const user of users) {
        try {
                     // Intentar obtener avatar real del proveedor de email
           const avatarResult = await realAvatarService.getRealAvatar(user.email);
           const gravatarAvatar = avatarResult.isReal ? avatarResult.url : null;
          
          if (gravatarAvatar && gravatarAvatar !== user.avatar_url) {
            // Actualizar en la base de datos
            const { error: updateError } = await supabase
              .from('users')
              .update({ 
                avatar_url: gravatarAvatar,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id);

            if (updateError) {
              console.error(`❌ Error actualizando avatar de ${user.email}:`, updateError);
            } else {
              console.log(`✅ Avatar de ${user.email} actualizado: ${gravatarAvatar}`);
            }
          }
        } catch (userError) {
          console.error(`❌ Error procesando usuario ${user.email}:`, userError);
        }
      }

      console.log('✅ Sincronización de avatares completada');
    } catch (error) {
      console.error('❌ Error en sincronización masiva:', error);
    }
  }

  public async getUserAvatar(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.log('❌ Usuario no encontrado o sin avatar');
        return null;
      }

      return data.avatar_url;
    } catch (error) {
      console.error('❌ Error getting user avatar:', error);
      return null;
    }
  }

  public async hasPermission(userRole: string, permission: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('permissions')
        .eq('name', userRole)
        .single();

      if (error || !data) return false;

      if (data.permissions.includes('all')) return true;
      return data.permissions.includes(permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  public async getPermissionsForRole(roleName: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('permissions')
        .eq('name', roleName)
        .single();

      if (error || !data) return [];

      return data.permissions || [];
    } catch (error) {
      console.error('Error getting permissions for role:', error);
      return [];
    }
  }

  public getAllPermissions(): Permission[] {
    return this.permissions;
  }

  public async validateUserAccess(userId: string, requiredPermission: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return false;

      return await this.hasPermission(user.role, requiredPermission);
    } catch (error) {
      console.error('Error validating user access:', error);
      return false;
    }
  }
}

// Instancia singleton del servicio
export const userManagementService = new UserManagementService();

// Exportar funciones de conveniencia para compatibilidad
export const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getInvitations,
  createInvitation,
  updateInvitation,
  deleteInvitation,
  getAuditLogs,
  createAuditLog,
  getUserStats,
  getRoleStats,
  getInvitationStats,
  hasPermission,
  getPermissionsForRole,
  getAllPermissions,
  validateUserAccess,
  updateUserAvatar,
  getUserAvatar,
  syncAuthUserAvatar,
  syncAllUserAvatars
} = userManagementService; 
