import { useApp } from '@/contexts/AppContext';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Bell, 
  Camera, 
  Save, 
  Edit3,
  Check,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Perfil() {
  const { user } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estados para edición de perfil
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    bio: '',
    location: '',
    website: ''
  });

  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });



  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        position: user.position || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || ''
      });


    }
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Actualizar perfil en Firebase Auth
      await updateProfile(auth.currentUser!, {
        displayName: profileData.name
      });

      // Actualizar datos en Firestore
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        name: profileData.name,
        phone: profileData.phone,
        company: profileData.company,
        position: profileData.position,
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: 'Perfil actualizado',
        description: 'Los datos de tu perfil han sido actualizados correctamente.'
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el perfil. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user || !auth.currentUser) return;
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden.',
        variant: 'destructive'
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'La nueva contraseña debe tener al menos 6 caracteres.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Reautenticar usuario
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Cambiar contraseña
      await updatePassword(auth.currentUser, passwordData.newPassword);

      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña ha sido cambiada correctamente.'
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        toast({
          title: 'Error',
          description: 'La contraseña actual es incorrecta.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo cambiar la contraseña. Inténtalo de nuevo.',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };



  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simular subida de archivo (en producción usar Firebase Storage)
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        // Aquí se actualizaría la foto de perfil en Firebase Storage
        toast({
          title: 'Foto actualizada',
          description: 'Tu foto de perfil ha sido actualizada.'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <p className="text-muted-foreground">Gestiona tu información personal y configuración</p>
        </div>
        <Badge variant="outline" className="text-sm">
          Miembro desde {new Date(user.createdAt || Date.now()).toLocaleDateString('es-ES')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-8">
        {/* Columna izquierda - Información básica */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información personal */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información Personal
                  </CardTitle>
                  <CardDescription>
                    Actualiza tu información personal y de contacto
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                  {isEditing ? 'Cancelar' : 'Editar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="+54 9 11 1234-5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Nombre de tu empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    value={profileData.position}
                    onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Tu cargo o posición"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Ciudad, País"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Sitio web</Label>
                <Input
                  id="website"
                  value={profileData.website}
                  onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="https://tu-sitio.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Cuéntanos sobre ti..."
                  rows={3}
                />
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleProfileUpdate} disabled={loading}>
                    {loading ? 'Guardando...' : <><Save className="h-4 w-4 mr-2" />Guardar cambios</>}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cambio de contraseña */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Seguridad
                  </CardTitle>
                  <CardDescription>
                    Cambia tu contraseña para mantener tu cuenta segura
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                >
                  {isChangingPassword ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                  {isChangingPassword ? 'Cancelar' : 'Cambiar contraseña'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isChangingPassword ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Contraseña actual</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Ingresa tu contraseña actual"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva contraseña</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Ingresa tu nueva contraseña"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirma tu nueva contraseña"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handlePasswordChange} disabled={loading}>
                      {loading ? 'Cambiando...' : <><Shield className="h-4 w-4 mr-2" />Cambiar contraseña</>}
                    </Button>
                    <Button variant="outline" onClick={() => setIsChangingPassword(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Última actualización: {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('es-ES') : 'Nunca'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha - Avatar y configuración */}
        <div className="space-y-6">
          {/* Avatar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Foto de perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.photoURL} alt={user.name} />
                  <AvatarFallback className="text-2xl">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-2 text-center">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-2" />
                      Cambiar foto
                    </Button>
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Información de la cuenta */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rol:</span>
                <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                  {user.role || 'user'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estado:</span>
                <Badge variant="outline" className="text-green-600">
                  Activo
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Miembro desde:</span>
                <span>{new Date(user.createdAt || Date.now()).toLocaleDateString('es-ES')}</span>
              </div>
              {user.lastLogin && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Último acceso:</span>
                  <span>{new Date(user.lastLogin).toLocaleDateString('es-ES')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 