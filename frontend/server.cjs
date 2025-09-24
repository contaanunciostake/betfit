import http from 'http';

const server = http.createServer((req, res) => {
  // Configurar CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Configurações do proxy para o Vite
  const options = {
    hostname: 'localhost',
    port: 5173,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: 'localhost:5173' // Override do host header
    }
  };

  const proxy = http.request(options, (proxyRes) => {
    // Copiar headers da resposta
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    
    res.writeHead(proxyRes.statusCode);
    proxyRes.pipe(res);
  });

  // Handle proxy errors
  proxy.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502, {'Content-Type': 'text/plain'});
    res.end('Bad Gateway - Certifique-se que o Vite está rodando na porta 5173');
  });

  // Pipe request to proxy
  req.pipe(proxy);
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Proxy server rodando em http://0.0.0.0:${PORT}`);
  console.log(`📡 Redirecionando para Vite em http://localhost:5173`);
  console.log('💡 Certifique-se que o Vite está rodando antes de usar o Cloudflare Tunnel');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando proxy server...');
  server.close(() => {
    console.log('✅ Proxy server encerrado');
    process.exit(0);
  });
});