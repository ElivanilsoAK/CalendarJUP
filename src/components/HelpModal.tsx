import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Book, Users, Calendar, BarChart, Settings, User } from 'lucide-react';

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [currentSection, setCurrentSection] = useState(0);

  const helpSections: HelpSection[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: <BarChart size={20} />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Visão Geral do Dashboard</h3>
          <p className="text-gray-600 dark:text-gray-400">
            O Dashboard é sua página inicial, onde você pode visualizar estatísticas importantes da sua organização.
          </p>
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200">Estatísticas</h4>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Veja o número de colaboradores, calendários criados e plantões agendados.
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200">Código da Organização</h4>
              <p className="text-sm text-green-600 dark:text-green-300">
                Compartilhe este código com novos membros para que possam entrar na sua organização.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'calendar',
      title: 'Gerador de Calendário',
      icon: <Calendar size={20} />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Criando Calendários de Plantão</h3>
          <p className="text-gray-600 dark:text-gray-400">
            O gerador de calendário permite criar automaticamente escalas de plantão equilibradas.
          </p>
          <div className="space-y-3">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-purple-800 dark:text-purple-200">Passo 1: Configurações Básicas</h4>
              <p className="text-sm text-purple-600 dark:text-purple-300">
                Selecione o mês, ano e adicione os colaboradores que participarão dos plantões.
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-orange-800 dark:text-orange-200">Passo 2: Configurações Avançadas</h4>
              <p className="text-sm text-orange-600 dark:text-orange-300">
                Defina feriados, férias e preferências de distribuição de plantões.
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200">Passo 3: Gerar e Revisar</h4>
              <p className="text-sm text-green-600 dark:text-green-300">
                O sistema gera automaticamente uma escala equilibrada que você pode ajustar manualmente.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'collaborators',
      title: 'Colaboradores',
      icon: <Users size={20} />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Gerenciando Colaboradores</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie os membros da sua organização e suas permissões.
          </p>
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200">Convidar Novos Membros</h4>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Gere um código de convite e compartilhe com novos colaboradores.
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200">Visualizar Férias</h4>
              <p className="text-sm text-green-600 dark:text-green-300">
                Acompanhe as férias de cada colaborador para planejar melhor os plantões.
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-purple-800 dark:text-purple-200">Editar Perfis</h4>
              <p className="text-sm text-purple-600 dark:text-purple-300">
                Atualize informações dos colaboradores e gerencie suas permissões.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: <BarChart size={20} />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Análises e Relatórios</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize estatísticas detalhadas sobre plantões e colaboradores.
          </p>
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200">Seus Plantões</h4>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Como colaborador, veja apenas os seus plantões agendados.
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200">Visão Administrativa</h4>
              <p className="text-sm text-green-600 dark:text-green-300">
                Como admin, visualize todos os plantões da organização.
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-purple-800 dark:text-purple-200">Gráficos e Estatísticas</h4>
              <p className="text-sm text-purple-600 dark:text-purple-300">
                Analise distribuição de plantões por mês e colaborador.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'profile',
      title: 'Perfil',
      icon: <User size={20} />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Gerenciando seu Perfil</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Personalize suas informações e gerencie suas organizações.
          </p>
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200">Alterar Senha</h4>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Mantenha sua conta segura alterando sua senha periodicamente.
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200">Gerenciar Organizações</h4>
              <p className="text-sm text-green-600 dark:text-green-300">
                Troque entre organizações, crie novas ou saia de organizações existentes.
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-purple-800 dark:text-purple-200">Avatar</h4>
              <p className="text-sm text-purple-600 dark:text-purple-300">
                Personalize sua foto de perfil para facilitar a identificação.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'settings',
      title: 'Configurações',
      icon: <Settings size={20} />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Configurações do Sistema</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Personalize a experiência e gerencie permissões da organização.
          </p>
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200">Tema</h4>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Alterne entre modo claro e escuro conforme sua preferência.
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200">Permissões (Admin)</h4>
              <p className="text-sm text-green-600 dark:text-green-300">
                Gerencie as permissões dos colaboradores da organização.
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-purple-800 dark:text-purple-200">Notificações</h4>
              <p className="text-sm text-purple-600 dark:text-purple-300">
                Configure como deseja receber alertas sobre plantões e atualizações.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextSection = () => {
    setCurrentSection((prev) => (prev + 1) % helpSections.length);
  };

  const prevSection = () => {
    setCurrentSection((prev) => (prev - 1 + helpSections.length) % helpSections.length);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <Book className="mr-3" />
              Central de Ajuda
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex h-[60vh]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 overflow-y-auto">
            <div className="p-4 space-y-2">
              {helpSections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(index)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    currentSection === index
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {section.icon}
                  <span className="font-medium">{section.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {helpSections[currentSection].content}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{currentSection + 1} de {helpSections.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={prevSection}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <button
                onClick={nextSection}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Próximo
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
