import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'white';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  variant = 'default', 
  text,
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const variantClasses = {
    default: 'border-zinc-600 border-t-zinc-400',
    primary: 'border-blue-600 border-t-transparent',
    white: 'border-white border-t-transparent'
  };

  const textClasses = {
    default: 'text-zinc-400',
    primary: 'text-blue-600',
    white: 'text-white'
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div 
        className={cn(
          'border-4 rounded-full animate-spin',
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      {text && (
        <p className={cn('text-sm font-medium', textClasses[variant])}>
          {text}
        </p>
      )}
    </div>
  );
}

// Componente de loading para páginas completas
export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-900">
      <LoadingSpinner 
        size="xl" 
        variant="primary" 
        text="Cargando..." 
      />
    </div>
  );
}

// Componente de loading para secciones
export function SectionLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner 
        size="lg" 
        variant="primary" 
        text="Cargando datos..." 
      />
    </div>
  );
}

// Componente de loading para botones
export function ButtonLoading() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      <span>Procesando...</span>
    </div>
  );
}

// Componente de loading para tablas
export function TableLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 animate-pulse">
          <div className="w-12 h-12 bg-zinc-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-zinc-700 rounded w-3/4" />
            <div className="h-3 bg-zinc-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente de loading para cards
export function CardLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-zinc-700 rounded w-1/2" />
      <div className="h-3 bg-zinc-700 rounded w-3/4" />
      <div className="h-3 bg-zinc-700 rounded w-1/2" />
    </div>
  );
} 