#!/bin/bash

# Reely Frontend Deployment to GCP Cloud Run
# This script builds and deploys the frontend service

set -e  # Exit on error

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-your-gcp-project-id}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="reely-frontend"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
BACKEND_URL="${BACKEND_URL:-https://reely-backend-XXXXXXX.run.app}"

echo "==================================="
echo " Deploying Reely Frontend to GCP"
echo "==================================="
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"
echo "Backend URL: ${BACKEND_URL}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo " gcloud CLI not found. Please install it first:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo " Not logged in to gcloud. Please run: gcloud auth login"
    exit 1
fi

# Set project
echo " Setting GCP project..."
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo " Enabling required GCP APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build Docker image with build args
echo " Building Docker image..."
gcloud builds submit \
  --tag ${IMAGE_NAME} \
  --build-arg VITE_API_URL=${BACKEND_URL} \
  .

# Deploy to Cloud Run
echo " Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60 \
  --max-instances 10 \
  --min-instances 0 \
  --port 8080

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')

echo ""
echo "==================================="
echo " Frontend Deployment Complete!"
echo "==================================="
echo "Service URL: ${SERVICE_URL}"
echo ""
echo " Open your app: ${SERVICE_URL}"
echo ""
echo "️  IMPORTANT:"
echo "  1. Update CORS settings in backend to allow: ${SERVICE_URL}"
echo "  2. Update Supabase redirect URLs to include: ${SERVICE_URL}"
echo "  3. Update Google Maps API key restrictions to allow: ${SERVICE_URL}"
echo "==================================="
