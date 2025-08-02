import json
import logging
import urllib.request
import urllib.error
import re
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Simple AWS Lambda handler for YouTube video info - no transcript extraction
    This is a basic fallback that shows the Lambda function is working
    """
    try:
        logger.info(f"Simple Lambda called with event: {json.dumps(event)}")
        
        # Parse query parameters for Function URL
        query_params = event.get('queryStringParameters', {}) or {}
        video_id = query_params.get('videoId', 'unknown')
        lang = query_params.get('lang', 'en')
        
        # Basic validation
        if not video_id or video_id == 'unknown':
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'error': 'Missing or invalid videoId parameter',
                    'type': 'ValidationError'
                })
            }
        
        # Simple video URL validation
        youtube_url = f"https://www.youtube.com/watch?v={video_id}"
        
        # Try to get basic video info without yt-dlp
        try:
            # Simple HTTP request to check if video exists
            req = urllib.request.Request(youtube_url, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            
            with urllib.request.urlopen(req, timeout=10) as response:
                content = response.read().decode('utf-8', errors='ignore')
                
                # Basic check if video is accessible
                if 'video is unavailable' in content.lower() or 'private video' in content.lower():
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Access-Control-Allow-Origin': '*',
                            'Content-Type': 'application/json'
                        },
                        'body': json.dumps({
                            'error': 'Video is unavailable or private',
                            'videoId': video_id,
                            'type': 'VideoUnavailable'
                        })
                    }
                
                # Try to extract title
                title_match = re.search(r'"title":"([^"]+)"', content)
                video_title = title_match.group(1) if title_match else f"Video {video_id}"
                
        except Exception as e:
            logger.warning(f"Could not fetch video info: {str(e)}")
            video_title = f"Video {video_id}"
        
        # Return success response indicating the Lambda is working
        # but transcript extraction is not available
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'status': 'lambda_working',
                'message': 'AWS Lambda is working, but transcript extraction is temporarily unavailable',
                'videoId': video_id,
                'videoTitle': video_title,
                'lang': lang,
                'reason': 'YouTube is blocking automated transcript extraction',
                'suggestion': 'Try using the YouTube Official API or enable captions on the video',
                'source': 'aws-lambda-simple',
                'timestamp': context.aws_request_id if hasattr(context, 'aws_request_id') else 'unknown'
            })
        }
        
    except Exception as e:
        logger.error(f"Error in simple Lambda: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': f'Simple Lambda error: {str(e)}',
                'type': 'LambdaError'
            })
        }