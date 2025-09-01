import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { productionConfig, isDevelopment } from '@/config/production';

// Configuración de Supabase usando variables de entorno o configuración de producción
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || productionConfig.supabase.url;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || productionConfig.supabase.anonKey;

// Verificar configuración
if (!supabaseUrl || !supabaseAnonKey) {
  if (isDevelopment()) {
    console.warn('⚠️ Variables de entorno de Supabase no configuradas, usando configuración de producción');
  } else {
    throw new Error('Faltan las variables de entorno de Supabase: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
  }
}

// Patrón Singleton para evitar múltiples instancias de GoTrueClient
let supabaseInstance: SupabaseClient | null = null;

// Función para obtener o crear la instancia única de Supabase
const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        // Configuración específica para evitar múltiples instancias
        storage: {
          key: 'tuwebai-supabase-auth',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      },
      db: {
        schema: 'public'
      }
    });
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
