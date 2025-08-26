import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundaryClass extends Component<Props & { navigate: (path: string) => void }, State> {
  constructor(props: Props & { navigate: (path: string) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    this.props.navigate('/dashboard');
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-zinc-800 border-zinc-700">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-xl text-white">Algo salió mal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-400 text-center">
                Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
              </p>
              
              {import.meta.env.DEV && this.state.error && (
                <details className="bg-zinc-900 p-3 rounded text-xs">
                  <summary className="cursor-pointer text-zinc-400 mb-2">
                    Detalles del error (solo desarrollo)
                  </summary>
                  <pre className="text-red-400 whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="text-yellow-400 whitespace-pre-wrap mt-2">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={this.handleRetry} 
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir al inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper para usar con hooks
export default function ErrorBoundary({ children, fallback }: Props) {
  return (
    <ErrorBoundaryClass navigate={(path: string) => {
      // Usar window.location como fallback si no hay router
      if (typeof window !== 'undefined') {
        window.location.href = path;
      }
    }} fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
}

// Componente de error simple para mostrar errores de API
export function ErrorMessage({ 
  error, 
  onRetry, 
  title = "Error",
  message = "Ha ocurrido un error. Por favor, intenta de nuevo."
}: {
  error?: string;
  onRetry?: () => void;
  title?: string;
  message?: string;
}) {
  return (
    <Card className="bg-red-500/10 border-red-500/20">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-red-400">{title}</h3>
        </div>
        <p className="text-zinc-400 mb-4">
          {error || message}
        </p>
        {onRetry && (
          <Button 
            onClick={onRetry} 
            variant="outline" 
            size="sm"
            className="border-red-500/20 text-red-400 hover:bg-red-500/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para errores de red
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Error de conexión"
      message="No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo."
      onRetry={onRetry}
    />
  );
}

// Componente para errores de permisos
export function PermissionError() {
  return (
    <ErrorMessage
      title="Sin permisos"
      message="No tienes permisos para acceder a esta funcionalidad."
    />
  );
}

// Componente para errores de datos no encontrados
export function NotFoundError({ 
  title = "No encontrado",
  message = "Los datos que buscas no existen o han sido eliminados."
}: {
  title?: string;
  message?: string;
}) {
  return (
    <Card className="bg-yellow-500/10 border-yellow-500/20">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-yellow-400">{title}</h3>
        </div>
        <p className="text-zinc-400">
          {message}
        </p>
      </CardContent>
    </Card>
  );
} 
