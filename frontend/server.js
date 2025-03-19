// server.js - Simple Express server to serve static files
const express = require('express');
const path = require('path');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://backend:3000';

// Enable CORS for all routes
app.use(cors());

// Configure API proxy
app.use('/api', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // Remove /api prefix when forwarding to the backend
  },
  logLevel: 'debug',
}));

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Handle SPA routing - redirect all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`API URL: ${API_URL}`);
});