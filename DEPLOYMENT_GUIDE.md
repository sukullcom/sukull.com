# Complete Deployment Guide for sukull.com

## Architecture Overview

```
┌─────────────────┐    API Calls    ┌──────────────────┐
│   Vercel        │ ──────────────► │    Railway       │
│   (Frontend)    │                 │ (Payment Server) │
│ sukull.com      │                 │ your-app.railway │
└─────────────────┘                 └──────────────────┘
```

## Part 1: Deploy Payment Server to Railway

### 1.1 Create Railway Account & Project

1. **Go to [railway.app](https://railway.app)**
2. **Sign up/Login** with GitHub
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your sukull.com repository**

### 1.2 Configure Railway Project

Railway will automatically detect your project. You need to:

1. **Set the Start Command**:
   - In Railway dashboard, go to **Settings** → **Deploy**
   - Set **Start Command**: `npm run payment-server:prod`
   - Or Railway will auto-detect from `railway.json`

2. **Set Environment Variables**:
   Go to **Variables** tab and add:

   ```bash
   NODE_ENV=production
   PAYMENT_SERVER_PORT=3001
   
   # Database (use your existing production DB)
   DATABASE_URL=your_production_database_url
   
   # Supabase (same as your Vercel setup)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Iyzico (for production payments)
   IYZICO_API_KEY=your_production_api_key
   IYZICO_SECRET_KEY=your_production_secret_key
   IYZICO_BASE_URL=https://api.iyzipay.com
   ```

3. **Deploy**:
   - Railway will automatically deploy
   - Wait for deployment to complete
   - You'll get a URL like: `https://sukull-payment-server-production.up.railway.app`

### 1.3 Test Railway Deployment

1. **Health Check**: Visit `https://your-railway-url/health`
2. **Should return**: 
   ```json
   {
     "success": true,
     "message": "Payment server is running",
     "timestamp": "2024-01-01T00:00:00.000Z",
     "iyzico": {
       "configured": true,
       "environment": "https://api.iyzipay.com"
     }
   }
   ```

## Part 2: Update Your Code with Railway URL

### 2.1 Update Payment Server URL

You need to replace the placeholder URL with your actual Railway URL:

**File: `components/credit-purchase.tsx`** (around line 112)

```typescript
// Replace this line:
(process.env.NODE_ENV === 'production' ? 'https://your-railway-app.railway.app' : 'http://localhost:3001')

// With your actual Railway URL:
(process.env.NODE_ENV === 'production' ? 'https://sukull-payment-server-production.up.railway.app' : 'http://localhost:3001')
```

### 2.2 Commit and Push Changes

```bash
git add .
git commit -m "Update payment server URL for Railway deployment"
git push origin main
```

## Part 3: Configure Vercel Environment Variables

### 3.1 Add Railway URL to Vercel

1. **Go to Vercel Dashboard**
2. **Select your sukull.com project**
3. **Go to Settings → Environment Variables**
4. **Add/Update these variables**:

   ```bash
   # Payment Server URL (your Railway URL)
   NEXT_PUBLIC_PAYMENT_SERVER_URL=https://sukull-payment-server-production.up.railway.app
   
   # App URL (should already exist)
   NEXT_PUBLIC_APP_URL=https://sukull.com
   
   # Node Environment
   NODE_ENV=production
   
   # Keep all your existing Supabase variables...
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   # ... etc
   ```

### 3.2 Redeploy Vercel

1. **Go to Deployments tab**
2. **Click "Redeploy" on latest deployment**
3. **Or push a new commit to trigger auto-deployment**

## Part 4: File Structure Explanation

Your repository contains BOTH applications, but they deploy separately:

```
sukull.com/
├── app/                    # Next.js app (deploys to Vercel)
├── components/             # Next.js components (deploys to Vercel)
├── lib/                    # Next.js utilities (deploys to Vercel)
├── payment-server.js       # Express server (deploys to Railway)
├── railway.json           # Railway config (Railway only)
├── package.json           # Contains scripts for both
├── next.config.js         # Next.js config (Vercel only)
└── vercel.json           # Vercel config (Vercel only)
```

## Part 5: How It Works in Production

### 5.1 User Flow

1. **User visits** `https://sukull.com` (Vercel)
2. **User clicks "Pay"** button
3. **Frontend makes API call** to `https://your-railway-url/api/payment/create`
4. **Railway processes payment** with Iyzico
5. **Railway returns result** to frontend
6. **Frontend shows success/error** message

### 5.2 Communication Flow

```
User Browser
    ↓ (visits)
Vercel (sukull.com)
    ↓ (API call)
Railway (payment server)
    ↓ (payment processing)
Iyzico API
    ↓ (result)
Railway
    ↓ (response)
Vercel
    ↓ (display result)
User Browser
```

## Part 6: Development vs Production

### Development (localhost)
```bash
npm run dev:full
# Runs both:
# - Next.js on http://localhost:3000
# - Payment server on http://localhost:3001
```

### Production
```bash
# Vercel automatically runs: npm run build && npm start
# Railway automatically runs: npm run payment-server:prod
```

## Part 7: Troubleshooting

### Common Issues:

1. **"Connection Timeout"**:
   - Check Railway deployment status
   - Verify Railway URL is correct in Vercel env vars

2. **"CORS Error"**:
   - Ensure `NEXT_PUBLIC_APP_URL=https://sukull.com` is set in Railway
   - Check Railway logs for CORS issues

3. **"Payment Failed"**:
   - Check Iyzico credentials in Railway
   - Verify database connection in Railway

### Checking Logs:

1. **Railway Logs**: Railway Dashboard → Deployments → View Logs
2. **Vercel Logs**: Vercel Dashboard → Functions → View Logs

## Part 8: Cost Considerations

- **Vercel**: Free tier should be sufficient for frontend
- **Railway**: $5/month for hobby plan (includes database)
- **Total**: ~$5/month for production deployment

## Part 9: Security Notes

- Payment server runs on separate domain (more secure)
- Environment variables are isolated between services
- Database credentials only on Railway (not exposed to frontend)

This architecture is production-ready and follows industry best practices! 