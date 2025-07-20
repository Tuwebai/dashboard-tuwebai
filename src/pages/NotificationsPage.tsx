import { useApp } from '@/contexts/AppContext';
import NotificationSystem from '@/components/NotificationSystem';
import NotificationDemo from '@/components/NotificationDemo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Zap } from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useApp();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Acceso denegado</h3>
          <p className="text-muted-foreground">Debes iniciar sesión para ver las notificaciones.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="demo" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Demostración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <NotificationSystem />
        </TabsContent>

        <TabsContent value="demo">
          <NotificationDemo />
        </TabsContent>
      </Tabs>
    </div>
  );
}