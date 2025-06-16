# Production Setup for sukull.com

## ✅ SOLUTION IMPLEMENTED

The payment system has been converted to use Vercel API routes instead of a separate payment server. This means:

- ✅ No separate server deployment needed
- ✅ Everything runs on the same domain (sukull.com)
- ✅ No port 3001 issues
- ✅ Simplified deployment

## Environment Variables for Vercel

Set these environment variables in your Vercel dashboard:

```bash
# Node Environment
NODE_ENV=production

# Database
DATABASE_URL=your_production_database_url

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Iyzico Configuration
IYZICO_API_KEY=your_production_api_key
IYZICO_SECRET_KEY=your_production_secret_key
IYZICO_BASE_URL=https://api.iyzipay.com  # Remove 'sandbox-' for production
```

## Testing the Payment System

1. **Health Check**: Visit `https://sukull.com/api/payment/health`
   - Should return JSON with success: true

2. **Payment Test**: Try making a payment on your site
   - Uses the same test card: 5890 0400 0000 0016

## What Changed

1. **Payment Server → API Route**: Moved from `payment-server.js` to `app/api/payment/create/route.ts`
2. **URL Updated**: Changed from `https://sukull.com:3001/api/payment/create` to `/api/payment/create`
3. **No Separate Deployment**: Everything runs on Vercel now
4. **Simplified CSP**: Removed port 3001 references

## Files Modified

- ✅ `app/api/payment/create/route.ts` - New payment API route
- ✅ `app/api/payment/health/route.ts` - Health check endpoint
- ✅ `components/credit-purchase.tsx` - Updated to use API route
- ✅ `middleware.ts` - Removed port 3001 from CSP

## Old Files (No Longer Needed)

- `payment-server.js` - Can be deleted (kept for reference)
- Package.json scripts `payment-server` and `dev:full` - No longer needed

## Deployment

Just deploy to Vercel as normal:
```bash
git add .
git commit -m "Convert payment server to API route"
git push
```

Vercel will automatically deploy and the payment system will work! 🎉