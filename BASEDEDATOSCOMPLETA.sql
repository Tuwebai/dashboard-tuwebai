-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

-- =====================================================
-- TABLAS DEL SISTEMA DE USUARIOS Y ROLES
-- =====================================================

-- Tabla de usuarios (ya existe, pero agregamos políticas RLS)
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  full_name text,
  role text DEFAULT 'user'::text CHECK (role = ANY (ARRAY['admin'::text, 'user'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  avatar_url text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Tabla de roles de usuario
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  display_name character varying NOT NULL,
  description text,
  permissions text[] DEFAULT '{}'::text[],
  is_system boolean DEFAULT false,
  can_delete boolean DEFAULT true,
  can_edit boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id)
);

-- Tabla de invitaciones de usuario
CREATE TABLE public.user_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL,
  role_id uuid,
  invited_by uuid,
  status character varying DEFAULT 'pending'::character varying CHECK (status = ANY (ARRAY['pending'::character varying, 'accepted'::character varying, 'expired'::character varying, 'cancelled'::character varying, 'declined'::character varying])),
  token character varying NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  message text,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT user_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id),
  CONSTRAINT user_invitations_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.user_roles(id)
);

-- Tabla de logs de auditoría
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action character varying NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address character varying,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla users
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para la tabla user_roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para la tabla user_invitations
CREATE POLICY "Admins can view all invitations" ON public.user_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert invitations" ON public.user_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update invitations" ON public.user_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete invitations" ON public.user_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para la tabla audit_logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar roles por defecto
INSERT INTO public.user_roles (name, display_name, description, permissions, is_system, can_delete, can_edit) VALUES
('admin', 'Administrador', 'Acceso completo al sistema', ARRAY['*'], true, false, false),
('user', 'Usuario', 'Usuario con permisos básicos', ARRAY['projects.view', 'tickets.view'], true, false, false),
('manager', 'Gerente', 'Gestión de proyectos y equipos', ARRAY['projects.manage', 'teams.manage', 'users.view'], false, true, true),
('developer', 'Desarrollador', 'Desarrollo y colaboración en proyectos', ARRAY['projects.manage', 'collaboration.manage', 'files.manage'], false, true, true);

-- Insertar usuario administrador por defecto (si no existe)
INSERT INTO public.users (email, full_name, role, created_at, updated_at)
SELECT 'admin@tuwebai.com', 'Administrador del Sistema', 'admin', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@tuwebai.com');

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_invitations_updated_at BEFORE UPDATE ON public.user_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear log de auditoría automáticamente
CREATE OR REPLACE FUNCTION log_user_action()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (user_id, action, details)
        VALUES (NEW.id, 'user_created', jsonb_build_object('email', NEW.email, 'role', NEW.role));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (user_id, action, details)
        VALUES (NEW.id, 'user_updated', jsonb_build_object('email', NEW.email, 'role', NEW.role, 'changes', jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role)));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (user_id, action, details)
        VALUES (OLD.id, 'user_deleted', jsonb_build_object('email', OLD.email, 'role', OLD.role));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger para logs de auditoría de usuarios
CREATE TRIGGER audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION log_user_action();

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para la tabla users
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- Índices para la tabla user_roles
CREATE INDEX idx_user_roles_name ON public.user_roles(name);
CREATE INDEX idx_user_roles_is_system ON public.user_roles(is_system);

-- Índices para la tabla user_invitations
CREATE INDEX idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX idx_user_invitations_status ON public.user_invitations(status);
CREATE INDEX idx_user_invitations_token ON public.user_invitations(token);
CREATE INDEX idx_user_invitations_expires_at ON public.user_invitations(expires_at);

-- Índices para la tabla audit_logs
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para usuarios con información de roles
CREATE OR REPLACE VIEW public.users_with_roles AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.created_at,
    u.updated_at,
    u.avatar_url,
    ur.display_name as role_display_name,
    ur.description as role_description,
    ur.permissions as role_permissions
FROM public.users u
LEFT JOIN public.user_roles ur ON u.role = ur.name;

-- Vista para estadísticas de usuarios
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
    COUNT(CASE WHEN created_at >= now() - interval '30 days' THEN 1 END) as new_users_month,
    COUNT(CASE WHEN created_at >= now() - interval '7 days' THEN 1 END) as new_users_week
FROM public.users;

-- =====================================================
-- RESTRICCIONES ADICIONALES
-- =====================================================

-- Asegurar que no se pueda eliminar el último administrador
CREATE OR REPLACE FUNCTION prevent_last_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role = 'admin' THEN
        IF (SELECT COUNT(*) FROM public.users WHERE role = 'admin') <= 1 THEN
            RAISE EXCEPTION 'No se puede eliminar el último administrador del sistema';
        END IF;
    END IF;
    RETURN OLD;
END;
$$ language 'plpgsql';

CREATE TRIGGER prevent_last_admin_deletion_trigger
    BEFORE DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION prevent_last_admin_deletion();

-- Asegurar que no se pueda cambiar el rol del último administrador
CREATE OR REPLACE FUNCTION prevent_last_admin_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role = 'admin' AND NEW.role != 'admin' THEN
        IF (SELECT COUNT(*) FROM public.users WHERE role = 'admin') <= 1 THEN
            RAISE EXCEPTION 'No se puede cambiar el rol del último administrador del sistema';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER prevent_last_admin_role_change_trigger
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION prevent_last_admin_role_change();

-- =====================================================
-- TABLAS EXISTENTES (mantener estructura original)
-- =====================================================

CREATE TABLE public.automation_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  automation_type character varying NOT NULL CHECK (automation_type::text = ANY (ARRAY['workflow'::character varying, 'trigger'::character varying, 'task'::character varying, 'pipeline'::character varying]::text[])),
  automation_id uuid NOT NULL,
  action character varying NOT NULL,
  status character varying NOT NULL CHECK (status::text = ANY (ARRAY['success'::character varying, 'error'::character varying, 'warning'::character varying, 'info'::character varying]::text[])),
  message text,
  details jsonb DEFAULT '{}'::jsonb,
  execution_time_ms integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT automation_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.automation_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['daily'::character varying, 'weekly'::character varying, 'monthly'::character varying, 'on_event'::character varying, 'custom'::character varying]::text[])),
  script text,
  script_type character varying DEFAULT 'sql'::character varying,
  parameters jsonb DEFAULT '{}'::jsonb,
  last_run timestamp with time zone,
  next_run timestamp with time zone,
  run_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  last_error text,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT automation_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT automation_tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  chat_room_id uuid NOT NULL,
  text text NOT NULL,
  sender character varying NOT NULL,
  sender_name character varying NOT NULL,
  timestamp timestamp with time zone DEFAULT now(),
  type character varying DEFAULT 'text'::character varying CHECK (type::text = ANY (ARRAY['text'::character varying, 'file'::character varying, 'system'::character varying]::text[])),
  project_id uuid,
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chat_rooms (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,
  participants ARRAY DEFAULT '{}'::character varying[],
  created_at timestamp with time zone DEFAULT now(),
  unread_count integer DEFAULT 0,
  project_name character varying NOT NULL,
  last_message text,
  last_message_time timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_rooms_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ci_cd_pipelines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  project_id uuid,
  repository_url character varying,
  branch character varying DEFAULT 'main'::character varying,
  stages jsonb DEFAULT '[]'::jsonb,
  triggers jsonb DEFAULT '[]'::jsonb,
  status character varying DEFAULT 'idle'::character varying CHECK (status::text = ANY (ARRAY['idle'::character varying, 'running'::character varying, 'success'::character varying, 'failed'::character varying, 'cancelled'::character varying]::text[])),
  current_stage character varying,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  duration_seconds integer,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ci_cd_pipelines_pkey PRIMARY KEY (id),
  CONSTRAINT ci_cd_pipelines_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT ci_cd_pipelines_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  text text NOT NULL,
  author character varying NOT NULL,
  author_name character varying NOT NULL,
  phase_key character varying,
  project_id uuid NOT NULL,
  timestamp timestamp with time zone DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.commits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  commit_hash character varying NOT NULL,
  message text NOT NULL,
  author character varying NOT NULL,
  branch character varying DEFAULT 'main'::character varying,
  files_changed ARRAY DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT commits_pkey PRIMARY KEY (id),
  CONSTRAINT commits_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.deployment_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  environment character varying NOT NULL CHECK (environment::text = ANY (ARRAY['development'::character varying, 'staging'::character varying, 'production'::character varying]::text[])),
  build_command text NOT NULL,
  test_command text,
  deploy_command text NOT NULL,
  health_check_path character varying NOT NULL DEFAULT '/health'::character varying,
  health_check_timeout integer DEFAULT 30,
  max_deployment_time integer DEFAULT 600,
  rollback_threshold integer DEFAULT 5,
  notifications jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT deployment_configs_pkey PRIMARY KEY (id),
  CONSTRAINT deployment_configs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.deployments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  version_id uuid,
  project_id uuid,
  environment character varying NOT NULL CHECK (environment::text = ANY (ARRAY['development'::character varying, 'staging'::character varying, 'production'::character varying]::text[])),
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying]::text[])),
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  deployed_by uuid,
  deployment_logs text NOT NULL DEFAULT ''::text,
  rollback_available boolean DEFAULT false,
  rollback_to character varying,
  health_check_url character varying,
  health_check_status character varying CHECK (health_check_status::text = ANY (ARRAY['healthy'::character varying, 'unhealthy'::character varying, 'unknown'::character varying]::text[])),
  performance_metrics jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT deployments_pkey PRIMARY KEY (id),
  CONSTRAINT deployments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT deployments_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.project_versions(id),
  CONSTRAINT deployments_deployed_by_fkey FOREIGN KEY (deployed_by) REFERENCES auth.users(id)
);
CREATE TABLE public.environment_variables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key character varying NOT NULL,
  value text NOT NULL,
  is_sensitive boolean DEFAULT false,
  environment character varying NOT NULL DEFAULT 'production'::character varying,
  project_id uuid,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT environment_variables_pkey PRIMARY KEY (id),
  CONSTRAINT environment_variables_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT environment_variables_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.environments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  name character varying NOT NULL CHECK (name::text = ANY (ARRAY['development'::character varying, 'staging'::character varying, 'production'::character varying]::text[])),
  display_name character varying NOT NULL,
  description text,
  url character varying,
  is_active boolean DEFAULT true,
  auto_deploy boolean DEFAULT false,
  branch character varying NOT NULL,
  health_check_url character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT environments_pkey PRIMARY KEY (id),
  CONSTRAINT environments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.notification_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  project_updates boolean DEFAULT true,
  ticket_updates boolean DEFAULT true,
  payment_updates boolean DEFAULT true,
  security_alerts boolean DEFAULT true,
  system_notifications boolean DEFAULT true,
  daily_summary boolean DEFAULT false,
  weekly_report boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_settings_pkey PRIMARY KEY (id),
  CONSTRAINT notification_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title character varying NOT NULL,
  message text NOT NULL,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['info'::character varying, 'success'::character varying, 'warning'::character varying, 'error'::character varying, 'critical'::character varying]::text[])),
  category character varying NOT NULL CHECK (category::text = ANY (ARRAY['system'::character varying, 'project'::character varying, 'ticket'::character varying, 'payment'::character varying, 'security'::character varying, 'user'::character varying]::text[])),
  is_read boolean DEFAULT false,
  is_urgent boolean DEFAULT false,
  action_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD'::text,
  status text DEFAULT 'pending'::text,
  payment_method text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.project_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  path text NOT NULL,
  size bigint NOT NULL DEFAULT 0,
  type character varying NOT NULL DEFAULT 'other'::character varying,
  mime_type character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  project_id uuid,
  version integer NOT NULL DEFAULT 1,
  is_public boolean NOT NULL DEFAULT false,
  permissions ARRAY NOT NULL DEFAULT ARRAY['read'::text, 'write'::text],
  folder_path character varying DEFAULT ''::character varying,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT project_files_pkey PRIMARY KEY (id),
  CONSTRAINT project_files_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT project_files_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.project_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  version character varying NOT NULL,
  description text NOT NULL,
  changes jsonb NOT NULL DEFAULT '[]'::jsonb,
  environment character varying NOT NULL CHECK (environment::text = ANY (ARRAY['development'::character varying, 'staging'::character varying, 'production'::character varying]::text[])),
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['draft'::character varying, 'in_review'::character varying, 'approved'::character varying, 'deployed'::character varying, 'failed'::character varying, 'rolled_back'::character varying, 'pending'::character varying, 'production'::character varying, 'staging'::character varying]::text[])),
  build_number integer NOT NULL DEFAULT 1,
  commit_hash character varying,
  branch character varying,
  build_logs text,
  deployment_logs text,
  rollback_to character varying,
  deployed_at timestamp with time zone,
  deployed_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_versions_pkey PRIMARY KEY (id),
  CONSTRAINT project_versions_deployed_by_fkey FOREIGN KEY (deployed_by) REFERENCES auth.users(id),
  CONSTRAINT project_versions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.project_workflows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  project_type character varying,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_workflows_pkey PRIMARY KEY (id),
  CONSTRAINT project_workflows_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  technologies ARRAY,
  environment_variables jsonb,
  status character varying DEFAULT 'development'::character varying CHECK (status::text = ANY (ARRAY['development'::character varying, 'production'::character varying, 'paused'::character varying, 'maintenance'::character varying]::text[])),
  github_repository_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  is_active boolean DEFAULT true,
  customicon character varying DEFAULT 'FolderOpen'::character varying,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.scheduled_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  template_id character varying,
  schedule character varying NOT NULL,
  recipients jsonb DEFAULT '[]'::jsonb,
  format character varying DEFAULT 'pdf'::character varying CHECK (format::text = ANY (ARRAY['pdf'::character varying, 'excel'::character varying, 'html'::character varying, 'csv'::character varying]::text[])),
  parameters jsonb DEFAULT '{}'::jsonb,
  last_generated timestamp with time zone,
  next_generation timestamp with time zone,
  generation_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT scheduled_reports_pkey PRIMARY KEY (id),
  CONSTRAINT scheduled_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title character varying NOT NULL,
  description text,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'in-progress'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[])),
  priority character varying DEFAULT 'medium'::character varying CHECK (priority::text = ANY (ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying]::text[])),
  assignee character varying NOT NULL,
  assignee_name character varying NOT NULL,
  due_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  project_id uuid NOT NULL,
  phase_key character varying,
  CONSTRAINT tasks_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tickets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  status text DEFAULT 'open'::text,
  priority text DEFAULT 'medium'::text,
  user_id uuid,
  assigned_to uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tickets_pkey PRIMARY KEY (id),
  CONSTRAINT tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id),
  CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.version_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL,
  user_email text NOT NULL,
  comment text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT version_comments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.workflow_executions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workflow_id uuid,
  project_id uuid,
  status character varying DEFAULT 'running'::character varying CHECK (status::text = ANY (ARRAY['running'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying]::text[])),
  current_step_id uuid,
  step_results jsonb DEFAULT '[]'::jsonb,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  duration_seconds integer,
  error_message text,
  created_by uuid,
  CONSTRAINT workflow_executions_pkey PRIMARY KEY (id),
  CONSTRAINT workflow_executions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT workflow_executions_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.project_workflows(id),
  CONSTRAINT workflow_executions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT workflow_executions_current_step_id_fkey FOREIGN KEY (current_step_id) REFERENCES public.workflow_steps(id)
);
CREATE TABLE public.workflow_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workflow_id uuid,
  name character varying NOT NULL,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['approval'::character varying, 'notification'::character varying, 'status_change'::character varying, 'email'::character varying, 'assignment'::character varying, 'condition'::character varying]::text[])),
  order_index integer NOT NULL,
  conditions jsonb DEFAULT '{}'::jsonb,
  actions jsonb DEFAULT '{}'::jsonb,
  timeout_seconds integer DEFAULT 3600,
  retry_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT workflow_steps_pkey PRIMARY KEY (id),
  CONSTRAINT workflow_steps_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.project_workflows(id)
);