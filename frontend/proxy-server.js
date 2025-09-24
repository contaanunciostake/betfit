import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 3000;

// Proxy para o Vite
app.use('/', createProxyMiddleware({
  target: 'http://localhost:5173',
  changeOrigin: true,
  ws: true, // Habilita WebSocket para HMR
  headers: {
    'Access-Control-Allow-Origin': '*',
  }
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy rodando em http://0.0.0.0:${PORT}`);
});