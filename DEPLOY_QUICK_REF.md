# 🚀 Reely - Quick Deployment Reference

## One-Line Deployment

```bash
export GCP_PROJECT_ID="your-project-id" && cd Backend && ./setup-secrets.sh && cd .. && ./deploy-all.sh
```

## Individual Commands

### Setup (One Time)
```bash
# 1. Install gcloud CLI
curl https://sdk.cloud.google.com | bash

# 2. Login
gcloud auth login

# 3. Set project
gcloud config set project YOUR_PROJECT_ID

# 4. Setup secrets
cd Backend && ./setup-secrets.sh
```

### Deploy
```bash
# Deploy both (recommended)
./deploy-all.sh

# Or deploy individually
cd Backend && ./deploy.sh
cd Frontend && BACKEND_URL="https://xxx.run.app" ./deploy.sh
```

### Test Locally
```bash
docker-compose up --build
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
```

## Useful Commands

```bash
# View logs
gcloud run services logs read reely-backend --region=us-central1 --limit=50
gcloud run services logs tail reely-backend --region=us-central1

# List services
gcloud run services list

# Get service URL
gcloud run services describe reely-backend --format='value(status.url)'

# Update secrets
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=-

# Delete service
gcloud run services delete reely-backend --region=us-central1
```

## Post-Deployment Checklist

- [ ] Update backend CORS with frontend URL
- [ ] Add frontend URL to Supabase redirect URLs
- [ ] Add frontend URL to Google Maps API restrictions
- [ ] Test login functionality
- [ ] Test image upload
- [ ] Test video processing
- [ ] Verify leaderboard loads
- [ ] Check Street View works

## Troubleshooting

**Container won't start?**
- Check logs: `gcloud run services logs read reely-backend`
- Verify secrets are set: `gcloud secrets list`

**503 errors?**
- Increase timeout: Add `--timeout 300` to deploy command
- Check health endpoint: `curl https://your-service-url/health`

**Secrets not found?**
- Grant permissions: `gcloud projects add-iam-policy-binding $GCP_PROJECT_ID --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"`

## Environment Variables

**Backend (via Secret Manager):**
- GEMINI_API_KEY
- MONGODB_URI
- SUPABASE_URL
- SUPABASE_ANON_KEY

**Frontend (build args):**
- VITE_API_URL
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_GOOGLE_MAPS_KEY

## Cost Estimate

**Free Tier (per month):**
- 2M requests
- 360K GB-seconds memory
- 180K vCPU-seconds

**With scale-to-zero:** Likely stays in free tier for low/medium traffic!

## Support

📖 Full guide: `GCP_DEPLOYMENT.md`
🔗 Cloud Run docs: https://cloud.google.com/run/docs
💬 GCP Console: https://console.cloud.google.com/run
