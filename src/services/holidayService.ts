// src/services/holidayService.ts
import { db } from '../firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

/**
 * Interface for a holiday object, matching the structure from BrasilAPI.
 */
export interface Holiday {
  date: string; // Format: "YYYY-MM-DD"
  name: string;
  type: string;
}

/**
 * Interface for a custom holiday object stored in Firestore.
 */
export interface CustomHoliday extends Holiday {
    id: string; // Firestore document ID
}

const API_BASE_URL = "https://brasilapi.com.br/api/feriados/v1";

/**
 * Fetches the national holidays for a given year from BrasilAPI.
 */
export const getNationalHolidays = async (year: number): Promise<Holiday[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${year}`);
    if (!response.ok) {
      if (response.status === 404) {
        // Se não encontrar feriados para o ano, retorna array vazio
        console.warn(`No holidays found for year ${year}`);
        return [];
      }
      throw new Error(`Failed to fetch national holidays: ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching national holidays:", error);
    // Em caso de erro, retorna array vazio em vez de quebrar a aplicação
    console.warn("Using empty holidays array due to API error");
    return [];
  }
};

/**
 * Fetches all custom holidays for a specific organization.
 */
export const getCustomHolidaysForOrg = async (orgId: string): Promise<CustomHoliday[]> => {
    const holidaysColRef = collection(db, 'organizations', orgId, 'holidays');
    const snapshot = await getDocs(holidaysColRef);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CustomHoliday));
};


/**
 * Adds a new custom holiday to a specific organization.
 */
export const addCustomHoliday = async (orgId: string, holidayData: { name: string; date: string }): Promise<CustomHoliday> => {
    const holidaysColRef = collection(db, 'organizations', orgId, 'holidays');
    const docRef = await addDoc(holidaysColRef, {
        ...holidayData,
        type: 'custom' // Mark this as a custom holiday
    });
    return { ...holidayData, id: docRef.id, type: 'custom' };
};

/**
 * Deletes a custom holiday from a specific organization.
 */
export const deleteCustomHoliday = async (orgId: string, holidayId: string): Promise<void> => {
    const holidayDocRef = doc(db, 'organizations', orgId, 'holidays', holidayId);
    await deleteDoc(holidayDocRef);
};