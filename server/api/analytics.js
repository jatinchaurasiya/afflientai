/**
 * Analytics API
 * Handles tracking and analytics events
 */
const express = require('express');
const router = express.Router();

// Database connection (replace with your actual DB connection)
const db = require('../db');

/**
 * Track impression events
 */
router.post('/impression', async (req, res) => {
  try {
    const { recommendations, siteId, triggerType, url, timestamp, userAgent } = req.body;
    
    // Validate request
    if (!recommendations || !Array.isArray(recommendations) || !siteId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Process and store impression data
    const impressionData = recommendations.map(rec => ({
      product_id: rec.id,
      site_id: siteId,
      timestamp: new Date(timestamp || Date.now()),
      url: url || '',
      trigger_type: triggerType || 'unknown',
      user_agent: userAgent || req.headers['user-agent'] || ''
    }));
    
    // Insert into database
    await db.execute(`
      INSERT INTO impressions (product_id, site_id, timestamp, url, trigger_type, user_agent)
      VALUES ?
    `, [impressionData.map(data => [
      data.product_id,
      data.site_id,
      data.timestamp,
      data.url,
      data.trigger_type,
      data.user_agent
    ])]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Impression logging error:', error);
    res.status(500).json({ error: 'Failed to log impression' });
  }
});

/**
 * Track click events
 */
router.post('/click', async (req, res) => {
  try {
    const { product, siteId, triggerType, url, timestamp } = req.body;
    
    // Validate request
    if (!product || !product.id || !siteId) {
      return res.status(400).json({ error: 'Invalid click data' });
    }
    
    // Insert into database
    await db.execute(`
      INSERT INTO clicks (product_id, site_id, timestamp, url, trigger_type, position)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      product.id,
      siteId,
      new Date(timestamp || Date.now()),
      url || '',
      triggerType || 'unknown',
      product.position || 0
    ]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Click logging error:', error);
    res.status(500).json({ error: 'Failed to log click' });
  }
});

/**
 * Track hover events
 */
router.post('/hover', async (req, res) => {
  try {
    const { product, siteId, url, timestamp } = req.body;
    
    // Validate request
    if (!product || !product.id || !siteId) {
      return res.status(400).json({ error: 'Invalid hover data' });
    }
    
    // Insert into database
    await db.execute(`
      INSERT INTO hovers (product_id, site_id, timestamp, url, position)
      VALUES (?, ?, ?, ?, ?)
    `, [
      product.id,
      siteId,
      new Date(timestamp || Date.now()),
      url || '',
      product.position || 0
    ]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Hover logging error:', error);
    res.status(500).json({ error: 'Failed to log hover' });
  }
});

/**
 * Track popup close events
 */
router.post('/close', async (req, res) => {
  try {
    const { siteId, reason, displayDuration, url, timestamp } = req.body;
    
    // Validate request
    if (!siteId) {
      return res.status(400).json({ error: 'Invalid close data' });
    }
    
    // Insert into database
    await db.execute(`
      INSERT INTO popup_closes (site_id, timestamp, url, reason, display_duration)
      VALUES (?, ?, ?, ?, ?)
    `, [
      siteId,
      new Date(timestamp || Date.now()),
      url || '',
      reason || 'unknown',
      displayDuration || 0
    ]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Close logging error:', error);
    res.status(500).json({ error: 'Failed to log close event' });
  }
});

/**
 * Get analytics summary
 */
router.get('/summary', async (req, res) => {
  try {
    const { siteId, startDate, endDate } = req.query;
    
    // Validate request
    if (!siteId) {
      return res.status(400).json({ error: 'Site ID is required' });
    }
    
    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get impression count
    const [impressionsResult] = await db.execute(`
      SELECT COUNT(*) as count
      FROM impressions
      WHERE site_id = ? AND timestamp BETWEEN ? AND ?
    `, [siteId, start, end]);
    
    // Get click count
    const [clicksResult] = await db.execute(`
      SELECT COUNT(*) as count
      FROM clicks
      WHERE site_id = ? AND timestamp BETWEEN ? AND ?
    `, [siteId, start, end]);
    
    // Get conversion count (if available)
    const [conversionsResult] = await db.execute(`
      SELECT COUNT(*) as count
      FROM conversions
      WHERE site_id = ? AND timestamp BETWEEN ? AND ?
    `, [siteId, start, end]);
    
    // Calculate metrics
    const impressions = impressionsResult[0]?.count || 0;
    const clicks = clicksResult[0]?.count || 0;
    const conversions = conversionsResult[0]?.count || 0;
    
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    
    res.json({
      success: true,
      data: {
        impressions,
        clicks,
        conversions,
        ctr: ctr.toFixed(2),
        conversionRate: conversionRate.toFixed(2),
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
          days: Math.ceil((end - start) / (24 * 60 * 60 * 1000))
        }
      }
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: 'Failed to get analytics summary' });
  }
});

module.exports = router;