import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function convertDriveLink(driveUrl: string): string {
  try {
    console.log('Original URL:', driveUrl);
    
    // Handle different Google Drive URL formats and convert directly to usercontent domain
    if (driveUrl.includes('drive.google.com/file/d/')) {
      // Extract file ID from share URL
      const fileIdMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        const directUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=view`;
        console.log('Converted to usercontent URL:', directUrl);
        return directUrl;
      }
    }
    
    if (driveUrl.includes('drive.google.com/open?id=')) {
      // Extract file ID from open URL
      const fileIdMatch = driveUrl.match(/[?&]id=([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        const directUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=view`;
        console.log('Converted to usercontent URL:', directUrl);
        return directUrl;
      }
    }
    
    if (driveUrl.includes('drive.google.com/uc?export=view&id=')) {
      // Extract file ID from uc URL and convert to usercontent
      const fileIdMatch = driveUrl.match(/[?&]id=([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        const directUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=view`;
        console.log('Converted uc URL to usercontent URL:', directUrl);
        return directUrl;
      }
    }
    
    // If already usercontent URL, return as is
    if (driveUrl.includes('drive.usercontent.google.com')) {
      console.log('Already usercontent URL:', driveUrl);
      return driveUrl;
    }
    
    // If not a Drive URL or not recognized format, return as is
    console.log('URL not converted, returning original:', driveUrl);
    return driveUrl;
  } catch (error) {
    console.error('Error converting Drive URL:', error);
    return driveUrl;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'GET') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    const url = new URL(req.url);
    const driveUrl = url.searchParams.get('url');

    if (!driveUrl) {
      return new Response('Missing url parameter', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Convert the Drive URL to direct access format
    const directUrl = convertDriveLink(driveUrl);
    
    console.log('Proxying image from:', directUrl);

    // Fetch the image from Google Drive with redirect handling
    const imageResponse = await fetch(directUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site'
      }
    });

    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', imageResponse.status, imageResponse.statusText);
      return new Response(`Failed to fetch image: ${imageResponse.statusText}`, { 
        status: imageResponse.status, 
        headers: corsHeaders 
      });
    }

    // Get the image data
    const imageData = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Return the image with CORS headers
    return new Response(imageData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error in proxy-drive-image function:', error);
    return new Response(`Internal server error: ${error.message}`, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});