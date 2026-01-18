#!/bin/bash

# Setup GCP Secrets for Reely Backend
# This script helps you create all required secrets in GCP Secret Manager

set -e

PROJECT_ID="${GCP_PROJECT_ID:-your-gcp-project-id}"

echo "=================================="
echo " Setting up GCP Secrets"
echo "=================================="
echo "Project: ${PROJECT_ID}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo " gcloud CLI not found. Please install it first"
    exit 1
fi

# Set project
gcloud config set project ${PROJECT_ID}

# Enable Secret Manager API
echo " Enabling Secret Manager API..."
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
    echo " GEMINI_API_KEY created/updated"
fi

# MONGODB_URI
echo ""
read -sp "Enter your MONGODB_URI: " MONGODB_URI
echo ""
if [ ! -z "$MONGODB_URI" ]; then
    echo -n "$MONGODB_URI" | gcloud secrets create MONGODB_URI --data-file=- 2>/dev/null || \
    echo -n "$MONGODB_URI" | gcloud secrets versions add MONGODB_URI --data-file=-
    echo " MONGODB_URI created/updated"
fi

# SUPABASE_URL
echo ""
read -p "Enter your SUPABASE_URL: " SUPABASE_URL
echo ""
if [ ! -z "$SUPABASE_URL" ]; then
    echo -n "$SUPABASE_URL" | gcloud secrets create SUPABASE_URL --data-file=- 2>/dev/null || \
    echo -n "$SUPABASE_URL" | gcloud secrets versions add SUPABASE_URL --data-file=-
    echo " SUPABASE_URL created/updated"
fi

# SUPABASE_ANON_KEY
echo ""
read -sp "Enter your SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
echo ""
if [ ! -z "$SUPABASE_ANON_KEY" ]; then
    echo -n "$SUPABASE_ANON_KEY" | gcloud secrets create SUPABASE_ANON_KEY --data-file=- 2>/dev/null || \
    echo -n "$SUPABASE_ANON_KEY" | gcloud secrets versions add SUPABASE_ANON_KEY --data-file=-
    echo " SUPABASE_ANON_KEY created/updated"
fi

# GCP_PROJECT_ID
echo ""
read -p "Enter your GCP_PROJECT_ID (or press Enter to use current project): " GCP_PROJECT_ID_INPUT
echo ""
if [ ! -z "$GCP_PROJECT_ID_INPUT" ]; then
    GCP_PROJECT_ID="$GCP_PROJECT_ID_INPUT"
fi
if [ ! -z "$GCP_PROJECT_ID" ] && [ "$GCP_PROJECT_ID" != "your-gcp-project-id" ]; then
    echo -n "$GCP_PROJECT_ID" | gcloud secrets create GCP_PROJECT_ID --data-file=- 2>/dev/null || \
    echo -n "$GCP_PROJECT_ID" | gcloud secrets versions add GCP_PROJECT_ID --data-file=-
    echo " GCP_PROJECT_ID created/updated"
fi

# GCS_BUCKET_NAME
echo ""
echo "Setting up Google Cloud Storage bucket for file persistence..."
read -p "Enter your GCS_BUCKET_NAME (or press Enter to create one): " GCS_BUCKET_NAME
echo ""

if [ -z "$GCS_BUCKET_NAME" ]; then
    # Generate a unique bucket name
    GCS_BUCKET_NAME="reely-uploads-$(date +%s)"
    echo " Creating new bucket: ${GCS_BUCKET_NAME}"
    
    # Enable Storage API
    gcloud services enable storage.googleapis.com
    
    # Create bucket
    gsutil mb -p ${PROJECT_ID} -l us-central1 gs://${GCS_BUCKET_NAME} 2>/dev/null || true
    
    # Set uniform bucket-level access
    gsutil uniformbucketlevelaccess set on gs://${GCS_BUCKET_NAME}
    
    # Make bucket publicly readable for images
    gsutil iam ch allUsers:roles/storage.objectViewer gs://${GCS_BUCKET_NAME}
    
    echo " ✅ Bucket created: gs://${GCS_BUCKET_NAME}"
fi

if [ ! -z "$GCS_BUCKET_NAME" ]; then
    echo -n "$GCS_BUCKET_NAME" | gcloud secrets create GCS_BUCKET_NAME --data-file=- 2>/dev/null || \
    echo -n "$GCS_BUCKET_NAME" | gcloud secrets versions add GCS_BUCKET_NAME --data-file=-
    echo " GCS_BUCKET_NAME created/updated"
fi

echo ""
echo "=================================="
echo " All secrets created!"
echo "=================================="
echo ""
echo "️  IMPORTANT: Grant Cloud Run access to GCS:"
echo ""
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)" 2>/dev/null || echo "")
if [ ! -z "$PROJECT_NUMBER" ]; then
    echo "  gcloud projects add-iam-policy-binding ${PROJECT_ID} \\"
    echo "    --member=\"serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com\" \\"
    echo "    --role=\"roles/storage.admin\""
    echo ""
    read -p "Would you like to grant this permission now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gcloud projects add-iam-policy-binding ${PROJECT_ID} \
          --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
          --role="roles/storage.admin"
        echo "  Permissions granted!"
    fi
fi
echo ""
echo "To verify, run:"
echo "  gcloud secrets list"
echo ""
echo "You can now run the deployment script:"
echo "  cd Backend && ./deploy.sh"
echo "=================================="
