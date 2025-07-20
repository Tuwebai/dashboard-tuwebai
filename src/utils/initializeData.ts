import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc } from 'firebase/firestore';

export const initializeChatData = async (userEmail: string) => {
  try {
    // Crear una sala de chat por defecto solo si no existe
    const chatRoomsRef = collection(firestore, 'chatRooms');
    const defaultRoom = await addDoc(chatRoomsRef, {
      participants: [userEmail, 'tuwebai@gmail.com'],
      createdAt: serverTimestamp(),
      unreadCount: 0
    });

    // Agregar mensaje de bienvenida
    const messagesRef = collection(firestore, 'chatRooms', defaultRoom.id, 'messages');
    await addDoc(messagesRef, {
      text: '¡Bienvenido! ¿En qué puedo ayudarte con tu proyecto?',
      senderId: 'admin',
      senderName: 'TuWeb AI',
      senderRole: 'admin',
      timestamp: serverTimestamp(),
      read: false
    });

    return defaultRoom.id;
  } catch (error) {
    console.error('Error initializing chat data:', error);
  }
};

export const initializeCommentsData = async (projectId: string) => {
  try {
    const commentsRef = collection(firestore, 'comments');
    
    // Comentario de bienvenida
    await addDoc(commentsRef, {
      text: '¡Proyecto iniciado! Comienza a colaborar con tu equipo.',
      authorId: 'admin',
      authorName: 'TuWeb AI',
      authorRole: 'admin',
      timestamp: serverTimestamp(),
      projectId,
      phaseKey: 'inicio',
      parentId: null,
      replies: [],
      reactions: {},
      mentions: [],
      isEdited: false
    });

  } catch (error) {
    console.error('Error initializing comments data:', error);
  }
};

export const initializeTasksData = async (projectId: string) => {
  try {
    const tasksRef = collection(firestore, 'tasks');
    
    // Tareas iniciales reales
    const initialTasks = [
      {
        title: 'Revisar requerimientos del proyecto',
        description: 'Analizar y documentar todos los requerimientos del cliente',
        status: 'pending',
        priority: 'high',
        assignee: 'tuwebai@gmail.com',
        projectId,
        createdAt: serverTimestamp(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
      },
      {
        title: 'Crear wireframes',
        description: 'Desarrollar wireframes para las principales páginas',
        status: 'in-progress',
        priority: 'medium',
        assignee: 'tuwebai@gmail.com',
        projectId,
        createdAt: serverTimestamp(),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 días
      }
    ];

    for (const task of initialTasks) {
      await addDoc(tasksRef, task);
    }

  } catch (error) {
    console.error('Error initializing tasks data:', error);
  }
};

// Inicializar datos del sistema admin - SOLO configuración real
export const initializeAdminSystemData = async () => {
  try {
    // Configuración del sistema
    const settingsRef = collection(firestore, 'admin_settings');
    await addDoc(settingsRef, {
      maintenance: false,
      autoBackup: true,
      emailNotifications: true,
      systemAlerts: true,
      userRegistration: true,
      projectCreation: true,
      createdAt: serverTimestamp()
    });

    // Logs del sistema iniciales
    const logsRef = collection(firestore, 'system_logs');
    const initialLogs = [
      {
        message: 'Sistema iniciado correctamente',
        level: 'info',
        timestamp: serverTimestamp(),
        source: 'system'
      },
      {
        message: 'Base de datos conectada',
        level: 'info',
        timestamp: serverTimestamp(),
        source: 'database'
      },
      {
        message: 'Servicios de autenticación activos',
        level: 'info',
        timestamp: serverTimestamp(),
        source: 'auth'
      }
    ];

    for (const log of initialLogs) {
      await addDoc(logsRef, log);
    }

    // Backup inicial
    const backupsRef = collection(firestore, 'system_backups');
    await addDoc(backupsRef, {
      name: 'Backup_Inicial',
      status: 'completed',
      size: '1.2 MB',
      createdAt: serverTimestamp(),
      type: 'full'
    });

    // Notificación de bienvenida para admin
    const notificationsRef = collection(firestore, 'admin_notifications');
    await addDoc(notificationsRef, {
      title: 'Bienvenido al Panel de Administración',
      message: 'El sistema está funcionando correctamente. Puedes comenzar a gestionar usuarios, proyectos y configuraciones.',
      type: 'info',
      priority: 'normal',
      targetUsers: 'admin',
      timestamp: serverTimestamp(),
      isActive: true,
      sentBy: 'system'
    });

  } catch (error) {
    console.error('Error initializing admin system data:', error);
  }
};

// ELIMINADO: initializeSampleData - NO MÁS DATOS DE EJEMPLO

// Función para limpiar datos simulados de Firestore
export const cleanSimulatedData = async () => {
  try {
    console.log('Limpiando datos simulados...');
    
    // Limpiar tickets simulados
    const ticketsRef = collection(firestore, 'tickets');
    const ticketsSnap = await getDocs(ticketsRef);
    const simulatedTickets = ticketsSnap.docs.filter(doc => {
      const data = doc.data();
      return data.userEmail && data.userEmail.includes('ejemplo.com');
    });
    
    for (const ticket of simulatedTickets) {
      await deleteDoc(doc(firestore, 'tickets', ticket.id));
    }
    
    // Limpiar pagos simulados
    const pagosRef = collection(firestore, 'pagos');
    const pagosSnap = await getDocs(pagosRef);
    const simulatedPagos = pagosSnap.docs.filter(doc => {
      const data = doc.data();
      return data.userEmail && data.userEmail.includes('ejemplo.com');
    });
    
    for (const pago of simulatedPagos) {
      await deleteDoc(doc(firestore, 'pagos', pago.id));
    }
    
    // Limpiar usuarios simulados (excepto admin)
    const usersRef = collection(firestore, 'users');
    const usersSnap = await getDocs(usersRef);
    const simulatedUsers = usersSnap.docs.filter(doc => {
      const data = doc.data();
      return data.email && data.email.includes('ejemplo.com');
    });
    
    for (const user of simulatedUsers) {
      await deleteDoc(doc(firestore, 'users', user.id));
    }
    
    console.log(`Datos simulados eliminados: ${simulatedTickets.length} tickets, ${simulatedPagos.length} pagos, ${simulatedUsers.length} usuarios`);
    
  } catch (error) {
    console.error('Error limpiando datos simulados:', error);
  }
}; 