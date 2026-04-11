# Script de Despliegue Automático para YurBuster (Versión 5 - API Subdomain)
$ip = "144.126.150.81"
$user = "root"
$file = "bundle.tar"

Write-Host "Configurando Backend para api.yurbuster.com..."

# 1. Comprimir
tar.exe -cf $file --exclude=node_modules --exclude=.git --exclude=*.mp4 --exclude=cloudflared* --exclude=*.msi *

# 2. Subir
scp $file ${user}@${ip}:/root/$file

# 3. Comandos remotos (Ajustando .env para usar el subdominio API)
$remoteCommands = @"
mkdir -p /var/www/yurbuster-app
tar -xf /root/$file -C /var/www/yurbuster-app
cd /var/www/yurbuster-app
# Ajustar PUBLIC_URL en el servidor a la nueva API
sed -i 's|PUBLIC_URL=.*|PUBLIC_URL=https://api.yurbuster.com|' .env
npm install --omit=dev
pm2 delete yurbuster-api 2>/dev/null
pm2 start server.js --name 'yurbuster-api'
pm2 save
"@

ssh ${user}@${ip} $remoteCommands

Write-Host "DEPLEGUE DE BACKEND OK"
