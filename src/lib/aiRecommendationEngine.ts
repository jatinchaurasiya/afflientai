import { supabase } from './supabase';
import { contentAnalysisService } from './contentAnalysisService';
import { affiliateNetworkService } from './affiliateNetworkService';

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
      // 1. Content extraction
      const rawContent = await this.extractContent(contentUrl);
      
      // 2. Text preprocessing
      const cleanedText = this.preprocessText(rawContent);
      
      // 3. Keyword extraction
      const keywords = this.extractKeywords(cleanedText);
      
      // 4. Intent analysis
      const buyingIntent = this.analyzeIntent(keywords, cleanedText);
      
      // 5. Product category mapping
      const categories = this.categorizeContent(keywords);
      
      // 6. Store analysis results
      await this.storeAnalysis(contentUrl, websiteId, keywords, buyingIntent, categories);
      
      // 7. Get recommended products
      const recommendedProducts = await this.matchProducts(categories, keywords, websiteId);
      
      return {
        keywords,
        intentScore: buyingIntent,
        categories,
        recommendedProducts,
        shouldShowPopup: buyingIntent > 0.6
      };
    } catch (error) {
      console.error('Content analysis error:', error);
      throw error;
    }
  }

  private async extractContent(contentUrl: string): Promise<string> {
    try {
      // In production, this would fetch and parse the actual webpage
      // For now, we'll simulate content extraction
      const response = await fetch(contentUrl);
      const html = await response.text();
      
      // Extract text content from HTML (simplified)
      const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      return textContent;
    } catch (error) {
      console.error('Content extraction error:', error);
      return '';
    }
  }

  private preprocessText(rawContent: string): string {
    return rawContent
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractKeywords(cleanedText: string): string[] {
    // Buying Intent Detection keywords
    const buyingIntentKeywords = [
      'best', 'review', 'compare', 'buy', 'deal', 'discount', 'price',
      'cheap', 'affordable', 'recommend', 'vs', 'versus', 'alternative',
      'guide', 'how to choose', 'top', 'rating', 'recommendation'
    ];

    // Remove stop words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did'
    ]);

    const words = cleanedText.split(' ').filter(word => 
      word.length > 3 && !stopWords.has(word)
    );

    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Prioritize buying intent keywords
    const prioritizedKeywords = Array.from(wordCount.entries())
      .sort((a, b) => {
        const aIsBuyingIntent = buyingIntentKeywords.includes(a[0]);
        const bIsBuyingIntent = buyingIntentKeywords.includes(b[0]);
        
        if (aIsBuyingIntent && !bIsBuyingIntent) return -1;
        if (!aIsBuyingIntent && bIsBuyingIntent) return 1;
        
        return b[1] - a[1]; // Sort by frequency
      })
      .slice(0, 20)
      .map(([word]) => word);

    return prioritizedKeywords;
  }

  private analyzeIntent(keywords: string[], cleanedText: string): number {
    const buyingIntentKeywords = [
      'best', 'review', 'compare', 'buy', 'deal', 'discount', 'price',
      'cheap', 'affordable', 'recommend', 'vs', 'versus', 'alternative',
      'guide', 'how to choose', 'top', 'rating', 'recommendation', 'shopping'
    ];

    let intentScore = 0;
    const keywordWeights = {
      'buy': 10, 'purchase': 10, 'deal': 8, 'discount': 8, 'best': 7,
      'review': 6, 'compare': 6, 'recommend': 5, 'price': 4, 'cheap': 4
    };

    buyingIntentKeywords.forEach(keyword => {
      const matches = (cleanedText.match(new RegExp(keyword, 'g')) || []).length;
      const weight = keywordWeights[keyword] || 1;
      intentScore += matches * weight;
    });

    // Normalize score (0-1)
    return Math.min(intentScore / 100, 1);
  }

  private categorizeContent(keywords: string[]): string[] {
    const categoryMappings = {
      'technology': ['tech', 'software', 'computer', 'phone', 'laptop', 'app', 'digital', 'gadget'],
      'health': ['health', 'fitness', 'medical', 'wellness', 'exercise', 'nutrition', 'supplement'],
      'fashion': ['fashion', 'clothing', 'style', 'outfit', 'dress', 'shoes', 'accessories'],
      'home': ['home', 'kitchen', 'furniture', 'decor', 'garden', 'cleaning', 'appliance'],
      'travel': ['travel', 'vacation', 'trip', 'hotel', 'flight', 'destination', 'luggage'],
      'food': ['food', 'recipe', 'cooking', 'restaurant', 'meal', 'ingredient', 'kitchen'],
      'beauty': ['beauty', 'skincare', 'makeup', 'cosmetics', 'hair', 'fragrance'],
      'sports': ['sports', 'fitness', 'workout', 'gym', 'athletic', 'outdoor', 'equipment'],
      'books': ['book', 'reading', 'novel', 'education', 'learning', 'study'],
      'automotive': ['car', 'auto', 'vehicle', 'driving', 'automotive', 'motorcycle']
    };

    const detectedCategories: string[] = [];
    const keywordText = keywords.join(' ').toLowerCase();

    Object.entries(categoryMappings).forEach(([category, categoryKeywords]) => {
      const matches = categoryKeywords.filter(keyword => 
        keywordText.includes(keyword)
      ).length;
      
      if (matches > 0) {
        detectedCategories.push(category);
      }
    });

    return detectedCategories.length > 0 ? detectedCategories : ['general'];
  }

  private async storeAnalysis(
    contentUrl: string, 
    websiteId: string, 
    keywords: string[], 
    buyingIntent: number, 
    categories: string[]
  ): Promise<void> {
    try {
      await supabase.from('content_analysis').insert({
        website_id: websiteId,
        content_url: contentUrl,
        content_hash: this.generateContentHash(contentUrl),
        keywords,
        products_identified: [],
        analysis_score: Math.round(buyingIntent * 100),
        category: categories[0] || 'general',
        buying_intent_score: buyingIntent,
        sentiment: 'neutral'
      });
    } catch (error) {
      console.error('Error storing analysis:', error);
    }
  }

  private async matchProducts(categories: string[], keywords: string[], websiteId: string): Promise<any[]> {
    try {
      // Get website owner
      const { data: website } = await supabase
        .from('websites')
        .select('user_id')
        .eq('id', websiteId)
        .single();

      if (!website) return [];

      // Get user's affiliate products
      const { data: products } = await supabase
        .from('affiliate_products')
        .select(`
          *,
          affiliate_accounts!inner(user_id, platform, status)
        `)
        .eq('affiliate_accounts.user_id', website.user_id)
        .eq('affiliate_accounts.status', 'active');

      if (!products) return [];

      // Score and rank products based on relevance
      const scoredProducts = products.map(product => ({
        ...product,
        relevanceScore: this.calculateProductRelevance(product, keywords, categories)
      }));

      // Sort by relevance and return top products
      return scoredProducts
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5);

    } catch (error) {
      console.error('Error matching products:', error);
      return [];
    }
  }

  private calculateProductRelevance(product: any, keywords: string[], categories: string[]): number {
    let score = 0;
    const productText = `${product.name} ${product.description || ''}`.toLowerCase();

    // Keyword matching (40% weight)
    keywords.forEach(keyword => {
      if (productText.includes(keyword.toLowerCase())) {
        score += 4;
      }
    });

    // Category matching (40% weight)
    categories.forEach(category => {
      if (product.category?.toLowerCase().includes(category.toLowerCase())) {
        score += 4;
      }
    });

    // Commission rate bonus (20% weight)
    score += (product.commission_rate || 0) * 0.2;

    return score;
  }

  private generateContentHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
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
    contentId: string, 
    userId?: string, 
    sessionId?: string, 
    limit: number = 5
  ): Promise<any[]> {
    try {
      // 1. Content-based recommendations
      const contentRecs = await this.getContentBasedRecommendations(contentId);
      
      // 2. User behavior-based recommendations
      let userRecs: any[] = [];
      if (userId) {
        userRecs = await this.getUserBehaviorRecommendations(userId);
      }
      
      // 3. Session-based recommendations
      let sessionRecs: any[] = [];
      if (sessionId) {
        sessionRecs = await this.getSessionBasedRecommendations(sessionId);
      }
      
      // 4. Combine recommendations with weighted scoring
      const combinedRecs = this.combineRecommendations(contentRecs, userRecs, sessionRecs);
      
      // 5. Apply business rules (inventory, commission rates)
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

      // Find products matching content keywords and category
      const { data: products } = await supabase
        .from('affiliate_products')
        .select('*')
        .ilike('category', `%${analysis.category}%`)
        .limit(10);

      return products || [];
    } catch (error) {
      console.error('Content-based recommendation error:', error);
      return [];
    }
  }

  private async getUserBehaviorRecommendations(userId: string): Promise<any[]> {
    try {
      // Get user's interaction history
      const { data: interactions } = await supabase
        .from('user_interactions')
        .select('product_id, event_type')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (!interactions) return [];

      // Find similar products based on user's interaction patterns
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
      // Get session interaction history
      const { data: interactions } = await supabase
        .from('user_interactions')
        .select('product_id, event_type, metadata')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (!interactions) return [];

      // Analyze session patterns and recommend similar products
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

    // Weight content-based recommendations (50%)
    contentRecs.forEach(product => {
      combinedMap.set(product.id, {
        ...product,
        score: (combinedMap.get(product.id)?.score || 0) + 0.5
      });
    });

    // Weight user behavior recommendations (30%)
    userRecs.forEach(product => {
      combinedMap.set(product.id, {
        ...product,
        score: (combinedMap.get(product.id)?.score || 0) + 0.3
      });
    });

    // Weight session recommendations (20%)
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
    // Filter out out-of-stock products, apply commission rate preferences, etc.
    return recommendations.filter(product => {
      // Basic business rules
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
      
      // 2. Get recommendations
      const recommendations = await this.recommendationEngine.getRecommendations(
        analysis.contentId,
        userId
      );
      
      // 3. Create smart popups if high buying intent
      if (analysis.shouldShowPopup && recommendations.length > 0) {
        await this.createSmartPopup(websiteId, recommendations, analysis);
      }
      
      // 4. Update analytics
      await this.updateAnalytics(websiteId, analysis, recommendations);
      
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
      
      await supabase.from('website_analytics').upsert({
        website_id: websiteId,
        date: today,
        posts_analyzed: 1,
        keywords_extracted: analysis.keywords.length,
        products_recommended: recommendations.length,
        avg_buying_intent: analysis.intentScore
      }, {
        onConflict: 'website_id,date'
      });
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

      // Update real-time recommendations based on interaction
      if (interactionData.eventType === 'product_clicked' || interactionData.eventType === 'product_viewed') {
        await this.updateUserPreferences(interactionData);
      }
    } catch (error) {
      console.error('Error tracking user interaction:', error);
    }
  }

  private async updateUserPreferences(interactionData: any): Promise<void> {
    // Update user behavior patterns for better future recommendations
    try {
      if (interactionData.userId) {
        await supabase.rpc('update_user_preferences', {
          p_user_id: interactionData.userId,
          p_interaction_type: interactionData.eventType,
          p_product_id: interactionData.productId,
          p_value: interactionData.value || 1
        });
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }
}

export const aiRecommendationService = new AIRecommendationService();