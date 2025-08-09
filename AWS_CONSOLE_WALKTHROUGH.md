# 🖥️ AWS Console Walkthrough Guide for IAM Policy Attachment

This guide provides step-by-step instructions for attaching the required IAM policies to your AWS user through the AWS Management Console web interface. This is necessary because your AWS CLI user currently lacks permissions to deploy the Lambda function.

## 🎯 Objective
Attach these three policies to your AWS user (recipe):
1. `AWSLambda_FullAccess`
2. `IAMFullAccess`
3. `AmazonAPIGatewayAdministrator`

## 📝 Step-by-Step Instructions

### Step 1: Access AWS IAM Console
1. Open your web browser and go to [AWS Console](https://aws.amazon.com/console/)
2. Sign in with your AWS credentials
3. Navigate to IAM service:
   - You can either search for "IAM" in the services search bar
   - Or go directly to: https://console.aws.amazon.com/iamv2/home

### Step 2: Navigate to Users
1. In the left sidebar, click on **Users**
2. You should see a list of IAM users
3. Find and click on your user named **recipe**

### Step 3: Access Permissions Tab
1. After clicking on your user, you'll see several tabs
2. Click on the **Permissions** tab

### Step 4: Add Permissions
1. Click the **Add permissions** button
2. Select **Attach policies directly** from the dropdown menu

### Step 5: Search and Attach Policies
For each policy, follow these steps:

#### Policy 1: AWSLambda_FullAccess
1. In the search box, type: `AWSLambda_FullAccess`
2. Check the box next to the policy in the search results
3. Click **Next: Review**

#### Policy 2: IAMFullAccess
1. Go back to the permissions page (click "Add permissions" again)
2. In the search box, type: `IAMFullAccess`
3. Check the box next to the policy in the search results
4. Click **Next: Review**

#### Policy 3: AmazonAPIGatewayAdministrator
1. Go back to the permissions page (click "Add permissions" again)
2. In the search box, type: `AmazonAPIGatewayAdministrator`
3. Check the box next to the policy in the search results
4. Click **Next: Review**

### Step 6: Review and Confirm
1. Review the policies you're attaching
2. Click **Add permissions** to confirm

### Step 7: Verify Permissions
1. After attaching all policies, refresh the **Permissions** tab
2. You should see the three policies listed in your user's permissions:
   - AWSLambda_FullAccess
   - IAMFullAccess
   - AmazonAPIGatewayAdministrator

## 🧪 Test Your Permissions

After attaching the policies, test if your permissions are working:

### Option 1: Test via AWS CLI (if you want to verify)
Run these commands in your terminal:
```bash
# Test IAM role creation permissions
aws iam get-role --role-name lambda-execution-role 2>/dev/null || echo "Role doesn't exist yet, but that's OK"

# Test Lambda permissions
aws lambda list-functions --max-items 1

# Test function URL permissions
aws lambda get-function-url-config --function-name sukull-youtube-transcript 2>/dev/null || echo "Function URL doesn't exist yet, but that's OK"
```

### Option 2: Test via AWS Console
1. Go to the Lambda service in AWS Console
2. Check if you can view existing functions
3. Check if you can create new functions

## 🚀 Proceed with Lambda Deployment

Once permissions are fixed, you can proceed with deploying the Lambda function:

1. Go back to your terminal/command prompt
2. Navigate to the Lambda directory:
   ```bash
   cd c:\src\FlutterProjects\sukull.com\aws-lambda-transcript
   ```
3. Run the deployment script:
   ```bash
   .\deploy.bat
   ```

## 📋 Common Issues and Solutions

### Issue: Policy Not Found in Search
- Make sure you're typing the exact policy name
- Try searching with partial names if the full name doesn't work

### Issue: "Add permissions" Button Not Working
- Ensure you have the right permissions to modify user policies
- Try refreshing the page

### Issue: AccessDenied After Attaching Policies
- Wait a few minutes for policies to propagate
- Log out and log back into AWS Console
- Ensure all three policies are attached

## 🔐 Security Note

For production environments, it's recommended to use more granular permissions instead of full access policies. However, for development and deployment purposes, these full access policies will allow you to successfully deploy and manage your Lambda function.

## 🎉 Success Criteria

After completing this walkthrough, you should be able to:
1. Run the Lambda deployment script without AccessDenied errors
2. Successfully create or update the Lambda function
3. Access the Lambda function URL configuration
4. Deploy the function with the correct CORS settings

Your AWS user now has the necessary permissions to deploy the YouTube transcript Lambda function!
