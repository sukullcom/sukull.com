# Deployment Guide for Sukull.com - Hybrid Architecture

## Architecture Overview

Since Iyzico's SDK doesn't work properly in serverless environments like Vercel, we're using a **hybrid approach**:

- **Next.js App**: Deployed on Vercel (sukull.com)
- **Payment Server**: Deployed on Railway/Render (separate Node.js server)

## Part 1: Deploy Payment Server (Railway/Render)

### Option A: Railway Deployment (Recommended)

1. **Create Railway Account**: Go to [railway.app](https://railway.app)

2. **Create New Project**: Connect your GitHub repository

3. **Configure Environment Variables**:
   ```
   IYZICO_API_KEY=your_production_api_key
   IYZICO_SECRET_KEY=your_production_secret_key
   IYZICO_BASE_URL=https://api.iyzipay.com
   DATABASE_URL=your_production_database_url
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   PORT=3001
   NEXT_PUBLIC_APP_URL=https://sukull.com
   ```

4. **Deploy Settings**:
   - Start Command: `node payment-server.js`
   - Build Command: `npm install`
   - Health Check: `/health`

5. **Get Deployment URL**: Railway will provide a URL like `https://your-app.railway.app`

### Option B: Render Deployment

1. **Create Render Account**: Go to [render.com](https://render.com)

2. **Create Web Service**: Connect your GitHub repository

3. **Configure Settings**:
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node payment-server.js`
   - Port: `3001`

4. **Add Environment Variables** (same as Railway above)

5. **Deploy and Get URL**: Render will provide a URL like `https://your-app.onrender.com`

## Part 2: Deploy Next.js App (Vercel)

### 1. Vercel Deployment

1. **Connect Repository**: Connect your GitHub repo to Vercel

2. **Configure Environment Variables**:
   ```
   # Payment Server Configuration
   NEXT_PUBLIC_PAYMENT_SERVER_URL=https://your-payment-server.railway.app
   
   # Database Configuration
   DATABASE_URL=your_production_database_url
   
   # Authentication (Supabase)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=https://sukull.com
   NODE_ENV=production
   ```

3. **Domain Configuration**:
   - Add `sukull.com` and `www.sukull.com` in Vercel dashboard
   - Update DNS records to point to Vercel

## Part 3: Configure CORS

Update the payment server CORS configuration to allow requests from your production domain:

In `payment-server.js`, ensure CORS is configured for production:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'https://sukull.com',
    'https://www.sukull.com'
  ],
  credentials: true
}));
```

## Development Setup

### Local Development (2 servers)

1. **Start Next.js App**:
   ```bash
   npm run dev
   ```

2. **Start Payment Server** (separate terminal):
   ```bash
   npm run payment-server
   ```

3. **Or start both together**:
   ```bash
   npm run dev:full
   ```

### Environment Variables (.env.local)

```
# For local development
NEXT_PUBLIC_PAYMENT_SERVER_URL=http://localhost:3001

# Database
DATABASE_URL=your_local_database_url

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Iyzico (for payment server)
IYZICO_API_KEY=sandbox-qaeSUyqS2RrU6OvZcbtkd9BrIydQa8st
IYZICO_SECRET_KEY=sandbox-X3n0IAtXd8Nce2uP6zxVyUoPUD9CsWoM
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
```

## Production Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   sukull.com    │    │  Payment Server │
│   (Vercel)      │◄──►│  (Railway)      │
│   Next.js App   │    │  Node.js + SDK  │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│    Database     │    │     Iyzico     │
│   (Supabase)    │    │      API       │
└─────────────────┘    └─────────────────┘
```

## Benefits of This Approach

✅ **Iyzico SDK Compatibility**: Node.js server ensures full SDK functionality
✅ **Vercel Performance**: Next.js app benefits from Vercel's edge network
✅ **Scalability**: Both services can scale independently  
✅ **Security**: Payment logic isolated in dedicated server
✅ **Cost Effective**: Railway/Render affordable for payment server

## Testing Checklist

- [ ] Local development with both servers
- [ ] Payment server deployed and accessible
- [ ] Next.js app deployed on Vercel
- [ ] Environment variables configured
- [ ] CORS configured properly
- [ ] Domain DNS configured
- [ ] Test payments in production
- [ ] Monitor both services

## Monitoring URLs

- **Main App**: https://sukull.com
- **Payment Server Health**: https://your-payment-server.railway.app/health
- **Vercel Dashboard**: Track Next.js app performance
- **Railway/Render Dashboard**: Monitor payment server

This hybrid approach ensures **reliable payment processing** while maintaining **optimal performance** for your main application! 🚀 