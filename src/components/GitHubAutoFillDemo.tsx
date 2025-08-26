import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, ExternalLink } from 'lucide-react';

const demoRepositories = [
  {
    name: 'React',
    url: 'https://github.com/facebook/react',
    description: 'Biblioteca de JavaScript para construir interfaces de usuario',
    technologies: ['React', 'TypeScript', 'JavaScript'],
    stars: '210k+'
  },
  {
    name: 'Vue.js',
    url: 'https://github.com/vuejs/vue',
    description: 'Framework progresivo de JavaScript',
    technologies: ['Vue.js', 'TypeScript', 'JavaScript'],
    stars: '205k+'
  },
  {
    name: 'Next.js',
    url: 'https://github.com/vercel/next.js',
    description: 'Framework de React para producción',
    technologies: ['Next.js', 'React', 'TypeScript'],
    stars: '110k+'
  },
  {
    name: 'Tailwind CSS',
    url: 'https://github.com/tailwindlabs/tailwindcss',
    description: 'Framework CSS utility-first',
    technologies: ['CSS', 'PostCSS', 'JavaScript'],
    stars: '75k+'
  },
  {
    name: 'Supabase',
    url: 'https://github.com/supabase/supabase',
    description: 'Alternativa open source a Firebase',
    technologies: ['TypeScript', 'PostgreSQL', 'Docker'],
    stars: '60k+'
  },
  {
    name: 'Vite',
    url: 'https://github.com/vitejs/vite',
    description: 'Build tool y dev server moderno',
    technologies: ['TypeScript', 'Rollup', 'ESBuild'],
    stars: '65k+'
  }
];

export const GitHubAutoFillDemo: React.FC = () => {
  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Github className="h-5 w-5" />
          Repositorios de Ejemplo para Probar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demoRepositories.map((repo, index) => (
            <div
              key={index}
              className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-white">{repo.name}</h3>
                <Badge variant="outline" className="text-xs">
                  ⭐ {repo.stars}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                {repo.description}
              </p>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {repo.technologies.slice(0, 3).map((tech, techIndex) => (
                  <Badge key={techIndex} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
                {repo.technologies.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{repo.technologies.length - 3}
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(repo.url)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-md transition-colors"
                >
                  Copiar URL
                </button>
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-zinc-700 hover:bg-zinc-600 text-white p-1.5 rounded-md transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <h4 className="font-semibold text-blue-300 mb-2">💡 Cómo usar:</h4>
          <ol className="text-sm text-blue-200 space-y-1">
            <li>1. Copia una URL de ejemplo</li>
            <li>2. Ve a "Nuevo Proyecto"</li>
            <li>3. Pega la URL en el campo "URL del Repositorio GitHub"</li>
            <li>4. Espera a que se analice automáticamente</li>
            <li>5. Revisa la información detectada y haz clic en "Usar esta información"</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
