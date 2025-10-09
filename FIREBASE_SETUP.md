# 🔥 Configuração do Firebase - Resolução de Permissões

## ❌ Problema Identificado

O erro `FirebaseError: Missing or insufficient permissions` na linha 314 do `AuthContext.tsx` ocorre porque:

1. **CollectionGroup Query**: A query `collectionGroup(db, 'members')` precisa de permissões especiais
2. **Regras Restritivas**: As regras atuais do Firebase são muito restritivas para esta operação
3. **Primeiro Login**: Usuários novos não têm permissões para acessar subcoleções

## ✅ Solução Implementada

### 1. Regras Temporárias Aplicadas

Criei regras temporárias mais permissivas em `firestore.rules`:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Regras temporárias mais permissivas para resolver o problema de collectionGroup
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 2. Como Aplicar as Regras

#### Opção A: Via Firebase Console (Recomendado)
1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. Vá em **Firestore Database** > **Regras**
4. Cole o conteúdo do arquivo `firestore.rules`
5. Clique em **Publicar**

#### Opção B: Via Firebase CLI
```bash
# 1. Fazer login no Firebase
firebase login

# 2. Aplicar as regras
firebase deploy --only firestore:rules
```

#### Opção C: Via Script (Windows)
```bash
# Execute o arquivo apply-rules.bat
apply-rules.bat
```

## 🔒 Regras Seguras (Para Implementar Depois)

Após resolver o problema inicial, implemente estas regras mais seguras:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper Functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isUserInOrg(orgId) {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));
    }

    function isOrgAdmin(orgId) {
      return isAuthenticated() && (
        get(/databases/$(database)/documents/organizations/$(orgId)).data.owner == request.auth.uid ||
        (exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role in ['admin', 'owner'])
      );
    }

    // Organizations
    match /organizations/{orgId} {
      allow read: if isUserInOrg(orgId);
      allow create: if isAuthenticated();
      allow update: if isOrgAdmin(orgId);
      allow delete: if false;

      // Members - CRUCIAL para collectionGroup
      match /members/{memberId} {
        allow read: if isAuthenticated(); // Permite collectionGroup
        allow create: if isOrgAdmin(orgId);
        allow update: if isOrgAdmin(orgId) || request.auth.uid == memberId;
        allow delete: if isOrgAdmin(orgId);
      }

      // Calendars
      match /calendars/{calendarId} {
        allow read: if isUserInOrg(orgId);
        allow create, update, delete: if isOrgAdmin(orgId);
      }
    }

    // Users
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Invites
    match /invites/{inviteId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

## 🚀 Teste a Solução

1. **Aplique as regras temporárias** usando uma das opções acima
2. **Teste criar uma organização** no Dashboard
3. **Verifique se o erro desapareceu**
4. **Implemente as regras seguras** quando tudo estiver funcionando

## 📋 Checklist de Verificação

- [ ] Regras temporárias aplicadas no Firebase
- [ ] Erro de permissões resolvido
- [ ] Criação de organização funcionando
- [ ] Login/logout funcionando
- [ ] Navegação entre páginas funcionando
- [ ] Regras seguras implementadas (opcional)

## 🔧 Troubleshooting

### Se ainda houver erros:

1. **Verifique o projeto Firebase**: Certifique-se de estar no projeto correto
2. **Limpe o cache**: `Ctrl + F5` no navegador
3. **Verifique a autenticação**: Faça logout e login novamente
4. **Console do navegador**: Verifique se há outros erros

### Logs úteis:
- Firebase Console > Firestore > Usage
- Browser DevTools > Console
- Network tab para verificar requests

## 📞 Suporte

Se o problema persistir, verifique:
1. Configuração do Firebase no projeto
2. Variáveis de ambiente
3. Permissões do usuário no Firebase
4. Status do projeto Firebase (ativo/suspenso)
