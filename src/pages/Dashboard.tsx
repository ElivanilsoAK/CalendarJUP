import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs, doc, setDoc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Calendar, Users, Plus, ArrowRight, Building, KeyRound } from 'lucide-react';
import { findOrganizationByInviteCode } from '../services/organizationService';

interface Calendar {
    id: string;
    year: number;
    month: number;
    companyName: string;
}

const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const Dashboard = () => {
  const { currentUser, currentUserOrg, refreshAuthContext, createOrganization } = useAuth();
  const navigate = useNavigate();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(true);
  const [stats, setStats] = useState({ collaborators: 0, calendars: 0 });

  // State for joining/creating an org
  const [joinCode, setJoinCode] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');


  useEffect(() => {
    const fetchData = async () => {
        if (!currentUserOrg) return;
        
        setLoadingCalendars(true);
        // Fetch calendars
        try {
            const calendarsRef = collection(db, 'organizations', currentUserOrg.orgId, 'calendars');
            const q = query(calendarsRef, orderBy('year', 'desc'), orderBy('month', 'desc'));
            const querySnapshot = await getDocs(q);
            const fetchedCalendars: Calendar[] = [];
            querySnapshot.forEach((doc) => {
                fetchedCalendars.push({ id: doc.id, ...doc.data() } as Calendar);
            });
            setCalendars(fetchedCalendars);

            // Fetch stats - buscar membros da organização
            const membersRef = collection(db, 'organizations', currentUserOrg.orgId, 'members');
            const membersSnapshot = await getDocs(membersRef);
            setStats({ collaborators: membersSnapshot.size, calendars: fetchedCalendars.length });

        } catch (error) {
            console.error("Error fetching data: ", error);
        } finally {
            setLoadingCalendars(false);
        }
    };
    fetchData();
  }, [currentUserOrg]);

  const handleJoinOrganization = async () => {
    if (!joinCode.trim() || !currentUser) return;
    setIsProcessing(true);
    setError('');
    try {
      const org = await findOrganizationByInviteCode(joinCode.toUpperCase());
      if (!org) {
        throw new Error('Código de convite inválido ou organização não encontrada.');
      }
      
      // Add user to organization members
      const memberRef = doc(db, 'organizations', org.id, 'members', currentUser.uid);
      await setDoc(memberRef, {
        email: currentUser.email,
        role: 'member',
        status: 'active',
        joinedAt: serverTimestamp(),
      });
      
      // Update user document with the new organization
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentOrgs = userData.organizations || [];
        if (!currentOrgs.includes(org.id)) {
          await updateDoc(userDocRef, {
            organizations: [...currentOrgs, org.id],
            updatedAt: serverTimestamp()
          });
        }
      } else {
        // Create user document if it doesn't exist
        await setDoc(userDocRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          organizations: [org.id],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      await refreshAuthContext();
      setJoinCode(''); // Clear the input
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim() || !currentUser) return;
    setIsProcessing(true);
    setError('');
    try {
      await createOrganization(newOrgName);
      setNewOrgName(''); // Clear the input
    } catch (err: any) {
      setError(err.message || 'Falha ao criar organização.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!currentUserOrg) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="w-full max-w-2xl text-center">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Bem-vindo(a) ao CalendarJUP!</h1>
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Para começar, junte-se a uma organização existente ou crie a sua própria.</p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    {/* Join Organization */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                        <div className="flex items-center mb-4">
                            <KeyRound className="w-6 h-6 text-blue-500 mr-3" />
                            <h2 className="text-xl font-semibold">Entrar em uma Organização</h2>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Peça o código de convite para o administrador da sua equipe.</p>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Insira o código de 6 dígitos"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                className="w-full px-4 py-2 bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg font-mono uppercase"
                            />
                            <button
                                onClick={handleJoinOrganization}
                                disabled={isProcessing || !joinCode}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                            >
                                {isProcessing ? 'Entrando...' : 'Entrar'}
                            </button>
                        </div>
                    </div>

                    {/* Create Organization */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                        <div className="flex items-center mb-4">
                            <Building className="w-6 h-6 text-green-500 mr-3" />
                            <h2 className="text-xl font-semibold">Criar uma Nova Organização</h2>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Crie um novo espaço para gerenciar os plantões da sua equipe.</p>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Nome da sua organização"
                                value={newOrgName}
                                onChange={(e) => setNewOrgName(e.target.value)}
                                className="w-full px-4 py-2 bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg"
                            />
                            <button
                                onClick={handleCreateOrganization}
                                disabled={isProcessing || !newOrgName}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                            >
                                {isProcessing ? 'Criando...' : 'Criar Organização'}
                            </button>
                        </div>
                    </div>
                </div>
                {error && <p className="mt-6 text-red-500">{error}</p>}
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Bem-vindo de volta, {currentUser?.displayName || currentUser?.email}.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm flex items-center space-x-4">
            <div className="bg-yellow-100 dark:bg-yellow-500/20 p-3 rounded-full">
                <Users className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Colaboradores</p>
                <p className="text-2xl font-bold">{stats.collaborators}</p>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm flex items-center space-x-4">
            <div className="bg-green-100 dark:bg-green-500/20 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Calendários Criados</p>
                <p className="text-2xl font-bold">{stats.calendars}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Saved Calendars */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Meus Calendários</h2>
            {loadingCalendars ? (
                <p className="text-gray-500 dark:text-gray-400">Carregando calendários...</p>
            ) : calendars.length > 0 ? (
                <div className="space-y-3">
                    {calendars.map(cal => (
                        <div key={cal.id} className="border dark:border-gray-700 p-4 rounded-lg flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-100">{monthNames[cal.month]} {cal.year}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{cal.companyName}</p>
                            </div>
                            <button className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold py-2 px-4 rounded-lg text-sm flex items-center space-x-2">
                                <span>Ver</span>
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Calendar className="mx-auto w-12 h-12 text-gray-300 dark:text-gray-600" />
                    <h3 className="mt-2 text-lg font-medium">Nenhum calendário encontrado</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Comece a criar seu primeiro calendário de plantão.</p>
                    <button 
                        onClick={() => navigate('/calendar-generator')}
                        className="mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center mx-auto space-x-2"
                    >
                        <Plus size={18} />
                        <span>Gerar Calendário</span>
                    </button>
                </div>
            )}
        </div>

        {/* Side Panel: Org Code */}
        <div className="space-y-8">
            {currentUserOrg && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                <h2 className="text-xl font-semibold">Código da Organização</h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Compartilhe este código com sua equipe para que eles possam entrar na organização.
                </p>
                <div className="mt-4 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
                <p className="text-2xl font-mono tracking-widest text-green-600 dark:text-green-400">{currentUserOrg.code}</p>
                </div>
            </div>
            )}

            {/* Create New Organization */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                <h2 className="text-xl font-semibold flex items-center">
                    <Building className="w-5 h-5 text-green-500 mr-2" />
                    Criar Nova Organização
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Crie uma nova organização para gerenciar outra equipe.
                </p>
                <div className="mt-4 space-y-3">
                    <input
                        type="text"
                        placeholder="Nome da nova organização"
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        className="w-full px-4 py-2 bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg"
                    />
                    <button
                        onClick={handleCreateOrganization}
                        disabled={isProcessing || !newOrgName}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                        <Plus size={18} />
                        <span>{isProcessing ? 'Criando...' : 'Criar Organização'}</span>
                    </button>
                </div>
                {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;