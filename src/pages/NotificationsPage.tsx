import { useApp } from '@/contexts/AppContext';
import NotificationSystem from '@/components/NotificationSystem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotificationsPage() {
  const { user } = useApp();
  const { t } = useTranslation();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold">{t('Acceso denegado')}</h3>
          <p className="text-muted-foreground">{t('Debes iniciar sesión para ver las notificaciones.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-full overflow-x-hidden">
      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t('Notificaciones')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <NotificationSystem />
        </TabsContent>
      </Tabs>
    </div>
  );
}