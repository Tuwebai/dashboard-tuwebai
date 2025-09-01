import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { errorHandler, createErrorFallback } from '@/lib/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log del error usando el sistema centralizado
    errorHandler.handleSupabaseError(
      { code: 'REACT_ERROR', message: error.message, details: error.stack },
      'ErrorBoundary'
    );

    this.setState({ errorInfo });

    // Callback personalizado si se proporciona
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log adicional para debugging
    console.error('🚨 Error Boundary capturó un error:', {
      error,
      errorInfo,
      errorId: this.state.errorId
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      // Fallback personalizado si se proporciona
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback por defecto con manejo de errores mejorado
      const errorFallback = createErrorFallback(
        {
          code: 'REACT_ERROR',
          message: this.state.error?.message || 'Error inesperado en la aplicación',
          details: this.state.error?.stack || '',
          hint: 'Intenta recargar la página o navegar a otra sección'
        },
        this.handleRetry
      );

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-red-200">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-800">
                {errorFallback.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-slate-700 mb-2">
                  {errorFallback.message}
                </p>
                {errorFallback.hint && (
                  <p className="text-sm text-slate-500">
                    💡 {errorFallback.hint}
                  </p>
                )}
              </div>

              {this.state.errorId && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500 font-mono">
                    ID de Error: {this.state.errorId}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {errorFallback.isRecoverable && (
                  <Button 
                    onClick={this.handleRetry}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reintentar
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleGoBack}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver Atrás
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir al Inicio
                </Button>
              </div>

              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-800">
                    🔍 Ver detalles técnicos (Solo desarrollo)
                  </summary>
                  <pre className="mt-2 p-3 bg-slate-100 rounded text-xs overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

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
