import { Bell, Search, Menu } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LogOut, User as UserIcon, FolderOpen, CreditCard, MessageCircle, Settings as SettingsIcon } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface TopbarProps {
  onMenuClick?: () => void;
  showMobileMenu?: boolean;
}

export default function Topbar({ onMenuClick, showMobileMenu = false }: TopbarProps) {
  const { user, projects } = useApp();
  const navigate = useNavigate();
  const [unreadChats, setUnreadChats] = useState(0);

  useEffect(() => {
    if (!user) return;
    // Escuchar mensajes no leídos en todos los chats del usuario
    const q = query(
      collection(firestore, 'chats'),
      where('users', 'array-contains', user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      let total = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.lastMessage && data.lastMessage.senderId !== user.uid && !data.lastMessage.read) {
          total++;
        }
      });
      setUnreadChats(total);
    });
    return () => unsub();
  }, [user]);

  return (
    <header className="h-14 sm:h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        {showMobileMenu && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMenuClick}
                  className="md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Menú</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Search */}
        <div className="relative max-w-xs sm:max-w-md w-full">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>Buscar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Input
            placeholder="Buscar proyectos..."
            className="pl-10 bg-input border-border text-sm sm:text-base"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Proyectos: </span>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {projects.length}
            </Badge>
          </div>
        </div>

        {/* Chat */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="relative" onClick={() => navigate('/chat')}>
                <MessageCircle className="h-5 w-5" />
                {unreadChats > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                    {unreadChats > 99 ? '99+' : unreadChats}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chat</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Notifications */}
        <NotificationBell />

        {/* User info */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Eliminar nombre y correo, dejar solo avatar y badge si es admin */}
          {user.role === 'admin' && (
            <span className="ml-2 px-2 py-0.5 rounded bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold uppercase">ADMIN</span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer border-2 border-primary">
                {user?.photoURL ? (
                  <AvatarImage src={user.photoURL} alt={user.name} />
                ) : (
                  <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/perfil')}>
                <UserIcon className="h-4 w-4 mr-2" /> Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/proyectos')}>
                <FolderOpen className="h-4 w-4 mr-2" /> Mis proyectos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/facturacion')}>
                <CreditCard className="h-4 w-4 mr-2" /> Facturación / Pagos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/soporte')}>
                <MessageCircle className="h-4 w-4 mr-2" /> Soporte / Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/configuracion')}>
                <SettingsIcon className="h-4 w-4 mr-2" /> Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await signOut(auth);
                  navigate('/login');
                }}
                className="text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}