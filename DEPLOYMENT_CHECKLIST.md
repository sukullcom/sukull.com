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
- [ ] 4. Wait for deployment to complete
- [ ] 5. Copy Railway URL (e.g., `https://sukull-payment-server-production.up.railway.app`)
- [ ] 6. Test health check: Visit `https://your-railway-url/health`

### Phase 2: Update Code with Railway URL
- [ ] 7. Update `components/credit-purchase.tsx` line 112 with your Railway URL
- [ ] 8. Commit and push changes to GitHub

### Phase 3: Update Vercel Environment Variables
- [ ] 9. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] 10. Add/Update: `NEXT_PUBLIC_PAYMENT_SERVER_URL=https://your-railway-url`
- [ ] 11. Redeploy Vercel project

### Phase 4: Test Everything
- [ ] 12. Visit sukull.com
- [ ] 13. Try to make a test payment
- [ ] 14. Check Railway logs if there are issues

## Quick Commands

```bash
# After updating Railway URL in code:
git add .
git commit -m "Update payment server URL for Railway"
git push origin main
```

## Important URLs to Save
- **Frontend**: https://sukull.com
- **Payment Server**: https://your-railway-url (fill this in after Railway deployment)
- **Health Check**: https://your-railway-url/health

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