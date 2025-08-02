# 🔧 Configuration Guide

## Environment Variables

After deploying your Lambda function, you'll get a Function URL. Add this to your main project's `.env.local` file:

```env
# AWS Lambda Function URL for YouTube transcript processing
# Get this URL after running the deployment script
NEXT_PUBLIC_LAMBDA_TRANSCRIPT_URL=https://your-unique-id.lambda-url.us-east-1.on.aws/
```

## How It Works

### Development (Local)
```env
# .env.local - no Lambda URL configured
# Uses local API: /api/youtube-transcript
```

### Production (Vercel + Lambda)
```env
# .env.local - Lambda URL configured  
NEXT_PUBLIC_LAMBDA_TRANSCRIPT_URL=https://your-function-url.lambda-url.us-east-1.on.aws/
# Uses AWS Lambda for transcript processing
```

## Deployment Steps

1. **Deploy Lambda**: Run `deploy.bat` (Windows) or `deploy.sh` (Mac/Linux)
2. **Copy Function URL**: From deployment output
3. **Update .env.local**: Add `NEXT_PUBLIC_LAMBDA_TRANSCRIPT_URL=...`
4. **Deploy to Vercel**: Your SubScribe game now works in production!

## Testing

### Local Testing
```bash
# Test local API
curl "http://localhost:3000/api/youtube-transcript?videoId=dQw4w9WgXcQ&lang=en"
```

### Lambda Testing  
```bash
# Test Lambda function
curl "https://your-function-url.lambda-url.us-east-1.on.aws/?videoId=dQw4w9WgXcQ&lang=en"
```

Both should return the same transcript data format.