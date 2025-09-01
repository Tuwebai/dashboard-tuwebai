import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuración de Supabase usando variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 URL de Supabase:', supabaseUrl);
console.log('🔧 Clave configurada:', supabaseAnonKey ? 'Sí' : 'No');

// Verificar que las variables estén definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Presente' : 'Faltante');
}

// Patrón Singleton para evitar múltiples instancias de GoTrueClient
let supabaseInstance: SupabaseClient | null = null;

// Storage personalizado compatible con Supabase
const createCustomStorage = () => {
  if (typeof window === 'undefined') {
    // Servidor - retornar storage mock
    return {
      getItem: (key: string) => Promise.resolve(null),
      setItem: (key: string, value: string) => Promise.resolve(),
      removeItem: (key: string) => Promise.resolve()
    };
  }

  // Cliente - usar localStorage con manejo de errores
  return {
    getItem: (key: string) => {
      try {
        const item = localStorage.getItem(key);
        return Promise.resolve(item);
      } catch (error) {
        console.warn('Error reading from localStorage:', error);
        return Promise.resolve(null);
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
        return Promise.resolve();
      } catch (error) {
        console.warn('Error writing to localStorage:', error);
        return Promise.resolve();
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key);
        return Promise.resolve();
      } catch (error) {
        console.warn('Error removing from localStorage:', error);
        return Promise.resolve();
      }
    }
  };
};

// Función para obtener o crear la instancia única de Supabase
const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    console.log('🚀 Creando cliente de Supabase...');
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    });
    console.log('✅ Cliente de Supabase creado exitosamente');
  }
  return supabaseInstance;
};

// Exportar la instancia única de Supabase
export const supabase = getSupabaseClient();

// Exportar tipos útiles
export type Database = {
  public: {
    Tables: {
                   users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: string;
          avatar_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          user_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          user_id: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          user_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: string;
          priority: string;
          user_id: string;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: string;
          priority?: string;
          user_id: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          status?: string;
          priority?: string;
          user_id?: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          status: string;
          payment_method: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          currency?: string;
          status?: string;
          payment_method: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          status?: string;
          payment_method?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      environment_variables: {
        Row: {
          id: string;
          key: string;
          value: string;
          is_sensitive: boolean;
          environment: string;
          project_id: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          key: string;
          value: string;
          is_sensitive?: boolean;
          environment?: string;
          project_id: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          key?: string;
          value?: string;
          is_sensitive?: boolean;
          environment?: string;
          project_id?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
    };
  };
};

// Exportar tipos específicos
export type User = Database['public']['Tables']['users']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Ticket = Database['public']['Tables']['tickets']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type EnvironmentVariable = Database['public']['Tables']['environment_variables']['Row'];
