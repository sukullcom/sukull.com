# Production Setup for sukull.com

## Architecture Overview

- **Frontend (Next.js)**: Deployed on Vercel at `https://sukull.com`
- **Payment Server**: Deployed on Railway at `https://your-app-name.railway.app`

## Step 1: Deploy Payment Server to Railway

1. **Create a new Railway project**:
   - Go to [railway.app](https://railway.app)
   - Create a new project
   - Connect your GitHub repository

2. **Configure Railway deployment**:
   - Railway will automatically detect the `railway.json` configuration
   - Set the start command to: `npm run payment-server:prod`

3. **Set Railway environment variables**:
   ```bash
   NODE_ENV=production
   PAYMENT_SERVER_PORT=3001
   DATABASE_URL=your_production_database_url
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Iyzico Configuration
   IYZICO_API_KEY=your_production_api_key
   IYZICO_SECRET_KEY=your_production_secret_key
   IYZICO_BASE_URL=https://api.iyzipay.com  # Remove 'sandbox-' for production
   ```

4. **Get your Railway URL**:
   - After deployment, Railway will give you a URL like: `https://your-app-name.railway.app`
   - Copy this URL for the next step

## Step 2: Configure Vercel Environment Variables

Set these environment variables in your Vercel dashboard:

```bash
# App URL
NEXT_PUBLIC_APP_URL=https://sukull.com

# Payment Server URL (use your Railway URL)
NEXT_PUBLIC_PAYMENT_SERVER_URL=https://your-app-name.railway.app

# Node Environment
NODE_ENV=production

# Your existing Supabase and other variables...
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# ... other variables
```

## Step 3: Update Code with Your Railway URL

Replace `https://your-railway-app.railway.app` in the following files with your actual Railway URL:

1. **components/credit-purchase.tsx** (line 112)
2. Update the fallback URL to your actual Railway deployment URL

## Alternative: Deploy Payment Server to Your Own VPS

If you prefer to host the payment server on your own server:

1. **Set up your server**:
   ```bash
   # Install Node.js and PM2
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   
   # Clone your repository
   git clone your-repo-url
   cd your-project
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   # Create .env file
   NODE_ENV=production
   PAYMENT_SERVER_PORT=3001
   # ... other variables
   ```

3. **Start with PM2**:
   ```bash
   pm2 start payment-server.js --name "payment-server"
   pm2 startup
   pm2 save
   ```

4. **Configure Nginx reverse proxy**:
   ```nginx
   server {
       listen 443 ssl;
       server_name sukull.com;
       
       location /api/payment/ {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## Changes Made for Production

1. **Railway Configuration**: Added `railway.json` for easy deployment
2. **CORS Configuration**: Updated to allow requests from `https://sukull.com`
3. **CSP Headers**: Updated to allow connections to `https://*.railway.app`
4. **Payment Server URL**: Uses Railway URL in production
5. **Separate Deployment**: Frontend on Vercel, Payment server on Railway

## Testing

1. **Health Check**: Visit `https://your-railway-app.railway.app/health`
2. **Payment Flow**: Test the complete payment process on sukull.com

## Troubleshooting

- **Connection Timeout**: Ensure Railway app is running and accessible
- **CORS Errors**: Check that Railway environment variables are set correctly
- **Payment Failures**: Check Railway logs for Iyzico API errors

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