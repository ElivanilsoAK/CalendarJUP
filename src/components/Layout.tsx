import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useFirebaseNotifications } from '../contexts/FirebaseNotificationContext';
import { useNavigate, NavLink } from 'react-router-dom';
import HelpModal from './HelpModal';
import NotificationCenter from './NotificationCenter';
import { 
  Sun, 
  Moon, 
  LogOut, 
  Calendar, 
  Users, 
  LayoutDashboard, 
  Menu, 
  X, 
  ChevronDown, 
  Settings, 
  User, 
  Bell,
  FileText,
  BarChart2,
  HelpCircle
} from 'lucide-react';

type LayoutProps = {
  children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useFirebaseNotifications();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);

  // Detect scroll for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/calendar-generator', label: 'Calendário', icon: Calendar },
    { path: '/reports', label: 'Relatórios', icon: FileText },
    { path: '/collaborators', label: 'Colaboradores', icon: Users },
    { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  ];

  const NavItem = ({ to, icon: Icon, label, end = false }: { to: string; icon: any; label: string; end?: boolean }) => {
    return (
      <NavLink
        to={to}
        end={end}
        onClick={() => setMobileMenuOpen(false)}
        className="nav-item"
      >
        {({ isActive }) => (
          <>
            <Icon size={20} className={isActive ? 'animate-pulse-gentle' : 'group-hover:scale-110 transition-transform'} />
            <span>{label}</span>
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300">
      {/* Header */}
      <header className={`
        sticky top-0 z-50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg
        border-b border-gray-200/80 dark:border-gray-700/80
        transition-shadow duration-300
        ${scrolled ? 'shadow-md' : ''}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="relative">
                <Calendar className="w-8 h-8 text-green-600 dark:text-green-500 group-hover:scale-110 transition-transform duration-200" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-yellow-500 bg-clip-text text-transparent">
                CalendarJUP
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 dark:bg-gray-900/50 rounded-2xl p-1">
              {navItems.map((item) => (
                <NavItem key={item.path} to={item.path} icon={item.icon} label={item.label} end={item.path === '/'} />
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Help */}
              <button 
                onClick={() => setHelpModalOpen(true)}
                className="nav-item nav-item-inactive"
                title="Central de Ajuda"
              >
                <HelpCircle size={20} />
              </button>

              {/* Notifications */}
              <button 
                onClick={() => setNotificationCenterOpen(true)}
                className="nav-item nav-item-inactive indicator relative"
                title="Notificações"
              >
                <Bell size={20} className="group-hover:scale-110 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group overflow-hidden"
              >
                <div className={`transform transition-all duration-300 ${theme === 'dark' ? 'rotate-180 scale-0' : 'rotate-0 scale-100'}`}>
                  <Sun size={20} className="text-yellow-500" />
                </div>
                <div className={`absolute inset-0 flex items-center justify-center transform transition-all duration-300 ${theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-180 scale-0'}`}>
                  <Moon size={20} className="text-green-400" />
                </div>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 p-2 pr-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                >
                  <div className="relative">
                    <img 
                      src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.email}&background=22c55e&color=fff&bold=true`}
                      alt="Avatar" 
                      className="w-9 h-9 rounded-xl ring-2 ring-green-500/20 group-hover:ring-green-500/40 transition-all"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold">{currentUser?.displayName || currentUser?.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
                  </div>
                  <ChevronDown size={16} className={`hidden sm:block transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                    <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                      <p className="font-medium text-sm">{currentUser?.displayName || currentUser?.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{currentUser?.email}</p>
                    </div>
                    <div className="p-2">
                      <button onClick={() => { navigate('/profile'); setUserMenuOpen(false); }} className="menu-item">
                        <User size={18} />
                        <span>Perfil</span>
                      </button>
                      <button onClick={() => { navigate('/settings'); setUserMenuOpen(false); }} className="menu-item">
                        <Settings size={18} />
                        <span>Configurações</span>
                      </button>
                      <button onClick={handleLogout} className="menu-item text-red-600 dark:text-red-400">
                        <LogOut size={18} />
                        <span>Sair</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl animate-in slide-in-from-top duration-200">
            <nav className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <NavItem key={item.path} to={item.path} icon={item.icon} label={item.label} end={item.path === '/'} />
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border-t border-gray-200/80 dark:border-gray-700/80 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} CalendarJUP. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                Privacidade
              </a>
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                Termos
              </a>
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                Suporte
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Help Modal */}
      <HelpModal 
        isOpen={helpModalOpen} 
        onClose={() => setHelpModalOpen(false)} 
      />

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={notificationCenterOpen} 
        onClose={() => setNotificationCenterOpen(false)} 
      />
    </div>
  );
};

export default Layout;
