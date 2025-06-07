import { supabase } from './supabase';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'afflient-secure-key-2024';

// Affiliate Network Service - Handles all affiliate platform connections
export class AffiliateNetworkService {
  private static instance: AffiliateNetworkService;
  private connectedNetworks = new Map();

  static getInstance(): AffiliateNetworkService {
    if (!AffiliateNetworkService.instance) {
      AffiliateNetworkService.instance = new AffiliateNetworkService();
    }
    return AffiliateNetworkService.instance;
  }

  // Connect affiliate account from any platform
  async connectAffiliateAccount(userId: string, networkData: {
    platform: 'amazon' | 'walmart' | 'ebay' | 'shareasale' | 'cj_affiliate';
    credentials: {
      associate_tag?: string;
      api_key?: string;
      api_secret?: string;
      website_id?: string;
    };
  }) {
    try {
      // Step 1: Validate credentials with the network
      const validation = await this.validateNetworkCredentials(networkData.platform, networkData.credentials);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Step 2: Encrypt sensitive credentials
      const encryptedCredentials = this.encryptCredentials(networkData.credentials);

      // Step 3: Store affiliate account
      const { data: account, error } = await supabase
        .from('affiliate_accounts')
        .insert({
          user_id: userId,
          platform: networkData.platform,
          associate_tag: networkData.credentials.associate_tag,
          api_key: networkData.credentials.api_key,
          encrypted_credentials: encryptedCredentials,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Step 4: Sync initial product catalog
      await this.syncProductCatalog(account.id, networkData.platform, networkData.credentials);

      // Step 5: Set up real-time product updates
      await this.setupProductSync(account.id, networkData.platform);

      return {
        success: true,
        account,
        message: `${networkData.platform} account connected successfully`
      };

    } catch (error) {
      console.error('Affiliate network connection error:', error);
      throw error;
    }
  }

  // Validate network credentials
  private async validateNetworkCredentials(platform: string, credentials: any): Promise<{valid: boolean, error?: string}> {
    switch (platform) {
      case 'amazon':
        return this.validateAmazonCredentials(credentials);
      case 'walmart':
        return this.validateWalmartCredentials(credentials);
      case 'ebay':
        return this.validateEbayCredentials(credentials);
      case 'shareasale':
        return this.validateShareASaleCredentials(credentials);
      case 'cj_affiliate':
        return this.validateCJCredentials(credentials);
      default:
        return { valid: false, error: 'Unsupported platform' };
    }
  }

  private async validateAmazonCredentials(credentials: any): Promise<{valid: boolean, error?: string}> {
    if (!credentials.associate_tag || !credentials.api_key || !credentials.api_secret) {
      return { valid: false, error: 'Missing required Amazon credentials' };
    }
    
    // In production, this would make actual API calls to validate
    return { valid: true };
  }

  private async validateWalmartCredentials(credentials: any): Promise<{valid: boolean, error?: string}> {
    if (!credentials.api_key) {
      return { valid: false, error: 'Missing Walmart API key' };
    }
    return { valid: true };
  }

  private async validateEbayCredentials(credentials: any): Promise<{valid: boolean, error?: string}> {
    if (!credentials.api_key) {
      return { valid: false, error: 'Missing eBay API key' };
    }
    return { valid: true };
  }

  private async validateShareASaleCredentials(credentials: any): Promise<{valid: boolean, error?: string}> {
    if (!credentials.api_key || !credentials.associate_tag) {
      return { valid: false, error: 'Missing ShareASale credentials' };
    }
    return { valid: true };
  }

  private async validateCJCredentials(credentials: any): Promise<{valid: boolean, error?: string}> {
    if (!credentials.api_key) {
      return { valid: false, error: 'Missing CJ Affiliate API key' };
    }
    return { valid: true };
  }

  // Encrypt sensitive credentials
  private encryptCredentials(credentials: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(credentials), ENCRYPTION_KEY).toString();
  }

  // Decrypt credentials
  private decryptCredentials(encryptedCredentials: string): any {
    const bytes = CryptoJS.AES.decrypt(encryptedCredentials, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  // Sync product catalog from affiliate network
  private async syncProductCatalog(accountId: string, platform: string, credentials: any) {
    try {
      const products = await this.fetchProductsFromNetwork(platform, credentials);
      
      // Store products in database
      for (const product of products) {
        await supabase
          .from('affiliate_products')
          .upsert({
            account_id: accountId,
            external_id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            currency: product.currency,
            category: product.category,
            image_url: product.image_url,
            affiliate_url: product.affiliate_url,
            commission_rate: product.commission_rate,
            last_updated: new Date().toISOString()
          });
      }

      console.log(`Synced ${products.length} products for ${platform}`);
    } catch (error) {
      console.error('Product catalog sync error:', error);
    }
  }

  // Fetch products from affiliate network
  private async fetchProductsFromNetwork(platform: string, credentials: any): Promise<any[]> {
    // In production, this would make actual API calls to each network
    // For now, return mock data
    const mockProducts = [
      {
        id: `${platform}_product_1`,
        name: `${platform} Product 1`,
        description: `Great product from ${platform}`,
        price: 29.99,
        currency: 'USD',
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
        affiliate_url: `https://${platform}.com/product/1?tag=${credentials.associate_tag}`,
        commission_rate: 5.0
      },
      {
        id: `${platform}_product_2`,
        name: `${platform} Product 2`,
        description: `Another great product from ${platform}`,
        price: 49.99,
        currency: 'USD',
        category: 'Home & Garden',
        image_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300',
        affiliate_url: `https://${platform}.com/product/2?tag=${credentials.associate_tag}`,
        commission_rate: 7.0
      }
    ];

    return mockProducts;
  }

  // Set up real-time product sync
  private async setupProductSync(accountId: string, platform: string) {
    // This would set up periodic sync jobs
    console.log(`Setting up product sync for ${platform} account ${accountId}`);
  }

  // Get products for recommendations
  async getProductsForRecommendation(userId: string, keywords: string[], category?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('affiliate_products')
        .select(`
          *,
          affiliate_accounts!inner(user_id, platform, status)
        `)
        .eq('affiliate_accounts.user_id', userId)
        .eq('affiliate_accounts.status', 'active');

      if (category) {
        query = query.ilike('category', `%${category}%`);
      }

      const { data: products, error } = await query.limit(20);

      if (error) throw error;

      // Filter products based on keywords
      const filteredProducts = products?.filter(product => {
        const searchText = `${product.name} ${product.description}`.toLowerCase();
        return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
      }) || [];

      return filteredProducts;
    } catch (error) {
      console.error('Error fetching products for recommendation:', error);
      return [];
    }
  }

  // Create affiliate link
  async createAffiliateLink(userId: string, productId: string, websiteId?: string): Promise<any> {
    try {
      const { data: product } = await supabase
        .from('affiliate_products')
        .select(`
          *,
          affiliate_accounts!inner(user_id, platform, associate_tag)
        `)
        .eq('id', productId)
        .eq('affiliate_accounts.user_id', userId)
        .single();

      if (!product) throw new Error('Product not found');

      // Generate short URL
      const shortCode = this.generateShortCode();
      const shortUrl = `${window.location.origin}/l/${shortCode}`;

      // Create affiliate link record
      const { data: link, error } = await supabase
        .from('affiliate_links')
        .insert({
          user_id: userId,
          account_id: product.account_id,
          website_id: websiteId,
          product_id: productId,
          original_url: product.affiliate_url,
          affiliate_url: product.affiliate_url,
          short_url: shortUrl,
          title: product.name,
          description: product.description,
          image_url: product.image_url,
          price: product.price,
          currency: product.currency,
          commission: product.commission_rate
        })
        .select()
        .single();

      if (error) throw error;

      return link;
    } catch (error) {
      console.error('Error creating affiliate link:', error);
      throw error;
    }
  }

  private generateShortCode(): string {
    return Math.random().toString(36).substring(2, 8);
  }
}

export const affiliateNetworkService = AffiliateNetworkService.getInstance();