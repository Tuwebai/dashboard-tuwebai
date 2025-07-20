import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { firestore } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, arrayUnion, arrayRemove, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Paperclip, Send, Check, CheckCheck, Search, Plus, Video, MoreVertical, CheckSquare, UserPlus, Gift, Ban, Trash2, Pencil, Palette } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getDocs } from 'firebase/firestore';
// Importar emoji-mart, framer-motion y lógica de storage
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFile } from '@/lib/storage';
import { Phone, AtSign, Info, Bell, BellOff, Image, File, Users, Edit2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';

// Tipos extendidos y robustos para chats y usuarios
interface UserParticipant {
  id: string;
  name?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  photoURL?: string;
}

interface Chat {
  id: string;
  users: string[];
  user?: UserParticipant;
  unreadCount?: number;
  lastMessage?: {
    text: string;
    timestamp: any;
    type?: string;
    senderId: string;
    read?: boolean;
  };
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
  read: boolean;
  user?: { name?: string; photoURL?: string; };
  reactions?: { [key: string]: string[] };
  replyTo?: string; // ID del mensaje original
  replyMessage?: Message; // Mensaje original (solo en frontend)
}

// Agrega esta función antes del return del componente:
function formatTimestamp(ts: any) {
  if (!ts) return '';
  if (typeof ts === 'string') return ts;
  if (ts.toDate) {
    const d = ts.toDate();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (ts.seconds) {
    const d = new Date(ts.seconds * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return '';
}

export default function ChatPage() {
  const { user } = useApp();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  // Agregar estados: usersData, typing, onlineStatus, recording, replyTo, editingMessage, reactions, showEmojiPicker, attachedFile, audioBlob, etc.
  const [typing, setTyping] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<'online' | 'offline' | 'typing'>('offline');
  const [recording, setRecording] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [reactions, setReactions] = useState<{ [key: string]: string[] }>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; url: string } | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  // 1. Agregar estado showUserInfoPanel y selectedUserInfo.
  const [showUserInfoPanel, setShowUserInfoPanel] = useState(false);
  const [selectedUserInfo, setSelectedUserInfo] = useState<any>(null);
  // 1. Agrega estado showReactionPicker y reactionTargetId para controlar el menú de emojis.
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionTargetId, setReactionTargetId] = useState<string | null>(null);
  // Estado para edición
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgText, setEditingMsgText] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [errorChats, setErrorChats] = useState<string | null>(null);
  const [errorMessages, setErrorMessages] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalResults, setGlobalResults] = useState<{ users: any[]; messages: any[] }>({ users: [], messages: [] });
  const [searching, setSearching] = useState(false);
  // Estado para mutear y tipo de notificación por chat
  const [mutedChats, setMutedChats] = useState<Record<string, boolean>>({});
  const [notificationTypes, setNotificationTypes] = useState<Record<string, 'all' | 'badge' | 'none'>>({});
  // Nuevo estado para el panel lateral de información del usuario
  const [userInfoPanelUser, setUserInfoPanelUser] = useState<any>(null);
  const [userInfoPanelOpen, setUserInfoPanelOpen] = useState(false);
  const [userInfoPanelData, setUserInfoPanelData] = useState<any>(null);
  const [userInfoTab, setUserInfoTab] = useState<'media' | 'files' | 'groups'>('media');
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  // Estado para saber si hay chat entre el usuario actual y el usuario del panel
  const [panelChatId, setPanelChatId] = useState<string | null>(null);
  // Estado de muteo para el chat del panel de usuario y edición
  const [panelMuted, setPanelMuted] = useState(false);
  // Estado para menú contextual
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; chat: Chat | null }>({ x: 0, y: 0, chat: null });
  // Estados para modales y selección
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [videoCallModalOpen, setVideoCallModalOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  // Estados para Jitsi Meet
  const [jitsiOpen, setJitsiOpen] = useState<null | 'audio' | 'video'>(null);
  const [jitsiRoom, setJitsiRoom] = useState<string | null>(null);
  // 4. Pin de mensajes
  const [pinnedMsgId, setPinnedMsgId] = useState<string | null>(null);

  // Eliminar/ocultar input type="file", botón Paperclip y toda la lógica relacionada con uploadFile, adjuntos y audio.
  // Eliminar/ocultar cualquier renderizado de imágenes, archivos, audio o video en los mensajes.
  // Dejar solo el input de texto, el botón de enviar y el renderizado de mensajes de texto.

  // 1. Al cargar chats y mensajes, obtener datos de usuario (nombre, avatar, estado) de la colección 'users'.
  // 2. En la cabecera del chat, mostrar avatar, nombre real y estado (en línea, escribiendo...).
  // 3. En la lista de chats, mostrar avatar y nombre real del otro usuario.
  // 4. En la lista de mensajes, agrupar mensajes consecutivos del mismo usuario (mostrar avatar solo en el primero del grupo, separar visualmente los grupos).
  // 5. Usar Firestore para actualizar y escuchar el estado "escribiendo..." y "en línea" en tiempo real.
  // 6. Al hacer clic en el ícono de chat en el dashboard del cliente, abrir el panel de información del admin.

  // Cargar datos del admin globalmente
  const [adminUser, setAdminUser] = useState<any>(null);
  useEffect(() => {
    const fetchAdmin = async () => {
      const snap = await getDocs(query(collection(firestore, 'users'), where('role', '==', 'admin')));
      if (!snap.empty) setAdminUser({ id: snap.docs[0].id, ...snap.docs[0].data() });
    };
    fetchAdmin();
  }, []);

  // Cargar chats del usuario
  useEffect(() => {
    if (!user) return;
    setLoadingChats(true);
    setErrorChats(null);
    const q = query(
      collection(firestore, 'chats'),
      where('users', 'array-contains', user.uid),
      orderBy('lastMessage.timestamp', 'desc')
    );
    const unsub = onSnapshot(q, async (snapshot) => {
      try {
      const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      setChats(chatsData);
      // Obtener datos de usuario para cada chat
      const userPromises = chatsData.map(async chat => {
        const otherUserId = chat.users.find(id => id !== user.uid);
        if (otherUserId) {
          const userDoc = await getDocs(query(collection(firestore, 'users'), where('id', '==', otherUserId)));
          if (!userDoc.empty) {
              const u = userDoc.docs[0].data();
              // Cast a UserParticipant
              const userParticipant: UserParticipant = {
                id: userDoc.docs[0].id,
                name: u.name,
                fullName: u.fullName,
                email: u.email,
                avatar: u.avatar,
                photoURL: u.photoURL,
              };
              return { ...chat, user: userParticipant };
          }
        }
        return chat;
      });
      const updatedChats = await Promise.all(userPromises);
      setChats(updatedChats);
        setLoadingChats(false);
      } catch (err) {
        setErrorChats('Error al cargar los chats.');
        setLoadingChats(false);
      }
    }, (err) => {
      setErrorChats('Error al cargar los chats.');
      setLoadingChats(false);
    });
    return () => unsub();
  }, [user]);

  // Cargar mensajes del chat seleccionado
  useEffect(() => {
    if (!selectedChat) { setMessages([]); return; }
    setLoadingMessages(true);
    setErrorMessages(null);
    const q = query(
      collection(firestore, 'chats', selectedChat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsub = onSnapshot(q, async (snapshot) => {
      try {
      let messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      // Obtener datos de usuario para cada mensaje
      const userPromises = messagesData.map(async msg => {
        const userDoc = await getDocs(query(collection(firestore, 'users'), where('id', '==', msg.senderId)));
        if (!userDoc.empty) {
          return { ...msg, user: userDoc.docs[0].data() };
        }
        return msg;
      });
      let updatedMessages = await Promise.all(userPromises);
      // Asociar replyMessage
      updatedMessages = updatedMessages.map(msg => {
        if (msg.replyTo) {
          const original = updatedMessages.find(m => m.id === msg.replyTo);
          if (original) return { ...msg, replyMessage: original };
        }
        return msg;
      });
      setMessages(updatedMessages);
        setLoadingMessages(false);
      } catch (err) {
        setErrorMessages('Error al cargar los mensajes.');
        setLoadingMessages(false);
      }
    }, (err) => {
      setErrorMessages('Error al cargar los mensajes.');
      setLoadingMessages(false);
    });
    return () => unsub();
  }, [selectedChat]);

  // Marcar mensajes como leídos al abrir chat
  useEffect(() => {
    if (!selectedChat || !user) return;
    const unread = messages.filter(m => m.senderId !== user.uid && !m.read);
    if (unread.length > 0) {
      unread.forEach(async (msg) => {
        await updateDoc(doc(firestore, 'chats', selectedChat.id, 'messages', msg.id), { read: true });
      });
      updateDoc(doc(firestore, 'chats', selectedChat.id), {
        lastMessage: { ...selectedChat.lastMessage, read: true }
      });
    }
  }, [messages, selectedChat, user]);

  // Scroll automático siempre al último mensaje
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, selectedChat]);

  // Enviar mensaje con reply
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;
    await addDoc(collection(firestore, 'chats', selectedChat.id, 'messages'), {
      senderId: user.uid,
      text: newMessage.trim(),
      timestamp: serverTimestamp(),
      read: false,
      ...(replyTo ? { replyTo: replyTo.id } : {})
    });
    await updateDoc(doc(firestore, 'chats', selectedChat.id), {
      lastMessage: {
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        senderId: user.uid,
        read: false
      }
    });
    setNewMessage('');
    setReplyTo(null);
  };

  // Crear nuevo chat (búsqueda de usuarios y lógica de inicio de chat)
  // ... (puedes expandir aquí para búsqueda avanzada de usuarios)

  // Cargar todos los usuarios para el modal
  const loadAllUsers = async () => {
    setLoadingUsers(true);
    const snap = await getDocs(collection(firestore, 'users'));
    setAllUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserParticipant)));
    setLoadingUsers(false);
  };

  // Abrir modal y cargar usuarios
  const handleOpenUserModal = () => {
    setShowUserModal(true);
    loadAllUsers();
  };

  // Iniciar chat con usuario seleccionado
  const handleStartChat = async (otherUser: any) => {
    if (!user) return;
    // Buscar si ya existe chat
    const q = query(
      collection(firestore, 'chats'),
      where('users', 'array-contains', user.uid)
    );
    const snap = await getDocs(q);
    let chat = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat)).find((c: any) => c.users.includes(otherUser.id));
    if (!chat) {
      // Crear nuevo chat
      const newChatRef = await addDoc(collection(firestore, 'chats'), {
        users: [user.uid, otherUser.id],
        lastMessage: { text: '', timestamp: serverTimestamp(), senderId: '', read: true }
      });
      chat = { id: newChatRef.id, users: [user.uid, otherUser.id], lastMessage: { text: '', timestamp: null, senderId: '', read: true } } as Chat;
    }
    setSelectedChat(chat);
    setShowUserModal(false);
  };

  // Handler para agregar/quitar reacción
  const handleReaction = async (msgId: string, emoji: string) => {
    if (!selectedChat || !user) return;
    const msgRef = doc(firestore, 'chats', selectedChat.id, 'messages', msgId);
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const userReacted = msg.reactions && msg.reactions[emoji]?.includes(user.uid);
    if (userReacted) {
      // Quitar reacción
      await updateDoc(msgRef, {
        [`reactions.${emoji}`]: arrayRemove(user.uid)
      });
    } else {
      // Agregar reacción
      await updateDoc(msgRef, {
        [`reactions.${emoji}`]: arrayUnion(user.uid)
      });
    }
  };

  // Handler para iniciar edición
  const startEditMessage = (msg: Message) => {
    setEditingMsgId(msg.id);
    setEditingMsgText(msg.text);
  };
  // Handler para guardar edición
  const saveEditMessage = async () => {
    if (!selectedChat || !editingMsgId) return;
    const msgRef = doc(firestore, 'chats', selectedChat.id, 'messages', editingMsgId);
    await updateDoc(msgRef, { text: editingMsgText });
    setEditingMsgId(null);
    setEditingMsgText('');
  };
  // Handler para cancelar edición
  const cancelEditMessage = () => {
    setEditingMsgId(null);
    setEditingMsgText('');
  };
  // Handler para eliminar mensaje
  const deleteMessage = async (msgId: string) => {
    if (!selectedChat) return;
    const msgRef = doc(firestore, 'chats', selectedChat.id, 'messages', msgId);
    await deleteDoc(msgRef);
  };

  // Estado de presencia de usuarios
  const [presenceMap, setPresenceMap] = useState<Record<string, any>>({});

  // Helper para obtener el uid del otro usuario
  const getOtherUserId = (chat: Chat) => chat.users.find((id: string) => id !== user.uid);

  // Actualizar presencia online/offline del usuario actual
  useEffect(() => {
    if (!user) return;
    const presenceRef = doc(firestore, 'userPresence', user.uid);
    const setOnline = async () => {
      await setDoc(presenceRef, {
        uid: user.uid,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL || '',
        isOnline: true,
        lastSeen: serverTimestamp(),
        typing: false
      }, { merge: true });
    };
    setOnline();
    const handleOffline = async () => {
      await setDoc(presenceRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
        typing: false
      }, { merge: true });
    };
    window.addEventListener('beforeunload', handleOffline);
    window.addEventListener('offline', handleOffline);
    return () => {
      handleOffline();
      window.removeEventListener('beforeunload', handleOffline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  // Escuchar presencia de todos los usuarios de los chats
  useEffect(() => {
    if (!chats.length) return;
    const unsubList: (() => void)[] = [];
    chats.forEach(chat => {
      const otherUserId = getOtherUserId(chat);
      if (otherUserId) {
        const ref = onSnapshot(doc(firestore, 'userPresence', otherUserId), snap => {
          setPresenceMap(prev => ({ ...prev, [otherUserId]: snap.exists() ? snap.data() : { isOnline: false } }));
        });
        unsubList.push(ref);
      }
    });
    return () => { unsubList.forEach(unsub => unsub()); };
  }, [chats, user]);

  // Typing indicator real
  useEffect(() => {
    if (!user) return;
    let typingTimeout: NodeJS.Timeout;
    const presenceRef = doc(firestore, 'userPresence', user.uid);
    const setTyping = async (isTyping: boolean) => {
      await setDoc(presenceRef, { typing: isTyping }, { merge: true });
    };
    if (typing) {
      setTyping(true);
      typingTimeout = setTimeout(() => setTyping(false), 2000);
    } else {
      setTyping(false);
    }
    return () => {
      clearTimeout(typingTimeout);
      setTyping(false);
    };
  }, [typing, user]);

  // Cargar estado de mute y tipo de notificación de los chats
  useEffect(() => {
    if (!chats.length) return;
    const muteMap: Record<string, boolean> = {};
    const notifMap: Record<string, 'all' | 'badge' | 'none'> = {};
    chats.forEach(chat => {
      muteMap[chat.id] = mutedChats[chat.id] || false;
      notifMap[chat.id] = notificationTypes[chat.id] || 'all';
    });
    setMutedChats(muteMap);
    setNotificationTypes(notifMap);
  }, [chats]);

  // Handler para mutear/desmutear chat
  const toggleMuteChat = async (chatId: string) => {
    const chatRef = doc(firestore, 'chats', chatId);
    await updateDoc(chatRef, { muted: !mutedChats[chatId] });
  };
  // Handler para cambiar tipo de notificación
  const changeNotificationType = async (chatId: string, type: 'all' | 'badge' | 'none') => {
    const chatRef = doc(firestore, 'chats', chatId);
    await updateDoc(chatRef, { notificationType: type });
  };

  // Handler para eliminar chat
  const handleDeleteChat = async (chatId: string) => {
    await deleteDoc(doc(firestore, 'chats', chatId));
    setContextMenu({ x: 0, y: 0, chat: null });
  };
  // Handler para silenciar/desilenciar chat
  const handleToggleMute = async (chat: Chat) => {
    const chatRef = doc(firestore, 'chats', chat.id);
    await updateDoc(chatRef, { muted: !mutedChats[chat.id] });
    setToastMsg(mutedChats[chat.id] ? 'Chat desilenciado' : 'Chat silenciado');
  };

  // Filtro de búsqueda en la lista de chats
  const filteredChats = chats.filter(chat => {
    const name = chat.user?.name?.toLowerCase() || '';
    const lastMsg = chat.lastMessage?.text?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || lastMsg.includes(q);
  });

  // Notificaciones push de nuevos mensajes no leídos
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (Notification.permission !== 'granted') return;
    if (!chats.length) return;
    // Detectar nuevos mensajes no leídos en chats que NO están abiertos
    const unsub = onSnapshot(
      query(collection(firestore, 'chats'), where('users', 'array-contains', user.uid)),
      (snapshot) => {
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (
            data.lastMessage &&
            data.lastMessage.senderId !== user.uid &&
            !data.lastMessage.read &&
            (!selectedChat || docSnap.id !== selectedChat.id) &&
            !mutedChats[docSnap.id] &&
            notificationTypes[docSnap.id] === 'all'
          ) {
            // Mostrar notificación push
            new Notification(data.user?.name || 'Nuevo mensaje', {
              body: data.lastMessage.text,
              icon: data.user?.photoURL || '/favicon.ico',
              tag: docSnap.id
            });
          }
        });
      }
    );
    return () => unsub();
  }, [user, chats, selectedChat]);

  // Búsqueda global de usuarios y mensajes
  useEffect(() => {
    if (!globalSearch.trim()) {
      setGlobalResults({ users: [], messages: [] });
      return;
    }
    setSearching(true);
    const doSearch = async () => {
      // Buscar usuarios
      const usersSnap = await getDocs(collection(firestore, 'users'));
      const users = usersSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as UserParticipant))
        .filter(u =>
          (u.name?.toLowerCase().includes(globalSearch.toLowerCase()) ||
            u.email?.toLowerCase().includes(globalSearch.toLowerCase())) &&
          u.id !== user.uid
        );
      // Buscar mensajes en todos los chats del usuario
      const chatsSnap = await getDocs(query(collection(firestore, 'chats'), where('users', 'array-contains', user.uid)));
      let messages: any[] = [];
      for (const chatDoc of chatsSnap.docs) {
        const chatId = chatDoc.id;
        const msgsSnap = await getDocs(collection(firestore, 'chats', chatId, 'messages'));
        msgsSnap.forEach(msgDoc => {
          const msg = msgDoc.data();
          if (msg.text?.toLowerCase().includes(globalSearch.toLowerCase())) {
            messages.push({ ...msg, id: msgDoc.id, chatId });
          }
        });
      }
      setGlobalResults({ users, messages });
      setSearching(false);
    };
    doSearch();
  }, [globalSearch, user]);

  // Abrir panel lateral al hacer clic en la cabecera del chat
  const handleOpenUserInfoPanel = (userId: string) => {
    setUserInfoPanelUser(userId);
    setUserInfoPanelOpen(true);
  };
  // Escuchar datos en tiempo real del usuario para el panel
  useEffect(() => {
    if (!userInfoPanelUser) return;
    const unsub = onSnapshot(doc(firestore, 'users', userInfoPanelUser), (snap) => {
      if (snap.exists()) setUserInfoPanelData({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [userInfoPanelUser]);

  // Handler para abrir panel de edición
  const handleOpenEditPanel = () => {
    setEditData(userInfoPanelData);
    setEditPanelOpen(true);
  };
  // Handler para guardar cambios de usuario
  const handleSaveEdit = async () => {
    if (!editData?.id) return;
    await updateDoc(doc(firestore, 'users', editData.id), {
      name: editData.name,
      lastName: editData.lastName || '',
      bio: editData.bio || '',
      phone: editData.phone || '',
      username: editData.username || '',
    });
    setEditPanelOpen(false);
  };
  // Handler para eliminar contacto (opcional, solo si aplica)
  const handleDeleteContact = async () => {
    if (!editData?.id) return;
    await updateDoc(doc(firestore, 'users', editData.id), { deleted: true });
    setEditPanelOpen(false);
    setUserInfoPanelOpen(false);
  };
  // Handler para cambiar notificaciones (mute/unmute) con verificación de existencia
  const toggleMuteChatSafe = async (chatId: string) => {
    const chatRef = doc(firestore, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      await setDoc(chatRef, { muted: true }, { merge: true });
    } else {
      await updateDoc(chatRef, { muted: !mutedChats[chatId] });
    }
  };

  // Buscar el chat entre el usuario actual y el usuario del panel y escuchar su estado
  useEffect(() => {
    if (!userInfoPanelUser || !user) { setPanelChatId(null); return; }
    const q = query(collection(firestore, 'chats'), where('users', 'array-contains', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const chat = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).find((c: any) => c.users.includes(userInfoPanelUser));
      setPanelChatId(chat ? chat.id : null);
    });
    return () => unsub();
  }, [userInfoPanelUser, user]);

  // Escuchar el estado de muteo en tiempo real para el chat del panel
  useEffect(() => {
    if (!panelChatId) { setPanelMuted(false); return; }
    const unsub = onSnapshot(doc(firestore, 'chats', panelChatId), (snap) => {
      setPanelMuted(snap.exists() ? !!snap.data().muted : false);
    });
    return () => unsub();
  }, [panelChatId]);

  // Ajustar layout principal
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);


  const handleShareContact = async () => {
    if (!selectedChat?.user) return;
    await addDoc(collection(firestore, 'chats', selectedChat.id, 'messages'), {
      senderId: user.uid,
      text: `Contacto: ${user.name || ''} (${user.email || ''})`,
      type: 'contact',
      timestamp: serverTimestamp(),
      read: false
    });
    await updateDoc(doc(firestore, 'chats', selectedChat.id), {
      lastMessage: {
        text: `Contacto: ${user.name || ''} (${user.email || ''})`,
        timestamp: serverTimestamp(),
        senderId: user.uid,
        read: false
      }
    });
  };

  const handleSendGift = () => {
    setToastMsg('¡Regalo enviado!');
  };

  const handleBlockUser = async () => {
    if (!selectedChat?.user) return;
    await updateDoc(doc(firestore, 'users', user.uid), {
      blocked: arrayUnion(selectedChat.user.id)
    });
    setToastMsg('Usuario bloqueado');
  };

  // Render modales y toast
  {callModalOpen && (
    <Dialog open={callModalOpen} onOpenChange={setCallModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Llamada</DialogTitle>
        </DialogHeader>
        <div className="py-6 text-center">Simulación de llamada en curso...</div>
        <Button onClick={() => setCallModalOpen(false)}>Colgar</Button>
      </DialogContent>
    </Dialog>
  )}
  {videoCallModalOpen && (
    <Dialog open={videoCallModalOpen} onOpenChange={setVideoCallModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Videollamada</DialogTitle>
        </DialogHeader>
        <div className="py-6 text-center">Simulación de videollamada en curso...</div>
        <Button onClick={() => setVideoCallModalOpen(false)}>Colgar</Button>
      </DialogContent>
    </Dialog>
  )}
  {toastMsg && (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-3 rounded shadow-lg z-[9999] animate-fade-in-out">{toastMsg}</div>
  )}

  // Llamada/videollamada real con Jitsi Meet
  const handleCall = () => {
    if (!selectedChat) return;
    setJitsiRoom(`tuwebai-chat-${selectedChat.id}`);
    setJitsiOpen('audio');
  };
  const handleVideoCall = () => {
    if (!selectedChat) return;
    setJitsiRoom(`tuwebai-chat-${selectedChat.id}`);
    setJitsiOpen('video');
  };

  // Seleccionar mensajes: copiar/borrar
  const handleSelectMessages = () => {
    setSelectMode(!selectMode);
    setSelectedMessages([]);
  };
  const handleCopySelected = async () => {
    const texts = messages.filter(m => selectedMessages.includes(m.id)).map(m => m.text).join('\n');
    await navigator.clipboard.writeText(texts);
    setToastMsg('Mensajes copiados');
  };
  const handleDeleteSelected = async () => {
    if (!selectedChat) return;
    const batch = (await import('firebase/firestore')).writeBatch(firestore);
    selectedMessages.forEach(id => {
      const ref = doc(firestore, 'chats', selectedChat.id, 'messages', id);
      batch.delete(ref);
    });
    await batch.commit();
    setSelectedMessages([]);
    setSelectMode(false);
    setToastMsg('Mensajes eliminados');
  };

  // Búsqueda en chat: resalta y navega
  const [searchInChat, setSearchInChat] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  useEffect(() => {
    if (!searchInChat.trim()) { setSearchResults([]); setSearchIndex(0); return; }
    const ids = messages.filter(m => m.text.toLowerCase().includes(searchInChat.toLowerCase())).map(m => m.id);
    setSearchResults(ids);
    setSearchIndex(0);
  }, [searchInChat, messages]);
  const handleSearchInChat = () => {
    const el = document.getElementById('chat-search-input');
    if (el) (el as HTMLInputElement).focus();
  };
  const goToNextResult = () => {
    if (searchResults.length === 0) return;
    const next = (searchIndex + 1) % searchResults.length;
    setSearchIndex(next);
    const el = document.getElementById(`msg-${searchResults[next]}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const goToPrevResult = () => {
    if (searchResults.length === 0) return;
    const prev = (searchIndex - 1 + searchResults.length) % searchResults.length;
    setSearchIndex(prev);
    const el = document.getElementById(`msg-${searchResults[prev]}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Render Jitsi Meet modal
  {jitsiOpen && jitsiRoom && (
    <Dialog open={!!jitsiOpen} onOpenChange={() => setJitsiOpen(null)}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{jitsiOpen === 'audio' ? 'Llamada' : 'Videollamada'}</DialogTitle>
        </DialogHeader>
        <iframe
          src={`https://meet.jit.si/${jitsiRoom}#config.startWithVideoMuted=${jitsiOpen === 'audio' ? 'true' : 'false'}&config.startWithAudioMuted=false`}
          allow="camera; microphone; fullscreen; display-capture"
          className="w-full h-[60vh] rounded"
          title="Jitsi Meet"
        />
        <Button onClick={() => setJitsiOpen(null)} className="mt-4">Finalizar</Button>
      </DialogContent>
    </Dialog>
  )}

  // 1. Reply a mensajes
  const handleReply = (msg: Message) => setReplyTo(msg);

  // 5. Menú contextual sobre cada mensaje
  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, chat: selectedChat });
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-end p-2">
      </div>
      <div className="flex w-full h-[100dvh] bg-background overflow-hidden max-h-screen">
        {/* Panel izquierdo: lista de chats */}
        <aside className="hidden md:flex flex-col w-80 border-r border-border bg-card h-full min-w-[320px] max-w-xs transition-all duration-300">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar chats o usuarios..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-input border-border"
            />
          </div>
          {/* En la lista de chats, usar filteredChats y mejorar accesibilidad */}
          <div className="flex-1 overflow-y-auto" role="list" aria-label="Lista de chats">
            {searching || globalSearch.trim() ? (
              <>
                {searching ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                    <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></span>
                    <span className="text-lg font-semibold">Buscando...</span>
              </div>
                ) : globalResults.users.length > 0 ? (
                  globalResults.users.map((u: UserParticipant) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 p-4 cursor-pointer border-b border-border hover:bg-accent transition"
                      onClick={() => handleStartChat(u)}
                      tabIndex={0}
                      aria-label={`Chat con ${u.fullName || u.name || u.email}`}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          {u.avatar || u.photoURL ? (
                            <AvatarImage src={u.avatar || u.photoURL} alt={u.fullName || u.name || 'Avatar'} />
                          ) : (
                            <AvatarFallback>{u.fullName?.charAt(0) || u.name?.charAt(0) || 'U'}</AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold truncate max-w-[140px]">{u.fullName || u.name || u.email}</span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                    <span className="text-lg font-semibold">No se encontraron resultados</span>
                  </div>
                )}
              </>
            ) : (
              filteredChats.map(chat => {
                // Solo declarar 'otherUser' una vez por cada chat en el map
                const otherUser: UserParticipant = chat.user || { id: '', name: '', fullName: '', email: '', avatar: '', photoURL: '' };
                const isOnline = presenceMap[getOtherUserId(chat)]?.isOnline;
                const lastActive = presenceMap[getOtherUserId(chat)]?.lastSeen;
                const unreadCount = chat.unreadCount || 0;
                const lastMsg = chat.lastMessage;
                // Formato de hora
                const now = new Date();
                let lastSeenText = 'Offline';
                if (isOnline) {
                  lastSeenText = 'Online';
                } else if (lastActive) {
                  const last = new Date(lastActive.seconds * 1000);
                  const diff = Math.floor((now.getTime() - last.getTime()) / 1000);
                  if (diff < 60) lastSeenText = 'hace un minuto';
                  else if (diff < 3600) lastSeenText = `hace ${Math.floor(diff/60)} min`;
                  else if (diff < 86400) lastSeenText = `hace ${Math.floor(diff/3600)} h`;
                  else if (diff < 172800) lastSeenText = 'ayer';
                  else lastSeenText = `${Math.floor(diff/86400)} días atrás`;
                }
                // Formato timestamp
                let ts = '';
                if (lastMsg?.timestamp?.toDate) {
                  const d = lastMsg.timestamp.toDate();
                  ts = (now.toDateString() === d.toDateString()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString([], { day: '2-digit', month: 'short' });
                }
                // Preview de mensaje
                let msgPreview = '';
                if (lastMsg?.type === 'image') msgPreview = '📷 Foto';
                else msgPreview = lastMsg?.text || '';
                return (
                  <ContextMenu key={chat.id}>
                    <ContextMenuTrigger asChild>
              <div
                key={chat.id}
                      role="listitem"
                      tabIndex={0}
                      aria-label={`Chat con ${otherUser.fullName || otherUser.name || otherUser.email || 'usuario'}`}
                      className={`flex items-center gap-3 p-4 cursor-pointer border-b border-border transition relative ${selectedChat?.id === chat.id ? 'bg-[#6c5ce7]/80 ring-2 ring-primary' : 'hover:bg-accent'}`}
                      onClick={() => { setSelectedChat(chat); setSelectedUserInfo(chat.user); setShowUserInfoPanel(true); }}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setSelectedChat(chat); setSelectedUserInfo(chat.user); setShowUserInfoPanel(true); } }}
                    >
                      <div className="relative group">
                        <Avatar className={`h-10 w-10 ${!isOnline ? 'grayscale border-2 border-gray-400' : ''}`}> {/* Avatar real */}
                          {otherUser.avatar || otherUser.photoURL ? (
                            <AvatarImage src={otherUser.avatar || otherUser.photoURL} alt={otherUser.fullName || otherUser.name || otherUser.email || 'Avatar'} />
                          ) : (
                            <AvatarFallback>{(otherUser.fullName || otherUser.name || otherUser.email || 'U').charAt(0)}</AvatarFallback>
                          )}
                </Avatar>
                        {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-500"></span>}
                        {/* Estado online/last seen en hover */}
                        <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-background px-2 py-1 rounded shadow text-xs text-muted-foreground opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                          {lastSeenText}
                        </div>
                      </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                          <span className="font-bold truncate max-w-[140px]">{otherUser.fullName || otherUser.name || otherUser.email || 'Usuario'}</span>
                          <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">{ts}</span>
                  </div>
                  <div className="flex items-center gap-2">
                          <span className="truncate text-sm text-muted-foreground max-w-[120px]">{msgPreview}</span>
                          {unreadCount > 0 && (
                            <span className="ml-2 bg-primary text-white rounded-full px-2 py-0.5 text-xs font-bold min-w-[22px] text-center">{unreadCount}</span>
                )}
                  </div>
                </div>
              </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent key={`menu-${chat.id}`}>
                      <ContextMenuItem key={`delete-${chat.id}`} onClick={() => handleDeleteChat(chat.id)}>
                        <Trash2 className="w-4 h-4 mr-2 text-destructive" /> Eliminar chat
                      </ContextMenuItem>
                      <ContextMenuItem key={`mute-${chat.id}`} onClick={() => handleToggleMute(chat)}>
                        {mutedChats[chat.id] ? <BellOff className="w-4 h-4 mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
                        {mutedChats[chat.id] ? 'Desilenciar' : 'Silenciar'}
                      </ContextMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Palette className="w-4 h-4 mr-2" /> Tema de color
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })
            )}
          </div>
          {/* Botón flotante + */}
            <Button
              className="fixed bottom-8 left-8 z-50 rounded-full shadow-lg bg-gradient-to-br from-purple-600 to-blue-500 text-white w-14 h-14 flex items-center justify-center text-3xl hover:scale-105 transition"
              onClick={handleOpenUserModal}
            >
              <Plus className="w-8 h-8" />
            </Button>
          {/* Modal de usuarios */}
          <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
            <DialogContent className="max-w-lg" aria-describedby="user-modal-desc">
              <DialogHeader>
                <DialogTitle>Iniciar nuevo chat</DialogTitle>
              </DialogHeader>
              <div id="user-modal-desc" className="sr-only">Busca y selecciona un usuario para iniciar una conversación real.</div>
              <Input
                placeholder="Buscar usuario..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="mb-4"
              />
              <div className="max-h-80 overflow-y-auto">
                {loadingUsers ? (
                  <div className="text-center py-8">Cargando usuarios...</div>
                ) : (
                  allUsers.filter(u => u.id !== user.uid && (u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()))).map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-accent rounded cursor-pointer" onClick={() => handleStartChat(u)}>
                      <Avatar className="h-8 w-8">{u.photoURL ? <AvatarImage src={u.photoURL} alt={u.name || 'Avatar'} /> : <AvatarFallback>{u.name?.charAt(0)}</AvatarFallback>}</Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{u.name || u.email}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </aside>
        {/* Panel izquierdo colapsable en móvil */}
        <aside className="flex md:hidden flex-col w-full h-1/2 max-h-[50vh] border-b border-border bg-card transition-all duration-300 z-30 absolute top-0 left-0" style={{ display: showMobileSidebar ? 'flex' : 'none' }}>
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar chats o usuarios..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-input border-border"
            />
          </div>
          {/* En la lista de chats, usar filteredChats y mejorar accesibilidad */}
          <div className="flex-1 overflow-y-auto" role="list" aria-label="Lista de chats">
            {searching || globalSearch.trim() ? (
              <>
                {searching ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                    <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></span>
                    <span className="text-lg font-semibold">Buscando...</span>
                  </div>
                ) : globalResults.users.length > 0 ? (
                  globalResults.users.map((u: UserParticipant) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 p-4 cursor-pointer border-b border-border hover:bg-accent transition"
                      onClick={() => handleStartChat(u)}
                      tabIndex={0}
                      aria-label={`Chat con ${u.fullName || u.name || u.email}`}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          {u.avatar || u.photoURL ? (
                            <AvatarImage src={u.avatar || u.photoURL} alt={u.fullName || u.name || 'Avatar'} />
                          ) : (
                            <AvatarFallback>{u.fullName?.charAt(0) || u.name?.charAt(0) || 'U'}</AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold truncate max-w-[140px]">{u.fullName || u.name || u.email}</span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                    <span className="text-lg font-semibold">No se encontraron resultados</span>
                  </div>
                )}
              </>
            ) : (
              filteredChats.map(chat => {
                // Solo declarar 'otherUser' una vez por cada chat en el map
                const otherUser: UserParticipant = chat.user || { id: '', name: '', fullName: '', email: '', avatar: '', photoURL: '' };
                const isOnline = presenceMap[getOtherUserId(chat)]?.isOnline;
                const lastActive = presenceMap[getOtherUserId(chat)]?.lastSeen;
                const unreadCount = chat.unreadCount || 0;
                const lastMsg = chat.lastMessage;
                // Formato de hora
                const now = new Date();
                let lastSeenText = 'Offline';
                if (isOnline) {
                  lastSeenText = 'Online';
                } else if (lastActive) {
                  const last = new Date(lastActive.seconds * 1000);
                  const diff = Math.floor((now.getTime() - last.getTime()) / 1000);
                  if (diff < 60) lastSeenText = 'hace un minuto';
                  else if (diff < 3600) lastSeenText = `hace ${Math.floor(diff/60)} min`;
                  else if (diff < 86400) lastSeenText = `hace ${Math.floor(diff/3600)} h`;
                  else if (diff < 172800) lastSeenText = 'ayer';
                  else lastSeenText = `${Math.floor(diff/86400)} días atrás`;
                }
                // Formato timestamp
                let ts = '';
                if (lastMsg?.timestamp?.toDate) {
                  const d = lastMsg.timestamp.toDate();
                  ts = (now.toDateString() === d.toDateString()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString([], { day: '2-digit', month: 'short' });
                }
                // Preview de mensaje
                let msgPreview = '';
                if (lastMsg?.type === 'image') msgPreview = '📷 Foto';
                else msgPreview = lastMsg?.text || '';
                return (
                  <ContextMenu key={chat.id}>
                    <ContextMenuTrigger asChild>
                      <div
                        key={chat.id}
                        role="listitem"
                        tabIndex={0}
                        aria-label={`Chat con ${otherUser.fullName || otherUser.name || otherUser.email || 'usuario'}`}
                        className={`flex items-center gap-3 p-4 cursor-pointer border-b border-border transition relative ${selectedChat?.id === chat.id ? 'bg-[#6c5ce7]/80 ring-2 ring-primary' : 'hover:bg-accent'}`}
                        onClick={() => { setSelectedChat(chat); setSelectedUserInfo(chat.user); setShowUserInfoPanel(true); }}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setSelectedChat(chat); setSelectedUserInfo(chat.user); setShowUserInfoPanel(true); } }}
                      >
                        <div className="relative group">
                          <Avatar className={`h-10 w-10 ${!isOnline ? 'grayscale border-2 border-gray-400' : ''}`}> {/* Avatar real */}
                            {otherUser.avatar || otherUser.photoURL ? (
                              <AvatarImage src={otherUser.avatar || otherUser.photoURL} alt={otherUser.fullName || otherUser.name || otherUser.email || 'Avatar'} />
                            ) : (
                              <AvatarFallback>{(otherUser.fullName || otherUser.name || otherUser.email || 'U').charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-500"></span>}
                          {/* Estado online/last seen en hover */}
                          <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-background px-2 py-1 rounded shadow text-xs text-muted-foreground opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                            {lastSeenText}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold truncate max-w-[140px]">{otherUser.fullName || otherUser.name || otherUser.email || 'Usuario'}</span>
                            <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">{ts}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm text-muted-foreground max-w-[120px]">{msgPreview}</span>
                            {unreadCount > 0 && (
                              <span className="ml-2 bg-primary text-white rounded-full px-2 py-0.5 text-xs font-bold min-w-[22px] text-center">{unreadCount}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent key={`menu-${chat.id}`}>
                      <ContextMenuItem key={`delete-${chat.id}`} onClick={() => handleDeleteChat(chat.id)}>
                        <Trash2 className="w-4 h-4 mr-2 text-destructive" /> Eliminar chat
                      </ContextMenuItem>
                      <ContextMenuItem key={`mute-${chat.id}`} onClick={() => handleToggleMute(chat)}>
                        {mutedChats[chat.id] ? <BellOff className="w-4 h-4 mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
                        {mutedChats[chat.id] ? 'Desilenciar' : 'Silenciar'}
                      </ContextMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Palette className="w-4 h-4 mr-2" /> Tema de color
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })
            )}
          </div>
          {/* Botón flotante + */}
          <Button
            className="fixed bottom-8 left-8 z-50 rounded-full shadow-lg bg-gradient-to-br from-purple-600 to-blue-500 text-white w-14 h-14 flex items-center justify-center text-3xl hover:scale-105 transition"
            onClick={handleOpenUserModal}
          >
            <Plus className="w-8 h-8" />
          </Button>
          {/* Modal de usuarios */}
          <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
            <DialogContent className="max-w-lg" aria-describedby="user-modal-desc">
              <DialogHeader>
                <DialogTitle>Iniciar nuevo chat</DialogTitle>
              </DialogHeader>
              <div id="user-modal-desc" className="sr-only">Busca y selecciona un usuario para iniciar una conversación real.</div>
              <Input
                placeholder="Buscar usuario..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="mb-4"
              />
              <div className="max-h-80 overflow-y-auto">
                {loadingUsers ? (
                  <div className="text-center py-8">Cargando usuarios...</div>
                ) : (
                  allUsers.filter(u => u.id !== user.uid && (u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()))).map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-accent rounded cursor-pointer" onClick={() => handleStartChat(u)}>
                      <Avatar className="h-8 w-8">{u.photoURL ? <AvatarImage src={u.photoURL} alt={u.name || 'Avatar'} /> : <AvatarFallback>{u.name?.charAt(0)}</AvatarFallback>}</Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{u.name || u.email}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </aside>
        {/* Panel central: chat activo */}
        <section className="flex-1 flex flex-col h-full relative bg-background transition-all duration-300">
          {!selectedChat ? (
            <div className="flex flex-1 items-center justify-center flex-col text-muted-foreground">
              <span className="text-2xl font-bold mb-2">Seleccioná un chat para comenzar</span>
              <span className="text-sm">Busca o inicia una conversación desde la barra lateral</span>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Header del chat */}
              <div className="p-4 border-b border-border flex items-center gap-3 justify-between bg-card">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {selectedChat?.user?.photoURL ? (
                      <AvatarImage src={selectedChat.user.photoURL} alt={selectedChat.user.name || 'Avatar'} />
                    ) : (
                      <AvatarFallback>{selectedChat?.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold text-base">{selectedChat?.user?.name || 'Chat'}</span>
                    <span className="text-xs text-muted-foreground">{presenceMap[selectedChat ? getOtherUserId(selectedChat) : '']?.isOnline ? 'En línea' : presenceMap[selectedChat ? getOtherUserId(selectedChat) : '']?.lastSeen ? `visto por última vez ${new Date(presenceMap[selectedChat ? getOtherUserId(selectedChat) : ''].lastSeen.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Offline'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Button variant="ghost" size="icon" aria-label="Llamar" onClick={handleCall}>
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Videollamada" onClick={handleVideoCall}>
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Buscar en chat" onClick={handleSearchInChat}>
                    <Search className="h-5 w-5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Más opciones">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => handleToggleMute(selectedChat)}>
                        <BellOff className="w-4 h-4 mr-2" /> Silenciar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCall}>
                        <Phone className="w-4 h-4 mr-2" /> Llamar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleVideoCall}>
                        <Video className="w-4 h-4 mr-2" /> Videollamada
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSelectMessages}>
                        <CheckSquare className="w-4 h-4 mr-2" /> Seleccionar mensajes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShareContact}>
                        <UserPlus className="w-4 h-4 mr-2" /> Compartir contacto
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleBlockUser}>
                        <Ban className="w-4 h-4 mr-2" /> Bloquear usuario
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Palette className="w-4 h-4 mr-2" /> Tema de color
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuItem onClick={() => handleDeleteChat(selectedChat?.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2 text-destructive" /> Eliminar chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {/* Mensajes agrupados por usuario */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2" ref={messagesEndRef}>
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                    <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></span>
                    <span className="text-lg font-semibold">Cargando mensajes...</span>
                  </div>
                ) : errorMessages ? (
                  <div className="flex flex-col items-center justify-center h-full text-destructive p-8">
                    <span className="text-lg font-semibold">{errorMessages}</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground">No hay mensajes aún</div>
                ) : (
                  messages.map((msg, index) => {
                    const isSameSender = index > 0 && messages[index - 1].senderId === msg.senderId;
                    const isGrouped = isSameSender && messages[index - 1].text.length > 0 && messages[index - 1].text.charAt(messages[index - 1].text.length - 1) === ' ';

                    return (
                      <div
                        key={msg.id}
                        id={`msg-${msg.id}`}
                        className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'} mb-2`}
                      >
                        <div
                          className={`relative max-w-[80%] px-5 py-3 rounded-2xl shadow text-base whitespace-pre-line break-words leading-relaxed select-text ${
                            msg.senderId === user.uid
                              ? 'bg-[#6c5ce7] text-white rounded-br-md'
                              : 'bg-zinc-800 text-white rounded-bl-md'
                          }`}
                          style={{
                            borderBottomRightRadius: msg.senderId === user.uid ? 6 : 20,
                            borderBottomLeftRadius: msg.senderId !== user.uid ? 6 : 20,
                            paddingRight: 56 // espacio para la hora
                          }}
                        >
                          <span style={{ fontSize: 17 }}>{msg.text}</span>
                          <span
                            className="absolute bottom-2 right-4 text-xs text-zinc-200 opacity-90 select-none"
                            style={{ fontSize: 14, minWidth: 38, textAlign: 'right', letterSpacing: 0.2 }}
                          >
                            {formatTimestamp(msg.timestamp)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              {/* Input de mensaje con reply preview */}
              <form
                className="p-4 border-t border-border flex flex-col gap-2 md:flex-row md:items-center"
                onSubmit={e => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                {replyTo && (
                  <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded px-2 py-1 mb-1 w-full">
                    <span className="font-semibold mr-2">{replyTo.user?.name || 'Usuario'}:</span>
                    <span className="truncate flex-1">{replyTo.text.length > 60 ? replyTo.text.slice(0, 60) + '…' : replyTo.text}</span>
                    <Button variant="ghost" size="icon" onClick={() => setReplyTo(null)}>
                      ×
                    </Button>
                  </div>
                )}
                <div className="flex flex-1 gap-2">
                  <Input
                    className="flex-1 resize-none"
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={e => { setNewMessage(e.target.value); setTyping(true); }}
                    onBlur={() => setTyping(false)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                        setTyping(false);
                      } else {
                        setTyping(true);
                      }
                    }}
                  />
                  <Button type="submit" variant="default" size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </div>
          )}
        </section>
        {/* Panel derecho: perfil/contacto */}
        <AnimatePresence>
          {userInfoPanelOpen && userInfoPanelData && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
              className="fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col bg-card shadow-2xl md:rounded-none rounded-t-2xl md:h-full md:rounded-l-2xl md:w-[400px]"
              style={{ pointerEvents: 'auto' }}
              onClick={() => setUserInfoPanelOpen(false)}
            >
              <div
                className="bg-card w-full h-full flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setUserInfoPanelOpen(false)} aria-label="Cerrar panel">
                      ×
                    </Button>
                    <span className="font-bold text-lg">User Info</span>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Editar perfil" onClick={handleOpenEditPanel}>
                    <Edit2 className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </div>
                {/* Avatar y nombre */}
                <div className="flex flex-col items-center mt-6 mb-2">
                  <Avatar className="h-24 w-24 mb-2">
                    {userInfoPanelData.photoURL ? (
                      <AvatarImage src={userInfoPanelData.photoURL} alt={userInfoPanelData.name || 'Avatar'} />
                    ) : (
                      <AvatarFallback className="text-4xl">{userInfoPanelData.name?.charAt(0) || 'U'}</AvatarFallback>
                    )}
                    </Avatar>
                  <div className="font-bold text-xl text-center">{userInfoPanelData.name}</div>
                  <div className="text-xs text-muted-foreground text-center">
                    {presenceMap[userInfoPanelUser]?.isOnline ? 'En línea' : presenceMap[userInfoPanelUser]?.lastSeen ? `last seen ${new Date(presenceMap[userInfoPanelUser].lastSeen.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Offline'}
                    </div>
                  </div>
                {/* Campos de usuario */}
                <div className="px-6 space-y-3 mt-2">
                  {userInfoPanelData.phone && (
                    <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> <span className="font-semibold">{userInfoPanelData.phone}</span> <span className="text-xs text-muted-foreground ml-2">Phone</span></div>
                  )}
                  <div className="flex items-center gap-2 text-sm"><AtSign className="h-4 w-4 text-muted-foreground" /> <span className="font-semibold">{userInfoPanelData.username || userInfoPanelData.email}</span> <span className="text-xs text-muted-foreground ml-2">Username</span></div>
                  <div className="flex items-center gap-2 text-sm"><AtSign className="h-4 w-4 text-muted-foreground" /> {userInfoPanelData.email} <span className="text-xs text-muted-foreground ml-2">Email</span></div>
                  {userInfoPanelData.bio && (
                    <div className="flex items-center gap-2 text-sm"><Info className="h-4 w-4 text-muted-foreground" /> <span className="font-semibold">{userInfoPanelData.bio}</span> <span className="text-xs text-muted-foreground ml-2">Bio</span></div>
                  )}
                </div>
                {/* Notificaciones toggle */}
                <div className="flex items-center gap-2 px-6 mt-4 mb-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">Notifications</span>
                  <Switch
                    checked={!panelMuted}
                    onCheckedChange={async val => {
                      if (!panelChatId) return;
                      const chatRef = doc(firestore, 'chats', panelChatId);
                      const chatSnap = await getDoc(chatRef);
                      if (!chatSnap.exists()) {
                        await setDoc(chatRef, { users: [user.uid, userInfoPanelUser], muted: !val, lastMessage: { text: '', timestamp: serverTimestamp(), senderId: '', read: true } }, { merge: true });
                      } else {
                        await updateDoc(chatRef, { muted: !val });
                      }
                    }}
                    aria-label="Toggle notifications"
                    className="ml-auto"
                    disabled={!panelChatId}
                  />
                </div>
                {/* Tabs: Media, Files, Groups */}
                <div className="flex border-b border-border mt-2">
                  <button className={`flex-1 py-2 text-sm font-semibold ${userInfoTab === 'media' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`} onClick={() => setUserInfoTab('media')}>Media</button>
                  <button className={`flex-1 py-2 text-sm font-semibold ${userInfoTab === 'files' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`} onClick={() => setUserInfoTab('files')}>Files</button>
                  <button className={`flex-1 py-2 text-sm font-semibold ${userInfoTab === 'groups' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`} onClick={() => setUserInfoTab('groups')}>Groups</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {userInfoTab === 'media' && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Image className="h-16 w-16 mb-2" />
                      <span className="text-sm">No media found</span>
                    </div>
                  )}
                  {userInfoTab === 'files' && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <File className="h-16 w-16 mb-2" />
                      <span className="text-sm">No files found</span>
                    </div>
                  )}
                  {userInfoTab === 'groups' && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Users className="h-16 w-16 mb-2" />
                      <span className="text-sm">No groups found</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {globalSearch.trim() && (
          <div className="max-h-96 overflow-y-auto bg-background border-b border-border">
            {searching ? (
              <div className="p-4 text-muted-foreground">Buscando...</div>
            ) : (
              <>
                {globalResults.users.length > 0 && (
                  <div className="p-2">
                    <div className="font-bold text-xs mb-1 text-primary">Usuarios</div>
                    {globalResults.users.map(u => {
                      const userName = typeof u.name === 'string' ? u.name : '';
                      const userEmail = typeof u.email === 'string' ? u.email : '';
                      return (
                        <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-accent rounded cursor-pointer" onClick={() => { setGlobalSearch(''); setShowUserModal(false); handleStartChat(u); }}>
                          <Avatar className="h-8 w-8">{u.photoURL ? <AvatarImage src={u.photoURL} alt={userName} /> : <AvatarFallback>{userName.charAt(0) || ''}</AvatarFallback>}</Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{userName}</div>
                            <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {globalResults.messages.length > 0 && (
                  <div className="p-2">
                    <div className="font-bold text-xs mb-1 text-primary">Mensajes</div>
                    {globalResults.messages.map(m => (
                      <div key={m.id} className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer" onClick={() => { setGlobalSearch(''); setSelectedChat(chats.find(c => c.id === m.chatId)); setTimeout(() => { const el = document.getElementById(`msg-${m.id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300); }}>
                        <span className="text-xs text-muted-foreground">{new Date(m.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="truncate flex-1">{m.text}</span>
                      </div>
                    ))}
                  </div>
                )}
                {globalResults.users.length === 0 && globalResults.messages.length === 0 && (
                  <div className="p-4 text-muted-foreground">Sin resultados</div>
                )}
              </>
            )}
          </div>
        )}
        {/* Panel lateral de edición de usuario */}
        <AnimatePresence>
          {editPanelOpen && editData && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col bg-card shadow-2xl md:rounded-none rounded-t-2xl md:h-full md:rounded-l-2xl"
              style={{ pointerEvents: 'auto' }}
              onClick={() => setEditPanelOpen(false)}
            >
              <div className="bg-card w-full h-full flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2 p-4 border-b border-border">
                  <Button variant="ghost" size="icon" onClick={() => setEditPanelOpen(false)} aria-label="Cerrar panel">←</Button>
                  <span className="font-bold text-lg">Edit</span>
                </div>
                <div className="flex flex-col items-center mt-6 mb-2">
                  <Avatar className="h-24 w-24 mb-2">
                    {editData.photoURL ? (
                      <AvatarImage src={editData.photoURL} alt={editData.name || 'Avatar'} />
                    ) : (
                      <AvatarFallback className="text-4xl">{editData.name?.charAt(0) || 'U'}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="font-bold text-xl text-center">{editData.name}</div>
                  <div className="text-xs text-muted-foreground text-center">original name</div>
                </div>
                <div className="px-6 space-y-3 mt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">First name (required)</label>
                    <input className="bg-background border rounded px-2 py-1" value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Last name (optional)</label>
                    <input className="bg-background border rounded px-2 py-1" value={editData.lastName || ''} onChange={e => setEditData({ ...editData, lastName: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Username</label>
                    <input className="bg-background border rounded px-2 py-1" value={editData.username || editData.email || ''} onChange={e => setEditData({ ...editData, username: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Bio</label>
                    <input className="bg-background border rounded px-2 py-1" value={editData.bio || ''} onChange={e => setEditData({ ...editData, bio: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Phone</label>
                    <input className="bg-background border rounded px-2 py-1" value={editData.phone || ''} onChange={e => setEditData({ ...editData, phone: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center gap-2 px-6 mt-4 mb-2">
                  <Switch
                    checked={!panelMuted}
                    onCheckedChange={async val => {
                      if (!panelChatId) return;
                      const chatRef = doc(firestore, 'chats', panelChatId);
                      const chatSnap = await getDoc(chatRef);
                      if (!chatSnap.exists()) {
                        await setDoc(chatRef, { users: [user.uid, userInfoPanelUser], muted: !val, lastMessage: { text: '', timestamp: serverTimestamp(), senderId: '', read: true } }, { merge: true });
                      } else {
                        await updateDoc(chatRef, { muted: !val });
                      }
                    }}
                    aria-label="Toggle notifications"
                    className="mr-2"
                    disabled={!panelChatId}
                  />
                  <span className="font-semibold text-sm">Notifications</span>
                  <span className="text-xs text-muted-foreground ml-2">{!panelMuted ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex-1 flex flex-col justify-end px-6 pb-6">
                  <Button variant="destructive" className="w-full mb-2" onClick={handleDeleteContact}><Trash2 className="h-4 w-4 mr-2" />Delete Contact</Button>
                  <Button variant="default" className="w-full" onClick={handleSaveEdit}>Save</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {callModalOpen && (
          <Dialog open={callModalOpen} onOpenChange={setCallModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Llamada</DialogTitle>
              </DialogHeader>
              <div className="py-6 text-center">Simulación de llamada en curso...</div>
              <Button onClick={() => setCallModalOpen(false)}>Colgar</Button>
            </DialogContent>
          </Dialog>
        )}
        {videoCallModalOpen && (
          <Dialog open={videoCallModalOpen} onOpenChange={setVideoCallModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Videollamada</DialogTitle>
              </DialogHeader>
              <div className="py-6 text-center">Simulación de videollamada en curso...</div>
              <Button onClick={() => setVideoCallModalOpen(false)}>Colgar</Button>
            </DialogContent>
          </Dialog>
        )}
        {toastMsg && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-3 rounded shadow-lg z-[9999] animate-fade-in-out">{toastMsg}</div>
        )}
        {jitsiOpen && jitsiRoom && (
          <Dialog open={!!jitsiOpen} onOpenChange={() => setJitsiOpen(null)}>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>{jitsiOpen === 'audio' ? 'Llamada' : 'Videollamada'}</DialogTitle>
              </DialogHeader>
              <iframe
                src={`https://meet.jit.si/${jitsiRoom}#config.startWithVideoMuted=${jitsiOpen === 'audio' ? 'true' : 'false'}&config.startWithAudioMuted=false`}
                allow="camera; microphone; fullscreen; display-capture"
                className="w-full h-[60vh] rounded"
                title="Jitsi Meet"
              />
              <Button onClick={() => setJitsiOpen(null)} className="mt-4">Finalizar</Button>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
} 