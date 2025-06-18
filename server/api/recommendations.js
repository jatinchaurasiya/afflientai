/**
 * Recommendations API
 * Handles recommendation requests and analytics tracking
 */
const express = require('express');
const router = express.Router();

// Database connection (replace with your actual DB connection)
const db = require('../db');

/**
 * Get recommendations for a specific URL or content
 */
router.get('/widget/:url', async (req, res) => {
  try {
    const { url } = req.params;
    const siteId = req.headers['x-site-id'];
    const apiKey = req.headers['authorization']?.replace('Bearer ', '');
    
    // Validate request
    if (!url || !siteId || !apiKey) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'URL, site ID, and API key are required'
      });
    }
    
    // Verify API key and site ID
    const isValidKey = await validateApiKey(siteId, apiKey);
    if (!isValidKey) {
      return res.status(401).json({ error: 'Invalid API key or site ID' });
    }
    
    // Get content-based recommendations
    const recommendations = await getRecommendationsForUrl(url, siteId);
    
    // Return recommendations
    res.json({
      success: true,
      recommendations,
      metadata: {
        url,
        timestamp: new Date().toISOString(),
        count: recommendations.length
      }
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get recommendations',
      message: error.message
    });
  }
});

/**
 * Get recommendations for a specific content ID
 */
router.get('/:contentId', async (req, res) => {
  try {
    const { contentId } = req.params;
    const siteId = req.headers['x-site-id'];
    const apiKey = req.headers['authorization']?.replace('Bearer ', '');
    
    // Validate request
    if (!contentId || !siteId || !apiKey) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Verify API key and site ID
    const isValidKey = await validateApiKey(siteId, apiKey);
    if (!isValidKey) {
      return res.status(401).json({ error: 'Invalid API key or site ID' });
    }
    
    // Get content-based recommendations
    const recommendations = await getRecommendationsForContent(contentId, siteId);
    
    // Return recommendations
    res.json({
      success: true,
      recommendations,
      metadata: {
        contentId,
        timestamp: new Date().toISOString(),
        count: recommendations.length
      }
    });
  } catch (error) {
    console.error('Error getting content recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get recommendations',
      message: error.message
    });
  }
});

/**
 * Log impression events
 */
router.post('/impression', async (req, res) => {
  try {
    const { siteId, recommendations, triggerType, url, timestamp, userAgent } = req.body;
    
    // Validate request
    if (!siteId || !recommendations || !Array.isArray(recommendations)) {
      return res.status(400).json({ error: 'Invalid impression data' });
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
 * Log click events
 */
router.post('/click', async (req, res) => {
  try {
    const { siteId, productId, triggerType, url, timestamp } = req.body;
    
    // Validate request
    if (!siteId || !productId) {
      return res.status(400).json({ error: 'Invalid click data' });
    }
    
    // Insert into database
    await db.execute(`
      INSERT INTO clicks (product_id, site_id, timestamp, url, trigger_type)
      VALUES (?, ?, ?, ?, ?)
    `, [
      productId,
      siteId,
      new Date(timestamp || Date.now()),
      url || '',
      triggerType || 'unknown'
    ]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Click logging error:', error);
    res.status(500).json({ error: 'Failed to log click' });
  }
});

/**
 * Validate API key and site ID
 */
async function validateApiKey(siteId, apiKey) {
  try {
    const [rows] = await db.execute(`
      SELECT 1 FROM sites 
      WHERE id = ? AND api_key = ? AND status = 'active'
      LIMIT 1
    `, [siteId, apiKey]);
    
    return rows.length > 0;
  } catch (error) {
    console.error('API key validation error:', error);
    return false;
  }
}

/**
 * Get recommendations for a URL
 */
async function getRecommendationsForUrl(url, siteId) {
  try {
    // In a real implementation, this would analyze the URL content
    // and return relevant product recommendations
    
    // For now, return mock recommendations
    const [rows] = await db.execute(`
      SELECT p.id, p.title, p.price, p.description, p.image_url, p.affiliate_url, 
             p.category, p.rating, p.original_price, p.discount
      FROM products p
      JOIN site_products sp ON p.id = sp.product_id
      WHERE sp.site_id = ?
      LIMIT 10
    `, [siteId]);
    
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      price: row.price,
      description: row.description,
      image_url: row.image_url,
      affiliate_url: row.affiliate_url,
      category: row.category,
      rating: row.rating,
      originalPrice: row.original_price,
      discount: row.discount
    }));
  } catch (error) {
    console.error('Error getting URL recommendations:', error);
    return [];
  }
}

/**
 * Get recommendations for a specific content ID
 */
async function getRecommendationsForContent(contentId, siteId) {
  try {
    // In a real implementation, this would fetch content-specific
    // recommendations based on the content analysis
    
    // For now, return mock recommendations
    const [rows] = await db.execute(`
      SELECT p.id, p.title, p.price, p.description, p.image_url, p.affiliate_url, 
             p.category, p.rating, p.original_price, p.discount
      FROM products p
      JOIN site_products sp ON p.id = sp.product_id
      WHERE sp.site_id = ?
      LIMIT 6
    `, [siteId]);
    
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      price: row.price,
      description: row.description,
      image_url: row.image_url,
      affiliate_url: row.affiliate_url,
      category: row.category,
      rating: row.rating,
      originalPrice: row.original_price,
      discount: row.discount
    }));
  } catch (error) {
    console.error('Error getting content recommendations:', error);
    return [];
  }
}

module.exports = router;