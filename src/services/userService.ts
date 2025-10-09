// src/services/userService.ts
import { db } from '../firebase/config';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Associates a user with a specific organization.
 *
 * @param userId The ID of the user to update.
 * @param orgId The ID of the organization to assign.
 */
export const updateUserOrg = async (userId: string, orgId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { orgId });
};

/**
 * Creates a new user document in Firestore.
 * This is typically called right after a user signs up.
 *
 * @param userId The UID from Firebase Auth.
 * @param userData Additional user data (e.g., email).
 */
export const createUserDocument = async (userId: string, userData: { email: string; name?: string; }) => {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
        await setDoc(userRef, {
            ...userData,
            createdAt: new Date(),
            role: 'member', // Default role
            orgId: null // Initially no organization
        });
    }
};

/**
 * Removes a user from their organization by setting their orgId to null.
 *
 * @param userId The ID of the user to remove from the org.
 */
export const removeUserFromOrg = async (userId: string): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    // Also reset their role to default when removed from an org
    await updateDoc(userRef, { orgId: null, role: 'member' });
};

/**
 * Updates the role of a user within their organization.
 *
 * @param userId The ID of the user to update.
 * @param role The new role to assign ('owner', 'admin', or 'member').
 */
export const updateUserRole = async (userId: string, role: 'owner' | 'admin' | 'member'): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { role });
};