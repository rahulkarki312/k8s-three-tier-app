const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3001;
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api',
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err.message);
    res.status(503).json({ error: 'Backend service unavailable' });
  },
}));

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.json({ status: 'healthy', component: 'frontend' });
});

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🎨 Frontend server running on port ${PORT}`);
  console.log(`🔗 Proxying API requests to ${API_URL}`);
});