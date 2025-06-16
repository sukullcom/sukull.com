// Ultra-simple server using only Node.js built-in modules
const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3001;

console.log('🚀 Starting ultra-simple server...');
console.log('📊 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 Port:', PORT);

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  console.log(`${method} ${path} - Origin: ${req.headers.origin}`);

  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight OPTIONS requests
  if (method === 'OPTIONS') {
    console.log('Handling preflight request');
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (path === '/health' && method === 'GET') {
    const health = {
      success: true,
      message: 'Ultra-simple server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: PORT
    };
    console.log('Health check requested:', health);
    res.writeHead(200);
    res.end(JSON.stringify(health));
    return;
  }

  // Ping endpoint
  if (path === '/ping' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // Mock payment endpoint
  if (path === '/api/payment/create' && method === 'POST') {
    console.log('Mock payment endpoint hit');
    const response = {
      success: false,
      message: 'This is an ultra-simple server - payment processing not available'
    };
    res.writeHead(200);
    res.end(JSON.stringify(response));
    return;
  }

  // 404 for other routes
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Ultra-simple server running on port ${PORT}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
}); 