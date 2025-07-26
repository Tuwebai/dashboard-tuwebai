import { firestore } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { sendEmailWithTemplate } from './emailService';

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'projects' | 'users' | 'billing' | 'analytics' | 'system' | 'reports';
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'approve';
  resource: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  role: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  avatar?: string;
  phone?: string;
  department?: string;
  position?: string;
  bio?: string;
  skills?: string[];
  preferences: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    theme: 'light' | 'dark' | 'auto';
  };
  metadata: {
    lastLogin?: string;
    loginCount: number;
    createdAt: string;
    updatedAt: string;
    invitedBy?: string;
    invitationAccepted?: boolean;
  };
}

export interface UserInvitation {
  id: string;
  email: string;
  role: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
  message?: string;
}

export interface UserAuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// Permisos predefinidos
export const PERMISSIONS: Permission[] = [
  // Proyectos
  { id: 'projects.create', name: 'Crear Proyectos', description: 'Puede crear nuevos proyectos', category: 'projects', action: 'create', resource: 'projects' },
  { id: 'projects.read', name: 'Ver Proyectos', description: 'Puede ver proyectos', category: 'projects', action: 'read', resource: 'projects' },
  { id: 'projects.update', name: 'Editar Proyectos', description: 'Puede editar proyectos', category: 'projects', action: 'update', resource: 'projects' },
  { id: 'projects.delete', name: 'Eliminar Proyectos', description: 'Puede eliminar proyectos', category: 'projects', action: 'delete', resource: 'projects' },
  { id: 'projects.export', name: 'Exportar Proyectos', description: 'Puede exportar datos de proyectos', category: 'projects', action: 'export', resource: 'projects' },
  
  // Usuarios
  { id: 'users.create', name: 'Crear Usuarios', description: 'Puede crear nuevos usuarios', category: 'users', action: 'create', resource: 'users' },
  { id: 'users.read', name: 'Ver Usuarios', description: 'Puede ver información de usuarios', category: 'users', action: 'read', resource: 'users' },
  { id: 'users.update', name: 'Editar Usuarios', description: 'Puede editar información de usuarios', category: 'users', action: 'update', resource: 'users' },
  { id: 'users.delete', name: 'Eliminar Usuarios', description: 'Puede eliminar usuarios', category: 'users', action: 'delete', resource: 'users' },
  { id: 'users.invite', name: 'Invitar Usuarios', description: 'Puede enviar invitaciones', category: 'users', action: 'create', resource: 'invitations' },
  
  // Facturación
  { id: 'billing.read', name: 'Ver Facturación', description: 'Puede ver información de facturación', category: 'billing', action: 'read', resource: 'billing' },
  { id: 'billing.create', name: 'Crear Facturas', description: 'Puede crear facturas', category: 'billing', action: 'create', resource: 'invoices' },
  { id: 'billing.update', name: 'Editar Facturas', description: 'Puede editar facturas', category: 'billing', action: 'update', resource: 'invoices' },
  { id: 'billing.approve', name: 'Aprobar Pagos', description: 'Puede aprobar pagos', category: 'billing', action: 'approve', resource: 'payments' },
  
  // Analytics
  { id: 'analytics.read', name: 'Ver Analytics', description: 'Puede ver analytics y reportes', category: 'analytics', action: 'read', resource: 'analytics' },
  { id: 'analytics.export', name: 'Exportar Analytics', description: 'Puede exportar reportes', category: 'analytics', action: 'export', resource: 'analytics' },
  
  // Sistema
  { id: 'system.settings', name: 'Configuración del Sistema', description: 'Puede modificar configuraciones del sistema', category: 'system', action: 'update', resource: 'settings' },
  { id: 'system.logs', name: 'Ver Logs', description: 'Puede ver logs del sistema', category: 'system', action: 'read', resource: 'logs' },
  { id: 'system.backup', name: 'Backup del Sistema', description: 'Puede realizar backups', category: 'system', action: 'create', resource: 'backups' }
];

// Roles predefinidos
export const DEFAULT_ROLES: UserRole[] = [
  {
    id: 'super-admin',
    name: 'Super Administrador',
    description: 'Acceso completo a todas las funcionalidades',
    permissions: PERMISSIONS.map(p => p.id),
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Administración general del sistema',
    permissions: [
      'projects.create', 'projects.read', 'projects.update', 'projects.delete', 'projects.export',
      'users.create', 'users.read', 'users.update', 'users.invite',
      'billing.read', 'billing.create', 'billing.update', 'billing.approve',
      'analytics.read', 'analytics.export',
      'system.settings', 'system.logs'
    ],
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'project-manager',
    name: 'Gerente de Proyectos',
    description: 'Gestión completa de proyectos',
    permissions: [
      'projects.create', 'projects.read', 'projects.update', 'projects.export',
      'users.read',
      'billing.read',
      'analytics.read'
    ],
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'developer',
    name: 'Desarrollador',
    description: 'Acceso a proyectos y herramientas de desarrollo',
    permissions: [
      'projects.read', 'projects.update',
      'users.read',
      'analytics.read'
    ],
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'client',
    name: 'Cliente',
    description: 'Acceso limitado a proyectos propios',
    permissions: [
      'projects.read',
      'billing.read'
    ],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

class UserManagementService {
  private roles: UserRole[] = [];
  private permissions: Permission[] = PERMISSIONS;

  constructor() {
    this.initializeRoles();
  }

  private async initializeRoles() {
    try {
      const rolesSnapshot = await getDocs(collection(firestore, 'roles'));
      if (rolesSnapshot.empty) {
        // Crear roles por defecto
        const batch = writeBatch(firestore);
        DEFAULT_ROLES.forEach(role => {
          const roleRef = doc(collection(firestore, 'roles'));
          batch.set(roleRef, role);
        });
        await batch.commit();
        this.roles = DEFAULT_ROLES;
      } else {
        this.roles = rolesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserRole));
      }
    } catch (error) {
      console.error('Error initializing roles:', error);
      this.roles = DEFAULT_ROLES;
    }
  }

  // Gestión de Roles
  public async getRoles(): Promise<UserRole[]> {
    try {
      const snapshot = await getDocs(collection(firestore, 'roles'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserRole));
    } catch (error) {
      console.error('Error getting roles:', error);
      return [];
    }
  }

  public async createRole(role: Omit<UserRole, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const roleData = {
        ...role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(firestore, 'roles'), roleData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating role:', error);
      throw new Error('No se pudo crear el rol');
    }
  }

  public async updateRole(roleId: string, updates: Partial<UserRole>): Promise<void> {
    try {
      const roleRef = doc(firestore, 'roles', roleId);
      await updateDoc(roleRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating role:', error);
      throw new Error('No se pudo actualizar el rol');
    }
  }

  public async deleteRole(roleId: string): Promise<void> {
    try {
      const roleRef = doc(firestore, 'roles', roleId);
      await deleteDoc(roleRef);
    } catch (error) {
      console.error('Error deleting role:', error);
      throw new Error('No se pudo eliminar el rol');
    }
  }

  // Gestión de Usuarios
  public async getUsers(): Promise<UserProfile[]> {
    try {
      const snapshot = await getDocs(collection(firestore, 'users'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  public async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  public async updateUser(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        metadata: {
          ...updates.metadata,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('No se pudo actualizar el usuario');
    }
  }

  public async deleteUser(userId: string): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', userId);
      await deleteDoc(userRef);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('No se pudo eliminar el usuario');
    }
  }

  // Sistema de Invitaciones
  public async inviteUser(invitation: Omit<UserInvitation, 'id' | 'token' | 'status' | 'createdAt'>): Promise<string> {
    try {
      const token = this.generateInvitationToken();
      const invitationData: UserInvitation = {
        ...invitation,
        id: '',
        token,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(firestore, 'invitations'), invitationData);
      
      // Enviar email de invitación
      await this.sendInvitationEmail(invitation.email, token, invitation.role, invitation.message);
      
      return docRef.id;
    } catch (error) {
      console.error('Error inviting user:', error);
      throw new Error('No se pudo enviar la invitación');
    }
  }

  public async getInvitations(): Promise<UserInvitation[]> {
    try {
      const snapshot = await getDocs(collection(firestore, 'invitations'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserInvitation));
    } catch (error) {
      console.error('Error getting invitations:', error);
      return [];
    }
  }

  public async acceptInvitation(token: string, userData: Partial<UserProfile>): Promise<void> {
    try {
      const invitationsRef = collection(firestore, 'invitations');
      const q = query(invitationsRef, where('token', '==', token), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Invitación no válida o expirada');
      }

      const invitation = snapshot.docs[0];
      const invitationData = invitation.data() as UserInvitation;

      if (new Date(invitationData.expiresAt) < new Date()) {
        throw new Error('La invitación ha expirado');
      }

      // Crear usuario
      const userProfile: UserProfile = {
        id: '',
        email: invitationData.email,
        role: invitationData.role,
        status: 'active',
        preferences: {
          language: 'es',
          timezone: 'America/New_York',
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          theme: 'auto'
        },
        metadata: {
          loginCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          invitedBy: invitationData.invitedBy,
          invitationAccepted: true
        },
        ...userData
      };

      await addDoc(collection(firestore, 'users'), userProfile);

      // Actualizar invitación
      const invitationRef = doc(firestore, 'invitations', invitation.id);
      await updateDoc(invitationRef, {
        status: 'accepted',
        acceptedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  // Auditoría
  public async logUserAction(userId: string, action: string, resource: string, details: any): Promise<void> {
    try {
      const auditLog: Omit<UserAuditLog, 'id'> = {
        userId,
        action,
        resource,
        details,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(firestore, 'auditLogs'), auditLog);
    } catch (error) {
      console.error('Error logging user action:', error);
    }
  }

  public async getAuditLogs(userId?: string, limit: number = 100): Promise<UserAuditLog[]> {
    try {
      let q = query(collection(firestore, 'auditLogs'), orderBy('timestamp', 'desc'));
      
      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.slice(0, limit).map(doc => ({ id: doc.id, ...doc.data() } as UserAuditLog));
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  // Verificación de Permisos
  public async hasPermission(userId: string, permissionId: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return false;

      const role = this.roles.find(r => r.id === user.role);
      if (!role) return false;

      return role.permissions.includes(permissionId);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  public async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return [];

      const role = this.roles.find(r => r.id === user.role);
      if (!role) return [];

      return this.permissions.filter(p => role.permissions.includes(p.id));
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  // Utilidades
  private generateInvitationToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private async sendInvitationEmail(email: string, token: string, role: string, message?: string): Promise<void> {
    try {
      const invitationUrl = `${window.location.origin}/invite?token=${token}`;
      
      await sendEmailWithTemplate('user_invitation', {
        to_email: email,
        invitation_url: invitationUrl,
        role: role,
        message: message || 'Has sido invitado a unirte a nuestro equipo.',
        expires_in: '7 días'
      });
    } catch (error) {
      console.error('Error sending invitation email:', error);
      throw new Error('No se pudo enviar el email de invitación');
    }
  }

  // Suscripciones en tiempo real
  public subscribeToUsers(callback: (users: UserProfile[]) => void): () => void {
    return onSnapshot(collection(firestore, 'users'), (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      callback(users);
    });
  }

  public subscribeToInvitations(callback: (invitations: UserInvitation[]) => void): () => void {
    return onSnapshot(collection(firestore, 'invitations'), (snapshot) => {
      const invitations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserInvitation));
      callback(invitations);
    });
  }
}

// Singleton instance
export const userManagementService = new UserManagementService();

export default userManagementService; 