// =====================================================
// INTERFACES Y TIPOS AVANZADOS
// =====================================================

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
  size?: number;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  download_url?: string;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author?: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected?: boolean;
}

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  language: string | null;
  default_branch: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  homepage: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  has_downloads: boolean;
  archived: boolean;
  disabled: boolean;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string;
  } | null;
}

interface GitHubLanguage {
  [key: string]: number;
}

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
}

interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
}

interface PackageJson {
  name?: string;
  displayName?: string;
  description?: string;
  version?: string;
  private?: boolean;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  type?: 'module' | 'commonjs';
}

interface RequirementsTxt {
  packages: string[];
}

interface DockerCompose {
  services: Record<string, any>;
  version?: string;
}

interface EnvironmentFile {
  variables: Record<string, string>;
  confidence: number;
}

// Interfaz para la información detectada desde GitHub
export interface DetectedInfo {
  name: string;
  description: string;
  technologies: string[];
  github_repository_url: string;
  status: 'development' | 'production' | 'maintenance';
  is_active: boolean;
  environment_variables: Record<string, string>;
  confidence: number;
  analysis: {
    hasReadme: boolean;
    hasPackageJson: boolean;
    hasDocker: boolean;
    hasCI: boolean;
    lastCommitDate: string;
    hasReleases: boolean;
    isMonorepo: boolean;
    detectedFrameworks: string[];
    detectedDatabases: string[];
    detectedCloudServices: string[];
    detectedCITools: string[];
  };
}

// =====================================================
// CONSTANTES Y CONFIGURACIÓN
// =====================================================

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';

// Tecnologías conocidas para detección inteligente
const KNOWN_FRAMEWORKS = {
  // Frontend
  'react': ['React', 'react', 'react-dom', '@types/react'],
  'vue': ['Vue', 'vue', 'vue-router', 'vuex'],
  'angular': ['Angular', '@angular/core', '@angular/common'],
  'svelte': ['Svelte', 'svelte'],
  'next': ['Next.js', 'next', 'next-auth'],
  'nuxt': ['Nuxt', 'nuxt'],
  'gatsby': ['Gatsby', 'gatsby'],
  
  // Backend
  'express': ['Express', 'express'],
  'fastify': ['Fastify', 'fastify'],
  'koa': ['Koa', 'koa'],
  'nest': ['NestJS', '@nestjs/core', '@nestjs/common'],
  'django': ['Django', 'django'],
  'flask': ['Flask', 'flask'],
  'spring': ['Spring Boot', 'spring-boot-starter'],
  'laravel': ['Laravel', 'laravel/framework'],
  
  // Mobile
  'react-native': ['React Native', 'react-native'],
  'flutter': ['Flutter', 'flutter'],
  'ionic': ['Ionic', '@ionic/core'],
  
  // Full-stack
  't3': ['T3 Stack', '@trpc/server', '@trpc/client'],
  'remix': ['Remix', '@remix-run/react'],
  'sveltekit': ['SvelteKit', '@sveltejs/kit'],
};

const KNOWN_DATABASES = {
  'postgresql': ['postgres', 'pg', 'postgresql', 'postgresql-client'],
  'mysql': ['mysql', 'mysql2', 'mariadb'],
  'mongodb': ['mongodb', 'mongoose', 'mongo'],
  'redis': ['redis', 'ioredis', 'node-redis'],
  'sqlite': ['sqlite3', 'better-sqlite3'],
  'supabase': ['@supabase/supabase-js', 'supabase'],
  'firebase': ['firebase', '@firebase/app'],
};

const KNOWN_CLOUD_SERVICES = {
  'vercel': ['vercel.json', 'vercel'],
  'netlify': ['netlify.toml', 'netlify'],
  'aws': ['aws-sdk', 'serverless', 'aws'],
  'azure': ['azure', '@azure/identity'],
  'gcp': ['google-cloud', '@google-cloud'],
  'heroku': ['heroku', 'procfile'],
  'railway': ['railway'],
  'render': ['render'],
};

const KNOWN_CI_TOOLS = {
  'github-actions': ['.github/workflows'],
  'gitlab-ci': ['.gitlab-ci.yml'],
  'jenkins': ['Jenkinsfile', 'jenkins'],
  'circleci': ['.circleci'],
  'travis': ['.travis.yml'],
  'azure-devops': ['azure-pipelines.yml'],
};

// Patrones para detección de variables de entorno
const ENV_PATTERNS = [
  /^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/gm, // .env
  /^([A-Z_][A-Z0-9_]*):\s*(.+)$/gm,    // docker-compose
  /process\.env\.([A-Z_][A-Z0-9_]*)/g,  // JavaScript
  /\$([A-Z_][A-Z0-9_]*)/g,              // Shell
];

class GitHubService {
  private baseUrl = GITHUB_API_BASE;
  private token: string | null = null;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor() {
    // Obtener token desde variables de entorno
    this.token = import.meta.env.VITE_GITHUB_TOKEN || null;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `GitHub API error: ${response.status}`);
    }

    return response.json();
  }

  // Extraer información del repositorio desde la URL
  parseRepositoryUrl(repoUrl: string): { owner: string; repo: string } | null {
    try {
      const url = new URL(repoUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      if (pathParts.length >= 2) {
      return {
        owner: pathParts[0],
          repo: pathParts[1].replace('.git', ''),
      };
      }
    } catch (error) {
      console.error('Error parsing repository URL:', error);
    }
    
      return null;
    }

  // =====================================================
  // MÉTODOS DE OBTENCIÓN DE DATOS
  // =====================================================

  /**
   * Obtener información completa del repositorio
   */
  async getRepositoryInfo(repoUrl: string): Promise<GitHubRepository> {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    return this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}`);
  }

  /**
   * Obtener lenguajes del repositorio
   */
  async getRepositoryLanguages(repoUrl: string): Promise<GitHubLanguage> {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    return this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}/languages`);
  }

  /**
   * Obtener contenido del README
   */
  async getReadmeContent(repoUrl: string): Promise<any> {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    return this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}/readme`);
  }

  /**
   * Obtener releases del repositorio
   */
  async getReleases(repoUrl: string): Promise<GitHubRelease[]> {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    return this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}/releases`);
  }

  /**
   * Obtener workflows de GitHub Actions
   */
  async getWorkflows(repoUrl: string): Promise<GitHubWorkflow[]> {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    try {
      const workflows = await this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}/actions/workflows`);
      return workflows.workflows || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Obtener package.json del repositorio
   */
  async getPackageJson(repoUrl: string): Promise<PackageJson | null> {
    try {
      const content = await this.getFileContent(repoUrl, 'package.json');
      if (content && content.content) {
        return JSON.parse(content.content);
      }
    } catch (error) {
      // package.json no encontrado o error de parsing
    }
    return null;
  }

  /**
   * Obtener docker-compose.yml del repositorio
   */
  async getDockerCompose(repoUrl: string): Promise<DockerCompose | null> {
    try {
      const content = await this.getFileContent(repoUrl, 'docker-compose.yml');
      if (content && content.content) {
        return JSON.parse(content.content);
      }
    } catch (error) {
      // docker-compose.yml no encontrado o error de parsing
    }
    return null;
  }

  /**
   * Obtener archivos de variables de entorno
   */
  async getEnvironmentFiles(repoUrl: string): Promise<EnvironmentFile[]> {
    const envFiles: EnvironmentFile[] = [];
    const envFileNames = ['.env.example', '.env.sample', '.env.template', '.env.local'];
    
    for (const fileName of envFileNames) {
      try {
        const content = await this.getFileContent(repoUrl, fileName);
        if (content && content.content) {
          const variables = this.parseEnvironmentFile(content.content);
          envFiles.push({
            variables,
            confidence: 0.9
          });
        }
      } catch (error) {
        // Archivo no encontrado
      }
    }

    return envFiles;
  }

  // Obtener contenido de un archivo
  async getFileContent(repoUrl: string, path: string, branch: string = 'main') {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    const response = await this.request(
      `/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${encodeURIComponent(path)}?ref=${branch}`
    );

    if (response.type === 'file' && response.content) {
      // Decodificar contenido base64
      const content = atob(response.content);
      return {
        ...response,
        content,
        decoded: true,
      };
    }

    return response;
  }

  // Obtener estructura de directorios
  async getDirectoryStructure(repoUrl: string, path: string = '', branch: string = 'main') {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    const endpoint = path 
      ? `/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${encodeURIComponent(path)}?ref=${branch}`
      : `/repos/${repoInfo.owner}/${repoInfo.repo}/contents?ref=${branch}`;

    const files = await this.request(endpoint);
    
    return files.map((file: GitHubFile) => ({
      name: file.name,
      path: file.path,
      type: file.type,
      size: file.size,
      url: file.html_url,
      download_url: file.download_url,
    }));
  }

  // Obtener branches del repositorio
  async getBranches(repoUrl: string): Promise<GitHubBranch[]> {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    return this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}/branches`);
  }

  // Obtener commits recientes
  async getRecentCommits(repoUrl: string, branch: string = 'main', limit: number = 10): Promise<GitHubCommit[]> {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    return this.request(
      `/repos/${repoInfo.owner}/${repoInfo.repo}/commits?sha=${branch}&per_page=${limit}`
    );
  }

  // Crear o actualizar un archivo
  async updateFile(
    repoUrl: string, 
    path: string, 
    content: string, 
    message: string, 
    branch: string = 'main',
    sha?: string
  ) {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    if (!this.token) {
      throw new Error('Se requiere token de GitHub para realizar cambios');
    }

    const body: any = {
      message,
      content: btoa(content), // Codificar en base64
      branch,
    };

    if (sha) {
      body.sha = sha;
    }

    return this.request(
      `/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${encodeURIComponent(path)}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      }
    );
  }

  // Crear un nuevo archivo
  async createFile(
    repoUrl: string, 
    path: string, 
    content: string, 
    message: string, 
    branch: string = 'main'
  ) {
    return this.updateFile(repoUrl, path, content, message, branch);
  }

  // Eliminar un archivo
  async deleteFile(
    repoUrl: string, 
    path: string, 
    message: string, 
    sha: string, 
    branch: string = 'main'
  ) {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    if (!this.token) {
      throw new Error('Se requiere token de GitHub para realizar cambios');
    }

    return this.request(
      `/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${encodeURIComponent(path)}`,
      {
        method: 'DELETE',
        body: JSON.stringify({
          message,
          sha,
          branch,
        }),
      }
    );
  }

  // Crear un nuevo branch
  async createBranch(repoUrl: string, newBranch: string, baseBranch: string = 'main') {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    if (!this.token) {
      throw new Error('Se requiere token de GitHub para crear branches');
    }

    // Primero obtener el SHA del branch base
    const baseBranchInfo = await this.request(
      `/repos/${repoInfo.owner}/${repoInfo.repo}/branches/${baseBranch}`
    );

    return this.request(
      `/repos/${repoInfo.owner}/${repoInfo.repo}/git/refs`,
      {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${newBranch}`,
          sha: baseBranchInfo.commit.sha,
        }),
      }
    );
  }

  // Obtener información de un commit específico
  async getCommitInfo(repoUrl: string, commitSha: string) {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    return this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}/commits/${commitSha}`);
  }

  // Obtener diferencias entre commits
  async getCommitDiff(repoUrl: string, baseSha: string, headSha: string) {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    return this.request(
      `/repos/${repoInfo.owner}/${repoInfo.repo}/compare/${baseSha}...${headSha}`
    );
  }

  // Buscar archivos en el repositorio
  async searchFiles(repoUrl: string, query: string, branch: string = 'main') {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    const response = await this.request(
      `/search/code?q=${encodeURIComponent(query)}+repo:${repoInfo.owner}/${repoInfo.repo}+path:/&ref=${branch}`
    );

    return response.items;
  }

  // Obtener estadísticas del repositorio
  async getRepositoryStats(repoUrl: string) {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
      if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    const [repo, languages, contributors] = await Promise.all([
      this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}`),
      this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}/languages`),
      this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}/contributors`),
    ]);
      
      return {
      repository: repo,
      languages,
      contributors,
    };
  }

  // Verificar si el token es válido
  async validateToken(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      await this.request('/user');
      return true;
    } catch (error) {
      return false;
    }
  }

  // Configurar token
  setToken(token: string) {
    this.token = token;
  }

  // Obtener token actual
  getToken(): string | null {
    return this.token;
  }

  // =====================================================
  // MÉTODOS PRINCIPALES DE AUTO-LLENADO
  // =====================================================

  /**
   * Función principal para auto-completar información del proyecto desde GitHub
   * Análisis inteligente y completo del repositorio
   */
  async autoFillFromGitHub(repoUrl: string): Promise<DetectedInfo> {
    const startTime = Date.now();
    console.log(`🚀 Iniciando análisis inteligente de: ${repoUrl}`);

    try {
      const repoInfo = this.parseRepositoryUrl(repoUrl);
      if (!repoInfo) {
        throw new Error('URL de repositorio inválida');
      }

      // Análisis paralelo de toda la información del repositorio
      const [
        repository,
        languages,
        readme,
        commits,
        releases,
        workflows,
        packageJson,
        dockerCompose,
        envFiles
      ] = await Promise.all([
        this.getRepositoryInfo(repoUrl),
        this.getRepositoryLanguages(repoUrl),
        this.getReadmeContent(repoUrl).catch(() => null),
        this.getRecentCommits(repoUrl, 'main', 5).catch(() => []),
        this.getReleases(repoUrl).catch(() => []),
        this.getWorkflows(repoUrl).catch(() => []),
        this.getPackageJson(repoUrl).catch(() => null),
        this.getDockerCompose(repoUrl).catch(() => null),
        this.getEnvironmentFiles(repoUrl).catch(() => [])
      ]);

      // Análisis inteligente del estado del proyecto
      const status = this.determineProjectStatus(repository, commits, releases, workflows);
      
      // Detección avanzada de tecnologías
      const technologies = this.extractTechnologies(
        languages, 
        packageJson, 
        workflows, 
        dockerCompose,
        repository.topics
      );

      // Generación inteligente de descripción
      const description = this.generateSmartDescription(
        repository, 
        readme, 
        packageJson, 
        technologies
      );

      // Extracción de variables de entorno
      const environmentVariables = this.extractEnvironmentVariables(envFiles);

      // Cálculo de confianza del análisis
      const confidence = this.calculateConfidence(
        readme, 
        packageJson, 
        dockerCompose, 
        workflows,
        envFiles
      );

      // Análisis detallado del repositorio
      const analysis = this.generateRepositoryAnalysis(
        repository,
        readme,
        packageJson,
        dockerCompose,
        workflows,
        commits,
        releases
      );

      const result: DetectedInfo = {
        name: this.formatProjectName(repository.name, packageJson),
        description,
        technologies,
        github_repository_url: repoUrl,
        status,
        is_active: !repository.archived && !repository.disabled,
        environment_variables: environmentVariables,
        confidence,
        analysis
      };

      const duration = Date.now() - startTime;
      console.log(`✅ Análisis completado en ${duration}ms - Confianza: ${confidence}%`);
      
      return result;

    } catch (error: any) {
      console.error('❌ Error en análisis del repositorio:', error);
      
      if (error.message.includes('Not Found')) {
        throw new Error('Repository not found');
      } else if (error.message.includes('API rate limit exceeded')) {
        throw new Error('API rate limit exceeded');
      } else if (error.message.includes('private')) {
        throw new Error('Repository is private');
      } else {
        throw new Error(`Error al analizar el repositorio: ${error.message}`);
      }
    }
  }
}

export const githubService = new GitHubService();
export default GitHubService;
