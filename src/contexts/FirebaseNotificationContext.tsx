// src/contexts/FirebaseNotificationContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  type Notification as FirebaseNotification 
} from '../services/notificationService';
import { onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { collection } from 'firebase/firestore';

interface FirebaseNotificationContextType {
  notifications: FirebaseNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const FirebaseNotificationContext = createContext<FirebaseNotificationContextType | undefined>(undefined);

export const useFirebaseNotifications = () => {
  const context = useContext(FirebaseNotificationContext);
  if (!context) {
    throw new Error('useFirebaseNotifications must be used within a FirebaseNotificationProvider');
  }
  return context;
};

interface FirebaseNotificationProviderProps {
  children: React.ReactNode;
}

export const FirebaseNotificationProvider: React.FC<FirebaseNotificationProviderProps> = ({ children }) => {
  const { currentUser, currentUserOrg } = useAuth();
  const [notifications, setNotifications] = useState<FirebaseNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const loadNotifications = async () => {
    if (!currentUserOrg || !currentUser) return;

    setLoading(true);
    try {
      const notificationsData = await getUserNotifications(currentUserOrg.orgId, currentUser.uid, 50);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!currentUserOrg) return;

    try {
      await markNotificationAsRead(currentUserOrg.orgId, notificationId);
      
      // Atualizar estado local
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUserOrg || !currentUser) return;

    try {
      await markAllNotificationsAsRead(currentUserOrg.orgId, currentUser.uid);
      
      // Atualizar estado local
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  };

  const refreshNotifications = async () => {
    await loadNotifications();
  };

  // Carregar notificações quando o usuário ou organização mudar
  useEffect(() => {
    if (currentUserOrg && currentUser) {
      loadNotifications();
    } else {
      setNotifications([]);
    }
  }, [currentUserOrg, currentUser]);

  // Configurar listener em tempo real para notificações
  useEffect(() => {
    if (!currentUserOrg || !currentUser) return;

    const notificationsRef = collection(db, 'organizations', currentUserOrg.orgId, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        readAt: doc.data().readAt?.toDate(),
      } as FirebaseNotification));

      setNotifications(notificationsData);
    }, (error) => {
      console.error('Erro ao escutar notificações:', error);
    });

    return () => unsubscribe();
  }, [currentUserOrg, currentUser]);

  const value: FirebaseNotificationContextType = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };

  return (
    <FirebaseNotificationContext.Provider value={value}>
      {children}
    </FirebaseNotificationContext.Provider>
  );
};
