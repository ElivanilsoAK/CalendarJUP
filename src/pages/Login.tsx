import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFormValidation } from '../hooks/useValidation';
import { formValidations } from '../services/validationService';
import ValidatedInput from '../components/forms/ValidatedInput';
import { Calendar, Mail, Lock, AlertCircle, Building, User } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
    <path fill="none" d="M0 0h48v48H0z"></path>
  </svg>
);

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, signup, loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  // Validação para login
  const loginValidation = useFormValidation('login', {
    email: '',
    password: ''
  });

  // Validação para registro
  const signupValidation = useFormValidation('signup', {
    email: '',
    password: '',
    name: '',
    orgCode: ''
  });

  const currentValidation = isLogin ? loginValidation : signupValidation;

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validar formulário
    const validation = currentValidation.validate();
    if (!validation.isValid) {
      return;
    }
    
    setLoading(true);
    try {
      if (isLogin) {
        await login(currentValidation.values.email, currentValidation.values.password);
      } else {
        await signup(
          currentValidation.values.email, 
          currentValidation.values.password, 
          currentValidation.values.name, 
          currentValidation.values.orgCode
        );
      }
      navigate('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro. Tente novamente.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(orgCode || undefined);
      navigate('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro com o login do Google.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Background Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img 
          src="/padrao.jpg" 
          alt="Background" 
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-8 w-auto text-green-600 dark:text-green-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                CalendarJUP
              </h1>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Bem-vindo de Volta
            </h2>
            <div className="mt-2 text-end">
              <button 
                onClick={() => { 
                  setIsLogin(!isLogin); 
                  setError(''); 
                  loginValidation.resetAll();
                  signupValidation.resetAll();
                }}
                className="text-sm text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-500"
              >
                {isLogin ? 'Criar uma conta' : 'Já tenho uma conta'}
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleEmailSubmit} className="mt-6 space-y-6">
            {/* Organization Code */}
            <ValidatedInput
              label="Código da Organização"
              type="text"
              value={currentValidation.values.orgCode}
              onChange={(e) => currentValidation.setFieldValue('orgCode', e.target.value.toUpperCase())}
              onBlur={() => currentValidation.setFieldTouched('orgCode')}
              error={currentValidation.errors.orgCode}
              touched={currentValidation.touched.orgCode}
              leftIcon={<Building size={20} />}
              placeholder="ABC123 (opcional)"
              maxLength={6}
              helperText="Deixe em branco para criar uma nova organização"
            />

            {/* Name (only for signup) */}
            {!isLogin && (
              <ValidatedInput
                label="Nome Completo"
                type="text"
                value={currentValidation.values.name}
                onChange={(e) => currentValidation.setFieldValue('name', e.target.value)}
                onBlur={() => currentValidation.setFieldTouched('name')}
                error={currentValidation.errors.name}
                touched={currentValidation.touched.name}
                leftIcon={<User size={20} />}
                placeholder="Seu nome completo"
                required
              />
            )}

            {/* Email */}
            <ValidatedInput
              label="Email"
              type="email"
              value={currentValidation.values.email}
              onChange={(e) => currentValidation.setFieldValue('email', e.target.value)}
              onBlur={() => currentValidation.setFieldTouched('email')}
              error={currentValidation.errors.email}
              touched={currentValidation.touched.email}
              leftIcon={<Mail size={20} />}
              placeholder="seu@email.com"
              required
            />

            {/* Password */}
            <ValidatedInput
              label="Senha"
              type="password"
              value={currentValidation.values.password}
              onChange={(e) => currentValidation.setFieldValue('password', e.target.value)}
              onBlur={() => currentValidation.setFieldTouched('password')}
              error={currentValidation.errors.password}
              touched={currentValidation.touched.password}
              leftIcon={<Lock size={20} />}
              placeholder="••••••••"
              required
            />

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed"
            >
              {loading ? (isLogin ? 'Entrando...' : 'Criando conta...') : (isLogin ? 'Entrar' : 'Criar conta')}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                  ou
                </span>
              </div>
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <GoogleIcon />
              Continuar com Google
            </button>

            {/* Error Message */}
            {error && (
              <div className="flex items-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Terms of Service */}
            <p className="mt-4 text-xs text-center text-gray-600 dark:text-gray-400">
              Ao continuar, você concorda com nossos{' '}
              <a href="#" className="text-green-600 hover:text-green-500">
                Termos de Serviço
              </a>{' '}
              e{' '}
              <a href="#" className="text-green-600 hover:text-green-500">
                Política de Privacidade
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
