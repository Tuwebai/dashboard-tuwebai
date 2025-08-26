import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { syncPaymentsFromMainSite } from '@/lib/webhookHandler';
import { toast } from '@/hooks/use-toast';
import { RefreshCw, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

export default function PaymentSync() {
  const { user } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const handleSync = async () => {
    if (!user) return;
    
    setSyncing(true);
    try {
      const result = await syncPaymentsFromMainSite(user.email);
      
      setLastSync(new Date().toLocaleString('es-ES'));
      
      toast({
        title: 'Sincronización exitosa',
        description: result.message,
      });
      
    } catch (error) {
      console.error('Error syncing payments:', error);
      toast({
        title: 'Error de sincronización',
        description: 'No se pudieron sincronizar los pagos. Intenta de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  const openMainSite = () => {
    window.open('https://tuweb-ai.com', '_blank');
  };

  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Sincronización con Página Principal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Sincroniza los pagos realizados en tuweb-ai.com con este dashboard
            </p>
            {lastSync && (
              <p className="text-xs text-muted-foreground">
                Última sincronización: {lastSync}
              </p>
            )}
          </div>
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleSync}
            disabled={syncing}
            className="flex-1"
          >
            {syncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar Pagos
              </>
            )}
          </Button>
          
          <Button 
            variant="outline"
            onClick={openMainSite}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ir a tuweb-ai.com
          </Button>
        </div>
        
        <div className="bg-muted/20 rounded-lg p-3">
          <h4 className="font-semibold text-sm mb-2">¿Cómo funciona?</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Los pagos realizados en tuweb-ai.com se sincronizan automáticamente</li>
            <li>• Puedes ver el historial completo aquí en el dashboard</li>
            <li>• Las facturas se generan automáticamente</li>
            <li>• El estado se actualiza en tiempo real</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 
