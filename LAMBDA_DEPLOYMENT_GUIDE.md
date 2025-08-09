# 🎯 Lambda Function Redeployment Guide

This guide will help you redeploy the AWS Lambda function for the SubScribe game to fix the CORS issues.

## 🔧 Prerequisites

Before redeploying, ensure you have:
1. AWS CLI installed and configured
2. An AWS account with appropriate permissions
3. The changes we made to the deployment scripts (deploy.bat and deploy.sh)

## 🔄 Redeployment Steps

### For Windows:
```bash
cd aws-lambda-transcript
.\deploy.bat
```

### For macOS/Linux:
```bash
cd aws-lambda-transcript
chmod +x deploy.sh
./deploy.sh
```

## 📋 What This Will Do

1. **Update the Lambda function code** with the latest version
2. **Remove the duplicate CORS configuration** from the Function URL
3. **Preserve all other settings** (timeout, memory, etc.)

## ✅ Verification After Deployment

After redeployment, test the function with:
```bash
curl "YOUR_LAMBDA_FUNCTION_URL?videoId=dQw4w9WgXcQ&lang=en"
```

Check the response headers to ensure there's only one `Access-Control-Allow-Origin` header.

## 🧪 Testing the SubScribe Game

1. Copy the Function URL from the deployment output
2. Update your `.env.local` file with:
   ```
   NEXT_PUBLIC_LAMBDA_TRANSCRIPT_URL=YOUR_NEW_FUNCTION_URL
   ```
3. Restart your Next.js development server
4. Test the SubScribe game at http://localhost:3000/games/SubScribe

## 🔍 Troubleshooting

If you still encounter issues:

1. **Check AWS Console**:
   - Go to AWS Lambda Console
   - Select your function
   - Go to "Function URL" tab
   - Verify CORS settings are minimal or absent

2. **Verify Headers**:
   ```bash
   curl -H "Origin: http://localhost:3000" -v YOUR_LAMBDA_FUNCTION_URL?videoId=dQw4w9WgXcQ
   ```
   Look for duplicate `Access-Control-Allow-Origin` headers in the response.

3. **CloudWatch Logs**:
   - Check AWS CloudWatch logs for any 500 errors
   - Look for timeout or memory issues

## 🎉 Expected Outcome

After redeployment:
- CORS errors should be resolved
- Only one `Access-Control-Allow-Origin` header should be present
- The SubScribe game should successfully fetch YouTube transcripts
- 500 errors (if related to CORS) should be eliminated

Your YouTube transcript functionality will be production-ready! 🚀
