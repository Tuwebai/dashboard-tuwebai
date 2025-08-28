import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

import { Users, UserPlus, Crown, Trash2, Mail } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  joinedAt: string;
  lastActivity: string;
  status: 'active' | 'inactive';
}

export default function Team() {
  const { user } = useApp();
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);

  // Cargar miembros del equipo desde Firestore
  useEffect(() => {
    if (!user) return;

    const loadTeamMembers = async () => {
      try {
        setLoading(true);
        const membersRef = collection(firestore, 'users');
        const q = query(membersRef, where('status', '==', 'active'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const membersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Member[];
          
          setTeamMembers(membersData);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error loading team members:', error);
        setLoading(false);
      }
    };

    loadTeamMembers();
  }, [user]);

  const handleInvite = async () => {
    if (!inviteEmail || !user) return;
    
    try {
      // En producción, aquí se enviaría un email de invitación
      const inviteRef = collection(firestore, 'invitations');
      await addDoc(inviteRef, {
        email: inviteEmail,
        invitedBy: user.email,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
      });
      
      toast({
        title: 'Invitación enviada',
        description: `Se ha enviado una invitación a ${inviteEmail}`
      });
      setInviteEmail('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar la invitación',
        variant: 'destructive'
      });
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'user') => {
    if (!user || user.role !== 'admin') return;
    
    try {
      const memberRef = doc(firestore, 'users', memberId);
      await updateDoc(memberRef, { role: newRole });
      
      toast({
        title: 'Rol actualizado',
        description: 'El rol del miembro ha sido actualizado'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el rol',
        variant: 'destructive'
      });
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!user || user.role !== 'admin') return;
    
    try {
      const memberRef = doc(firestore, 'users', memberId);
      await updateDoc(memberRef, { status: 'inactive' });
      
      toast({
        title: 'Miembro removido',
        description: 'El miembro ha sido removido del equipo'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo remover el miembro',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-2">Gestión de equipo</h1>
      <p className="text-muted-foreground mb-6">Administra los miembros y roles de tu equipo.</p>
      <Card>
        <CardHeader>
          <CardTitle>Miembros del equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left py-2">Nombre</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Rol</th>
                <th className="text-left py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center">Cargando miembros...</td>
                </tr>
              ) : teamMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center">No hay miembros en el equipo.</td>
                </tr>
              ) : (
                teamMembers.map(m => (
                  <tr key={m.id} className="border-b last:border-b-0">
                    <td className="py-2">{m.name}</td>
                    <td className="py-2">{m.email}</td>
                    <td className="py-2 capitalize">
                      <Badge variant={m.role === 'admin' ? 'default' : 'secondary'}>{m.role}</Badge>
                    </td>
                    <td className="py-2 flex gap-2">
                      {user?.email !== m.email && (
                        <Button size="sm" variant="outline" onClick={() => handleRoleChange(m.id, m.role === 'admin' ? 'user' : 'admin')}>
                          Cambiar a {m.role === 'admin' ? 'Usuario' : 'Admin'}
                        </Button>
                      )}
                      {user?.email !== m.email && (
                        <Button size="sm" variant="destructive" onClick={() => handleRemove(m.id)}>
                          Eliminar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Invitar miembro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Email del nuevo miembro"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="border rounded px-2 py-1 flex-1"
            />
            <Button onClick={handleInvite}>Invitar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
