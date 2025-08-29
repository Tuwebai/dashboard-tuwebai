import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ClientCollaborationPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Colaboración del Proyecto</h1>
              <p className="text-slate-600 mt-2">Espacio de trabajo colaborativo</p>
            </div>
          </div>
          
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚧</div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Componente en Desarrollo</h2>
            <p className="text-slate-600 mb-6">
              El componente de colaboración está siendo actualizado al diseño claro del dashboard.
            </p>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
