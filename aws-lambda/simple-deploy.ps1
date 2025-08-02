# Simple AWS Lambda Deployment Script
param(
    [string]$FunctionName = "youtube-transcript-extractor",
    [string]$Region = "us-east-1",
    [string]$RoleName = "lambda-youtube-transcript-role"
)

Write-Host "🚀 Starting AWS Lambda deployment..." -ForegroundColor Green

# Create IAM role
Write-Host "📋 Creating IAM role..." -ForegroundColor Yellow
$trustPolicy = '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
$trustPolicy | Out-File -FilePath "trust-policy.json" -Encoding utf8

aws iam create-role --role-name $RoleName --assume-role-policy-document file://trust-policy.json 2>$null
aws iam attach-role-policy --role-name $RoleName --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

Start-Sleep -Seconds 5

# Get role ARN
$roleResult = aws iam get-role --role-name $RoleName | ConvertFrom-Json
$roleArn = $roleResult.Role.Arn
Write-Host "✅ Role ARN: $roleArn" -ForegroundColor Cyan

# Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
if (Test-Path "lambda-deployment.zip") { Remove-Item "lambda-deployment.zip" }
Compress-Archive -Path "lambda_function.py" -DestinationPath "lambda-deployment.zip" -Force

# Deploy function
Write-Host "🚀 Deploying function..." -ForegroundColor Yellow
try {
    aws lambda get-function --function-name $FunctionName 2>$null | Out-Null
    Write-Host "📝 Updating existing function..." -ForegroundColor Yellow
    aws lambda update-function-code --function-name $FunctionName --zip-file "fileb://lambda-deployment.zip"
} catch {
    Write-Host "🆕 Creating new function..." -ForegroundColor Yellow
    aws lambda create-function --function-name $FunctionName --runtime python3.9 --role $roleArn --handler lambda_function.lambda_handler --zip-file "fileb://lambda-deployment.zip" --timeout 300 --memory-size 512
}

# Create function URL
Write-Host "🌐 Setting up Function URL..." -ForegroundColor Yellow
try {
    $urlResult = aws lambda create-function-url-config --function-name $FunctionName --auth-type NONE --cors "AllowCredentials=false,AllowHeaders=Content-Type,AllowMethods=GET,POST,OPTIONS,AllowOrigins=*" | ConvertFrom-Json
    $functionUrl = $urlResult.FunctionUrl
} catch {
    $urlResult = aws lambda get-function-url-config --function-name $FunctionName | ConvertFrom-Json
    $functionUrl = $urlResult.FunctionUrl
}

# Clean up
Remove-Item "trust-policy.json" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host "🔗 Function URL: $functionUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next step: Add this URL to Vercel as YOUTUBE_TRANSCRIPT_LAMBDA_URL" -ForegroundColor Yellow