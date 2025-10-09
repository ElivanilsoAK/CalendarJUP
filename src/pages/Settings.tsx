import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToastContext } from '../contexts/ToastContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Sun, Moon, Shield, Bell, Settings as SettingsIcon } from 'lucide-react';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
}

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, currentUserOrg, userOrgs } = useAuth();
  const { success, error } = useToastContext();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Get user role
  const userRole = userOrgs.find(org => org.orgId === currentUserOrg?.orgId)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'owner';

  useEffect(() => {
    const fetchCollaborators = async () => {
      if (!currentUserOrg) return;
      
      setLoading(true);
      try {
        const membersRef = collection(db, 'organizations', currentUserOrg.orgId, 'members');
        const membersSnapshot = await getDocs(membersRef);
        
        const members: Collaborator[] = [];
        for (const memberDoc of membersSnapshot.docs) {
          const memberData = memberDoc.data();
          const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', memberDoc.id)));
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            members.push({
              id: memberDoc.id,
              name: userData.displayName || userData.name || 'Usuário sem nome',
              email: memberData.email,
              role: memberData.role
            });
          }
        }
        
        setCollaborators(members);
      } catch (err) {
        console.error('Error fetching collaborators:', err);
        error('Erro ao carregar colaboradores', 'Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborators();
  }, [currentUserOrg]);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'member') => {
    if (!currentUserOrg || !isAdmin) return;
    
    setSaving(true);
    try {
      const memberRef = doc(db, 'organizations', currentUserOrg.orgId, 'members', userId);
      await updateDoc(memberRef, { role: newRole });
      
      setCollaborators(prev => prev.map(c => 
        c.id === userId ? { ...c, role: newRole } : c
      ));
      
      success('Permissões atualizadas', 'Permissões do colaborador atualizadas com sucesso!');
    } catch (err) {
      console.error('Error updating role:', err);
      error('Erro ao atualizar permissões', 'Tente novamente mais tarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-10">Configurações</h1>


      <div className="space-y-8">
        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
            <Sun className="mr-3" />
            Tema
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-gray-600 dark:text-gray-300">Mudar a aparência da aplicação.</p>
            <button 
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {theme === 'light' ? <Moon size={16}/> : <Sun size={16} />}
              {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </button>
          </div>
        </div>

        {/* Organization Settings */}
        {isAdmin && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
              <Shield className="mr-3" />
              Permissões da Organização
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Gerencie as permissões dos colaboradores da organização.
            </p>
            
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                    <div className="w-24 h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {collaborator.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{collaborator.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{collaborator.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        collaborator.role === 'owner' 
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                          : collaborator.role === 'admin'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}>
                        {collaborator.role === 'owner' ? 'Proprietário' : 
                         collaborator.role === 'admin' ? 'Administrador' : 'Membro'}
                      </span>
                      
                      {collaborator.role !== 'owner' && collaborator.id !== currentUser?.uid && (
                        <select
                          value={collaborator.role}
                          onChange={(e) => handleRoleChange(collaborator.id, e.target.value as 'admin' | 'member')}
                          disabled={saving}
                          className="px-3 py-1 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 text-sm"
                        >
                          <option value="member">Membro</option>
                          <option value="admin">Administrador</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notification Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
            <Bell className="mr-3" />
            Notificações
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300">Gerenciar preferências de notificação.</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Receba alertas sobre plantões e atualizações.</p>
            </div>
            <button className="px-4 py-2 rounded-lg font-semibold text-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed">
              Em breve
            </button>
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
            <SettingsIcon className="mr-3" />
            Idioma
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300">Escolher o idioma da interface.</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Atualmente: Português (Brasil)</p>
            </div>
            <button className="px-4 py-2 rounded-lg font-semibold text-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed">
              Em breve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
