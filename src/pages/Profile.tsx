import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';
import AvatarUpload from '../components/AvatarUpload';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Lock, Building, Upload, CheckCircle, AlertCircle, Users, Plus, ArrowRight, LogOut, Trash2 } from 'lucide-react';

const Profile = () => {
  const { currentUser, createOrganization, currentUserOrg, userOrgs, switchOrg, leaveOrganization, deleteOrganization } = useAuth();
  const { success, error } = useToastContext();
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Organization State
  const [orgName, setOrgName] = useState('');
  const [orgError, setOrgError] = useState('');
  const [orgSuccess, setOrgSuccess] = useState('');
  const [orgLoading, setOrgLoading] = useState(false);

  const handleAvatarUpdated = (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('As novas senhas não correspondem.');
      return;
    }
    if (!currentUser?.email) return;

    setPasswordLoading(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      setPasswordSuccess('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError('Falha ao alterar a senha. Verifique sua senha atual.');
      console.error(error);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgError('');
    setOrgSuccess('');
    if (!orgName) {
      setOrgError('O nome da organização é obrigatório.');
      return;
    }
    setOrgLoading(true);
    try {
      await createOrganization(orgName);
      setOrgSuccess(`Organização "${orgName}" criada com sucesso!`);
      setOrgName('');
    } catch (error) {
      setOrgError('Falha ao criar organização.');
      console.error(error);
    } finally {
      setOrgLoading(false);
    }
  };

  const handleLeaveOrg = async (orgId: string, orgName: string) => {
    if (!window.confirm(`Tem certeza que deseja sair da organização "${orgName}"?`)) {
      return;
    }
    try {
      await leaveOrganization(orgId);
      setOrgSuccess(`Você saiu da organização "${orgName}" com sucesso!`);
    } catch (error) {
      setOrgError('Falha ao sair da organização.');
      console.error(error);
    }
  };

  const handleDeleteOrg = async (orgId: string, orgName: string) => {
    if (!window.confirm(`ATENÇÃO: Tem certeza que deseja EXCLUIR permanentemente a organização "${orgName}"?\n\nEsta ação não pode ser desfeita e todos os dados serão perdidos!`)) {
      return;
    }
    try {
      await deleteOrganization(orgId);
      setOrgSuccess(`Organização "${orgName}" foi excluída com sucesso!`);
    } catch (error) {
      setOrgError(error instanceof Error ? error.message : 'Falha ao excluir organização.');
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-10">Meu Perfil</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 flex flex-col items-center text-center">
          <div className="mb-4">
            <AvatarUpload
              currentAvatar={currentUser?.photoURL || avatarUrl}
              userId={currentUser?.uid || ''}
              userName={currentUser?.displayName || currentUser?.email || ''}
              organizationId={currentUserOrg?.orgId}
              isUserProfile={true}
              onAvatarUpdated={handleAvatarUpdated}
              size="xl"
              showUploadButton={false}
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{currentUser?.displayName}</h2>
          <p className="text-md text-gray-500 dark:text-gray-400">{currentUser?.email}</p>
        </div>

        <div className="md:col-span-2 space-y-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center"><Lock className="mr-3"/>Alterar Senha</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input type="password" placeholder="Senha Atual" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700" required />
              <input type="password" placeholder="Nova Senha" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700" required />
              <input type="password" placeholder="Confirmar Nova Senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700" required />
              {passwordError && <p className="text-red-500 text-sm flex items-center"><AlertCircle size={16} className="mr-2"/>{passwordError}</p>}
              {passwordSuccess && <p className="text-green-500 text-sm flex items-center"><CheckCircle size={16} className="mr-2"/>{passwordSuccess}</p>}
              <button type="submit" disabled={passwordLoading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400">{passwordLoading ? 'Salvando...' : 'Salvar Nova Senha'}</button>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center"><Building className="mr-3"/>Gerenciar Organizações</h3>
            
            {/* Current Organization */}
            {currentUserOrg && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-800 dark:text-green-200 flex items-center">
                      <Users className="mr-2" size={16} />
                      Organização Atual
                    </h4>
                    <p className="text-green-600 dark:text-green-300 font-medium">{currentUserOrg.name}</p>
                    <p className="text-sm text-green-500 dark:text-green-400">Código: {currentUserOrg.code}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 text-xs font-semibold rounded-full">
                      {currentUserOrg.role === 'owner' ? 'Proprietário' : 
                       currentUserOrg.role === 'admin' ? 'Administrador' : 'Membro'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Organization List */}
            {userOrgs.length > 1 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Outras Organizações</h4>
                <div className="space-y-2">
                  {userOrgs.filter(org => org.orgId !== currentUserOrg?.orgId).map((org) => (
                    <div key={org.orgId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{org.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Código: {org.code}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => switchOrg(org.orgId)}
                          className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm"
                        >
                          <ArrowRight size={14} />
                          Trocar
                        </button>
                        <button
                          onClick={() => handleLeaveOrg(org.orgId, org.name)}
                          className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors text-sm"
                          title="Sair da organização"
                        >
                          <LogOut size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Organization Actions */}
            {currentUserOrg && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Ações da Organização Atual</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLeaveOrg(currentUserOrg.orgId, currentUserOrg.name)}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors text-sm"
                  >
                    <LogOut size={16} />
                    Sair da Organização
                  </button>
                  {currentUserOrg.role === 'owner' && (
                    <button
                      onClick={() => handleDeleteOrg(currentUserOrg.orgId, currentUserOrg.name)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-sm"
                    >
                      <Trash2 size={16} />
                      Excluir Organização
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Create New Organization */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Plus className="mr-2" size={16} />
                Criar Nova Organização
              </h4>
              <form onSubmit={handleCreateOrg} className="space-y-4">
                <input type="text" placeholder="Nome da Organização" value={orgName} onChange={e => setOrgName(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700" required />
                {orgError && <p className="text-red-500 text-sm flex items-center"><AlertCircle size={16} className="mr-2"/>{orgError}</p>}
                {orgSuccess && <p className="text-green-500 text-sm flex items-center"><CheckCircle size={16} className="mr-2"/>{orgSuccess}</p>}
                <button type="submit" disabled={orgLoading} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400">{orgLoading ? 'Criando...' : 'Criar Organização'}</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
