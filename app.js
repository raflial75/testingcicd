// app.js
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());

// Health check endpoint (untuk liveness probe)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Readiness check endpoint (untuk readiness probe)
app.get('/ready', (req, res) => {
  res.status(200).json({ 
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Simple CI/CD Test Application!',
    version: '1.0.0',
    environment: process.env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString()
  });
});

// API endpoint contoh
app.get('/api/info', (req, res) => {
  res.json({
    application: 'Simple Test App',
    version: '1.0.0',
    nodejs: process.version,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Counter endpoint (untuk testing state)
let counter = 0;
app.get('/api/counter', (req, res) => {
  counter++;
  res.json({
    count: counter,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/echo', (req, res) => {
  res.json({
    received: req.body,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.ENVIRONMENT || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;