// Netlify Function to proxy analytics requests to Cloudflare Worker
// This ensures POST requests with bodies are properly forwarded

const WORKER_URL = 'https://vehicle-dealership-api.nick-damato0011527.workers.dev';

exports.handler = async (event, context) => {
  const { path, httpMethod, headers, body } = event;
  
  // Extract the API path (remove /api prefix if present)
  const apiPath = path.replace(/^\/\.netlify\/functions\/analytics-proxy/, '');
  const targetUrl = `${WORKER_URL}/api/analytics${apiPath}`;
  
  console.log(`Proxying ${httpMethod} request to: ${targetUrl}`);
  
  try {
    const response = await fetch(targetUrl, {
      method: httpMethod,
      headers: {
        'Content-Type': headers['content-type'] || 'application/json',
      },
      body: httpMethod !== 'GET' && httpMethod !== 'HEAD' ? body : undefined,
    });
    
    const data = await response.text();
    
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: data,
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Proxy error', message: error.message }),
    };
  }
};
