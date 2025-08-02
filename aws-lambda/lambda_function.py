import json
import subprocess
import os
import tempfile
import logging
from typing import Dict, Any, List

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda handler for YouTube transcript extraction
    """
    try:
        # Log the full event for debugging
        logger.info(f"Full event: {json.dumps(event)}")
        
        # Parse request - Function URL events have different structure
        if 'requestContext' in event and 'http' in event['requestContext']:
            # Function URL event structure
            method = event['requestContext']['http']['method']
            
            if method == 'OPTIONS':
                return {
                    'statusCode': 200,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    },
                    'body': ''
                }
            
            # Parse query parameters for Function URL
            query_params = event.get('queryStringParameters', {}) or {}
            video_id = query_params.get('videoId')
            lang = query_params.get('lang', 'en')
            
        elif 'httpMethod' in event:
            # API Gateway event
            if event['httpMethod'] == 'OPTIONS':
                return {
                    'statusCode': 200,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    },
                    'body': ''
                }
            
            # Parse query parameters for API Gateway
            query_params = event.get('queryStringParameters', {}) or {}
            video_id = query_params.get('videoId')
            lang = query_params.get('lang', 'en')
        else:
            # Direct invocation
            video_id = event.get('videoId')
            lang = event.get('lang', 'en')
        
        logger.info(f"Processing video_id: {video_id}, lang: {lang}")
        
        if not video_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'error': 'Missing videoId parameter'
                })
            }
        
        # Extract transcript using yt-dlp
        transcript = extract_youtube_transcript(video_id, lang)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'transcript': transcript['transcript'],
                'language': lang,
                'videoTitle': transcript['title'],
                'totalLines': len(transcript['transcript']),
                'source': 'aws-lambda-ytdlp'
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': f'Failed to extract transcript: {str(e)}',
                'type': 'TranscriptExtractionError'
            })
        }

def extract_youtube_transcript(video_id: str, lang: str = 'en') -> Dict[str, Any]:
    """
    Extract transcript from YouTube video using yt-dlp
    """
    url = f"https://www.youtube.com/watch?v={video_id}"
    
    # Create temporary directory for yt-dlp output
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # First, get video info and check if subtitles are available
            info_cmd = [
                'yt-dlp',
                '--dump-json',
                '--no-download',
                '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                '--add-header', 'Accept-Language:en-US,en;q=0.9',
                '--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                '--extractor-retries', '3',
                '--fragment-retries', '3',
                url
            ]
            
            logger.info(f"Running command: {' '.join(info_cmd)}")
            info_result = subprocess.run(info_cmd, capture_output=True, text=True, timeout=30)
            
            if info_result.returncode != 0:
                raise Exception(f"Failed to get video info: {info_result.stderr}")
            
            video_info = json.loads(info_result.stdout)
            video_title = video_info.get('title', f'Video {video_id}')
            
            # Check for available subtitles
            subtitles = video_info.get('subtitles', {})
            automatic_captions = video_info.get('automatic_captions', {})
            
            # Try to find subtitles in preferred language, then English, then any available
            available_langs = list(subtitles.keys()) + list(automatic_captions.keys())
            
            if not available_langs:
                raise Exception(f"No subtitles found for video {video_id}")
            
            # Choose language priority: requested lang -> 'en' -> first available
            chosen_lang = lang if lang in available_langs else ('en' if 'en' in available_langs else available_langs[0])
            
            logger.info(f"Available subtitle languages: {available_langs}")
            logger.info(f"Chosen language: {chosen_lang}")
            
            # Download subtitles
            subtitle_file = os.path.join(temp_dir, f"{video_id}.{chosen_lang}.vtt")
            
            download_cmd = [
                'yt-dlp',
                '--write-subs',
                '--write-auto-subs',
                '--sub-langs', chosen_lang,
                '--sub-format', 'vtt',
                '--skip-download',
                '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                '--add-header', 'Accept-Language:en-US,en;q=0.9',
                '--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                '--extractor-retries', '3',
                '--fragment-retries', '3',
                '--output', os.path.join(temp_dir, f'{video_id}.%(ext)s'),
                url
            ]
            
            logger.info(f"Running command: {' '.join(download_cmd)}")
            download_result = subprocess.run(download_cmd, capture_output=True, text=True, timeout=60)
            
            if download_result.returncode != 0:
                raise Exception(f"Failed to download subtitles: {download_result.stderr}")
            
            # Find the downloaded subtitle file
            subtitle_files = [f for f in os.listdir(temp_dir) if f.endswith('.vtt')]
            if not subtitle_files:
                raise Exception("Subtitle file not found after download")
            
            subtitle_file = os.path.join(temp_dir, subtitle_files[0])
            
            # Parse VTT file
            transcript = parse_vtt_file(subtitle_file)
            
            return {
                'transcript': transcript,
                'title': video_title,
                'language': chosen_lang
            }
            
        except subprocess.TimeoutExpired:
            raise Exception("Timeout while extracting transcript")
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse video info: {str(e)}")
        except Exception as e:
            logger.error(f"Error in extract_youtube_transcript: {str(e)}")
            raise

def parse_vtt_file(file_path: str) -> List[Dict[str, Any]]:
    """
    Parse VTT subtitle file and return transcript entries
    """
    transcript = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split by double newlines to get subtitle blocks
        blocks = content.split('\n\n')
        
        for block in blocks:
            lines = block.strip().split('\n')
            
            if len(lines) >= 2:
                # Check if first line contains timestamp
                if '-->' in lines[0]:
                    timestamp_line = lines[0]
                    text_lines = lines[1:]
                elif len(lines) >= 3 and '-->' in lines[1]:
                    timestamp_line = lines[1]
                    text_lines = lines[2:]
                else:
                    continue
                
                # Parse timestamp
                try:
                    start_time = parse_timestamp(timestamp_line.split(' --> ')[0])
                    text = ' '.join(text_lines).strip()
                    
                    # Clean up text (remove HTML tags, extra spaces)
                    text = clean_subtitle_text(text)
                    
                    if text:  # Only add non-empty text
                        transcript.append({
                            'startTime': start_time,
                            'text': text
                        })
                except Exception as e:
                    logger.warning(f"Failed to parse subtitle block: {str(e)}")
                    continue
        
        return transcript
        
    except Exception as e:
        raise Exception(f"Failed to parse VTT file: {str(e)}")

def parse_timestamp(timestamp: str) -> float:
    """
    Parse VTT timestamp to seconds
    Format: 00:00:01.000 or 00:01.000
    """
    timestamp = timestamp.strip()
    
    # Remove any extra formatting
    if '.' in timestamp:
        time_part, ms_part = timestamp.split('.')
        ms = float('0.' + ms_part)
    else:
        time_part = timestamp
        ms = 0
    
    time_components = time_part.split(':')
    
    if len(time_components) == 3:  # HH:MM:SS
        hours, minutes, seconds = map(int, time_components)
        return hours * 3600 + minutes * 60 + seconds + ms
    elif len(time_components) == 2:  # MM:SS
        minutes, seconds = map(int, time_components)
        return minutes * 60 + seconds + ms
    else:
        return float(time_part) + ms

def clean_subtitle_text(text: str) -> str:
    """
    Clean subtitle text by removing HTML tags and extra formatting
    """
    import re
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Remove extra whitespace
    text = ' '.join(text.split())
    
    # Decode HTML entities
    text = text.replace('&amp;', '&')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    text = text.replace('&quot;', '"')
    text = text.replace('&#39;', "'")
    
    return text.strip()