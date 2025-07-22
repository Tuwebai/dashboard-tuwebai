import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Reply, 
  Heart, 
  ThumbsUp, 
  ThumbsDown,
  Flag,
  Edit,
  Trash2,
  MoreVertical,
  AtSign,
  Paperclip,
  Send,
  Clock,
  User,
  CheckCircle
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { firestore } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  where,
  doc,
  updateDoc,
  deleteDoc,
  limit
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatDateSafe } from '@/utils/formatDateSafe';

interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'user';
  timestamp: any;
  projectId: string;
  phaseKey?: string;
  parentId?: string;
  replies: Comment[];
  reactions: {
    [key: string]: string[]; // reactionType -> userIds
  };
  mentions: string[];
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  isEdited: boolean;
  editedAt?: any;
}

interface CollaborativeCommentsProps {
  projectId: string;
  phaseKey?: string;
  onCommentAdded?: (comment: Comment) => void;
}

export default function CollaborativeComments({ 
  projectId, 
  phaseKey,
  onCommentAdded 
}: CollaborativeCommentsProps) {
  const { user } = useApp();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load comments
  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);

    const commentsRef = collection(firestore, 'comments');
    const q = query(
      commentsRef,
      where('projectId', '==', projectId),
      phaseKey ? where('phaseKey', '==', phaseKey) : where('phaseKey', 'in', [phaseKey || '', null]),
      where('parentId', '==', null),
      orderBy('timestamp', 'desc'),
      limit(20) // paginación básica
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData: Comment[] = [];
      snapshot.forEach((doc) => {
        commentsData.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(commentsData);
      setIsLoading(false);
    }, (error) => {
      setIsLoading(false);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los comentarios.',
        variant: 'destructive'
      });
    });

    return () => unsubscribe();
  }, [projectId, phaseKey]);

  // Load replies for each comment
  useEffect(() => {
    if (comments.length === 0) return;

    const unsubscribeFunctions: (() => void)[] = [];

    comments.forEach((comment) => {
      const repliesRef = collection(firestore, 'comments');
      const q = query(
        repliesRef,
        where('parentId', '==', comment.id),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const replies: Comment[] = [];
        snapshot.forEach((doc) => {
          replies.push({ id: doc.id, ...doc.data() } as Comment);
        });

        setComments(prev => 
          prev.map(c => 
            c.id === comment.id ? { ...c, replies } : c
          )
        );
      });

      unsubscribeFunctions.push(unsubscribe);
    });

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [comments.map(c => c.id).join(',')]);

  // Add comment
  const addComment = async () => {
    if (!user) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para comentar.',
        variant: 'destructive'
      });
      return;
    }
    if (!newComment.trim()) {
      toast({
        title: 'Comentario vacío',
        description: 'No puedes enviar un comentario vacío.',
        variant: 'destructive'
      });
      return;
    }
    if (comments.some(c => c.text.trim() === newComment.trim() && c.authorId === user.uid)) {
      toast({
        title: 'Comentario duplicado',
        description: 'Ya enviaste este comentario.',
        variant: 'destructive'
      });
      return;
    }
    try {
      const commentsRef = collection(firestore, 'comments');
      const commentData = {
        text: newComment.trim(),
        authorId: user.uid,
        authorName: user.name,
        authorRole: user.role,
        timestamp: serverTimestamp(),
        projectId,
        phaseKey: phaseKey || '',
        parentId: replyTo?.id || null,
        replies: [],
        reactions: {},
        mentions: extractMentions(newComment),
        isEdited: false
      };
      const docRef = await addDoc(commentsRef, commentData);
      if (onCommentAdded) {
        onCommentAdded({ id: docRef.id, ...commentData } as Comment);
      }
      setNewComment('');
      setReplyTo(null);
      toast({
        title: 'Comentario agregado',
        description: 'Tu comentario ha sido publicado.',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el comentario.',
        variant: 'destructive'
      });
    }
  };

  // Edit comment
  const editComment = async (commentId: string) => {
    if (!editText.trim()) return;

    try {
      const commentRef = doc(firestore, 'comments', commentId);
      await updateDoc(commentRef, {
        text: editText.trim(),
        isEdited: true,
        editedAt: serverTimestamp()
      });

      setEditingComment(null);
      setEditText('');
      toast({
        title: 'Comentario editado',
        description: 'El comentario ha sido actualizado.'
      });
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo editar el comentario.',
        variant: 'destructive'
      });
    }
  };

  // Delete comment
  const deleteComment = async (commentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;

    try {
      await deleteDoc(doc(firestore, 'comments', commentId));
      toast({
        title: 'Comentario eliminado',
        description: 'El comentario ha sido eliminado.'
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el comentario.',
        variant: 'destructive'
      });
    }
  };

  // Add reaction
  const addReaction = async (commentId: string, reactionType: string) => {
    if (!user) return;

    try {
      const commentRef = doc(firestore, 'comments', commentId);
      const comment = comments.find(c => c.id === commentId);
      
      if (!comment) return;

      const currentReactions = comment.reactions || {};
      const currentUsers = currentReactions[reactionType] || [];
      
      let newUsers;
      if (currentUsers.includes(user.uid)) {
        // Remove reaction
        newUsers = currentUsers.filter(id => id !== user.uid);
      } else {
        // Add reaction
        newUsers = [...currentUsers, user.uid];
      }

      await updateDoc(commentRef, {
        [`reactions.${reactionType}`]: newUsers
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Extract mentions from text
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    return formatDateSafe(timestamp);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addComment();
    }
  };

  // Start editing
  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditText(comment.text);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingComment(null);
    setEditText('');
  };

  // Render comment
  const renderComment = (comment: Comment, isReply = false) => {
    const reactions = comment.reactions || {};
    const reactionCounts = Object.entries(reactions).reduce((acc, [type, users]) => {
      acc[type] = users.length;
      return acc;
    }, {} as Record<string, number>);

    const userReactions = Object.entries(reactions).reduce((acc, [type, users]) => {
      if (users.includes(user?.uid || '')) {
        acc[type] = true;
      }
      return acc;
    }, {} as Record<string, boolean>);

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback>
              {comment.authorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-sm">{comment.authorName}</span>
              <Badge variant="outline" className="text-xs">
                {comment.authorRole === 'admin' ? 'Admin' : 'Cliente'}
              </Badge>
              {comment.isEdited && (
                <span className="text-xs text-muted-foreground">(editado)</span>
              )}
            </div>
            
            {editingComment === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => editComment(comment.id)}>
                    Guardar
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                
                {/* Reactions */}
                {Object.keys(reactionCounts).length > 0 && (
                  <div className="flex gap-2">
                    {Object.entries(reactionCounts).map(([type, count]) => (
                      <Button
                        key={type}
                        size="sm"
                        variant={userReactions[type] ? "default" : "outline"}
                        onClick={() => addReaction(comment.id, type)}
                        className="h-6 px-2 text-xs"
                      >
                        {type === 'like' && <ThumbsUp className="h-3 w-3 mr-1" />}
                        {type === 'dislike' && <ThumbsDown className="h-3 w-3 mr-1" />}
                        {type === 'heart' && <Heart className="h-3 w-3 mr-1" />}
                        {count}
                      </Button>
                    ))}
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(comment.timestamp)}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyTo(comment)}
                    className="h-auto p-0 text-xs"
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Responder
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addReaction(comment.id, 'like')}
                    className={`h-auto p-0 text-xs ${userReactions.like ? 'text-blue-500' : ''}`}
                  >
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    Me gusta
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addReaction(comment.id, 'heart')}
                    className={`h-auto p-0 text-xs ${userReactions.heart ? 'text-red-500' : ''}`}
                  >
                    <Heart className="h-3 w-3 mr-1" />
                    Amor
                  </Button>
                  
                  {(comment.authorId === user?.uid || user?.role === 'admin') && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(comment)}
                        className="h-auto p-0 text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteComment(comment.id)}
                        className="h-auto p-0 text-xs text-red-500"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Eliminar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-3">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <div className="ml-4 space-y-2">
              <div className="h-4 w-40 bg-muted/30 rounded animate-pulse" />
              <div className="h-4 w-32 bg-muted/20 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comentarios {phaseKey && `- ${phaseKey}`}
          <Badge variant="secondary">{comments.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Comment */}
        <div className="space-y-3">
          {replyTo && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Respondiendo a <span className="font-medium">{replyTo.authorName}</span>
              </p>
              <p className="text-sm mt-1">{replyTo.text.substring(0, 100)}...</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
                className="mt-2 h-auto p-0 text-xs"
              >
                Cancelar respuesta
              </Button>
            </div>
          )}
          
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <Textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe un comentario... Usa @ para mencionar usuarios"
                className="min-h-[100px]"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Presiona Enter para enviar, Shift+Enter para nueva línea</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <AtSign className="h-4 w-4" />
                  </Button>
                  <Button onClick={addComment} disabled={!newComment.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Comentar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Comments List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay comentarios aún</p>
                <p className="text-sm">Sé el primero en comentar</p>
              </div>
            ) : (
              comments.map(comment => renderComment(comment))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 