import { createClient } from '@supabase/supabase-js';
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

// Crear cliente de Supabase con configuración mejorada
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
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
