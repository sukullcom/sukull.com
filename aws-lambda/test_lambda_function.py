import json
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Simple test Lambda handler
    """
    try:
        logger.info(f"Test Lambda called with event: {json.dumps(event)}")
        
        # Parse query parameters for Function URL
        query_params = event.get('queryStringParameters', {}) or {}
        video_id = query_params.get('videoId', 'test-video')
        lang = query_params.get('lang', 'en')
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'status': 'success',
                'message': 'Test Lambda function is working',
                'videoId': video_id,
                'lang': lang,
                'environment': {
                    'python_version': '3.9',
                    'lambda_runtime': context.aws_request_id if hasattr(context, 'aws_request_id') else 'unknown'
                }
            })
        }
        
    except Exception as e:
        logger.error(f"Error in test Lambda: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': f'Test Lambda error: {str(e)}',
                'type': 'TestError'
            })
        }