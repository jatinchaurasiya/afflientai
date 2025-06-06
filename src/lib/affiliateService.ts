import { supabase } from './supabase';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production';

// Encryption utilities
export class EncryptionService {
  static encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  }

  static decrypt(encryptedText: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}

// Platform service interfaces
interface AffiliateCredentials {
  associate_tag?: string;
  api_key?: string;
  api_secret?: string;
  platform_name?: string;
}

interface ProductDetails {
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  commission: number;
}

interface LinkCreationResult {
  affiliateUrl: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  commission: number;
}

// Amazon Service
class AmazonService {
  private credentials: AffiliateCredentials;

  constructor(credentials: AffiliateCredentials) {
    this.credentials = credentials;
  }

  async createAffiliateLink(productId: string, originalUrl: string): Promise<LinkCreationResult> {
    try {
      // Add Amazon associate tag to URL
      const url = new URL(originalUrl);
      url.searchParams.set('tag', this.credentials.associate_tag || '');
      
      const affiliateUrl = url.toString();
      
      // In a real implementation, you would call Amazon PAAPI 5.0 here
      // For now, we'll extract basic info from the URL and use defaults
      const productDetails = await this.getProductDetails(productId);
      
      return {
        affiliateUrl,
        title: productDetails.title,
        price: productDetails.price,
        currency: productDetails.currency,
        imageUrl: productDetails.imageUrl,
        commission: productDetails.commission
      };
    } catch (error) {
      throw new Error(`Amazon API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getProductDetails(productId: string): Promise<ProductDetails> {
    // This would integrate with Amazon PAAPI 5.0 in production
    // For demo purposes, returning mock data
    return {
      title: `Amazon Product ${productId}`,
      price: 29.99,
      currency: 'USD',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
      commission: 5.0
    };
  }
}

// eBay Service
class EbayService {
  private credentials: AffiliateCredentials;

  constructor(credentials: AffiliateCredentials) {
    this.credentials = credentials;
  }

  async createAffiliateLink(productId: string, originalUrl: string): Promise<LinkCreationResult> {
    try {
      // Add eBay campaign ID to URL
      const url = new URL(originalUrl);
      url.searchParams.set('campid', this.credentials.associate_tag || '');
      
      const affiliateUrl = url.toString();
      const productDetails = await this.getProductDetails(productId);
      
      return {
        affiliateUrl,
        title: productDetails.title,
        price: productDetails.price,
        currency: productDetails.currency,
        imageUrl: productDetails.imageUrl,
        commission: productDetails.commission
      };
    } catch (error) {
      throw new Error(`eBay API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getProductDetails(productId: string): Promise<ProductDetails> {
    return {
      title: `eBay Product ${productId}`,
      price: 19.99,
      currency: 'USD',
      imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300',
      commission: 3.0
    };
  }
}

// Walmart Service
class WalmartService {
  private credentials: AffiliateCredentials;

  constructor(credentials: AffiliateCredentials) {
    this.credentials = credentials;
  }

  async createAffiliateLink(productId: string, originalUrl: string): Promise<LinkCreationResult> {
    try {
      // Walmart uses Impact Radius for affiliate tracking
      const affiliateUrl = `https://goto.walmart.com/c/${this.credentials.api_key}?u=${encodeURIComponent(originalUrl)}`;
      const productDetails = await this.getProductDetails(productId);
      
      return {
        affiliateUrl,
        title: productDetails.title,
        price: productDetails.price,
        currency: productDetails.currency,
        imageUrl: productDetails.imageUrl,
        commission: productDetails.commission
      };
    } catch (error) {
      throw new Error(`Walmart API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getProductDetails(productId: string): Promise<ProductDetails> {
    return {
      title: `Walmart Product ${productId}`,
      price: 24.99,
      currency: 'USD',
      imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300',
      commission: 4.0
    };
  }
}

// Service Factory
export class AffiliateServiceFactory {
  static createService(platform: string, credentials: AffiliateCredentials) {
    switch (platform) {
      case 'amazon':
        return new AmazonService(credentials);
      case 'ebay':
        return new EbayService(credentials);
      case 'walmart':
        return new WalmartService(credentials);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}

// Main Affiliate Service
export class AffiliateService {
  // Connect affiliate account
  static async connectAccount(platform: string, credentials: AffiliateCredentials, platformName?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Test connection by creating a service instance
      const service = AffiliateServiceFactory.createService(platform, credentials);
      
      // Encrypt credentials
      const encryptedCredentials = EncryptionService.encrypt(JSON.stringify(credentials));

      // Check if account already exists
      const { data: existingAccount } = await supabase
        .from('affiliate_accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .single();

      let result;
      if (existingAccount) {
        // Update existing account
        result = await supabase
          .from('affiliate_accounts')
          .update({
            encrypted_credentials: encryptedCredentials,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAccount.id)
          .select()
          .single();
      } else {
        // Create new account
        result = await supabase
          .from('affiliate_accounts')
          .insert({
            user_id: user.id,
            platform,
            associate_tag: credentials.associate_tag,
            api_key: credentials.api_key,
            api_secret: credentials.api_secret,
            encrypted_credentials: encryptedCredentials,
            status: 'active'
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      return {
        success: true,
        message: 'Affiliate account connected successfully',
        accountId: result.data.id
      };
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  // Create affiliate link
  static async createAffiliateLink(
    accountId: string,
    productId: string,
    originalUrl: string,
    title?: string,
    description?: string,
    widgetId?: string
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get affiliate account
      const { data: account, error: accountError } = await supabase
        .from('affiliate_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (accountError || !account) {
        throw new Error('Affiliate account not found');
      }

      // Decrypt credentials
      const credentials = JSON.parse(EncryptionService.decrypt(account.encrypted_credentials));
      
      // Create service instance
      const service = AffiliateServiceFactory.createService(account.platform, credentials);
      
      // Generate affiliate link
      const linkData = await service.createAffiliateLink(productId, originalUrl);
      
      // Generate short URL
      const { data: shortUrlData } = await supabase.rpc('generate_short_url');
      const shortUrl = `${window.location.origin}/l/${shortUrlData}`;

      // Save to database
      const { data: affiliateLink, error: linkError } = await supabase
        .from('affiliate_links')
        .insert({
          user_id: user.id,
          account_id: accountId,
          widget_id: widgetId,
          product_id: productId,
          original_url: originalUrl,
          affiliate_url: linkData.affiliateUrl,
          short_url: shortUrl,
          title: title || linkData.title,
          description,
          image_url: linkData.imageUrl,
          price: linkData.price,
          currency: linkData.currency,
          commission: linkData.commission
        })
        .select()
        .single();

      if (linkError) throw linkError;

      return {
        success: true,
        link: {
          id: affiliateLink.id,
          shortUrl,
          affiliateUrl: linkData.affiliateUrl,
          title: affiliateLink.title,
          price: linkData.price,
          commission: linkData.commission
        }
      };
    } catch (error) {
      console.error('Link creation error:', error);
      throw error;
    }
  }

  // Track click
  static async trackClick(shortCode: string, clickData: any) {
    try {
      // Find the affiliate link
      const shortUrl = `${window.location.origin}/l/${shortCode}`;
      const { data: link, error: linkError } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('short_url', shortUrl)
        .eq('is_active', true)
        .single();

      if (linkError || !link) {
        throw new Error('Link not found');
      }

      // Store click data
      const { error: clickError } = await supabase
        .from('link_clicks')
        .insert({
          link_id: link.id,
          ip_address: clickData.ip,
          user_agent: clickData.userAgent,
          referrer: clickData.referrer,
          country: clickData.country,
          city: clickData.city,
          device: clickData.device,
          browser: clickData.browser,
          session_id: clickData.sessionId
        });

      if (clickError) throw clickError;

      // Update analytics
      await supabase.rpc('update_link_analytics', {
        p_user_id: link.user_id,
        p_account_id: link.account_id,
        p_link_id: link.id,
        p_widget_id: link.widget_id,
        p_metric: 'clicks',
        p_value: 1
      });

      return link.affiliate_url;
    } catch (error) {
      console.error('Click tracking error:', error);
      throw error;
    }
  }

  // Get analytics
  static async getAnalytics(accountId?: string, startDate?: string, endDate?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('link_analytics')
        .select(`
          *,
          affiliate_accounts!inner(platform, associate_tag)
        `)
        .eq('user_id', user.id);

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data: analytics, error } = await query.order('date', { ascending: false });

      if (error) throw error;

      // Calculate summary
      const summary = analytics?.reduce(
        (acc, record) => ({
          totalClicks: acc.totalClicks + record.clicks,
          totalConversions: acc.totalConversions + record.conversions,
          totalRevenue: acc.totalRevenue + record.revenue,
          totalCommissions: acc.totalCommissions + record.commissions
        }),
        { totalClicks: 0, totalConversions: 0, totalRevenue: 0, totalCommissions: 0 }
      ) || { totalClicks: 0, totalConversions: 0, totalRevenue: 0, totalCommissions: 0 };

      return {
        success: true,
        analytics: analytics || [],
        summary
      };
    } catch (error) {
      console.error('Analytics error:', error);
      throw error;
    }
  }

  // Get user's affiliate links
  static async getAffiliateLinks(accountId?: string, page = 1, limit = 20) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('affiliate_links')
        .select(`
          *,
          affiliate_accounts!inner(platform, associate_tag)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      const { data: links, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      return {
        success: true,
        links: links || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Links fetch error:', error);
      throw error;
    }
  }
}