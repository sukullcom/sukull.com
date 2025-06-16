# Deployment Checklist ✅

## Current Status
- ✅ Frontend deployed to Vercel (sukull.com)
- ❌ Payment server needs to be deployed to Railway

## Step-by-Step Checklist

### Phase 1: Deploy Payment Server to Railway
- [ ] 1. Go to [railway.app](https://railway.app) and create account
- [ ] 2. Create new project from GitHub repo
- [ ] 3. **CRITICAL**: Set these environment variables in Railway:
  ```bash
  # Required for server startup
  NODE_ENV=production
  PORT=3001
  
  # Database connection (use your existing production DB)
  DATABASE_URL=your_production_database_url
  
  # Supabase (same as your Vercel setup)
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  
  # Iyzico (for production payments)
  IYZICO_API_KEY=your_production_api_key
  IYZICO_SECRET_KEY=your_production_secret_key
  IYZICO_BASE_URL=https://api.iyzipay.com
  
  # CORS configuration (CRITICAL!)
  NEXT_PUBLIC_APP_URL=https://sukull.com
  ```
- [ ] 4. Wait for deployment to complete
- [ ] 5. Copy Railway URL (should be: `https://sukullcom-production.up.railway.app`)
- [ ] 6. Test health check: Visit `https://sukullcom-production.up.railway.app/health`

### Phase 2: Update Code with Railway URL
- [ ] 7. ✅ Code updated with Railway URL: `https://sukullcom-production.up.railway.app`
- [ ] 8. ✅ Push changes to GitHub (Railway will auto-redeploy)

### Phase 3: Update Vercel Environment Variables
- [ ] 9. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] 10. Add/Update: `NEXT_PUBLIC_PAYMENT_SERVER_URL=https://sukullcom-production.up.railway.app`
- [ ] 11. Redeploy Vercel project

### Phase 4: Test Everything
- [ ] 12. Visit sukull.com
- [ ] 13. Try to make a test payment
- [ ] 14. Check Railway logs if there are issues

## ⚠️ Railway Health Check Issues Fixed
- ✅ Server now binds to `0.0.0.0` (required for Railway)
- ✅ Uses `process.env.PORT` (Railway sets this automatically)
- ✅ Better error handling for missing environment variables
- ✅ Health check works even if some services are unavailable
- ✅ Increased health check timeout to 300 seconds

## 🚨 If Railway Health Check Still Fails

### Check Railway Logs:
1. Go to Railway Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Check the **Build Logs** and **Deploy Logs**
4. Look for these success messages:
   ```
   🚀 Payment server running on port 3001
   ✅ Supabase client initialized
   ✅ Database pool initialized
   ```

### Common Issues:
1. **Missing DATABASE_URL**: Server won't start without database connection
2. **Missing Supabase credentials**: Authentication will fail
3. **Port binding**: Make sure `PORT` environment variable is set
4. **Build failures**: Check if all dependencies are installed

### Test Health Endpoint:
The health endpoint should return:
```json
{
  "success": true,
  "message": "Payment server is running",
  "services": {
    "supabase": true,
    "database": true,
    "iyzico": true
  },
  "environment": "production"
}
```

## Quick Commands

```bash
# After updating Railway fixes:
git add .
git commit -m "Fix Railway deployment issues"
git push origin main
```

## Important URLs to Save
- **Frontend**: https://sukull.com
- **Payment Server**: https://sukullcom-production.up.railway.app
- **Health Check**: https://sukullcom-production.up.railway.app/health

## What You DON'T Need to Do
- ❌ Don't deploy the entire app to Railway
- ❌ Don't change your Vercel deployment
- ❌ Don't create a new database (use your existing one)
- ❌ Don't change your domain setup

## What You ARE Doing
- ✅ Keeping frontend on Vercel (sukull.com)
- ✅ Moving ONLY payment server to Railway
- ✅ Frontend will make API calls to Railway for payments
- ✅ Everything else stays the same 