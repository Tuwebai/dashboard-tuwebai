import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { firestore } from '@/lib/firebase';
import { useApp } from './AppContext';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message' | 'system';
  category: 'project' | 'team' | 'system' | 'security' | 'billing' | 'feature';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  archived: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userId: string;
  actions?: any[];
  metadata?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  loading: boolean;
  addNotification: (data: Omit<Notification, 'id' | 'timestamp' | 'read' | 'archived' | 'userId'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  unreadCount: number;
  selectedNotification: Notification | null;
  setSelectedNotification: (n: Notification | null) => void;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!firestore || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.email),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Notification));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const addNotification = useCallback(async (data: Omit<Notification, 'id' | 'timestamp' | 'read' | 'archived' | 'userId'>) => {
    if (!firestore || !user) return;
    await addDoc(collection(firestore, 'notifications'), {
      ...data,
      userId: user.email,
      timestamp: new Date().toISOString(),
      read: false,
      archived: false
    });
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, 'notifications', id), { read: true });
  };

  const markAllAsRead = async () => {
    if (!firestore) return;
    await Promise.all(
      notifications.filter(n => !n.read).map(n => markAsRead(n.id))
    );
  };

  const archiveNotification = async (id: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, 'notifications', id), { archived: true });
  };

  const deleteNotification = async (id: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, 'notifications', id));
  };

  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      loading,
      addNotification,
      markAsRead,
      markAllAsRead,
      archiveNotification,
      deleteNotification,
      unreadCount,
      selectedNotification,
      setSelectedNotification,
      modalOpen,
      setModalOpen
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  return ctx;
} 