# Deployment Checklist ✅

## Current Status
- ✅ Frontend deployed to Vercel (sukull.com)
- ✅ Payment server deployed to Railway (but CORS still needs fixing)

## Step-by-Step Checklist

### Phase 1: Deploy Payment Server to Railway
- [x] 1. Go to [railway.app](https://railway.app) and create account
- [x] 2. Create new project from GitHub repo
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
  ```
- [x] 4. Wait for deployment to complete
- [x] 5. Copy Railway URL (should be: `https://sukullcom-production.up.railway.app`)
- [ ] 6. Test health check: Visit `https://sukullcom-production.up.railway.app/health`

### Phase 2: Update Code with Railway URL
- [x] 7. ✅ Code updated with Railway URL: `https://sukullcom-production.up.railway.app`
- [x] 8. ✅ Push CORS fixes to GitHub (Railway will auto-redeploy)

### Phase 3: Update Vercel Environment Variables
- [ ] 9. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] 10. Add/Update: `NEXT_PUBLIC_PAYMENT_SERVER_URL=https://sukullcom-production.up.railway.app`
- [ ] 11. Redeploy Vercel project

### Phase 4: Test Everything
- [ ] 12. Visit sukull.com
- [ ] 13. Try to make a test payment
- [ ] 14. Check Railway logs if there are issues

## ⚠️ CORS Issues Fixed (Latest Update)
- ✅ Simplified CORS configuration with explicit origin list
- ✅ Added explicit CORS headers middleware
- ✅ Improved preflight request handling
- ✅ Added server stability improvements
- ✅ Better error handling and logging

## 🚨 Current Issue: Railway Server Not Responding

The Railway deployment shows as successful, but the server returns 502 errors. This is likely due to:

### Most Likely Causes:
1. **Missing Environment Variables** - Server can't start without DATABASE_URL
2. **Database Connection Issues** - Can't connect to production database
3. **Port Configuration** - Railway might be using a different port

### Immediate Actions Needed:

1. **Check Railway Environment Variables**:
   - Go to Railway Dashboard → Variables
   - Ensure all required variables are set (especially DATABASE_URL)

2. **Check Railway Logs**:
   - Go to Railway Dashboard → Deployments → Latest → Logs
   - Look for startup messages or error messages

3. **Test Health Endpoint**:
   - Try: `https://sukullcom-production.up.railway.app/health`
   - Should return JSON with server status

## Quick Commands

```bash
# Push the latest CORS fixes:
git push origin main
```

## Important URLs to Save
- **Frontend**: https://sukull.com
- **Payment Server**: https://sukullcom-production.up.railway.app
- **Health Check**: https://sukullcom-production.up.railway.app/health (currently returning 502)

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

## Next Steps
1. **Push the CORS fixes**: `git push origin main`
2. **Check Railway environment variables** (especially DATABASE_URL)
3. **Check Railway deployment logs** for error messages
4. **Test health endpoint** once server is responding 