# Production Setup for sukull.com

## Environment Variables for Production

When deploying to sukull.com, make sure to set these environment variables:

### Required Environment Variables

```bash
# App URL
NEXT_PUBLIC_APP_URL=https://sukull.com

# Payment Server URL
NEXT_PUBLIC_PAYMENT_SERVER_URL=https://sukull.com:3001

# Node Environment
NODE_ENV=production

# Payment Server Port (if different from default 3001)
PAYMENT_SERVER_PORT=3001
```

### Optional Environment Variables

If you want to override the automatic domain detection, you can set:

```bash
# Supabase URLs (if different from your current setup)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database URL (if different)
DATABASE_URL=your_production_database_url

# Iyzico Configuration (for production payments)
IYZICO_API_KEY=your_production_api_key
IYZICO_SECRET_KEY=your_production_secret_key
IYZICO_BASE_URL=https://api.iyzipay.com  # Remove 'sandbox-' for production
```

## Changes Made for Production

1. **CORS Configuration**: Updated to allow requests from `https://sukull.com`
2. **CSP Headers**: Updated to allow connections to `https://sukull.com:3001`
3. **Payment Server URL**: Automatically detects environment and uses appropriate URL
4. **Image Domains**: Added sukull.com to allowed image domains
5. **Server Logs**: Updated to show correct URLs based on environment

## Running in Production

The same command works for both development and production:

```bash
npm run dev:full
```

The system will automatically detect the environment and use the appropriate configurations:

- **Development**: Uses `http://localhost:3000` and `http://localhost:3001`
- **Production**: Uses `https://sukull.com` and `https://sukull.com:3001`

## SSL/HTTPS Considerations

Make sure your server supports HTTPS on port 3001 for the payment server, or configure a reverse proxy to handle SSL termination.

## Firewall/Security

Ensure port 3001 is open and accessible from your main domain for the payment server to work properly. 