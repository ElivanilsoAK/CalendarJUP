# CalendarJUP - Sistema Inteligente de Gestão de Plantões

<div align="center">

![CalendarJUP Logo](public/vite.svg)

**CalendarJUP** é uma plataforma web moderna e elegante para criar, gerenciar e exportar calendários de plantão de forma inteligente e organizada. Desenvolvida com tecnologias de ponta, oferece uma experiência fluida e responsiva com design minimalista e funcionalidades avançadas.

[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3-38bdf8.svg)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-10.6-ffca28.svg)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-4.4-646cff.svg)](https://vitejs.dev/)

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow.svg)]()

</div>

## 🎯 Objetivo do Projeto

O **CalendarJUP** foi desenvolvido para resolver um problema comum em empresas e organizações que precisam gerenciar plantões de forma justa e eficiente. A plataforma automatiza a criação de calendários de plantão, garantindo distribuição equilibrada entre colaboradores, respeitando férias e feriados, enquanto mantém total flexibilidade para ajustes manuais.

### 🎨 Design Philosophy
- **Simplicidade:** Interface intuitiva que não requer treinamento
- **Eficiência:** Automação inteligente que economiza tempo
- **Justiça:** Algoritmo que distribui plantões de forma equilibrada
- **Flexibilidade:** Permite personalização e ajustes manuais
- **Modernidade:** Tecnologias atuais para melhor performance

## ✨ Funcionalidades Principais

### 🔐 **Autenticação e Segurança**
- **Login Multiplataforma:** E-mail/Senha e Google OAuth
- **Sistema de Organizações:** Isolamento completo de dados por empresa
- **Códigos de Convite:** Sistema seguro para adicionar membros
- **Controle de Acesso:** Três níveis de permissão (Owner, Admin, Member)

### 👥 **Gestão de Colaboradores**
- **Perfis Completos:** Informações detalhadas de cada membro
- **Hierarquia de Permissões:**
  - **Owner:** Controle total da organização
  - **Admin:** Gerenciamento de membros e calendários
  - **Member:** Visualização e perfil pessoal
- **Sistema de Convites:** Adicione membros facilmente via código

### 📅 **Gerador Inteligente de Calendários**
- **Algoritmo Avançado:** Distribuição justa e automática de plantões
- **Feriados Inteligentes:** 
  - Integração com BrasilAPI para feriados nacionais
  - Feriados customizados por organização
- **Respeito a Férias:** Sistema que considera períodos de ausência
- **Evita Sobrecarga:** Algoritmo que previne plantões consecutivos
- **Ajustes Manuais:** Flexibilidade total para modificações

### 📊 **Analytics e Relatórios**
- **Dashboard Intuitivo:** Visão geral da organização
- **Estatísticas de Plantões:** Distribuição e carga de trabalho
- **Relatórios Detalhados:** Análises completas por período
- **Métricas de Performance:** Acompanhamento de uso da plataforma

### 📄 **Exportação Profissional**
- **PDFs Customizados:** Logos e cores da organização
- **Múltiplos Formatos:** Calendários mensais e anuais
- **Alta Qualidade:** Documentos prontos para impressão

### 🎨 **Interface Moderna**
- **Design Responsivo:** Otimizado para todos os dispositivos
- **Tema Escuro/Claro:** Preferências personalizáveis
- **Glass Morphism:** Interface moderna e elegante
- **UX Intuitiva:** Navegação fluida e acessível


## 🛠️ Stack Técnica

### **Frontend**
- **React 18.2** - Biblioteca principal para interface
- **TypeScript 5.0** - Tipagem estática e melhor DX
- **Vite 4.4** - Build tool moderno e rápido
- **TailwindCSS 3.3** - Framework CSS utilitário
- **React Router 6** - Roteamento da aplicação

### **UI/UX Libraries**
- **@headlessui/react** - Componentes acessíveis
- **@heroicons/react** - Ícones do design system
- **lucide-react** - Biblioteca adicional de ícones
- **class-variance-authority** - Gerenciamento de variantes

### **Backend & Infraestrutura**
- **Firebase 10.6** - Backend as a Service
  - Authentication (Email/Password + Google OAuth)
  - Firestore (Banco de dados NoSQL)
  - Storage (Armazenamento de arquivos)
  - Analytics (Métricas de uso)

### **Utilitários e Ferramentas**
- **jsPDF + jspdf-autotable** - Geração de PDFs
- **date-fns** - Manipulação avançada de datas
- **Vitest + Testing Library** - Framework de testes
- **ESLint + TypeScript ESLint** - Análise de código

---

## 🏛️ Arquitetura

A aplicação segue uma arquitetura de componentes, com uma clara separação de responsabilidades.

```
+---------------------+      +---------------------+      +-----------------+
|      Frontend       |      |      Serviços       |      |     Firebase    |
| (React Components)  |----->| (holiday, user, org)|----->|  (Backend as a  |
|      (UI/UX)        |      |  (Lógica de Negócio) |      |     Service)    |
+---------------------+      +---------------------+      +-----------------+
        |                                                       |
        |                                                       |
        v                                                       v
+---------------------+                                 +-----------------+
|   State Management  |                                 |    Firestore    |
| (React Context API) |                                 | (Banco de Dados)|
+---------------------+                                 +-----------------+
```

-   **Frontend:** Componentes React responsáveis pela renderização da UI.
-   **Serviços:** Módulos TypeScript que encapsulam a lógica de negócio (ex: chamadas de API, manipulação de dados).
-   **Firebase:** Utilizado como Backend as a Service para autenticação, armazenamento de dados (Firestore) e arquivos (Storage).
-   **State Management:** O Context API do React é usado para gerenciar o estado global, como informações do usuário autenticado e tema.

## 📂 Estrutura do Projeto

```
CalendarJUP/
├── 📁 public/                 # Arquivos estáticos públicos
│   ├── padrao.jpg            # Imagem padrão da organização
│   └── vite.svg              # Logo do projeto
├── 📁 src/
│   ├── 📁 components/        # Componentes React reutilizáveis
│   │   ├── 📁 ui/           # Design System (Button, Card, CalendarBase)
│   │   ├── Layout.tsx       # Layout principal com navegação
│   │   ├── CalendarView.tsx # Visualização de calendários
│   │   └── ...              # Modais e componentes específicos
│   ├── 📁 contexts/         # Contextos React para estado global
│   │   ├── AuthContext.tsx  # Autenticação e organizações
│   │   ├── ThemeContext.tsx # Gerenciamento de tema
│   │   └── NotificationContext.tsx # Sistema de notificações
│   ├── 📁 firebase/         # Configuração e integração Firebase
│   │   ├── config.ts        # Configuração principal
│   │   └── analytics.ts     # Eventos e métricas
│   ├── 📁 pages/            # Componentes de página
│   │   ├── Dashboard.tsx    # Página principal
│   │   ├── Login.tsx        # Autenticação
│   │   ├── CalendarGenerator.tsx # Gerador de calendários
│   │   ├── Collaborators.tsx # Gestão de colaboradores
│   │   └── ...              # Outras páginas
│   ├── 📁 services/         # Lógica de negócio e APIs
│   │   ├── holidayService.ts # Integração BrasilAPI
│   │   ├── organizationService.ts # Operações de organização
│   │   └── userService.ts   # Operações de usuário
│   ├── 📁 types/            # Definições TypeScript
│   │   └── collaborator.ts  # Tipos de colaboradores
│   ├── 📁 utils/            # Funções utilitárias
│   │   ├── calendarLogic.ts # Algoritmo de geração de calendários
│   │   └── pdfExport.ts     # Geração de PDFs
│   ├── App.tsx              # Componente principal com roteamento
│   ├── main.tsx             # Ponto de entrada da aplicação
│   └── index.css            # Estilos globais
├── 📄 firebase.json         # Configuração Firebase Hosting
├── 📄 firestore.rules       # Regras de segurança do Firestore
├── 📄 tailwind.config.js    # Configuração TailwindCSS
├── 📄 vite.config.ts        # Configuração Vite
└── 📄 package.json          # Dependências e scripts
```

> 📋 **Documentação Detalhada:** Para padrões de código, convenções e arquitetura técnica, consulte [CODING.md](CODING.md)

## 🚀 Instalação e Execução Local

### **Pré-requisitos**
- **Node.js** v18+ (recomendado v20+)
- **npm** ou **yarn**
- **Git**
- Conta no [Firebase Console](https://console.firebase.google.com/)

### **Passo a Passo**

1. **📥 Clone o Repositório**
   ```bash
   git clone <url-do-repositorio>
   cd CalendarJUP
   ```

2. **📦 Instale as Dependências**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **🔥 Configure o Firebase**
   
   a. Crie um novo projeto no [Firebase Console](https://console.firebase.google.com/)
   
   b. Ative os serviços necessários:
      - **Authentication** (Email/Password + Google)
      - **Firestore Database**
      - **Storage** (opcional)
      - **Analytics** (opcional)
   
   c. Crie um arquivo `.env` na raiz do projeto:
   ```env
   VITE_FIREBASE_API_KEY=sua_api_key
   VITE_FIREBASE_AUTH_DOMAIN=seu_dominio
   VITE_FIREBASE_PROJECT_ID=seu_project_id
   VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
   VITE_FIREBASE_APP_ID=seu_app_id
   ```

4. **🔒 Configure as Regras do Firestore**
   
   Copie o conteúdo do arquivo `firestore.rules` e cole nas regras do seu projeto Firebase:
   ```bash
   # No console Firebase > Firestore > Rules
   ```

5. **🚀 Execute a Aplicação**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

6. **🌐 Acesse a Aplicação**
   
   Abra seu navegador em `http://localhost:5173`

### **Scripts Disponíveis**

```bash
npm run dev      # Inicia o servidor de desenvolvimento
npm run build    # Gera o build de produção
npm run test     # Executa os testes com Vitest
npm run lint     # Executa o linter ESLint
npm run preview  # Visualiza o build localmente
```

## 🔒 Segurança e Isolamento de Dados

O CalendarJUP implementa um sistema robusto de segurança que garante isolamento completo entre organizações:

### **Regras de Segurança do Firestore**
- **Isolamento por Organização:** Cada organização só acessa seus próprios dados
- **Controle de Acesso Baseado em Roles:** Owner, Admin e Member têm permissões distintas
- **Validação de Autenticação:** Todas as operações requerem usuário autenticado
- **Proteção contra Acesso Não Autorizado:** Regras que impedem acesso cruzado

### **Estrutura de Dados Segura**
```
organizations/{orgId}/
├── name, owner, code, createdAt
├── members/{userId}/
│   └── email, role, status, joinedAt
├── calendars/{calendarId}/
│   └── name, month, year, data
└── holidays/{holidayId}/
    └── name, date, type

users/{userId}/
└── uid, email, displayName, organizations[]
```

### **Princípios de Segurança**
- ✅ **Zero Trust:** Verificação constante de permissões
- ✅ **Princípio do Menor Privilégio:** Acesso mínimo necessário
- ✅ **Auditoria:** Logs de todas as operações importantes
- ✅ **Isolamento:** Dados completamente separados por organização

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir com o projeto:

1. **Fork** o repositório
2. Crie uma **branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

### **Padrões de Contribuição**
- Siga as convenções de código definidas em [CODING.md](CODING.md)
- Escreva testes para novas funcionalidades
- Mantenha a documentação atualizada
- Use commits semânticos

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 🙏 Agradecimentos

- **Firebase** - Plataforma de backend
- **React Team** - Biblioteca de interface
- **TailwindCSS** - Framework CSS
- **Vite** - Build tool moderno
- **BrasilAPI** - API de feriados nacionais

---

<div align="center">

**Desenvolvido com ❤️ para simplificar a gestão de plantões**

[🔗 Demo](https://calendarjup.web.app) | [📖 Documentação](CODING.md) | [🐛 Issues](https://github.com/seu-usuario/calendarjup/issues) | [💬 Discussões](https://github.com/seu-usuario/calendarjup/discussions)

</div>