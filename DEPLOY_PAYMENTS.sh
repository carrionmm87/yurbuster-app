#!/bin/bash

# Deploy script to copy updated database to VPS

REMOTE_USER="root"
REMOTE_HOST="144.126.150.81"
REMOTE_PATH="/var/www/yurbuster-app/backend/prisma"
LOCAL_DB="backend/prisma/database.sqlite"

echo "📤 Copying updated database to VPS..."
echo "Source: $LOCAL_DB"
echo "Destination: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"
echo ""

# Copy database
scp -o StrictHostKeyChecking=no "$LOCAL_DB" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database copied successfully!"
    echo ""
    echo "📝 Next step: Restart the backend on the VPS"
    echo ""
    echo "Run this command:"
    echo "ssh root@144.126.150.81 'cd /var/www/yurbuster-app && pm2 restart yurbuster-backend'"
    echo ""
else
    echo "❌ Failed to copy database"
    exit 1
fi
