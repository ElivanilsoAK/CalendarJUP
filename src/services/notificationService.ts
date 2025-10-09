// src/services/notificationService.ts
import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  limit
} from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'vacation' | 'calendar' | 'collaborator' | 'system';
  read: boolean;
  createdAt: Date;
  readAt?: Date;
  data?: any; // Dados adicionais específicos da notificação
}

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'vacation' | 'calendar' | 'collaborator' | 'system';
  data?: any;
}

/**
 * Cria uma nova notificação para um usuário
 */
export const createNotification = async (
  orgId: string,
  notificationData: CreateNotificationData
): Promise<string> => {
  try {
    const notificationsRef = collection(db, 'organizations', orgId, 'notifications');
    const docRef = await addDoc(notificationsRef, {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    throw new Error('Falha ao criar notificação.');
  }
};

/**
 * Cria notificações para múltiplos usuários
 */
export const createBulkNotifications = async (
  orgId: string,
  userIds: string[],
  notificationData: Omit<CreateNotificationData, 'userId'>
): Promise<void> => {
  try {
    const notificationsRef = collection(db, 'organizations', orgId, 'notifications');
    const batch = [];
    
    for (const userId of userIds) {
      batch.push({
        ...notificationData,
        userId,
        read: false,
        createdAt: serverTimestamp(),
      });
    }
    
    // Firebase não suporta batch write para addDoc, então fazemos individualmente
    for (const notification of batch) {
      await addDoc(notificationsRef, notification);
    }
  } catch (error) {
    console.error('Erro ao criar notificações em lote:', error);
    throw new Error('Falha ao criar notificações.');
  }
};

/**
 * Busca notificações de um usuário
 */
export const getUserNotifications = async (
  orgId: string,
  userId: string,
  limitCount: number = 50
): Promise<Notification[]> => {
  try {
    const notificationsRef = collection(db, 'organizations', orgId, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      readAt: doc.data().readAt?.toDate(),
    } as Notification));
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    throw new Error('Falha ao carregar notificações.');
  }
};

/**
 * Marca uma notificação como lida
 */
export const markNotificationAsRead = async (
  orgId: string,
  notificationId: string
): Promise<void> => {
  try {
    const notificationRef = doc(db, 'organizations', orgId, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    throw new Error('Falha ao marcar notificação como lida.');
  }
};

/**
 * Marca todas as notificações de um usuário como lidas
 */
export const markAllNotificationsAsRead = async (
  orgId: string,
  userId: string
): Promise<void> => {
  try {
    const notificationsRef = collection(db, 'organizations', orgId, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    
    const batch = [];
    snapshot.docs.forEach(doc => {
      batch.push(updateDoc(doc.ref, {
        read: true,
        readAt: serverTimestamp(),
      }));
    });
    
    await Promise.all(batch);
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    throw new Error('Falha ao marcar notificações como lidas.');
  }
};

/**
 * Conta notificações não lidas de um usuário
 */
export const getUnreadNotificationCount = async (
  orgId: string,
  userId: string
): Promise<number> => {
  try {
    const notificationsRef = collection(db, 'organizations', orgId, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Erro ao contar notificações não lidas:', error);
    return 0;
  }
};

// Notificações específicas do sistema

/**
 * Busca IDs dos administradores de uma organização
 */
export const getAdminIds = async (orgId: string): Promise<string[]> => {
  try {
    const membersRef = collection(db, 'organizations', orgId, 'members');
    const q = query(membersRef, where('role', 'in', ['admin', 'owner']));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Erro ao buscar administradores:', error);
    return [];
  }
};

/**
 * Notifica sobre nova solicitação de férias
 */
export const notifyVacationRequest = async (
  orgId: string,
  adminIds: string[],
  userName: string,
  startDate: string,
  endDate: string
): Promise<void> => {
  const message = `${userName} solicitou férias de ${startDate} até ${endDate}`;
  
  await createBulkNotifications(orgId, adminIds, {
    title: 'Nova Solicitação de Férias',
    message,
    type: 'info',
    category: 'vacation',
    data: { startDate, endDate, userName }
  });
};

/**
 * Notifica sobre aprovação de férias
 */
export const notifyVacationApproved = async (
  orgId: string,
  userId: string,
  startDate: string,
  endDate: string
): Promise<void> => {
  await createNotification(orgId, {
    userId,
    title: 'Férias Aprovadas',
    message: `Suas férias de ${startDate} até ${endDate} foram aprovadas!`,
    type: 'success',
    category: 'vacation',
    data: { startDate, endDate }
  });
};

/**
 * Notifica sobre rejeição de férias
 */
export const notifyVacationRejected = async (
  orgId: string,
  userId: string,
  startDate: string,
  endDate: string,
  reason?: string
): Promise<void> => {
  const message = reason 
    ? `Suas férias de ${startDate} até ${endDate} foram rejeitadas. Motivo: ${reason}`
    : `Suas férias de ${startDate} até ${endDate} foram rejeitadas.`;
    
  await createNotification(orgId, {
    userId,
    title: 'Férias Rejeitadas',
    message,
    type: 'warning',
    category: 'vacation',
    data: { startDate, endDate, reason }
  });
};

/**
 * Notifica sobre novo colaborador adicionado
 */
export const notifyNewCollaborator = async (
  orgId: string,
  adminIds: string[],
  newCollaboratorName: string,
  role: string
): Promise<void> => {
  await createBulkNotifications(orgId, adminIds, {
    title: 'Novo Colaborador',
    message: `${newCollaboratorName} foi adicionado como ${role}`,
    type: 'success',
    category: 'collaborator',
    data: { newCollaboratorName, role }
  });
};

/**
 * Notifica sobre novo calendário gerado
 */
export const notifyCalendarGenerated = async (
  orgId: string,
  userIds: string[],
  calendarName: string,
  month: number,
  year: number
): Promise<void> => {
  await createBulkNotifications(orgId, userIds, {
    title: 'Novo Calendário',
    message: `Calendário ${calendarName} de ${month}/${year} foi gerado`,
    type: 'info',
    category: 'calendar',
    data: { calendarName, month, year }
  });
};
