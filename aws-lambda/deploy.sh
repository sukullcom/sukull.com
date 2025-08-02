#!/bin/bash

# AWS Lambda Deployment Script for YouTube Transcript Service
# Prerequisites: AWS CLI configured with appropriate permissions

set -e

FUNCTION_NAME="youtube-transcript-extractor"
REGION="us-east-1"  # Change this to your preferred region
ROLE_NAME="lambda-youtube-transcript-role"
ZIP_FILE="lambda-deployment.zip"

echo "🚀 Starting AWS Lambda deployment for YouTube Transcript Extractor"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI is configured"

# Create IAM role for Lambda (if it doesn't exist)
echo "📋 Creating/checking IAM role..."

TRUST_POLICY='{
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

# Create role (ignore error if it already exists)
aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document "$TRUST_POLICY" \
    --description "Role for YouTube transcript extraction Lambda" 2>/dev/null || echo "Role already exists"

# Attach basic Lambda execution policy
aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole 2>/dev/null || echo "Policy already attached"

echo "✅ IAM role configured"

# Get the role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
echo "📝 Role ARN: $ROLE_ARN"

# Create deployment package
echo "📦 Creating deployment package..."

# Clean up previous package
rm -f $ZIP_FILE

# Install Python dependencies in a temporary directory
TEMP_DIR=$(mktemp -d)
pip install -r requirements.txt -t $TEMP_DIR

# Copy Lambda function
cp lambda_function.py $TEMP_DIR/

# Create ZIP file
cd $TEMP_DIR
zip -r ../$ZIP_FILE .
cd ..
mv $ZIP_FILE $(dirname $0)/

# Clean up temp directory
rm -rf $TEMP_DIR

echo "✅ Deployment package created: $ZIP_FILE"

# Wait a moment for IAM role to propagate
echo "⏳ Waiting for IAM role to propagate..."
sleep 10

# Deploy Lambda function
echo "🚀 Deploying Lambda function..."

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &>/dev/null; then
    echo "📝 Function exists, updating code..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://$ZIP_FILE \
        --region $REGION
    
    echo "📝 Updating function configuration..."
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout 60 \
        --memory-size 1024 \
        --region $REGION
else
    echo "📝 Creating new function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime python3.9 \
        --role $ROLE_ARN \
        --handler lambda_function.lambda_handler \
        --zip-file fileb://$ZIP_FILE \
        --timeout 60 \
        --memory-size 1024 \
        --region $REGION \
        --description "YouTube transcript extraction service for SubScribe game"
fi

echo "✅ Lambda function deployed successfully!"

# Create/update Function URL
echo "🌐 Setting up Function URL..."

FUNCTION_URL=$(aws lambda create-function-url-config \
    --function-name $FUNCTION_NAME \
    --cors "AllowOrigins=*,AllowMethods=GET,AllowHeaders=Content-Type" \
    --auth-type NONE \
    --region $REGION \
    --query 'FunctionUrl' \
    --output text 2>/dev/null || \
    aws lambda get-function-url-config \
    --function-name $FUNCTION_NAME \
    --region $REGION \
    --query 'FunctionUrl' \
    --output text)

echo "✅ Function URL configured: $FUNCTION_URL"

# Test the function
echo "🧪 Testing the function..."
TEST_RESPONSE=$(aws lambda invoke \
    --function-name $FUNCTION_NAME \
    --payload '{"videoId":"dQw4w9WgXcQ","lang":"en"}' \
    --region $REGION \
    /tmp/test-response.json && cat /tmp/test-response.json)

echo "📝 Test response: $TEST_RESPONSE"

# Clean up
rm -f $ZIP_FILE
rm -f /tmp/test-response.json

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Summary:"
echo "   Function Name: $FUNCTION_NAME"
echo "   Region: $REGION"
echo "   Function URL: $FUNCTION_URL"
echo ""
echo "🔗 Add this URL to your Vercel environment variables:"
echo "   YOUTUBE_TRANSCRIPT_LAMBDA_URL=$FUNCTION_URL"
echo ""
echo "📞 Test URL example:"
echo "   $FUNCTION_URL?videoId=dQw4w9WgXcQ&lang=en"