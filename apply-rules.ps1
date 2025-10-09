# Script PowerShell para aplicar regras do Firebase
Write-Host "🔥 Aplicando regras do Firestore..." -ForegroundColor Green

# Verificar se Firebase CLI está instalado
try {
    $firebaseVersion = firebase --version
    Write-Host "✅ Firebase CLI encontrado: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI não encontrado. Instalando..." -ForegroundColor Red
    npm install -g firebase-tools
}

# Verificar se está logado
Write-Host "🔐 Verificando login do Firebase..." -ForegroundColor Yellow
try {
    firebase projects:list | Out-Null
    Write-Host "✅ Logado no Firebase" -ForegroundColor Green
} catch {
    Write-Host "❌ Não está logado. Execute: firebase login" -ForegroundColor Red
    Write-Host "💡 Abra o terminal e execute: firebase login" -ForegroundColor Cyan
    Read-Host "Pressione Enter após fazer login"
}

# Aplicar regras
Write-Host "📝 Aplicando regras do Firestore..." -ForegroundColor Yellow
try {
    firebase deploy --only firestore:rules
    Write-Host "✅ Regras aplicadas com sucesso!" -ForegroundColor Green
    Write-Host "🎉 Agora você pode testar a criação de organizações!" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Erro ao aplicar regras. Verifique o projeto Firebase." -ForegroundColor Red
    Write-Host "💡 Certifique-se de que o projeto está configurado corretamente." -ForegroundColor Cyan
}

Read-Host "Pressione Enter para continuar"
