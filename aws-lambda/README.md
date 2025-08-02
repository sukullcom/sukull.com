# AWS Lambda YouTube Transcript Extractor

This AWS Lambda function extracts YouTube video transcripts using `yt-dlp` for the SubScribe game.

## Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   # Install AWS CLI
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   
   # Configure AWS CLI
   aws configure
   ```

2. **Python 3.9+ and pip installed**
   ```bash
   python3 --version
   pip --version
   ```

## Deployment Steps

### Step 1: Deploy to AWS Lambda

```bash
cd aws-lambda
./deploy.sh
```

This script will:
- Create IAM role for Lambda
- Package the function with dependencies
- Deploy to AWS Lambda
- Set up Function URL with CORS
- Test the deployment

### Step 2: Note the Function URL

After deployment, you'll see output like:
```
🔗 Add this URL to your Vercel environment variables:
   YOUTUBE_TRANSCRIPT_LAMBDA_URL=https://abc123.lambda-url.us-east-1.on.aws/
```

### Step 3: Add Environment Variable to Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Name**: `YOUTUBE_TRANSCRIPT_LAMBDA_URL`
   - **Value**: The Function URL from Step 2
   - **Environment**: Production, Preview, Development

### Step 4: Deploy to Vercel

The Vercel app will automatically use the Lambda function once the environment variable is set.

## Testing

### Test Lambda Function Directly
```bash
curl "https://your-function-url.lambda-url.us-east-1.on.aws/?videoId=dQw4w9WgXcQ&lang=en"
```

### Test Through Vercel
Your SubScribe game will automatically use the Lambda function for any YouTube video.

## Architecture

```
User Request → Vercel (Next.js) → AWS Lambda (yt-dlp) → Response
```

## Cost Estimation

AWS Lambda Free Tier:
- 1M requests per month: FREE
- First 400,000 GB-seconds: FREE

Expected monthly cost for moderate usage: **$0-5**

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure AWS CLI is configured with proper permissions
   - IAM user needs Lambda, IAM, and CloudWatch permissions

2. **Function Timeout**
   - Function timeout is set to 60 seconds
   - Large videos may take longer to process

3. **No Transcript Found**
   - Video may not have auto-generated captions
   - Try with a popular video that definitely has captions

### Debug Commands

```bash
# Check function logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/youtube-transcript-extractor

# Test function directly
aws lambda invoke --function-name youtube-transcript-extractor --payload '{"videoId":"dQw4w9WgXcQ"}' response.json
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `YOUTUBE_TRANSCRIPT_LAMBDA_URL` | AWS Lambda Function URL | Yes |

## Function Details

- **Runtime**: Python 3.9
- **Memory**: 1024 MB
- **Timeout**: 60 seconds
- **Dependencies**: yt-dlp
- **CORS**: Enabled for all origins