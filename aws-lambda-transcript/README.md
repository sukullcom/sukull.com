# 🎬 YouTube Transcript AWS Lambda Function

This AWS Lambda function solves Vercel's binary execution limitation by providing YouTube transcript extraction using `yt-dlp` in AWS Lambda for your SubScribe game.

## 🎯 Why This Solution?

- **✅ Vercel Problem**: Vercel doesn't support binary execution (`yt-dlp`)
- **✅ AWS Lambda Solution**: Full Linux environment with binary support
- **✅ Cost-Effective**: Pay only for usage (very cheap for transcript calls)
- **✅ Reliable**: Better than external APIs for YouTube transcript extraction

## 🚀 Quick Setup

### Prerequisites

1. **AWS Account** (free tier eligible)
2. **AWS CLI installed** 
3. **Node.js 18+**

### Step 1: Install AWS CLI

#### Windows:
```bash
# Download and install from: https://aws.amazon.com/cli/
# Or use chocolatey:
choco install awscli
```

#### macOS:
```bash
brew install awscli
```

#### Linux:
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Step 2: Configure AWS CLI

```bash
aws configure
```

Enter your AWS credentials:
- **AWS Access Key ID**: (from AWS IAM)
- **AWS Secret Access Key**: (from AWS IAM)
- **Default region**: `us-east-1` (recommended)
- **Output format**: `json`

### Step 3: Deploy Lambda Function

#### Windows:
```bash
cd aws-lambda-transcript
.\deploy.bat
```

#### macOS/Linux:
```bash
cd aws-lambda-transcript
chmod +x deploy.sh
./deploy.sh
```

### Step 4: Update Your SubScribe Game

After deployment, you'll get a Function URL like:
```
https://abcd1234.lambda-url.us-east-1.on.aws/
```

Add this to your `.env.local`:
```env
NEXT_PUBLIC_LAMBDA_TRANSCRIPT_URL=https://your-function-url.lambda-url.us-east-1.on.aws/
```

## 🔧 AWS Account Setup (If You Don't Have One)

### 1. Create AWS Account

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Follow the signup process (requires credit card but free tier is free)

### 2. Create IAM User for CLI

1. **Go to IAM Console**: https://console.aws.amazon.com/iam/
2. **Users** → **Create User**
3. **Username**: `lambda-deployer`
4. **Attach Policies Directly**:
   - `AWSLambdaFullAccess`
   - `IAMFullAccess` (for role creation)
5. **Create User**
6. **Security Credentials** → **Create Access Key**
7. **Use Case**: Command Line Interface (CLI)
8. **Copy Access Key ID and Secret Access Key**

### 3. Configure AWS CLI
```bash
aws configure
# Enter your Access Key ID and Secret Access Key
```

## 📝 How It Works

1. **Client Request**: SubScribe game calls Lambda URL
2. **Lambda Process**: Downloads yt-dlp binary and extracts transcript
3. **Response**: Returns transcript data in same format as local API

## 🧪 Testing

After deployment, test your function:

```bash
# Test with a YouTube video
curl "https://your-function-url.lambda-url.us-east-1.on.aws/?videoId=dQw4w9WgXcQ&lang=en"
```

Expected response:
```json
{
  "transcript": [...],
  "language": "en",
  "isAutomatic": true,
  "totalLines": 42,
  "duration": 212,
  "videoTitle": "Rick Astley - Never Gonna Give You Up"
}
```

## 💰 Cost Estimate

AWS Lambda pricing (very affordable):
- **Free Tier**: 1M requests/month + 400K GB-seconds compute
- **After Free Tier**: ~$0.0000002 per request
- **Example**: 10,000 transcript requests = ~$2/month

## 🔄 Integration with SubScribe Game

Update your SubScribe game files to use Lambda:

```typescript
// In your SubScribe game component
const transcriptUrl = process.env.NEXT_PUBLIC_LAMBDA_TRANSCRIPT_URL || '/api/youtube-transcript';

const response = await fetch(`${transcriptUrl}?videoId=${videoId}&lang=en`);
```

## 🐛 Troubleshooting

### AWS CLI Not Found
```bash
# Install AWS CLI first
# Windows: https://aws.amazon.com/cli/
# macOS: brew install awscli
# Linux: snap install aws-cli --classic
```

### Permission Denied
```bash
# Check your AWS credentials
aws sts get-caller-identity

# If error, reconfigure:
aws configure
```

### Function Not Working
```bash
# Check Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/sukull-youtube-transcript"

# View recent logs
aws logs tail /aws/lambda/sukull-youtube-transcript --follow
```

### CORS Issues
The function includes CORS headers. If you still have issues:
1. Check your request includes proper headers
2. Verify the Function URL CORS configuration in AWS Console

## 🔄 Updating the Function

To update after making changes:

```bash
# Windows
.\deploy.bat

# macOS/Linux  
./deploy.sh
```

## 📊 Monitoring

View function metrics in AWS Console:
1. Go to [Lambda Console](https://console.aws.amazon.com/lambda/)
2. Click your function: `sukull-youtube-transcript`
3. **Monitoring** tab shows invocations, duration, errors

## 🗑️ Cleanup (If Needed)

To remove everything:

```bash
# Delete function
aws lambda delete-function --function-name sukull-youtube-transcript

# Delete IAM role
aws iam detach-role-policy --role-name lambda-execution-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name lambda-execution-role
```

## 🎯 Summary

After setup, your SubScribe game will:
- ✅ Work perfectly in production (no Vercel limitations)
- ✅ Use reliable AWS Lambda for transcript extraction
- ✅ Cost almost nothing (free tier covers most usage)
- ✅ Have the same exact API interface as your local version

Your YouTube transcript functionality is now production-ready! 🎉