// src/services/organizationService.ts
import { db } from '../firebase/config';
import { doc, updateDoc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';

/**
 * Generates a random 6-character alphanumeric string.
 */
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generates a new invite code for an organization and saves it to Firestore.
 * If a code already exists, it will be overwritten.
 *
 * @param orgId The ID of the organization.
 * @returns The newly generated invite code.
 */
export const generateAndSaveInviteCode = async (orgId: string): Promise<string> => {
  const newCode = generateInviteCode();
  const orgRef = doc(db, 'organizations', orgId);
  await updateDoc(orgRef, {
    inviteCode: newCode,
  });
  return newCode;
};

/**
 * Fetches the current invite code for an organization.
 *
 * @param orgId The ID of the organization.
 * @returns The invite code, or null if it doesn't exist.
 */
export const getInviteCode = async (orgId: string): Promise<string | null> => {
  const orgRef = doc(db, 'organizations', orgId);
  const docSnap = await getDoc(orgRef);
  if (docSnap.exists() && docSnap.data().inviteCode) {
    return docSnap.data().inviteCode;
  }
  return null;
};

/**
 * Finds an organization by its invite code.
 *
 * @param code The invite code to search for.
 * @returns The organization data (including ID) or null if not found.
 */
export const findOrganizationByInviteCode = async (code: string): Promise<{ id: string; [key: string]: any } | null> => {
  const orgsRef = collection(db, 'organizations');
  const q = query(orgsRef, where('inviteCode', '==', code));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const orgDoc = querySnapshot.docs[0];
    return { id: orgDoc.id, ...orgDoc.data() };
  }

  return null;
};

/**
 * Creates a new organization document in Firestore.
 *
 * @param ownerId The UID of the user who will own the organization.
 * @param orgName The name for the new organization.
 * @returns The ID of the newly created organization.
 */
export const createOrganization = async (ownerId: string, orgName: string): Promise<string> => {
    const newOrgRef = doc(collection(db, 'organizations'));
    const newCode = generateInviteCode();

    await setDoc(newOrgRef, {
      name: orgName,
      owner: ownerId,
      inviteCode: newCode,
      createdAt: new Date(),
    });

    return newOrgRef.id;
};