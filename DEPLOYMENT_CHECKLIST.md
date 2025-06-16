# Deployment Checklist ✅

## Current Status
- ✅ Frontend deployed to Vercel (sukull.com)
- ❌ Payment server needs to be deployed to Railway

## Step-by-Step Checklist

### Phase 1: Deploy Payment Server to Railway
- [ ] 1. Go to [railway.app](https://railway.app) and create account
- [ ] 2. Create new project from GitHub repo
- [ ] 3. Set environment variables in Railway:
  - [ ] `NODE_ENV=production`
  - [ ] `DATABASE_URL=your_db_url`
  - [ ] `NEXT_PUBLIC_SUPABASE_URL=your_supabase_url`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY=your_service_key`
  - [ ] `IYZICO_API_KEY=your_api_key`
  - [ ] `IYZICO_SECRET_KEY=your_secret_key`
  - [ ] `IYZICO_BASE_URL=https://api.iyzipay.com`
  - [ ] `NEXT_PUBLIC_APP_URL=https://sukull.com` (Important for CORS!)
- [ ] 4. Wait for deployment to complete
- [ ] 5. Copy Railway URL (should be: `https://sukullcom-production.up.railway.app`)
- [ ] 6. Test health check: Visit `https://sukullcom-production.up.railway.app/health`

### Phase 2: Update Code with Railway URL
- [ ] 7. ✅ Code updated with Railway URL: `https://sukullcom-production.up.railway.app`
- [ ] 8. Commit and push changes to GitHub

### Phase 3: Update Vercel Environment Variables
- [ ] 9. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] 10. Add/Update: `NEXT_PUBLIC_PAYMENT_SERVER_URL=https://sukullcom-production.up.railway.app`
- [ ] 11. Redeploy Vercel project

### Phase 4: Test Everything
- [ ] 12. Visit sukull.com
- [ ] 13. Try to make a test payment
- [ ] 14. Check Railway logs if there are issues

## ⚠️ Current Issues Fixed
- ✅ Fixed double slash in URL (`//api/payment/create` → `/api/payment/create`)
- ✅ Updated CORS configuration to explicitly allow sukull.com
- ✅ Added preflight request handler for OPTIONS requests

## Quick Commands

```bash
# After updating Railway URL in code:
git add .
git commit -m "Fix CORS and URL issues for Railway deployment"
git push origin main
```

## Important URLs to Save
- **Frontend**: https://sukull.com
- **Payment Server**: https://sukullcom-production.up.railway.app
- **Health Check**: https://sukullcom-production.up.railway.app/health

## Troubleshooting CORS Issues
If you still get CORS errors:

1. **Check Railway Environment Variables**:
   - Make sure `NEXT_PUBLIC_APP_URL=https://sukull.com` is set in Railway
   
2. **Check Railway Logs**:
   - Look for "CORS check" messages in Railway logs
   - Should show: `CORS check - Origin: https://sukull.com Allowed: [...]`

3. **Test Health Endpoint**:
   - Visit: https://sukullcom-production.up.railway.app/health
   - Should return JSON with server status

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