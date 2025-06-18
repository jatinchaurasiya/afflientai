/**
 * Main server file
 * Initializes and runs the Express server
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

// Import routes
const recommendationsRouter = require('./api/recommendations');
const analyticsRouter = require('./api/analytics');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/analytics', analyticsRouter);

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbConnected = await db.testConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Test database connection
  db.testConnection();
});

module.exports = app;