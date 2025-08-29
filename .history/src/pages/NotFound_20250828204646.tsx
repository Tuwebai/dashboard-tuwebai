import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <Card className="bg-gray-800 border-gray-700 shadow-2xl max-w-md w-full">
        <CardContent className="text-center p-8">
          <div className="mb-6">
            <h1 className="text-6xl font-bold text-blue-400 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-white mb-2">Página no encontrada</h2>
            <p className="text-gray-400">
              La página que buscas no existe o ha sido movida.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button asChild className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 transition-opacity">
              <Link to="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Ir al Dashboard
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver atrás
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
