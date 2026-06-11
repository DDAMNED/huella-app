# ═══════════════════════════════════════════════════════════════
# HUELLA App — Deploy a Vercel
# Ejecutar desde: C:\Users\anton\Desktop\huella-app
# ═══════════════════════════════════════════════════════════════

Set-Location "C:\Users\anton\Desktop\huella-app"

# 1. Instalar dependencias
Write-Host "Instalando dependencias..."
npm install

# 2. Git init y primer commit
git init
git add .
git commit -m "feat: HUELLA + Vexa + OpenAI integration"

Write-Host ""
Write-Host "=== SIGUIENTE PASO ==="
Write-Host "1. Crea un repo en github.com (llamalo 'huella-app', privado o publico)"
Write-Host "2. Ejecuta:"
Write-Host "   git remote add origin https://github.com/DDAMNED/huella-app.git"
Write-Host "   git push -u origin main"
Write-Host "3. En vercel.com importa el repo 'huella-app'"
Write-Host "4. En Environment Variables añade:"
Write-Host "   VEXA_API_KEY    = tu clave de vexa.ai/account"
Write-Host "   VEXA_HOST       = https://api.cloud.vexa.ai"
Write-Host "   OPENAI_API_KEY  = tu clave de OpenAI"
Write-Host "5. Deploy!"
