/**
 * Frontend Worker - Serves the Next.js application from R2
 * Serves static assets and handles client-side routing
 */

interface Env {
  FRONTEND_ASSETS: R2Bucket;
  NEXT_PUBLIC_GRANT_SENTINEL_API_URL?: string;
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

function getContentType(pathname: string): string {
  const ext = pathname.substring(pathname.lastIndexOf('.'));
  return MIME_TYPES[ext] || 'application/octet-stream';
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    let pathname = url.pathname;

    // Remove leading slash for R2 key
    if (pathname.startsWith('/')) {
      pathname = pathname.substring(1);
    }

    // Default to index.html for root and client-side routes
    if (pathname === '' || pathname === '/') {
      pathname = 'index.html';
    }

    // Try to serve from R2
    try {
      const object = await env.FRONTEND_ASSETS.get(pathname);
      
      if (object) {
        const headers = new Headers();
        headers.set('Content-Type', getContentType(pathname));
        
        // Cache static assets
        if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
          headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        }
        
        return new Response(object.body, { headers });
      }
    } catch (error) {
      console.error('Error serving from R2:', error);
    }

    // If not found in R2, try index.html for client-side routing
    if (pathname !== 'index.html') {
      try {
        const indexObject = await env.FRONTEND_ASSETS.get('index.html');
        if (indexObject) {
          return new Response(indexObject.body, {
            headers: { 'Content-Type': 'text/html' }
          });
        }
      } catch (error) {
        console.error('Error serving index.html:', error);
      }
    }

    // Fallback: return a simple page with instructions
    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Grant Sentinel</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
    }
    .container {
      padding: 2rem;
    }
    h1 { color: #333; }
    p { color: #666; }
    .link {
      display: inline-block;
      margin: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #0066cc;
      color: white;
      text-decoration: none;
      border-radius: 4px;
    }
    .link:hover { background: #0052a3; }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Grant Sentinel Frontend Worker</h1>
    <p>Frontend assets need to be uploaded to R2. Upload your Next.js build output to the <code>grant-sentinel-frontend-assets</code> bucket.</p>
    <p><strong>API Worker:</strong> <a href="https://grant-sentinel.wakas.workers.dev">https://grant-sentinel.wakas.workers.dev</a></p>
    <div style="margin-top: 2rem;">
      <a href="https://grant-sentinel.wakas.workers.dev" class="link">View API</a>
      <a href="https://grant-sentinel.wakas.workers.dev/api/sources" class="link">View Sources</a>
      <a href="https://grant-sentinel.wakas.workers.dev/health" class="link">Health Check</a>
    </div>
  </div>
</body>
</html>`,
      {
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
      }
    );
  }
};
