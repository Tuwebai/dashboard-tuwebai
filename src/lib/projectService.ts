import { supabase } from './supabase';
import { Project, CreateProjectData, UpdateProjectData, ProjectFilters, ProjectSort } from '@/types/project.types';

// Verificar si la tabla projects existe y tiene el esquema correcto
async function checkTableSchema(): Promise<boolean> {
  try {
    // Verificar que la tabla existe y tiene las columnas necesarias
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, technologies, environment_variables, status, github_repository_url, customicon, created_at, updated_at, created_by, is_active')
      .limit(1);
    
    if (error) {
      console.warn('Table projects schema check failed:', error);
      return false;
    }
    
         // Si no hay error, el esquema es correcto
     return true;
  } catch (error) {
    console.warn('Table projects might not exist or have incorrect schema:', error);
    return false;
  }
}

// No hay datos simulados - todo se obtiene de Supabase

export const projectService = {
  // Obtener todos los proyectos con filtros y ordenamiento
  async getProjects(filters?: ProjectFilters, sort?: ProjectSort, page = 1, limit = 10) {
    try {
      const hasValidSchema = await checkTableSchema();
      
      if (!hasValidSchema) {
        console.warn('Base de datos no disponible, retornando datos vacíos');
        return {
          data: [],
          count: 0
        };
      }

      // Asegurar que siempre incluimos customicon en la consulta
      let query = supabase
        .from('projects')
        .select('id, name, description, technologies, environment_variables, status, github_repository_url, customicon, created_at, updated_at, created_by, is_active', { count: 'exact' });

      // Aplicar filtros
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.technology) {
        query = query.contains('technologies', [filters.technology]);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Aplicar ordenamiento
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Aplicar paginación
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      

      return {
        projects: data as Project[],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  // Obtener un proyecto por ID
  async getProjectById(id: string): Promise<Project> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, technologies, environment_variables, status, github_repository_url, customicon, created_at, updated_at, created_by, is_active')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      
      
      return data as Project;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  },

  // Crear un nuevo proyecto
  async createProject(projectData: CreateProjectData): Promise<Project> {
    try {
      const hasValidSchema = await checkTableSchema();
      
      if (!hasValidSchema) {
        console.warn('Cannot create project: database schema issues');
        throw new Error('No se puede crear el proyecto debido a problemas en la base de datos. Por favor, contacta al administrador.');
      }

      const { data, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  // Actualizar un proyecto
  async updateProject(id: string, projectData: UpdateProjectData): Promise<Project> {
    try {
      let updateData = { ...projectData };
      
             // Si solo estamos actualizando customicon, hacer una consulta específica
       if (Object.keys(updateData).length === 1 && updateData.customicon) {

         
         const { data, error } = await supabase
           .from('projects')
           .update({ customicon: updateData.customicon })
           .eq('id', id)
           .select('id, name, description, technologies, environment_variables, status, github_repository_url, customicon, created_at, updated_at, created_by, is_active')
           .single();

        if (error) {
          console.error('Error updating customicon:', error);
          throw error;
        }
        
        return data as Project;
      }
      
             // Para otras actualizaciones, usar el método normal
       const { data, error } = await supabase
         .from('projects')
         .update(updateData)
         .eq('id', id)
         .select('id, name, description, technologies, environment_variables, status, github_repository_url, customicon, created_at, updated_at, created_by, is_active')
         .single();

      if (error) {
        console.error('Error updating project:', error);
        throw error;
      }
      
      return data as Project;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  // Eliminar un proyecto
  async deleteProject(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // Obtener estadísticas de proyectos
  async getProjectStats() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('status, is_active');

      if (error) throw error;

      const stats = {
        total: data.length,
        active: data.filter(p => p.is_active).length,
        development: data.filter(p => p.status === 'development').length,
        production: data.filter(p => p.status === 'production').length,
        paused: data.filter(p => p.status === 'paused').length,
        maintenance: data.filter(p => p.status === 'maintenance').length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching project stats:', error);
      throw error;
    }
  },

  // Obtener tecnologías únicas
  async getUniqueTechnologies(): Promise<string[]> {
    try {
      const hasValidSchema = await checkTableSchema();
      
      if (!hasValidSchema) {
        console.warn('Base de datos no disponible, retornando tecnologías vacías');
        return [];
      }

      const { data, error } = await supabase
        .from('projects')
        .select('technologies');

      if (error) throw error;

      const allTechnologies = data
        .flatMap(p => p.technologies || [])
        .filter((tech, index, arr) => arr.indexOf(tech) === index);

      return allTechnologies;
    } catch (error) {
      console.error('Error fetching technologies:', error);
      throw error;
    }
  },

  // Validar URL de GitHub
  validateGitHubUrl(url: string): boolean {
    if (!url) return true; // URL opcional
    const githubRegex = /^https:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-._]+$/;
    return githubRegex.test(url);
  },

  // Validar datos del proyecto
  validateProjectData(data: CreateProjectData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('El nombre del proyecto es requerido');
    }

    if (data.name && data.name.length > 255) {
      errors.push('El nombre del proyecto no puede exceder 255 caracteres');
    }

    if (data.description && data.description.length > 10000) {
      errors.push('La descripción no puede exceder 10,000 caracteres');
    }

    if (data.technologies && data.technologies.length > 20) {
      errors.push('No se pueden agregar más de 20 tecnologías');
    }

    if (data.github_repository_url && !this.validateGitHubUrl(data.github_repository_url)) {
      errors.push('La URL de GitHub no es válida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
