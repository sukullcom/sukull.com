import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';

export async function GET(request: Request) {
  // Add authentication check
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Get the URL from the query string
  const { searchParams } = new URL(request.url);
  
  // Extract all the avatar parameters
  const accessoriesType = searchParams.get('accessoriesType') || '';
  const avatarStyle = searchParams.get('avatarStyle') || 'Circle';
  const clotheColor = searchParams.get('clotheColor') || '';
  const clotheType = searchParams.get('clotheType') || '';
  const eyeType = searchParams.get('eyeType') || '';
  const eyebrowType = searchParams.get('eyebrowType') || '';
  const facialHairColor = searchParams.get('facialHairColor') || '';
  const facialHairType = searchParams.get('facialHairType') || '';
  const hairColor = searchParams.get('hairColor') || '';
  const hatColor = searchParams.get('hatColor') || '';
  const mouthType = searchParams.get('mouthType') || '';
  const skinColor = searchParams.get('skinColor') || '';
  const topType = searchParams.get('topType') || '';
  
  // Construct the avataaars.io URL
  const avatarUrl = new URL('https://avataaars.io/');
  if (accessoriesType) avatarUrl.searchParams.append('accessoriesType', accessoriesType);
  if (avatarStyle) avatarUrl.searchParams.append('avatarStyle', avatarStyle);
  if (clotheColor) avatarUrl.searchParams.append('clotheColor', clotheColor);
  if (clotheType) avatarUrl.searchParams.append('clotheType', clotheType);
  if (eyeType) avatarUrl.searchParams.append('eyeType', eyeType);
  if (eyebrowType) avatarUrl.searchParams.append('eyebrowType', eyebrowType);
  if (facialHairColor) avatarUrl.searchParams.append('facialHairColor', facialHairColor);
  if (facialHairType) avatarUrl.searchParams.append('facialHairType', facialHairType);
  if (hairColor) avatarUrl.searchParams.append('hairColor', hairColor);
  if (hatColor) avatarUrl.searchParams.append('hatColor', hatColor);
  if (mouthType) avatarUrl.searchParams.append('mouthType', mouthType);
  if (skinColor) avatarUrl.searchParams.append('skinColor', skinColor);
  if (topType) avatarUrl.searchParams.append('topType', topType);
  
  try {
    // Fetch the SVG from avataaars.io
    const response = await fetch(avatarUrl.toString());
    
    if (!response.ok) {
      return new NextResponse('Failed to fetch avatar', { status: response.status });
    }
    
    // Get the SVG content
    const svgContent = await response.text();
    
    // Return the SVG with the correct content type
    return new NextResponse(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Error fetching avatar:', error);
    return new NextResponse('Error fetching avatar', { status: 500 });
  }
} 