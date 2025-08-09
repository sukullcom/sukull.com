@echo off
REM AWS Lambda Deployment Script for YouTube Transcript Function (Windows)
REM This script creates and deploys the Lambda function with yt-dlp binary

echo 🚀 Deploying YouTube Transcript Lambda Function...

REM Function configuration
set FUNCTION_NAME=sukull-youtube-transcript
set RUNTIME=nodejs18.x
set HANDLER=index.handler
set ROLE_NAME=lambda-execution-role

REM Check if AWS CLI is installed
aws --version >nul 2>&1
if errorlevel 1 (
    echo ❌ AWS CLI not found. Please install AWS CLI first.
    echo 📥 Download from: https://aws.amazon.com/cli/
    pause
    exit /b 1
)

echo 📝 Checking IAM role...
aws iam get-role --role-name %ROLE_NAME% >nul 2>&1
if errorlevel 1 (
    echo Creating IAM role: %ROLE_NAME%
    aws iam create-role --role-name %ROLE_NAME% --assume-role-policy-document "{\"Version\": \"2012-10-17\", \"Statement\": [{\"Effect\": \"Allow\", \"Principal\": {\"Service\": \"lambda.amazonaws.com\"}, \"Action\": \"sts:AssumeRole\"}]}"
    
    REM Attach basic execution policy
    aws iam attach-role-policy --role-name %ROLE_NAME% --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    
    echo ⏳ Waiting for role to be available...
    timeout /t 10 /nobreak >nul
)

REM Get role ARN
for /f "tokens=*" %%i in ('aws iam get-role --role-name %ROLE_NAME% --query "Role.Arn" --output text') do set ROLE_ARN=%%i
echo ✅ Using role: %ROLE_ARN%

REM Download yt-dlp binary for Lambda
echo 📥 Downloading yt-dlp binary...
if not exist "yt-dlp" (
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp
    echo ✅ yt-dlp downloaded
) else (
    echo ✅ yt-dlp already exists
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install --production

REM Create deployment package
echo 📦 Creating deployment package...
if exist lambda-package.zip del lambda-package.zip
powershell -command "Compress-Archive -Path * -DestinationPath lambda-package.zip -Exclude @('*.zip', 'deploy.bat', 'deploy.sh', 'README.md')"

REM Check if function exists
echo 🔍 Checking if function exists...
aws lambda get-function --function-name %FUNCTION_NAME% >nul 2>&1
if errorlevel 1 (
    echo 🆕 Creating new function...
    aws lambda create-function --function-name %FUNCTION_NAME% --runtime %RUNTIME% --role %ROLE_ARN% --handler %HANDLER% --zip-file fileb://lambda-package.zip --timeout 30 --memory-size 1024 --description "YouTube transcript extraction using yt-dlp for SubScribe game"
) else (
    echo 📝 Updating existing function...
    aws lambda update-function-code --function-name %FUNCTION_NAME% --zip-file fileb://lambda-package.zip
    
    REM Update configuration
    aws lambda update-function-configuration --function-name %FUNCTION_NAME% --timeout 30 --memory-size 1024
)

REM Create or update function URL
echo 🌐 Setting up Function URL...
aws lambda create-function-url-config --function-name %FUNCTION_NAME% --auth-type NONE >nul 2>&1
if errorlevel 1 (
    aws lambda update-function-url-config --function-name %FUNCTION_NAME% --auth-type NONE
)

REM Get function URL
for /f "tokens=*" %%i in ('aws lambda get-function-url-config --function-name %FUNCTION_NAME% --query "FunctionUrl" --output text') do set FUNCTION_URL=%%i

echo.
echo 🎉 Deployment complete!
echo 📍 Function URL: %FUNCTION_URL%
echo.
echo 🧪 Test your function:
echo curl "%FUNCTION_URL%?videoId=dQw4w9WgXcQ&lang=en"
echo.
echo 🔧 Next steps:
echo 1. Update your SubScribe game to use this URL
echo 2. Add NEXT_PUBLIC_LAMBDA_TRANSCRIPT_URL=%FUNCTION_URL% to your .env.local
echo.
pause