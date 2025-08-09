# 🔐 AWS Permissions Fix Guide

This guide will help you resolve the IAM AccessDenied errors that occurred during Lambda deployment.

## 📋 Error Analysis

The deployment failed with "AccessDenied" errors, which means your AWS CLI user doesn't have sufficient permissions to:
1. Create IAM roles
2. Manage Lambda functions
3. Configure Lambda function URLs

## 🔧 Solution Steps

### Step 1: Check Current AWS Identity
First, verify which AWS user you're currently using:
```bash
aws sts get-caller-identity
```

### Step 2: Grant Required Permissions

You need to attach the following policies to your AWS CLI user:

1. **AWSLambdaFullAccess** - For Lambda function management
2. **IAMFullAccess** - For IAM role creation
3. **AmazonAPIGatewayAdministrator** - For function URL configuration

#### Option A: Using AWS Console (Recommended)

1. Go to the [IAM Console](https://console.aws.amazon.com/iam/)
2. Navigate to **Users** → **[your CLI user]**
3. Click **Permissions** tab
4. Click "Add permissions" → "Attach policies directly"
5. Search for and select each of these policies:
   - `AWSLambda_FullAccess`
   - `IAMFullAccess`
   - `AmazonAPIGatewayAdministrator`
6. Click "Add permissions"

#### Option B: Using AWS CLI

If you have admin access, you can attach policies directly:
```bash
# Replace YOUR_USER_NAME with your actual AWS CLI user name
aws iam attach-user-policy --user-name YOUR_USER_NAME --policy-arn arn:aws:iam::aws:policy/AWSLambda_FullAccess
aws iam attach-user-policy --user-name YOUR_USER_NAME --policy-arn arn:aws:iam::aws:policy/IAMFullAccess
aws iam attach-user-policy --user-name YOUR_USER_NAME --policy-arn arn:aws:iam::aws:policy/AmazonAPIGatewayAdministrator
```

### Step 3: Verify Permissions
After attaching policies, verify your permissions:
```bash
# Test IAM role creation permissions
aws iam get-role --role-name lambda-execution-role 2>/dev/null || echo "Role doesn't exist yet, but that's OK"

# Test Lambda permissions
aws lambda list-functions --max-items 1

# Test function URL permissions
aws lambda get-function-url-config --function-name sukull-youtube-transcript 2>/dev/null || echo "Function URL doesn't exist yet, but that's OK"
```

### Step 4: Redeploy Lambda Function
Once permissions are fixed, redeploy the Lambda function:
```bash
# Windows
cd aws-lambda-transcript
.\deploy.bat

# macOS/Linux
cd aws-lambda-transcript
chmod +x deploy.sh
./deploy.sh
```

## 🧪 Post-Deployment Verification

After successful deployment:

1. **Test the function directly**:
   ```bash
   curl "YOUR_NEW_LAMBDA_FUNCTION_URL?videoId=dQw4w9WgXcQ&lang=en"
   ```

2. **Run our test script**:
   ```bash
   node test_lambda_cors.js YOUR_NEW_LAMBDA_FUNCTION_URL
   ```

3. **Update your environment variables**:
   Add the new Function URL to your `.env.local` file:
   ```
   NEXT_PUBLIC_LAMBDA_TRANSCRIPT_URL=YOUR_NEW_FUNCTION_URL
   ```

4. **Restart your Next.js development server**:
   ```bash
   npm run dev
   ```

5. **Test the SubScribe game**:
   Visit http://localhost:3000/games/SubScribe and try fetching a transcript

## 🔍 Troubleshooting

If you continue to have permission issues:

1. **Use AdministratorAccess policy** (NOT recommended for production):
   This gives full access to all AWS services:
   ```bash
   aws iam attach-user-policy --user-name YOUR_USER_NAME --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
   ```

2. **Create a dedicated deployment user**:
   - In IAM Console, create a new user specifically for Lambda deployments
   - Attach the required policies to this user
   - Configure AWS CLI with this user's credentials

3. **Check your AWS region**:
   Ensure you're deploying to the same region you configured in AWS CLI:
   ```bash
   aws configure get region
   ```

## 🎯 Expected Outcome

After fixing permissions and redeploying:
- ✅ Lambda function deploys successfully
- ✅ Only one `Access-Control-Allow-Origin` header in responses
- ✅ No more CORS errors in SubScribe game
- ✅ YouTube transcripts fetch correctly via Lambda

## 🔐 Security Note

For production environments, follow the principle of least privilege:
- Create a custom policy with only the specific permissions needed
- Don't use `AdministratorAccess` or `IAMFullAccess` in production
- Consider using AWS roles instead of direct user policies

Your Lambda deployment should work after following these steps! 🚀
