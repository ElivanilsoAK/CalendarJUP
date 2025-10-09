// src/services/vacationService.ts
import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

export interface Vacation {
  id: string;
  userId: string;
  userName: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
}

export interface VacationRequest {
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

/**
 * Solicita férias para um usuário
 */
export const requestVacation = async (
  orgId: string, 
  vacationData: VacationRequest
): Promise<string> => {
  try {
    const vacationsRef = collection(db, 'organizations', orgId, 'vacations');
    const docRef = await addDoc(vacationsRef, {
      ...vacationData,
      status: 'pending',
      requestedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Erro ao solicitar férias:', error);
    throw new Error('Falha ao solicitar férias. Tente novamente.');
  }
};

/**
 * Busca todas as férias de um usuário
 */
export const getUserVacations = async (
  orgId: string, 
  userId: string
): Promise<Vacation[]> => {
  try {
    const vacationsRef = collection(db, 'organizations', orgId, 'vacations');
    const q = query(
      vacationsRef, 
      where('userId', '==', userId),
      orderBy('requestedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      requestedAt: doc.data().requestedAt?.toDate() || new Date(),
      approvedAt: doc.data().approvedAt?.toDate(),
      rejectedAt: doc.data().rejectedAt?.toDate(),
    } as Vacation));
  } catch (error) {
    console.error('Erro ao buscar férias do usuário:', error);
    throw new Error('Falha ao carregar férias. Tente novamente.');
  }
};

/**
 * Busca todas as férias da organização (para admins)
 */
export const getAllVacations = async (orgId: string): Promise<Vacation[]> => {
  try {
    const vacationsRef = collection(db, 'organizations', orgId, 'vacations');
    const q = query(vacationsRef, orderBy('requestedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      requestedAt: doc.data().requestedAt?.toDate() || new Date(),
      approvedAt: doc.data().approvedAt?.toDate(),
      rejectedAt: doc.data().rejectedAt?.toDate(),
    } as Vacation));
  } catch (error) {
    console.error('Erro ao buscar férias da organização:', error);
    throw new Error('Falha ao carregar férias. Tente novamente.');
  }
};

/**
 * Aprova uma solicitação de férias
 */
export const approveVacation = async (
  orgId: string, 
  vacationId: string, 
  approvedBy: string
): Promise<void> => {
  try {
    const vacationRef = doc(db, 'organizations', orgId, 'vacations', vacationId);
    await updateDoc(vacationRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      approvedBy,
    });
  } catch (error) {
    console.error('Erro ao aprovar férias:', error);
    throw new Error('Falha ao aprovar férias. Tente novamente.');
  }
};

/**
 * Rejeita uma solicitação de férias
 */
export const rejectVacation = async (
  orgId: string, 
  vacationId: string, 
  rejectedBy: string,
  rejectionReason?: string
): Promise<void> => {
  try {
    const vacationRef = doc(db, 'organizations', orgId, 'vacations', vacationId);
    await updateDoc(vacationRef, {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
      rejectedBy,
      rejectionReason,
    });
  } catch (error) {
    console.error('Erro ao rejeitar férias:', error);
    throw new Error('Falha ao rejeitar férias. Tente novamente.');
  }
};

/**
 * Cancela uma solicitação de férias
 */
export const cancelVacation = async (
  orgId: string, 
  vacationId: string
): Promise<void> => {
  try {
    const vacationRef = doc(db, 'organizations', orgId, 'vacations', vacationId);
    await deleteDoc(vacationRef);
  } catch (error) {
    console.error('Erro ao cancelar férias:', error);
    throw new Error('Falha ao cancelar férias. Tente novamente.');
  }
};

/**
 * Verifica se um usuário tem férias em um período específico
 */
export const hasVacationInPeriod = async (
  orgId: string, 
  userId: string, 
  startDate: string, 
  endDate: string
): Promise<boolean> => {
  try {
    const vacationsRef = collection(db, 'organizations', orgId, 'vacations');
    const q = query(
      vacationsRef,
      where('userId', '==', userId),
      where('status', '==', 'approved')
    );
    const snapshot = await getDocs(q);
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return snapshot.docs.some(doc => {
      const vacation = doc.data();
      const vacationStart = new Date(vacation.startDate);
      const vacationEnd = new Date(vacation.endDate);
      
      // Verifica se há sobreposição de datas
      return (vacationStart <= end && vacationEnd >= start);
    });
  } catch (error) {
    console.error('Erro ao verificar férias:', error);
    return false;
  }
};
