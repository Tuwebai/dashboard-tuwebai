import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle, loginWithGithub } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(email, password);
    if (success) {
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente.",
      });
      // Redirigir según el rol
      if (email.toLowerCase() === 'tuwebai@gmail.com') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      toast({
        title: "Error",
        description: "Credenciales inválidas o usuario no registrado.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const success = await loginWithGoogle();
    if (success) {
      toast({ title: '¡Bienvenido!', description: 'Has iniciado sesión correctamente.' });
      navigate('/');
    } else {
      toast({ title: 'Error', description: 'No se pudo iniciar sesión con Google.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleGithubLogin = async () => {
    setIsLoading(true);
    const success = await loginWithGithub();
    if (success) {
      toast({ title: '¡Bienvenido!', description: 'Has iniciado sesión correctamente.' });
      navigate('/');
    } else {
      toast({ title: 'Error', description: 'No se pudo iniciar sesión con GitHub.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img 
              src="/logoweb.jpg" 
              alt="TuWebAI Logo" 
              className="h-10 w-10 object-contain rounded-xl"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Dashboard-TuWebAI
            </h1>
          </div>
          <p className="text-muted-foreground">
            Accede a tu dashboard para gestionar tus proyectos
          </p>
        </div>

        <div className="relative">
          {/* Fondo azul eléctrico borroso */}
          <div className="absolute inset-0 bg-[#00CCFF] rounded-lg blur-xl opacity-30 -z-10"></div>
          <Card className="bg-card border-border shadow-card relative z-10">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-input border-border pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>

            {/* Botones de login social */}
            <div className="flex flex-col gap-2 mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                Iniciar sesión con Google
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleGithubLogin}
                disabled={isLoading}
              >
                Iniciar sesión con GitHub
              </Button>
            </div>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <Link 
                  to="/register" 
                  className="text-primary hover:text-primary-glow transition-colors font-medium"
                >
                  Regístrate aquí
                </Link>
              </p>
              <p className="text-xs text-muted-foreground">
                Al continuar, aceptas nuestros{' '}
                <Link 
                  to="/terminos-condiciones" 
                  className="text-primary hover:text-primary-glow transition-colors font-medium underline"
                >
                  Términos y Condiciones
                </Link>
                {' '}y{' '}
                <Link 
                  to="/politica-privacidad" 
                  className="text-primary hover:text-primary-glow transition-colors font-medium underline"
                >
                  Política de Privacidad
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
