#!/bin/bash

# Setup GCP Secrets for Reely Backend
# This script helps you create all required secrets in GCP Secret Manager

set -e

PROJECT_ID="${GCP_PROJECT_ID:-your-gcp-project-id}"

echo "=================================="
echo "🔐 Setting up GCP Secrets"
echo "=================================="
echo "Project: ${PROJECT_ID}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first"
    exit 1
fi

# Set project
gcloud config set project ${PROJECT_ID}

# Enable Secret Manager API
echo "🔧 Enabling Secret Manager API..."
gcloud services enable secretmanager.googleapis.com

echo ""
echo "Let's create your secrets..."
echo ""

# GEMINI_API_KEY
read -sp "Enter your GEMINI_API_KEY: " GEMINI_API_KEY
echo ""
if [ ! -z "$GEMINI_API_KEY" ]; then
    echo -n "$GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=- 2>/dev/null || \
    echo -n "$GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
    echo "✅ GEMINI_API_KEY created/updated"
fi

# MONGODB_URI
echo ""
read -sp "Enter your MONGODB_URI: " MONGODB_URI
echo ""
if [ ! -z "$MONGODB_URI" ]; then
    echo -n "$MONGODB_URI" | gcloud secrets create MONGODB_URI --data-file=- 2>/dev/null || \
    echo -n "$MONGODB_URI" | gcloud secrets versions add MONGODB_URI --data-file=-
    echo "✅ MONGODB_URI created/updated"
fi

# SUPABASE_URL
echo ""
read -p "Enter your SUPABASE_URL: " SUPABASE_URL
echo ""
if [ ! -z "$SUPABASE_URL" ]; then
    echo -n "$SUPABASE_URL" | gcloud secrets create SUPABASE_URL --data-file=- 2>/dev/null || \
    echo -n "$SUPABASE_URL" | gcloud secrets versions add SUPABASE_URL --data-file=-
    echo "✅ SUPABASE_URL created/updated"
fi

# SUPABASE_ANON_KEY
echo ""
read -sp "Enter your SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
echo ""
if [ ! -z "$SUPABASE_ANON_KEY" ]; then
    echo -n "$SUPABASE_ANON_KEY" | gcloud secrets create SUPABASE_ANON_KEY --data-file=- 2>/dev/null || \
    echo -n "$SUPABASE_ANON_KEY" | gcloud secrets versions add SUPABASE_ANON_KEY --data-file=-
    echo "✅ SUPABASE_ANON_KEY created/updated"
fi

echo ""
echo "=================================="
echo "✅ All secrets created!"
echo "=================================="
echo ""
echo "To verify, run:"
echo "  gcloud secrets list"
echo ""
echo "You can now run the deployment script:"
echo "  cd Backend && ./deploy.sh"
echo "=================================="
