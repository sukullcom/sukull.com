# AWS Lambda Deployment Script for YouTube Transcript Service
# PowerShell version

$FUNCTION_NAME = "youtube-transcript-extractor"
$REGION = "us-east-1"
$ROLE_NAME = "lambda-youtube-transcript-role"
$ZIP_FILE = "lambda-deployment.zip"

Write-Host "🚀 Starting AWS Lambda deployment for YouTube Transcript Extractor" -ForegroundColor Green

# Check if AWS CLI is configured
try {
    $identity = aws sts get-caller-identity 2>$null | ConvertFrom-Json
    Write-Host "✅ AWS CLI is configured for account: $($identity.Account)" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Create trust policy file
$trustPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Principal = @{
                Service = "lambda.amazonaws.com"
            }
            Action = "sts:AssumeRole"
        }
    )
} | ConvertTo-Json -Depth 10

$trustPolicy | Out-File -FilePath "trust-policy.json" -Encoding utf8

Write-Host "📋 Creating/checking IAM role..." -ForegroundColor Yellow

# Create IAM role (ignore error if it already exists)
aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document file://trust-policy.json 2>$null

# Attach basic execution policy
aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

Write-Host "✅ IAM role configured" -ForegroundColor Green

# Wait a moment for role to propagate
Start-Sleep -Seconds 5

# Get role ARN
$roleArn = (aws iam get-role --role-name $ROLE_NAME | ConvertFrom-Json).Role.Arn
Write-Host "📋 Role ARN: $roleArn" -ForegroundColor Cyan

# Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow

# Remove old zip if exists
if (Test-Path $ZIP_FILE) {
    Remove-Item $ZIP_FILE
}

# Create zip with lambda function and requirements
if (Get-Command python -ErrorAction SilentlyContinue) {
    # Install dependencies to a temporary directory
    $tempDir = "package"
    if (Test-Path $tempDir) {
        Remove-Item -Recurse -Force $tempDir
    }
    New-Item -ItemType Directory -Path $tempDir | Out-Null
    
    Write-Host "📥 Installing Python dependencies..." -ForegroundColor Yellow
    python -m pip install -r requirements.txt -t $tempDir
    
    # Copy lambda function to package directory
    Copy-Item "lambda_function.py" -Destination $tempDir
    
    # Create zip from package directory
    Compress-Archive -Path "$tempDir\*" -DestinationPath $ZIP_FILE -Force
    
    # Clean up
    Remove-Item -Recurse -Force $tempDir
} else {
    Write-Host "❌ Python not found. Installing dependencies manually..." -ForegroundColor Red
    # Just zip the lambda function without dependencies
    Compress-Archive -Path "lambda_function.py" -DestinationPath $ZIP_FILE -Force
    Write-Host "⚠️  Dependencies not installed. Lambda might fail without yt-dlp." -ForegroundColor Yellow
}

Write-Host "✅ Deployment package created: $ZIP_FILE" -ForegroundColor Green

# Deploy or update Lambda function
Write-Host "🚀 Deploying Lambda function..." -ForegroundColor Yellow

# Check if function exists
$functionExists = $false
try {
    aws lambda get-function --function-name $FUNCTION_NAME 2>$null | Out-Null
    $functionExists = $true
} catch {
    $functionExists = $false
}

if ($functionExists) {
    Write-Host "📝 Updating existing function..." -ForegroundColor Yellow
    aws lambda update-function-code --function-name $FUNCTION_NAME --zip-file "fileb://$ZIP_FILE"
} else {
    Write-Host "🆕 Creating new function..." -ForegroundColor Yellow
    aws lambda create-function --function-name $FUNCTION_NAME --runtime python3.9 --role $roleArn --handler lambda_function.lambda_handler --zip-file "fileb://$ZIP_FILE" --timeout 300 --memory-size 512 --description "YouTube transcript extractor using yt-dlp"
}

# Create or update function URL
Write-Host "🌐 Setting up Function URL..." -ForegroundColor Yellow

try {
    # Try to create function URL
    $urlConfig = aws lambda create-function-url-config --function-name $FUNCTION_NAME --auth-type NONE --cors "AllowCredentials=false,AllowHeaders=Content-Type,AllowMethods=GET,POST,OPTIONS,AllowOrigins=*,MaxAge=300" | ConvertFrom-Json
    
    $functionUrl = $urlConfig.FunctionUrl
} catch {
    # Function URL might already exist, get it
    try {
        $urlConfig = aws lambda get-function-url-config --function-name $FUNCTION_NAME | ConvertFrom-Json
        $functionUrl = $urlConfig.FunctionUrl
    } catch {
        Write-Host "❌ Failed to configure Function URL" -ForegroundColor Red
        exit 1
    }
}

# Test the function
Write-Host "🧪 Testing Lambda function..." -ForegroundColor Yellow

$testPayload = @{
    httpMethod = "GET"
    queryStringParameters = @{
        videoId = "dQw4w9WgXcQ"
        lang = "en"
    }
} | ConvertTo-Json -Depth 5

$testPayload | Out-File -FilePath "test-payload.json" -Encoding utf8

try {
    $response = aws lambda invoke --function-name $FUNCTION_NAME --payload file://test-payload.json response.json
    $result = Get-Content -Path "response.json" | ConvertFrom-Json
    
    if ($result.statusCode -eq 200) {
        Write-Host "✅ Lambda function is working!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Lambda function responded with status: $($result.statusCode)" -ForegroundColor Yellow
        Write-Host "Response: $($result.body)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Test failed, but function might still work" -ForegroundColor Yellow
}

# Cleanup temporary files
Remove-Item -Path "trust-policy.json" -ErrorAction SilentlyContinue
Remove-Item -Path "test-payload.json" -ErrorAction SilentlyContinue
Remove-Item -Path "response.json" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Function URL: $functionUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy the Function URL above" -ForegroundColor White
Write-Host "2. Add it to your Vercel environment variables as: YOUTUBE_TRANSCRIPT_LAMBDA_URL" -ForegroundColor White
Write-Host "3. Redeploy your Vercel app" -ForegroundColor White
Write-Host ""
Write-Host "💰 Estimated cost: ~`$0.0001 per transcript request" -ForegroundColor Green