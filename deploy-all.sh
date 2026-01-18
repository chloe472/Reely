#!/bin/bash

# Reely - Quick Deployment Script for GCP
# This script deploys both backend and frontend in the correct order

set -e

echo "╔══════════════════════════════════════════════╗"
echo "║                                              ║"
echo "║    Reely - GCP Cloud Run Deployment       ║"
echo "║                                              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Check if GCP_PROJECT_ID is set
if [ -z "$GCP_PROJECT_ID" ]; then
    echo " GCP_PROJECT_ID environment variable not set"
    echo ""
    echo "Please set it with:"
    echo "  export GCP_PROJECT_ID='your-project-id'"
    exit 1
fi

# Check if GCP_REGION is set
if [ -z "$GCP_REGION" ]; then
    echo "️  GCP_REGION not set, using default: us-central1"
    export GCP_REGION="us-central1"
fi

echo " Configuration:"
echo "   Project ID: $GCP_PROJECT_ID"
echo "   Region: $GCP_REGION"
echo ""

# Ask if secrets are setup
read -p "Have you setup GCP secrets? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please run: cd Backend && ./setup-secrets.sh"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════"
echo "Step 1/2: Deploying Backend"
echo "════════════════════════════════════════════════"
echo ""

cd Backend
./deploy.sh

# Extract backend URL
BACKEND_URL=$(gcloud run services describe reely-backend --platform managed --region $GCP_REGION --format 'value(status.url)')

if [ -z "$BACKEND_URL" ]; then
    echo " Failed to get backend URL"
    exit 1
fi

echo ""
echo " Backend deployed: $BACKEND_URL"
echo ""

# Wait a moment for backend to be fully ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

echo ""
echo "════════════════════════════════════════════════"
echo "Step 2/2: Deploying Frontend"
echo "════════════════════════════════════════════════"
echo ""

cd ../Frontend
export BACKEND_URL=$BACKEND_URL
./deploy.sh

# Extract frontend URL
FRONTEND_URL=$(gcloud run services describe reely-frontend --platform managed --region $GCP_REGION --format 'value(status.url)')

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║                                              ║"
echo "║    DEPLOYMENT COMPLETE!                    ║"
echo "║                                              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo " Your App URLs:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo ""
echo "️  NEXT STEPS:"
echo ""
echo "1. Update Backend CORS:"
echo "   - Edit Backend/server.js"
echo "   - Add frontend URL to CORS origins"
echo "   - Redeploy: cd Backend && ./deploy.sh"
echo ""
echo "2. Update Supabase:"
echo "   - Go to: https://app.supabase.com"
echo "   - Add redirect URL: $FRONTEND_URL/*"
echo ""
echo "3. Update Google Maps API:"
echo "   - Go to: https://console.cloud.google.com/apis/credentials"
echo "   - Add frontend URL to allowed origins"
echo ""
echo "4. Test your app:"
echo "   - Open: $FRONTEND_URL"
echo "   - Try login, upload, and guess features"
echo ""
echo "════════════════════════════════════════════════"
