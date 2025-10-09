
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { generateAndSaveInviteCode, getInviteCode } from '../services/organizationService';
import { removeUserFromOrg } from '../services/userService';
import EditProfileModal from '../components/EditProfileModal';
import CollaboratorDetailModal from '../components/CollaboratorDetailModal';
import AddCollaboratorModal from '../components/AddCollaboratorModal';
import VacationModal from '../components/VacationModal';
import { Calendar, Edit, Copy, Check, Trash2, Plane, Plus } from 'lucide-react';

import type { Collaborator } from '../types/collaborator';

const RoleBadge: React.FC<{ role?: 'owner' | 'admin' | 'member' }> = ({ role }) => {
    const roleStyles = {
        owner: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-300', label: 'Proprietário' },
        admin: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300', label: 'Admin' },
        member: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400', label: 'Membro' }
    };
    if (!role) return null;
    const { bg, text, label } = roleStyles[role];
    return (<span className={`px-2 py-1 text-xs font-semibold rounded-full ${bg} ${text}`}>{label}</span>);
};


const Collaborators = () => {
    const { currentUser, currentUserOrg } = useAuth();
    const { error } = useToastContext();
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
    const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchCollaborators = async () => {
            if (!currentUserOrg) return;
            setLoading(true);
            try {
                // Fetch collaborators from members subcollection
                const membersRef = collection(db, 'organizations', currentUserOrg.orgId, 'members');
                const membersSnapshot = await getDocs(membersRef);
                const users: Collaborator[] = [];
                
                for (const memberDoc of membersSnapshot.docs) {
                    const memberData = memberDoc.data();
                    
                    // Para evitar problemas de permissão, vamos usar apenas os dados do membro
                    // e buscar dados adicionais do usuário apenas se necessário
                    let userName = 'Usuário sem nome';
                    let userAvatar = '';
                    let userDepartment = '';
                    
                    try {
                        // Tentar buscar dados do usuário apenas para o usuário atual
                        if (memberDoc.id === currentUser?.uid) {
                            const userDocRef = doc(db, 'users', memberDoc.id);
                            const userDoc = await getDoc(userDocRef);
                            if (userDoc.exists()) {
                                const userData = userDoc.data();
                                userName = userData.displayName || userData.name || 'Usuário sem nome';
                                userAvatar = userData.avatar || '';
                                userDepartment = userData.department || '';
                            }
                        } else {
                            // Para outros usuários, usar apenas o email como nome
                            userName = memberData.email.split('@')[0];
                        }
                    } catch (error) {
                        console.warn(`Could not fetch user data for ${memberDoc.id}:`, error);
                        // Usar email como fallback
                        userName = memberData.email.split('@')[0];
                    }
                    
                        users.push({
                            id: memberDoc.id,
                        name: userName,
                            email: memberData.email,
                            role: memberData.role,
                        avatar: userAvatar,
                        department: userDepartment
                        });
                }
                
                setCollaborators(users);

                // Fetch invite code if user is admin or owner
                const currentUserRole = users.find(c => c.id === currentUser?.uid)?.role;
                if (currentUserRole === 'admin' || currentUserRole === 'owner') {
                    const code = await getInviteCode(currentUserOrg.orgId);
                    setInviteCode(code);
                }

            } catch (error) {
                console.error("Error fetching data: ", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCollaborators();
    }, [currentUserOrg, currentUser]);

    const currentUserRole = collaborators.find(c => c.id === currentUser?.uid)?.role;
    const isAdmin = currentUserRole === 'admin' || currentUserRole === 'owner';

    const handleProfileUpdate = (updatedData: Partial<Collaborator>) => {
        setCollaborators(collaborators.map((c: Collaborator) => 
            c.id === (selectedCollaborator?.id || currentUser?.uid) ? { ...c, ...updatedData } : c
        ));
    };

    const handleViewShifts = (collaborator: Collaborator) => {
        setSelectedCollaborator(collaborator);
        setIsDetailModalOpen(true);
    };
    
    const handleEditProfile = (collaborator?: Collaborator) => {
        setSelectedCollaborator(collaborator || null);
        setIsEditModalOpen(true);
    }

    const handleGenerateCode = async () => {
        if (!currentUserOrg) return;
        const newCode = await generateAndSaveInviteCode(currentUserOrg.orgId);
        setInviteCode(newCode);
    };

    const handleCopyCode = () => {
        if (!inviteCode) return;
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    };

    const handleRemoveCollaborator = async (collaboratorId: string) => {
        if (!window.confirm('Tem certeza que deseja remover este colaborador da organização?')) {
            return;
        }
        try {
            await removeUserFromOrg(collaboratorId);
            setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
        } catch (err) {
            console.error("Failed to remove collaborator:", err);
            error('Erro ao remover colaborador', 'Tente novamente mais tarde.');
        }
    };

    const handleViewVacations = (collaborator: Collaborator) => {
        setSelectedCollaborator(collaborator);
        setIsVacationModalOpen(true);
    };

    const handleAddCollaborator = async (email: string, role: 'admin' | 'member') => {
        if (!currentUserOrg) {
            throw new Error('Organização não encontrada');
        }

        // Verificar se o usuário já existe
        const userQuery = query(collection(db, 'users'), where('email', '==', email));
        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.empty) {
            throw new Error('Usuário não encontrado. O colaborador deve ter uma conta no sistema.');
        }

        const userDoc = userSnapshot.docs[0];
        const userId = userDoc.id;
        const userData = userDoc.data();

        // Verificar se o usuário já é membro da organização
        const memberRef = doc(db, 'organizations', currentUserOrg.orgId, 'members', userId);
        const existingMemberDoc = await getDoc(memberRef);
        
        if (existingMemberDoc.exists()) {
            throw new Error('Este usuário já é membro da organização.');
        }

        // Adicionar o usuário como membro da organização
        await setDoc(memberRef, {
            email: userData.email,
            role: role,
            status: 'active',
            joinedAt: serverTimestamp(),
        });

        // Atualizar o documento do usuário para incluir esta organização
        const userDocRef = doc(db, 'users', userId);
        const currentOrgs = userData.organizations || [];
        if (!currentOrgs.includes(currentUserOrg.orgId)) {
            await setDoc(userDocRef, {
                ...userData,
                organizations: [...currentOrgs, currentUserOrg.orgId],
                updatedAt: serverTimestamp()
            }, { merge: true });
        }

        // Atualizar a lista local de colaboradores
        const newCollaborator: Collaborator = {
            id: userId,
            name: userData.displayName || userData.name || email.split('@')[0],
            email: userData.email,
            role: role,
            avatar: userData.avatar || '',
            department: userData.department || ''
        };

        setCollaborators(prev => [...prev, newCollaborator]);
    };

    return (
        <div className="font-sans">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Colaboradores</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Gerencie os membros da sua organização.
                    </p>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    {isAdmin && (
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm">
                            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Convidar Colaboradores</h3>
                            {inviteCode ? (
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={inviteCode}
                                        className="flex-grow bg-white dark:bg-gray-700 p-2 border border-gray-300 dark:border-gray-600 rounded-md font-mono"
                                    />
                                    <button onClick={handleCopyCode} className="p-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                    </button>
                                </div>
                            ) : (
                                <p className="text-gray-500">Nenhum código de convite ativo.</p>
                            )}
                            <button
                                onClick={handleGenerateCode}
                                className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
                            >
                                {inviteCode ? 'Gerar Novo Código' : 'Gerar Código de Convite'}
                            </button>
                        </div>
                    )}
                    
                    {/* Add Collaborator Button */}
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"
                        >
                            <Plus size={18} />
                            <span>Adicionar Colaborador</span>
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Skeleton Loader */}
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm animate-pulse">
                            <div className="flex items-center space-x-4">
                                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                <div className="flex-1 space-y-3">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collaborators.map((user: Collaborator) => (
                        <div 
                            key={user.id} 
                            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                        >
                            <div className="flex flex-col items-center text-center">
                                <img 
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name || user.email}&background=random&color=fff`} 
                                    alt="Avatar" 
                                    className="w-24 h-24 rounded-full mb-4 border-4 border-white dark:border-gray-700"
                                />
                                <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{user.name || user.email}</p>
                                {user.department && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{user.department}</p>}
                                <RoleBadge role={user.role} />
                                <div className="mt-4 flex space-x-2">
                                    <button onClick={() => handleViewShifts(user)} className="flex-1 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-500/30 font-medium py-2 px-4 rounded-lg text-sm flex items-center justify-center space-x-2">
                                        <Calendar size={16} />
                                        <span>Ver Plantões</span>
                                    </button>
                                    <button onClick={() => handleViewVacations(user)} className="bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-500/30 font-medium p-2 rounded-lg text-sm" title="Ver Férias">
                                        <Plane size={16} />
                                    </button>
                                    {(isAdmin || currentUser?.uid === user.id) && (
                                        <button onClick={() => handleEditProfile(user)} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium p-2 rounded-lg text-sm" title="Editar Perfil">
                                            <Edit size={16} />
                                        </button>
                                    )}
                                    {isAdmin && currentUser?.uid !== user.id && (
                                        <button
                                            onClick={() => handleRemoveCollaborator(user.id)}
                                            className="bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-500/30 font-medium p-2 rounded-lg text-sm"
                                            title="Remover da Organização"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <EditProfileModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onProfileUpdate={handleProfileUpdate}
                collaborator={selectedCollaborator}
                isAdmin={isAdmin}
            />

            <CollaboratorDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                collaborator={selectedCollaborator}
            />

            <AddCollaboratorModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAddCollaborator={handleAddCollaborator}
            />

            <VacationModal
                isOpen={isVacationModalOpen}
                onClose={() => setIsVacationModalOpen(false)}
                collaborator={selectedCollaborator}
            />

        </div>
    );
};

export default Collaborators;
