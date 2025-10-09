# Guia de Codificação do CalendarJUP

Este documento serve como guia de referência para a padronização, arquitetura e boas práticas de codificação adotadas no projeto CalendarJUP. Aqui você encontrará informações detalhadas sobre a estrutura do código, convenções de nomenclatura, padrões arquiteturais e diretrizes de desenvolvimento.

## 📁 Estrutura Detalhada do Projeto

```
CalendarJUP/
├── 📁 public/                     # Arquivos estáticos públicos
│   ├── padrao.jpg                # Imagem padrão para organizações
│   └── vite.svg                  # Logo do projeto
├── 📁 src/
│   ├── 📁 components/            # Componentes React reutilizáveis
│   │   ├── 📁 ui/               # Design System Base
│   │   │   ├── Button.tsx       # Componente de botão com variantes
│   │   │   ├── CalendarBase.tsx # Componente base de calendário
│   │   │   └── Card.tsx         # Componente de card com subcomponentes
│   │   ├── CalendarView.tsx     # Visualização de calendários
│   │   ├── CollaboratorDetailModal.tsx # Modal de detalhes do colaborador
│   │   ├── EditProfileModal.tsx # Modal de edição de perfil
│   │   ├── HelpModal.tsx        # Modal de ajuda e documentação
│   │   ├── Layout.tsx           # Layout principal com navegação
│   │   ├── NotificationCenter.tsx # Centro de notificações
│   │   └── PrivateRoute.tsx     # Rota protegida por autenticação
│   ├── 📁 contexts/             # Contextos React para estado global
│   │   ├── AuthContext.tsx      # Autenticação e gerenciamento de organizações
│   │   ├── NotificationContext.tsx # Sistema de notificações
│   │   └── ThemeContext.tsx     # Gerenciamento de tema (claro/escuro)
│   ├── 📁 firebase/             # Configuração e integração Firebase
│   │   ├── analytics.ts         # Configuração e eventos do Analytics
│   │   └── config.ts            # Configuração principal do Firebase
│   ├── 📁 hooks/                # Hooks personalizados (vazio - para futuras implementações)
│   ├── 📁 pages/                # Componentes de página (rotas)
│   │   ├── Analytics.tsx        # Página de analytics e métricas
│   │   ├── CalendarGenerator.tsx # Gerador de calendários
│   │   ├── Collaborators.tsx    # Gestão de colaboradores
│   │   ├── Dashboard.tsx        # Página principal/dashboard
│   │   ├── Login.tsx            # Página de autenticação
│   │   ├── Profile.tsx          # Página de perfil do usuário
│   │   ├── Reports.tsx          # Relatórios e análises
│   │   └── Settings.tsx         # Configurações da aplicação
│   ├── 📁 services/             # Lógica de negócio e integrações
│   │   ├── holidayService.ts    # Integração com BrasilAPI para feriados
│   │   ├── organizationService.ts # Operações CRUD de organizações
│   │   └── userService.ts       # Operações de usuários
│   ├── 📁 types/                # Definições de tipos TypeScript
│   │   └── collaborator.ts      # Interfaces e tipos de colaboradores
│   ├── 📁 utils/                # Funções utilitárias
│   │   ├── calendarLogic.ts     # Algoritmo de geração de calendários
│   │   └── pdfExport.ts         # Geração de PDFs com jsPDF
│   ├── 📄 App.css               # Estilos específicos do App
│   ├── 📄 App.tsx               # Componente principal com roteamento
│   ├── 📄 index.css             # Estilos globais e utilitários
│   └── 📄 main.tsx              # Ponto de entrada da aplicação
├── 📁 dist/                     # Build de produção (gerado automaticamente)
├── 📄 .env                      # Variáveis de ambiente (não versionado)
├── 📄 .gitignore               # Arquivos ignorados pelo git
├── 📄 CODING.md                # Este arquivo - documentação de código
├── 📄 README.md                # Documentação principal do projeto
├── 📄 eslint.config.js         # Configuração do ESLint
├── 📄 firebase.json            # Configuração do Firebase Hosting
├── 📄 firestore.rules          # Regras de segurança do Firestore
├── 📄 firestore.rules.secure   # Regras de segurança alternativas
├── 📄 index.html               # HTML principal da aplicação
├── 📄 package.json             # Dependências e scripts npm
├── 📄 package-lock.json        # Lock das dependências
├── 📄 postcss.config.cjs       # Configuração do PostCSS
├── 📄 postcss.config.js        # Configuração alternativa do PostCSS
├── 📄 tailwind.config.js       # Configuração do Tailwind CSS
├── 📄 tsconfig.app.json        # Configuração TypeScript (aplicação)
├── 📄 tsconfig.json            # Configuração TypeScript principal
├── 📄 tsconfig.node.json       # Configuração TypeScript (node)
├── 📄 vite.config.ts           # Configuração do Vite
└── 📄 vitest.config.ts         # Configuração do Vitest
```

## 🛠️ Stack Tecnológica

### **Core Framework**
- **React 18.2** - Biblioteca principal para interface de usuário
- **TypeScript 5.0** - Superset JavaScript com tipagem estática
- **Vite 4.4** - Build tool moderno e rápido para desenvolvimento

### **UI/UX & Styling**
- **TailwindCSS 3.3** - Framework CSS utilitário para estilização
- **@headlessui/react 1.7** - Componentes acessíveis sem estilos pré-definidos
- **@heroicons/react 2.0** - Ícones do design system Heroicons
- **lucide-react 0.544** - Biblioteca adicional de ícones SVG
- **class-variance-authority 0.7** - Gerenciamento de variantes de componentes
- **@tailwindcss/forms 0.5** - Estilos pré-definidos para formulários

### **Roteamento e Navegação**
- **react-router-dom 6.17** - Roteamento declarativo da aplicação

### **Backend & Infraestrutura**
- **Firebase 10.6** - Backend as a Service completo
  - **Authentication** - Autenticação (Email/Password + Google OAuth)
  - **Firestore** - Banco de dados NoSQL
  - **Storage** - Armazenamento de arquivos
  - **Analytics** - Métricas e eventos de uso

### **Manipulação de Dados**
- **date-fns 2.30** - Biblioteca moderna para manipulação de datas
- **jsPDF 2.5** - Geração de documentos PDF no cliente
- **jspdf-autotable 3.7** - Plugin para criação de tabelas em PDF

### **Desenvolvimento e Testes**
- **Vitest 0.34** - Framework de testes moderno (substituto do Jest)
- **@testing-library/react 16.3** - Utilitários para testes de componentes
- **@testing-library/jest-dom 6.9** - Matchers customizados para DOM
- **jsdom 27.0** - Ambiente DOM simulado para testes

### **Qualidade de Código**
- **ESLint 9.36** - Linter JavaScript/TypeScript
- **typescript-eslint 8.45** - Regras ESLint específicas para TypeScript
- **eslint-plugin-react-hooks 5.2** - Regras para React Hooks
- **eslint-plugin-react-refresh 0.4** - Regras para React Refresh

### **Build e Deploy**
- **PostCSS 8.4** - Processador CSS
- **Autoprefixer 10.4** - Prefixos CSS automáticos
- **Firebase CLI** - Deploy e configuração do Firebase

## 🏗️ Arquitetura da Aplicação

### **Padrão Arquitetural**
O CalendarJUP segue uma arquitetura em camadas bem definida:

```
┌─────────────────────────────────────────┐
│              Presentation Layer         │
│         (React Components & Pages)      │
├─────────────────────────────────────────┤
│              Business Logic             │
│         (Services & Contexts)           │
├─────────────────────────────────────────┤
│              Data Access                │
│         (Firebase & External APIs)      │
└─────────────────────────────────────────┘
```

### **Estrutura de Roteamento**
A aplicação utiliza React Router v6 com roteamento hierárquico e proteção de rotas:

```typescript
// App.tsx - Estrutura principal de rotas
<BrowserRouter>
  <Routes>
    {/* Rota pública - Autenticação */}
    <Route path="/login" element={<Login />} />
    
    {/* Rotas protegidas - Requerem autenticação */}
    <Route element={<PrivateRoute />}>
      <Route element={<Layout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/calendar-generator" element={<CalendarGenerator />} />
      <Route path="/collaborators" element={<Collaborators />} />
      <Route path="/reports" element={<Reports />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Route>
  </Routes>
</BrowserRouter>
```

### **Hierarquia de Providers**
```typescript
// main.tsx - Hierarquia de contextos
<ThemeProvider>
  <NotificationProvider>
  <AuthProvider>
    <App />
  </AuthProvider>
  </NotificationProvider>
</ThemeProvider>
```

### **Fluxo de Dados**
```
User Interaction → Component → Context/Service → Firebase → UI Update
```

### **Separação de Responsabilidades**

#### **Presentation Layer (Components & Pages)**
- **Components**: Componentes reutilizáveis e específicos
- **Pages**: Componentes de página que representam rotas
- **UI Components**: Design system base (Button, Card, etc.)

#### **Business Logic Layer (Services & Contexts)**
- **Contexts**: Gerenciamento de estado global
- **Services**: Lógica de negócio e integrações
- **Utils**: Funções utilitárias e helpers

#### **Data Access Layer (Firebase & APIs)**
- **Firebase Config**: Configuração e inicialização
- **External APIs**: Integrações (BrasilAPI, etc.)
- **Firestore Rules**: Regras de segurança e acesso

## 📝 Padrões de Codificação

### **Estrutura de Componentes**

#### **1. Padrão de Componente Funcional**
```typescript
import React from 'react';
import type { ComponentProps } from './types';

interface ComponentProps {
  prop1: string;
  prop2?: number;
  children?: React.ReactNode;
}

export const Component: React.FC<ComponentProps> = ({ 
  prop1, 
  prop2, 
  children,
  ...props 
}) => {
  // Hooks e lógica do componente
  const [state, setState] = React.useState('');
  
  // Event handlers
  const handleClick = () => {
    // Lógica do handler
  };

  return (
    <div {...props}>
      {children}
    </div>
  );
};

Component.displayName = 'Component';
```

#### **2. Design System e Variantes**
```typescript
// Exemplo: Button.tsx com class-variance-authority
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-white hover:bg-primary-700',
        secondary: 'bg-secondary-600 text-white hover:bg-secondary-700',
        outline: 'border border-gray-300 bg-white text-gray-700',
        ghost: 'text-gray-700 hover:bg-gray-100',
        danger: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}
```

#### **3. Componentes com Ref Forwarding**
```typescript
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        disabled={loading}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
```

### **Estilização e Design System**

#### **1. TailwindCSS - Configuração Principal**
```javascript
// tailwind.config.js - Tema customizado
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
theme: {
  extend: {
    colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
    },
    animation: {
      'fade-in': 'fade-in 0.3s ease-out',
      'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-top': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
    },
    backdropBlur: {
      'xs': '2px',
      'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
```

#### **2. Classes Utilitárias Customizadas**
```css
/* src/index.css - Estilos globais */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .glass-morphism {
    @apply bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-white/20 dark:border-gray-700/20;
  }
  
  .card-hover {
    @apply transition-all duration-200 hover:shadow-lg hover:-translate-y-1;
  }
  
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-md transition-colors;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

#### **3. Tema Escuro/Claro**
```typescript
// ThemeContext.tsx - Gerenciamento de tema
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### **Hooks e Contextos**

#### **1. Hooks Personalizados**
```typescript
// src/hooks/useLocalStorage.ts - Exemplo de hook personalizado
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
```

#### **2. Contextos Principais**

**AuthContext - Gerenciamento de Autenticação**
```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  currentUser: User | null;
  currentUserOrg: UserOrgInfo | null;
  userOrgs: UserOrgInfo[];
  loading: boolean;
  signup: (email: string, pass: string, name: string, orgCode?: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: (orgCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchOrg: (orgId: string) => void;
  createOrganization: (orgName: string) => Promise<void>;
  leaveOrganization: (orgId: string) => Promise<void>;
  deleteOrganization: (orgId: string) => Promise<void>;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserOrg, setCurrentUserOrg] = useState<UserOrgInfo | null>(null);
  const [userOrgs, setUserOrgs] = useState<UserOrgInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Implementação dos métodos de autenticação...
};
```

**NotificationContext - Sistema de Notificações**
```typescript
// src/contexts/NotificationContext.tsx
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}
```

### **Firebase - Configuração e Integração**

#### **1. Configuração Principal**
```typescript
// src/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
```

#### **2. Estrutura de Dados no Firestore**
```
organizations/
├── {orgId}/
│   ├── name: string
│   ├── owner: string (userId)
│   ├── code: string (código de convite)
│   ├── createdAt: Timestamp
│   ├── members/
│   │   └── {userId}/
│   │       ├── email: string
│   │       ├── role: 'owner' | 'admin' | 'member'
│   │       ├── status: 'active' | 'inactive'
│   │       └── joinedAt: Timestamp
│   ├── calendars/
│   │   └── {calendarId}/
│   │       ├── name: string
│   │       ├── month: number
│   │       ├── year: number
│   │       ├── data: Day[]
│   │       └── createdAt: Timestamp
│   └── holidays/
│       └── {holidayId}/
│           ├── name: string
│           ├── date: string
│           ├── type: 'national' | 'custom'
│           └── createdAt: Timestamp

users/
└── {userId}/
    ├── uid: string
    ├── email: string
    ├── displayName: string
    ├── avatarUrl?: string
    ├── organizations: string[] (orgIds)
    └── createdAt: Timestamp

invites/
└── {inviteId}/
    ├── email: string
    ├── orgId: string
    ├── role: 'admin' | 'member'
    ├── status: 'pending' | 'accepted' | 'declined'
    ├── createdAt: Timestamp
    └── acceptedBy?: string (userId)
```

#### **3. Regras de Segurança do Firestore**
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isUserInOrg(orgId) {
      return exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));
    }
    
    function isOrgAdmin(orgId) {
      return get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role in ['admin', 'owner'];
    }
    
    function isOrgOwner(orgId) {
      return get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role == 'owner';
    }
    
    // Organizations collection
    match /organizations/{orgId} {
      allow read: if isUserInOrg(orgId);
      allow update: if isOrgOwner(orgId);
      allow delete: if isOrgOwner(orgId);
      
      // Members subcollection
      match /members/{userId} {
        allow read: if isUserInOrg(orgId);
        allow create: if isOrgAdmin(orgId);
        allow update: if isOrgAdmin(orgId) || request.auth.uid == userId;
        allow delete: if isOrgAdmin(orgId);
      }
      
      // Calendars subcollection
      match /calendars/{calendarId} {
        allow read: if isUserInOrg(orgId);
        allow create, update, delete: if isOrgAdmin(orgId);
      }
      
      // Holidays subcollection
      match /holidays/{holidayId} {
        allow read: if isUserInOrg(orgId);
        allow create, update, delete: if isOrgAdmin(orgId);
      }
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId;
    }
    
    // Invites collection
    match /invites/{inviteId} {
      allow read: if request.auth != null;
      allow create: if isOrgAdmin(resource.data.orgId);
      allow update: if request.auth.uid == resource.data.acceptedBy;
    }
  }
}
```

### **Tipagem TypeScript**

#### **1. Estratégias de Tipagem**
```typescript
// src/types/collaborator.ts - Interfaces principais
export interface Collaborator {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  department?: string;
  startDate?: string;
  totalPlantoes?: number;
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
  };
}

export interface Plantonista {
  id: string;
  name: string;
  email: string;
  vacations?: Vacation[];
}

export interface Vacation {
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface Holiday {
  date: string;
  name: string;
  type: 'national' | 'custom';
}

export interface Day {
  date: string;
  plantonista: Plantonista | null;
}

export interface Calendar {
  id: string;
  name: string;
  month: number;
  year: number;
  data: Day[];
  companyName: string;
  createdAt: Date;
}
```

#### **2. Type Guards e Validações**
```typescript
// src/utils/typeGuards.ts
export const isPlantonista = (obj: any): obj is Plantonista => {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string';
};

export const isHoliday = (obj: any): obj is Holiday => {
  return obj &&
    typeof obj.date === 'string' &&
    typeof obj.name === 'string' &&
    ['national', 'custom'].includes(obj.type);
};
```

#### **3. Tipos Utilitários**
```typescript
// src/types/common.ts
export type Status = 'loading' | 'success' | 'error' | 'idle';

export interface ApiResponse<T> {
  data: T;
  status: Status;
  error?: string;
}

export type Theme = 'light' | 'dark';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';
```

### **Gerenciamento de Estado**

#### **1. Estado Local**
```typescript
// useState para estado simples
const [loading, setLoading] = useState(false);
const [data, setData] = useState<DataType[]>([]);

// useReducer para estado complexo
const [state, dispatch] = useReducer(reducer, initialState);
```

#### **2. Estado Global**
```typescript
// Contextos React para estado compartilhado
const { currentUser, login, logout } = useAuth();
const { theme, toggleTheme } = useTheme();
const { notifications, addNotification } = useNotifications();
```

### **Serviços e Lógica de Negócio**

#### **1. Padrão de Serviços**
```typescript
// src/services/holidayService.ts
export interface Holiday {
  date: string;
  name: string;
  type: 'national' | 'custom';
}

export const getNationalHolidays = async (year: number): Promise<Holiday[]> => {
  try {
    const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
    const data = await response.json();
    return data.map((holiday: any) => ({
      date: holiday.date,
      name: holiday.name,
      type: 'national' as const,
    }));
  } catch (error) {
    console.error('Erro ao buscar feriados:', error);
    throw new Error('Falha ao carregar feriados nacionais');
  }
};
```

#### **2. Organização de Serviços**
```
src/services/
├── holidayService.ts      # Integração BrasilAPI
├── organizationService.ts # CRUD organizações
└── userService.ts         # Operações de usuário
```

### **Geração de PDF**

#### **1. Utilitário PDF**
```typescript
// src/utils/pdfExport.ts
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateCalendarPDF = async (
  calendar: Calendar,
  logoUrl?: string
): Promise<void> => {
  const doc = new jsPDF();
  
  // Configurar logo
  if (logoUrl) {
    const logo = await loadImage(logoUrl);
    doc.addImage(logo, 'PNG', 15, 10, 30, 20);
  }
  
  // Gerar tabela do calendário
  // ... implementação detalhada
};
```

## 📋 Convenções de Nomenclatura

### **Arquivos e Pastas**
- **Componentes**: PascalCase (`Button.tsx`, `CalendarView.tsx`)
- **Utilitários**: camelCase (`calendarLogic.ts`, `pdfExport.ts`)
- **Tipos**: PascalCase (`collaborator.ts`)
- **Páginas**: PascalCase (`Dashboard.tsx`, `Login.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useAuth.ts`, `useLocalStorage.ts`)

### **Variáveis e Funções**
- **Variáveis**: camelCase (`currentUser`, `isLoading`)
- **Funções**: camelCase (`handleSubmit`, `fetchData`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRIES`)
- **Event Handlers**: Prefixo `handle` (`handleClick`, `handleSubmit`)
- **Hooks**: Prefixo `use` (`useAuth`, `useLocalStorage`)

### **Componentes e Props**
- **Componentes**: PascalCase (`Button`, `CalendarView`)
- **Props Interfaces**: PascalCase + sufixo `Props` (`ButtonProps`, `CalendarProps`)
- **Tipos de Props**: PascalCase + sufixo `Type` (`AuthContextType`)

## 🧪 Testes

### **Configuração Vitest**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
});
```

### **Estrutura de Testes**
```
src/
├── components/
│   └── Button.test.tsx
├── utils/
│   └── calendarLogic.test.ts
└── setupTests.ts
```

### **Exemplo de Teste**
```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## ⚡ Performance e Otimização

### **Estratégias Implementadas**
- **Code Splitting**: Lazy loading de componentes quando necessário
- **Memoização**: `useMemo` e `useCallback` para evitar re-renders desnecessários
- **Bundle Optimization**: Vite para builds otimizados
- **Image Optimization**: Imagens otimizadas no diretório `public/`

### **Bundle Analysis**
```bash
npm run build
# Gera arquivos otimizados em dist/
# Chunks separados para melhor cache
# Compressão automática
```

## ♿ Acessibilidade

### **Práticas Implementadas**
- **@headlessui/react**: Componentes acessíveis por padrão
- **ARIA Labels**: Labels apropriados para elementos interativos
- **Keyboard Navigation**: Suporte completo a navegação por teclado
- **Contrast**: Contraste adequado nos temas claro e escuro
- **Screen Readers**: Compatibilidade com leitores de tela

## 🔧 Qualidade de Código

### **ESLint Configuration**
```javascript
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  }
);
```

### **Scripts de Qualidade**
```bash
npm run lint      # Executa o linter
npm run test      # Executa os testes
npm run build     # Build de produção
npm run preview   # Preview do build
```

---

## 📚 Recursos Adicionais

### **Documentação Externa**
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

### **Ferramentas Recomendadas**
- **VS Code Extensions**: ES7+ React/Redux/React-Native snippets, Tailwind CSS IntelliSense
- **Browser Extensions**: React Developer Tools, Redux DevTools
- **Testing**: Vitest, Testing Library, Playwright (para E2E)

---

**📅 Última atualização**: Janeiro 2025  
**🔖 Versão do projeto**: 0.0.0  
**⚙️ Node.js**: v18+ (recomendado v20+)  
**📦 Package Manager**: npm ou yarn