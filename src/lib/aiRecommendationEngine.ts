import { supabase } from './supabase';

// AI-Powered Content Analysis Engine
export class ContentAnalyzer {
  private static instance: ContentAnalyzer;

  static getInstance(): ContentAnalyzer {
    if (!ContentAnalyzer.instance) {
      ContentAnalyzer.instance = new ContentAnalyzer();
    }
    return ContentAnalyzer.instance;
  }

  async analyzeContent(contentUrl: string, websiteId: string): Promise<any> {
    try {
      // Use the existing Supabase Edge Function for content analysis
      const { data, error } = await supabase.functions.invoke('analyze-content', {
        body: {
          contentUrl,
          websiteId
        }
      });

      if (error) {
        console.error('Content analysis function error:', error);
        throw error;
      }

      // Return the analysis results with contentId
      return {
        contentId: data?.contentId,
        keywords: data?.keywords || [],
        intentScore: data?.intentScore || 0,
        categories: data?.categories || ['general'],
        recommendedProducts: data?.recommendedProducts || [],
        shouldShowPopup: (data?.intentScore || 0) > 0.6
      };
    } catch (error) {
      console.error('Content analysis error:', error);
      // Return fallback data to prevent crashes
      return {
        contentId: null,
        keywords: [],
        intentScore: 0,
        categories: ['general'],
        recommendedProducts: [],
        shouldShowPopup: false
      };
    }
  }
}

// Product Recommendation Engine
export class ProductRecommendationEngine {
  private static instance: ProductRecommendationEngine;

  static getInstance(): ProductRecommendationEngine {
    if (!ProductRecommendationEngine.instance) {
      ProductRecommendationEngine.instance = new ProductRecommendationEngine();
    }
    return ProductRecommendationEngine.instance;
  }

  async getRecommendations(
    contentId: string | null, 
    userId?: string, 
    sessionId?: string, 
    limit: number = 5
  ): Promise<any[]> {
    try {
      // Skip content-based recommendations if contentId is null/undefined
      let contentRecs: any[] = [];
      if (contentId) {
        contentRecs = await this.getContentBasedRecommendations(contentId);
      }
      
      let userRecs: any[] = [];
      if (userId) {
        userRecs = await this.getUserBehaviorRecommendations(userId);
      }
      
      let sessionRecs: any[] = [];
      if (sessionId) {
        sessionRecs = await this.getSessionBasedRecommendations(sessionId);
      }
      
      const combinedRecs = this.combineRecommendations(contentRecs, userRecs, sessionRecs);
      const filteredRecs = await this.applyBusinessFilters(combinedRecs);
      
      return filteredRecs.slice(0, limit);
    } catch (error) {
      console.error('Recommendation engine error:', error);
      return [];
    }
  }

  private async getContentBasedRecommendations(contentId: string): Promise<any[]> {
    try {
      const { data: analysis } = await supabase
        .from('content_analysis')
        .select('*')
        .eq('id', contentId)
        .single();

      if (!analysis) return [];

      // Get website owner to find their products
      const { data: website } = await supabase
        .from('websites')
        .select('user_id')
        .eq('id', analysis.website_id)
        .single();

      if (!website) return [];

      // Find products from user's affiliate accounts
      const { data: products } = await supabase
        .from('affiliate_products')
        .select(`
          *,
          affiliate_accounts!inner(user_id, platform, status)
        `)
        .eq('affiliate_accounts.user_id', website.user_id)
        .eq('affiliate_accounts.status', 'active')
        .limit(10);

      return products || [];
    } catch (error) {
      console.error('Content-based recommendation error:', error);
      return [];
    }
  }

  private async getUserBehaviorRecommendations(userId: string): Promise<any[]> {
    try {
      const { data: interactions } = await supabase
        .from('user_interactions')
        .select('product_id, event_type')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (!interactions) return [];

      const interactedProductIds = interactions
        .filter(i => i.product_id)
        .map(i => i.product_id);

      if (interactedProductIds.length === 0) return [];

      const { data: products } = await supabase
        .from('affiliate_products')
        .select('*')
        .in('id', interactedProductIds.slice(0, 5));

      return products || [];
    } catch (error) {
      console.error('User behavior recommendation error:', error);
      return [];
    }
  }

  private async getSessionBasedRecommendations(sessionId: string): Promise<any[]> {
    try {
      const { data: interactions } = await supabase
        .from('user_interactions')
        .select('product_id, event_type, metadata')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (!interactions) return [];

      const viewedProducts = interactions
        .filter(i => i.product_id && i.event_type === 'product_viewed')
        .map(i => i.product_id);

      if (viewedProducts.length === 0) return [];

      const { data: products } = await supabase
        .from('affiliate_products')
        .select('*')
        .in('id', viewedProducts.slice(0, 3));

      return products || [];
    } catch (error) {
      console.error('Session-based recommendation error:', error);
      return [];
    }
  }

  private combineRecommendations(
    contentRecs: any[], 
    userRecs: any[], 
    sessionRecs: any[]
  ): any[] {
    const combinedMap = new Map();

    contentRecs.forEach(product => {
      combinedMap.set(product.id, {
        ...product,
        score: (combinedMap.get(product.id)?.score || 0) + 0.5
      });
    });

    userRecs.forEach(product => {
      combinedMap.set(product.id, {
        ...product,
        score: (combinedMap.get(product.id)?.score || 0) + 0.3
      });
    });

    sessionRecs.forEach(product => {
      combinedMap.set(product.id, {
        ...product,
        score: (combinedMap.get(product.id)?.score || 0) + 0.2
      });
    });

    return Array.from(combinedMap.values())
      .sort((a, b) => b.score - a.score);
  }

  private async applyBusinessFilters(recommendations: any[]): Promise<any[]> {
    return recommendations.filter(product => {
      return product.price > 0 && 
             product.commission_rate > 0 && 
             product.affiliate_url;
    });
  }
}

// Main AI Recommendation Service
export class AIRecommendationService {
  private contentAnalyzer: ContentAnalyzer;
  private recommendationEngine: ProductRecommendationEngine;

  constructor() {
    this.contentAnalyzer = ContentAnalyzer.getInstance();
    this.recommendationEngine = ProductRecommendationEngine.getInstance();
  }

  async processNewBlogPost(websiteId: string, postUrl: string, userId: string): Promise<any> {
    try {
      // 1. Analyze content
      const analysis = await this.contentAnalyzer.analyzeContent(postUrl, websiteId);
      
      // 2. Get recommendations - handle null contentId
      const recommendations = await this.recommendationEngine.getRecommendations(
        analysis.contentId,
        userId
      );
      
      // 3. Create smart popups if high buying intent
      if (analysis.shouldShowPopup && recommendations.length > 0) {
        await this.createSmartPopup(websiteId, recommendations, analysis);
      }
      
      // 4. Update analytics - only if we have a valid website
      if (websiteId) {
        await this.updateAnalytics(websiteId, analysis, recommendations);
      }
      
      return {
        success: true,
        analysis,
        recommendations,
        popupCreated: analysis.shouldShowPopup
      };
    } catch (error) {
      console.error('AI recommendation processing error:', error);
      throw error;
    }
  }

  private async createSmartPopup(websiteId: string, recommendations: any[], analysis: any): Promise<void> {
    try {
      const popupConfig = {
        type: 'smart-recommendation',
        trigger: {
          scrollPercentage: analysis.intentScore > 0.8 ? 30 : 50,
          timeDelay: analysis.intentScore > 0.8 ? 3000 : 5000
        },
        content: {
          headline: `Perfect ${analysis.categories[0]} Products for You!`,
          description: 'Based on what you\'re reading, these products are perfect for you.',
          products: recommendations.slice(0, 3)
        },
        design: {
          template: 'modern-card',
          colors: {
            primary: '#4F46E5',
            secondary: '#10B981'
          }
        }
      };

      await supabase.from('popups').insert({
        website_id: websiteId,
        name: `AI Generated - ${analysis.categories[0]}`,
        config: popupConfig,
        trigger_rules: popupConfig.trigger,
        design_settings: popupConfig.design,
        status: 'active'
      });
    } catch (error) {
      console.error('Error creating smart popup:', error);
    }
  }

  private async updateAnalytics(websiteId: string, analysis: any, recommendations: any[]): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // First check if the website belongs to the current user
      const { data: website } = await supabase
        .from('websites')
        .select('user_id')
        .eq('id', websiteId)
        .single();

      if (!website) {
        console.warn('Website not found for analytics update');
        return;
      }

      // Use a more specific upsert approach
      const { data: existingAnalytics } = await supabase
        .from('website_analytics')
        .select('*')
        .eq('website_id', websiteId)
        .eq('date', today)
        .single();

      if (existingAnalytics) {
        // Update existing record
        await supabase
          .from('website_analytics')
          .update({
            posts_analyzed: (existingAnalytics.posts_analyzed || 0) + 1,
            keywords_extracted: (existingAnalytics.keywords_extracted || 0) + analysis.keywords.length,
            products_recommended: (existingAnalytics.products_recommended || 0) + recommendations.length,
            avg_buying_intent: ((existingAnalytics.avg_buying_intent || 0) + analysis.intentScore) / 2
          })
          .eq('id', existingAnalytics.id);
      } else {
        // Insert new record
        await supabase
          .from('website_analytics')
          .insert({
            website_id: websiteId,
            date: today,
            posts_analyzed: 1,
            keywords_extracted: analysis.keywords.length,
            products_recommended: recommendations.length,
            avg_buying_intent: analysis.intentScore
          });
      }
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }

  async trackUserInteraction(interactionData: {
    websiteId: string;
    sessionId: string;
    userId?: string;
    eventType: string;
    productId?: string;
    popupId?: string;
    value?: number;
    metadata?: any;
  }): Promise<void> {
    try {
      await supabase.from('user_interactions').insert({
        website_id: interactionData.websiteId,
        session_id: interactionData.sessionId,
        user_id: interactionData.userId,
        event_type: interactionData.eventType,
        product_id: interactionData.productId,
        popup_id: interactionData.popupId,
        event_value: interactionData.value,
        metadata: interactionData.metadata || {}
      });

      if (interactionData.eventType === 'product_clicked' || interactionData.eventType === 'product_viewed') {
        await this.updateUserPreferences(interactionData);
      }
    } catch (error) {
      console.error('Error tracking user interaction:', error);
    }
  }

  private async updateUserPreferences(interactionData: any): Promise<void> {
    try {
      if (interactionData.userId) {
        // Simple preference update without RPC
        const { data: profile } = await supabase
          .from('user_behavior_profiles')
          .select('*')
          .eq('user_id', interactionData.userId)
          .single();

        if (profile) {
          const updatedPreferences = {
            ...profile.preferences,
            [interactionData.eventType]: (profile.preferences?.[interactionData.eventType] || 0) + 1
          };

          await supabase
            .from('user_behavior_profiles')
            .update({ preferences: updatedPreferences })
            .eq('user_id', interactionData.userId);
        }
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }
}

export const aiRecommendationService = new AIRecommendationService();