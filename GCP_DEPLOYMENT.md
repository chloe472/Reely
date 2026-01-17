# 🚀 GCP Cloud Run Deployment Guide

Complete guide to deploy Reely on Google Cloud Platform using Cloud Run.

---

## 📋 Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed: https://cloud.google.com/sdk/docs/install
3. **Docker** installed (optional, Cloud Build handles this)
4. **GCP Project** created

---

## 🎯 Quick Start

### Step 1: Setup GCP Project

```bash
# Login to GCP
gcloud auth login

# Set your project ID
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"

# Set project
gcloud config set project $GCP_PROJECT_ID
```

### Step 2: Setup Secrets (Backend)

```bash
cd Backend
./setup-secrets.sh
```

This will prompt you for:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `MONGODB_URI` - Your MongoDB connection string
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Step 3: Deploy Backend

```bash
cd Backend
./deploy.sh
```

**Copy the backend URL** from the output (e.g., `https://reely-backend-xxxxx.run.app`)

### Step 4: Deploy Frontend

```bash
cd Frontend

# Set backend URL
export BACKEND_URL="https://reely-backend-xxxxx.run.app"

# Deploy
./deploy.sh
```

### Step 5: Post-Deployment Configuration

After deployment, you need to update:

1. **Backend CORS Settings**
   - Update `Backend/server.js` CORS origin to include frontend URL
   - Redeploy backend

2. **Supabase Configuration**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your frontend URL to "Redirect URLs"
   - Add: `https://reely-frontend-xxxxx.run.app/*`

3. **Google Maps API**
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Edit your API key restrictions
   - Add your frontend URL to "Application restrictions"

---

## 🔧 Manual Deployment Steps

### Backend Deployment (Manual)

```bash
cd Backend

# Set variables
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"

# Build image
gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/reely-backend

# Deploy to Cloud Run
gcloud run deploy reely-backend \
  --image gcr.io/$GCP_PROJECT_ID/reely-backend \
  --platform managed \
  --region $GCP_REGION \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --port 8080 \
  --update-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest,MONGODB_URI=MONGODB_URI:latest,SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_ANON_KEY=SUPABASE_ANON_KEY:latest"
```

### Frontend Deployment (Manual)

```bash
cd Frontend

# Build image
gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/reely-frontend

# Deploy to Cloud Run
gcloud run deploy reely-frontend \
  --image gcr.io/$GCP_PROJECT_ID/reely-frontend \
  --platform managed \
  --region $GCP_REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --port 8080
```

---

## 🔐 Managing Secrets

### Create a Secret

```bash
echo -n "your-secret-value" | gcloud secrets create SECRET_NAME --data-file=-
```

### Update a Secret

```bash
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=-
```

### List Secrets

```bash
gcloud secrets list
```

### View Secret Value

```bash
gcloud secrets versions access latest --secret="SECRET_NAME"
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# Backend logs
gcloud run services logs read reely-backend --region=$GCP_REGION

# Frontend logs
gcloud run services logs read reely-frontend --region=$GCP_REGION

# Follow logs in real-time
gcloud run services logs tail reely-backend --region=$GCP_REGION
```

### View Service Details

```bash
gcloud run services describe reely-backend --region=$GCP_REGION
```

### Monitor in Console

Visit: https://console.cloud.google.com/run

---

## 💰 Cost Optimization

Cloud Run pricing is based on:
- **Request count**
- **CPU/Memory usage**
- **Execution time**

### Free Tier (per month)
- 2 million requests
- 360,000 GB-seconds memory
- 180,000 vCPU-seconds

### Tips to Reduce Costs:
1. Set `--min-instances 0` (scale to zero when idle)
2. Set appropriate `--max-instances` to limit scaling
3. Use `--cpu 1` and `--memory 512Mi` for frontend
4. Use `--memory 1Gi` for backend (due to video processing)

---

## 🔄 Update/Redeploy

To update your deployment:

```bash
# Backend
cd Backend
./deploy.sh

# Frontend
cd Frontend
export BACKEND_URL="your-backend-url"
./deploy.sh
```

---

## 🐛 Troubleshooting

### Issue: Container fails to start

**Check logs:**
```bash
gcloud run services logs read reely-backend --region=$GCP_REGION --limit 50
```

**Common causes:**
- Missing environment variables/secrets
- Port not exposed correctly (must be 8080)
- Application crashes on startup

### Issue: Secrets not found

**Grant permissions:**
```bash
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Issue: Build fails

**Check build logs:**
```bash
gcloud builds list --limit=5
gcloud builds log [BUILD_ID]
```

### Issue: 503 Service Unavailable

- Check if service is deployed: `gcloud run services list`
- Check service health: `curl https://your-service-url/health`
- Increase timeout: Add `--timeout 300` to deploy command

---

## 🔗 Useful Commands

```bash
# List all services
gcloud run services list

# Delete a service
gcloud run services delete reely-backend --region=$GCP_REGION

# Get service URL
gcloud run services describe reely-backend --format='value(status.url)'

# Update environment variables
gcloud run services update reely-backend \
  --update-env-vars KEY=VALUE

# Scale service
gcloud run services update reely-backend \
  --min-instances=0 \
  --max-instances=10
```

---

## 📝 Environment Variables

### Backend

Secrets (via Secret Manager):
- `GEMINI_API_KEY` - Google Gemini API key
- `MONGODB_URI` - MongoDB connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon key

Environment Variables:
- `NODE_ENV=production`
- `PORT=8080` (automatically set by Cloud Run)

### Frontend

Build Arguments:
- `VITE_API_URL` - Backend URL
- `VITE_SUPABASE_URL` - Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `VITE_GOOGLE_MAPS_KEY` - Google Maps API key

---

## 🎉 Success Checklist

After deployment, verify:

- ✅ Backend is accessible: `curl https://reely-backend-xxx.run.app/health`
- ✅ Frontend loads in browser
- ✅ Google OAuth login works
- ✅ Image upload works
- ✅ Video processing works
- ✅ Leaderboard loads
- ✅ Maps and Street View work
- ✅ Collections feature works

---

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Container Registry](https://cloud.google.com/container-registry/docs)

---

## 🆘 Support

If you encounter issues:
1. Check the logs: `gcloud run services logs read SERVICE_NAME`
2. Verify secrets are set correctly
3. Ensure all APIs are enabled
4. Check IAM permissions
5. Review Cloud Run quotas and limits

---

**Made with ❤️ for Reely**
