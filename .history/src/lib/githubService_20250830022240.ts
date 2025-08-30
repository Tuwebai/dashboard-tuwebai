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

class GitHubService {
  private baseUrl = 'https://api.github.com';
  private token: string | null = null;

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

  // Obtener información del repositorio
  async getRepositoryInfo(repoUrl: string) {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    return this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}`);
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

  // Función para auto-completar información del proyecto desde GitHub
  async autoFillFromGitHub(repoUrl: string) {
    try {
      const repoInfo = this.parseRepositoryUrl(repoUrl);
      if (!repoInfo) {
        throw new Error('URL de repositorio inválida');
      }

      // Obtener información básica del repositorio
      const [repository, languages, readme] = await Promise.all([
        this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}`),
        this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}/languages`),
        this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}/readme`).catch(() => null)
      ]);

      // Extraer tecnologías de los lenguajes
      const technologies = Object.keys(languages || {});

      // Extraer descripción del README si existe
      let description = repository.description || '';
      if (readme && readme.content) {
        try {
          const readmeContent = atob(readme.content);
          // Extraer primera línea no vacía como descripción
          const lines = readmeContent.split('\n').filter(line => line.trim());
          if (lines.length > 0) {
            const firstLine = lines[0].replace(/^#+\s*/, '').trim();
            if (firstLine) {
              description = firstLine;
            }
          }
        } catch (error) {
          console.warn('Error parsing README content:', error);
        }
      }

      return {
        name: repository.name,
        description: description || repository.description || '',
        technologies: technologies,
        github_repository_url: repoUrl,
        status: 'development', // Por defecto
        is_active: true,
        environment_variables: {}
      };
    } catch (error: any) {
      if (error.message.includes('Not Found')) {
        throw new Error('Repository not found');
      } else if (error.message.includes('API rate limit exceeded')) {
        throw new Error('API rate limit exceeded');
      } else {
        throw new Error(error.message || 'Error al obtener información del repositorio');
      }
    }
  }
}

export const githubService = new GitHubService();
export default GitHubService;
