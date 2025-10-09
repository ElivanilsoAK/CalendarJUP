import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';
import { db, storage } from '../firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { updateUserRole } from '../services/userService';
import { logCollaboratorUpdated } from '../firebase/analytics';
import { X, Upload, User, Calendar } from 'lucide-react';

interface Collaborator {
    id: string;
    email: string;
    age?: number;
    avatarUrl?: string;
    role?: 'owner' | 'admin' | 'member';
}

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProfileUpdate: (updatedData: Partial<Collaborator>) => void;
    collaborator?: Collaborator | null;
    isAdmin?: boolean;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onProfileUpdate, collaborator, isAdmin }) => {
    const { currentUser } = useAuth();
    const { success, error, warning } = useToastContext();
    const [age, setAge] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [role, setRole] = useState<'owner' | 'admin' | 'member'>('member');
    const [isUploading, setIsUploading] = useState(false);
    const [currentAvatar, setCurrentAvatar] = useState<string | undefined>(undefined);

    useEffect(() => {
        const fetchUserData = async () => {
            const uid = collaborator?.id || currentUser?.uid;
            if (uid) {
                const userRef = doc(db, 'users', uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    setAge(userData.age || '');
                    setCurrentAvatar(userData.avatarUrl);
                    setRole(userData.role || 'member');
                }
            }
        };
        if (isOpen) {
            fetchUserData();
        }
    }, [isOpen, currentUser, collaborator]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Validar tipo de arquivo
            if (!file.type.startsWith('image/')) {
                warning('Tipo de arquivo inválido', 'Por favor, selecione apenas imagens.');
                return;
            }
            
            // Validar tamanho (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                warning('Arquivo muito grande', 'Por favor, selecione uma imagem menor que 5MB.');
                return;
            }
            
            setAvatarFile(file);
        }
    };

    const handleSave = async () => {
        const uid = collaborator?.id || currentUser?.uid;
        if (!uid) return;

        let avatarUrl = currentAvatar;
        setIsUploading(true);

        try {
            if (avatarFile) {
                // Upload do avatar
                const timestamp = Date.now();
                const fileName = `avatar_${timestamp}_${avatarFile.name}`;
                const storageRef = ref(storage, `users/${uid}/avatars/${fileName}`);
                const uploadTask = uploadBytesResumable(storageRef, avatarFile);
                
                await uploadTask;
                avatarUrl = await getDownloadURL(uploadTask.snapshot.ref);
            }

            const userRef = doc(db, 'users', uid);
            const updatedData: Partial<Collaborator> = {
                age: age ? Number(age) : undefined,
                avatarUrl: avatarUrl,
            };

            if (isAdmin && collaborator && collaborator.role !== role) {
                await updateUserRole(uid, role);
                updatedData.role = role;
            }

            await updateDoc(userRef, { 
                age: updatedData.age, 
                avatarUrl: updatedData.avatarUrl,
                updatedAt: new Date()
            });

            logCollaboratorUpdated(uid);
            onProfileUpdate(updatedData);
            success('Perfil atualizado', 'Perfil atualizado com sucesso!');
            onClose();
        } catch (err) {
            console.error('Erro ao atualizar perfil:', err);
            error('Erro ao atualizar perfil', 'Tente novamente mais tarde.');
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                            <User className="mr-3" />
                            Editar Perfil
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Avatar Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Avatar
                        </label>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                {currentAvatar ? (
                                    <img 
                                        src={currentAvatar} 
                                        alt="Avatar atual" 
                                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                        <User size={32} className="text-gray-400" />
                                    </div>
                                )}
                                {avatarFile && (
                                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                                        <Upload size={12} className="text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <input 
                                    type="file" 
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                    id="avatar-upload"
                                />
                                <label
                                    htmlFor="avatar-upload"
                                    className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                                >
                                    <Upload size={16} className="mr-2" />
                                    {avatarFile ? 'Trocar Avatar' : 'Escolher Avatar'}
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    PNG, JPG ou GIF (máx. 5MB)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Age Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <Calendar className="inline mr-2" size={16} />
                            Idade
                        </label>
                        <input 
                            type="number" 
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="Digite sua idade"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                    </div>

                    {/* Role Section (only for admins) */}
                    {isAdmin && collaborator?.id !== currentUser?.uid && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Cargo
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                                disabled={collaborator?.role === 'owner'}
                            >
                                <option value="member">Membro</option>
                                <option value="admin">Administrador</option>
                            </select>
                            {collaborator?.role === 'owner' && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    O cargo de proprietário não pode ser alterado.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isUploading}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isUploading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Salvando...
                            </>
                        ) : (
                            'Salvar Alterações'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProfileModal;
