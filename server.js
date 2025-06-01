import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { google } from 'googleapis';
import aws4 from 'aws4';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Amazon Product Advertising API Helper
class AmazonPAAPI {
  constructor(accessKey, secretKey, partnerTag, marketplace = 'webservices.amazon.com') {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.partnerTag = partnerTag;
    this.marketplace = marketplace;
    this.region = 'us-east-1';
    this.service = 'ProductAdvertisingAPI';
  }
  
  async makeRequest(operation, payload) {
    const host = this.marketplace;
    const uri = '/paapi5/' + operation.toLowerCase();
    
    const requestPayload = {
      ...payload,
      PartnerTag: this.partnerTag,
      PartnerType: 'Associates',
      Marketplace: `www.${this.marketplace.replace('webservices.', '')}`
    };
    
    const options = {
      host: host,
      path: uri,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Amz-Target': `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}`
      },
      body: JSON.stringify(requestPayload),
      region: this.region,
      service: this.service
    };
    
    const signedOptions = aws4.sign(options, {
      accessKeyId: this.accessKey,
      secretAccessKey: this.secretKey
    });
    
    try {
      const response = await axios({
        method: 'POST',
        url: `https://${host}${uri}`,
        headers: signedOptions.headers,
        data: requestPayload
      });
      
      return response.data;
    } catch (error) {
      console.error('Amazon PA-API Error:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async getItemDetails(asins) {
    return await this.makeRequest('GetItems', {
      ItemIds: asins,
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'ItemInfo.Features',
        'Offers.Listings.Price'
      ]
    });
  }
  
  async searchItems(keywords, itemCount = 10) {
    return await this.makeRequest('SearchItems', {
      Keywords: keywords,
      SearchIndex: 'All',
      ItemCount: itemCount,
      Resources: [
        'Images.Primary.Medium',
        'ItemInfo.Title',
        'Offers.Listings.Price'
      ]
    });
  }
}

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) throw error;
    if (!user) throw new Error('User not found');
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Analytics Routes
app.get('/api/analytics/overview', authenticateToken, async (req, res) => {
  try {
    const { data: analyticsData, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('widget_id', req.query.widgetId)
      .order('date', { ascending: false })
      .limit(30);
      
    if (error) throw error;
    
    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.post('/api/analytics/track', async (req, res) => {
  try {
    const { widgetId, eventType, productId } = req.body;
    
    const { data: widget, error: widgetError } = await supabase
      .from('widgets')
      .select('user_id')
      .eq('id', widgetId)
      .single();
      
    if (widgetError) throw widgetError;
    
    const { error: analyticsError } = await supabase
      .from('analytics')
      .upsert({
        widget_id: widgetId,
        date: new Date().toISOString().split('T')[0],
        [eventType]: supabase.raw('?? + 1', [eventType])
      }, {
        onConflict: 'widget_id,date'
      });
      
    if (analyticsError) throw analyticsError;
    
    res.json({ success: true });
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Product Search Routes
app.get('/api/products/search', authenticateToken, async (req, res) => {
  try {
    const { query, category } = req.query;
    
    const { data: affiliateAccount, error: accountError } = await supabase
      .from('affiliate_accounts')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('platform', 'amazon')
      .single();
      
    if (accountError) throw accountError;
    
    const amazon = new AmazonPAAPI(
      affiliateAccount.api_key,
      affiliateAccount.api_secret,
      affiliateAccount.associate_tag
    );
    
    const searchResults = await amazon.searchItems(query);
    
    res.json({
      success: true,
      products: searchResults.ItemsResult.Items
    });
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// Blog Verification Routes
app.post('/api/blogs/verify', authenticateToken, async (req, res) => {
  try {
    const { blogId } = req.body;
    
    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', blogId)
      .eq('user_id', req.user.id)
      .single();
      
    if (blogError) throw blogError;
    
    // Verify the blog (implementation depends on verification method)
    const isVerified = true; // Replace with actual verification logic
    
    const { error: updateError } = await supabase
      .from('blogs')
      .update({
        verification_status: isVerified ? 'verified' : 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', blogId);
      
    if (updateError) throw updateError;
    
    res.json({
      success: true,
      verified: isVerified
    });
  } catch (error) {
    console.error('Blog verification error:', error);
    res.status(500).json({ error: 'Failed to verify blog' });
  }
});

// Widget Routes
app.post('/api/widgets/create', authenticateToken, async (req, res) => {
  try {
    const { blogId, name, settings } = req.body;
    
    const { data: widget, error } = await supabase
      .from('widgets')
      .insert({
        user_id: req.user.id,
        blog_id: blogId,
        name,
        settings
      })
      .select()
      .single();
      
    if (error) throw error;
    
    res.json({
      success: true,
      widget
    });
  } catch (error) {
    console.error('Widget creation error:', error);
    res.status(500).json({ error: 'Failed to create widget' });
  }
});

// Start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Affiliate & Blog Analytics API running on port ${port}`);
});

export default app;