// src/pages/Login.tsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useFormValidation } from '../hooks/useValidation';
import ValidatedInput from '../components/forms/ValidatedInput';
import { Mail, Lock, User, Building, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loginValidation = useFormValidation('login', {
    email: '',
    password: ''
  });
  const signupValidation = useFormValidation('signup', {
    email: '',
    password: '',
    name: '',
    orgCode: ''
  });

  const currentValidation = isLogin ? loginValidation : signupValidation;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
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
          (currentValidation.values as any).name, 
          (currentValidation.values as any).orgCode
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
      await loginWithGoogle();
      navigate('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro com o login do Google.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {isLogin ? 'Acesse o CalendarJUP' : 'Comece a usar o CalendarJUP'}
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            {!isLogin && (
              <ValidatedInput
                label="Nome completo"
                type="text"
                value={(currentValidation.values as any).name}
                onChange={(e) => currentValidation.setFieldValue('name' as any, e.target.value)}
                onBlur={() => currentValidation.setFieldTouched('name' as any)}
                error={(currentValidation.errors as any).name}
                touched={(currentValidation.touched as any).name}
                leftIcon={<User size={20} />}
                placeholder="Seu nome completo"
                required
              />
            )}

            <ValidatedInput
              label="E-mail"
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

            <ValidatedInput
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              value={currentValidation.values.password}
              onChange={(e) => currentValidation.setFieldValue('password', e.target.value)}
              onBlur={() => currentValidation.setFieldTouched('password')}
              error={currentValidation.errors.password}
              touched={currentValidation.touched.password}
              leftIcon={<Lock size={20} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
              placeholder="Sua senha"
              required
            />

            {!isLogin && (
              <ValidatedInput
                label="Código da Organização"
                type="text"
                value={(currentValidation.values as any).orgCode}
                onChange={(e) => currentValidation.setFieldValue('orgCode' as any, e.target.value.toUpperCase())}
                onBlur={() => currentValidation.setFieldTouched('orgCode' as any)}
                error={(currentValidation.errors as any).orgCode}
                touched={(currentValidation.touched as any).orgCode}
                leftIcon={<Building size={20} />}
                placeholder="ABC123 (opcional)"
                maxLength={6}
                helperText="Deixe em branco para criar uma nova organização"
              />
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              disabled={!currentValidation.isValid}
            >
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Ou continue com</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                onClick={handleGoogleLogin}
                loading={loading}
                className="w-full flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
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
        </Card>
      </div>
    </div>
  );
};

export default Login;