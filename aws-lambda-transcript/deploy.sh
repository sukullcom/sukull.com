#!/bin/bash

# AWS Lambda Deployment Script for YouTube Transcript Function
# This script creates and deploys the Lambda function with yt-dlp binary

echo "🚀 Deploying YouTube Transcript Lambda Function..."

# Function configuration
FUNCTION_NAME="sukull-youtube-transcript"
RUNTIME="nodejs18.x"
HANDLER="index.handler"
ROLE_NAME="lambda-execution-role"

# Create IAM role if it doesn't exist
echo "📝 Checking IAM role..."
if ! aws iam get-role --role-name $ROLE_NAME &>/dev/null; then
    echo "Creating IAM role: $ROLE_NAME"
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document '{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }'
    
    # Attach basic execution policy
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    
    echo "⏳ Waiting for role to be available..."
    sleep 10
fi

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
echo "✅ Using role: $ROLE_ARN"

# Download yt-dlp binary for Lambda
echo "📥 Downloading yt-dlp binary..."
if [ ! -f "yt-dlp" ]; then
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp
    chmod +x yt-dlp
    echo "✅ yt-dlp downloaded"
else
    echo "✅ yt-dlp already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create deployment package
echo "📦 Creating deployment package..."
zip -r lambda-package.zip . -x "*.zip" "deploy.sh" "README.md" ".git/*" "node_modules/.cache/*"

# Check if function exists
echo "🔍 Checking if function exists..."
if aws lambda get-function --function-name $FUNCTION_NAME &>/dev/null; then
    echo "📝 Updating existing function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://lambda-package.zip
    
    # Update configuration
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout 30 \
        --memory-size 1024
else
    echo "🆕 Creating new function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://lambda-package.zip \
        --timeout 30 \
        --memory-size 1024 \
        --description "YouTube transcript extraction using yt-dlp for SubScribe game"
fi

# Create or update function URL
echo "🌐 Setting up Function URL..."
aws lambda create-function-url-config --function-name $FUNCTION_NAME --auth-type NONE 2>/dev/null || \
aws lambda update-function-url-config --function-name $FUNCTION_NAME --auth-type NONE

# Get function URL
FUNCTION_URL=$(aws lambda get-function-url-config --function-name $FUNCTION_NAME --query 'FunctionUrl' --output text)

echo ""
echo "🎉 Deployment complete!"
echo "📍 Function URL: $FUNCTION_URL"
echo ""
echo "🧪 Test your function:"
echo "curl \"${FUNCTION_URL}?videoId=dQw4w9WgXcQ&lang=en\""
echo ""
echo "🔧 Next steps:"
echo "1. Update your SubScribe game to use this URL"
echo "2. Replace LAMBDA_FUNCTION_URL in your environment variables"
echo ""