// src/services/avatarService.ts
import { storage, db } from '../firebase/config';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadBytesResumable 
} from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import type { User } from 'firebase/auth';

export interface AvatarUploadResult {
  success: boolean;
  avatarUrl?: string;
  error?: string;
}

export interface AvatarUploadOptions {
  userId: string;
  file: File;
  organizationId?: string;
  isUserProfile?: boolean;
  currentUser?: User;
}

/**
 * Valida um arquivo de avatar
 */
export const validateAvatarFile = (file: File): { valid: boolean; error?: string } => {
  // Validar tipo de arquivo
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Por favor, selecione apenas arquivos de imagem.' };
  }

  // Validar tamanho (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'O arquivo deve ter no máximo 5MB.' };
  }

  // Validar tipos específicos
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Tipo de arquivo não suportado. Use JPG, PNG, GIF ou WebP.' };
  }

  return { valid: true };
};

/**
 * Gera um caminho único para o avatar
 */
const generateAvatarPath = (userId: string, fileName: string, organizationId?: string): string => {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  if (organizationId) {
    return `organizations/${organizationId}/avatars/${userId}/${timestamp}_${sanitizedFileName}`;
  } else {
    return `users/${userId}/avatars/${timestamp}_${sanitizedFileName}`;
  }
};

/**
 * Faz upload do avatar para o Storage
 */
const uploadAvatarToStorage = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  const uploadTask = await uploadBytes(storageRef, file);
  const avatarUrl = await getDownloadURL(uploadTask.ref);
  
  return avatarUrl;
};

/**
 * Atualiza o avatar no Firebase Auth
 */
const updateAuthProfile = async (user: User, avatarUrl: string): Promise<void> => {
  await updateProfile(user, { photoURL: avatarUrl });
};

/**
 * Atualiza o avatar no documento do usuário no Firestore
 */
const updateUserDocument = async (userId: string, avatarUrl: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    avatar: avatarUrl,
    avatarUrl: avatarUrl, // Compatibilidade com diferentes campos
    updatedAt: new Date()
  });
};

/**
 * Atualiza o avatar no documento do colaborador na organização
 */
const updateCollaboratorDocument = async (organizationId: string, userId: string, avatarUrl: string): Promise<void> => {
  const collaboratorRef = doc(db, 'organizations', organizationId, 'members', userId);
  
  try {
    // Verificar se o documento existe
    const docSnap = await getDoc(collaboratorRef);
    if (docSnap.exists()) {
      await updateDoc(collaboratorRef, {
        avatar: avatarUrl,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.warn('Não foi possível atualizar o documento do colaborador:', error);
  }
};

/**
 * Remove avatar antigo do Storage (se existir)
 */
export const removeOldAvatar = async (avatarUrl: string): Promise<void> => {
  try {
    if (avatarUrl && avatarUrl.includes('firebasestorage.googleapis.com')) {
      const avatarRef = ref(storage, avatarUrl);
      await deleteObject(avatarRef);
    }
  } catch (error) {
    console.warn('Não foi possível remover o avatar antigo:', error);
  }
};

/**
 * Upload completo de avatar com todas as atualizações
 */
export const uploadAvatar = async (options: AvatarUploadOptions): Promise<AvatarUploadResult> => {
  const { userId, file, organizationId, isUserProfile = false, currentUser } = options;

  try {
    // Validar arquivo
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Gerar caminho único
    const avatarPath = generateAvatarPath(userId, file.name, organizationId);

    // Fazer upload para o Storage
    const avatarUrl = await uploadAvatarToStorage(file, avatarPath);

    // Atualizar Firebase Auth (se for perfil do usuário atual)
    if (isUserProfile && currentUser) {
      await updateAuthProfile(currentUser, avatarUrl);
    }

    // Atualizar documento do usuário no Firestore
    await updateUserDocument(userId, avatarUrl);

    // Atualizar documento do colaborador na organização (se aplicável)
    if (organizationId) {
      await updateCollaboratorDocument(organizationId, userId, avatarUrl);
    }

    return { success: true, avatarUrl };
  } catch (error) {
    console.error('Erro no upload do avatar:', error);
    return { 
      success: false, 
      error: 'Erro ao fazer upload do avatar. Tente novamente.' 
    };
  }
};

/**
 * Upload com progresso (para uploads maiores)
 */
export const uploadAvatarWithProgress = async (
  options: AvatarUploadOptions,
  onProgress?: (progress: number) => void
): Promise<AvatarUploadResult> => {
  const { userId, file, organizationId, isUserProfile = false, currentUser } = options;

  try {
    // Validar arquivo
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Gerar caminho único
    const avatarPath = generateAvatarPath(userId, file.name, organizationId);
    const storageRef = ref(storage, avatarPath);

    // Upload com progresso
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Erro no upload:', error);
          reject({ success: false, error: 'Erro no upload do arquivo.' });
        },
        async () => {
          try {
            const avatarUrl = await getDownloadURL(uploadTask.snapshot.ref);

            // Atualizar Firebase Auth (se for perfil do usuário atual)
            if (isUserProfile && currentUser) {
              await updateAuthProfile(currentUser, avatarUrl);
            }

            // Atualizar documento do usuário no Firestore
            await updateUserDocument(userId, avatarUrl);

            // Atualizar documento do colaborador na organização (se aplicável)
            if (organizationId) {
              await updateCollaboratorDocument(organizationId, userId, avatarUrl);
            }

            resolve({ success: true, avatarUrl });
          } catch (error) {
            console.error('Erro ao finalizar upload:', error);
            reject({ success: false, error: 'Erro ao finalizar upload.' });
          }
        }
      );
    });
  } catch (error) {
    console.error('Erro no upload do avatar:', error);
    return { 
      success: false, 
      error: 'Erro ao fazer upload do avatar. Tente novamente.' 
    };
  }
};

/**
 * Busca o avatar atual de um usuário
 */
export const getCurrentAvatar = async (userId: string): Promise<string | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.avatar || userData.avatarUrl || null;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar avatar atual:', error);
    return null;
  }
};
