#!/bin/bash
# deploy.sh — build แล้ว deploy ขึ้น Firebase Hosting

set -e

echo "📦 Building..."
npm run build

echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "✅ Done! https://product-photo-app.web.app"
