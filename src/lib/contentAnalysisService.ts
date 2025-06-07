import { supabase } from './supabase';
import { affiliateNetworkService } from './affiliateNetworkService';

// Content Analysis Service - Analyzes blog posts and identifies keywords
export class ContentAnalysisService {
  private static instance: ContentAnalysisService;

  static getInstance(): ContentAnalysisService {
    if (!ContentAnalysisService.instance) {
      ContentAnalysisService.instance = new ContentAnalysisService();
    }
    return ContentAnalysisService.instance;
  }

  // Analyze blog post content when new post is published
  async analyzeBlogPost(websiteId: string, postData: {
    url: string;
    title: string;
    content: string;
    excerpt?: string;
  }) {
    try {
      // Step 1: Extract keywords and analyze content
      const analysis = await this.performContentAnalysis(postData.content, postData.title);

      // Step 2: Identify buying intent and product mentions
      const buyingSignals = await this.identifyBuyingIntent(postData.content);

      // Step 3: Categorize content
      const category = await this.categorizeContent(postData.content);

      // Step 4: Store analysis results
      const { data: contentAnalysis, error } = await supabase
        .from('content_analysis')
        .insert({
          website_id: websiteId,
          content_url: postData.url,
          content_hash: this.generateContentHash(postData.content),
          keywords: analysis.keywords,
          products_identified: buyingSignals.products,
          analysis_score: analysis.score,
          category: category,
          buying_intent_score: buyingSignals.score,
          sentiment: analysis.sentiment
        })
        .select()
        .single();

      if (error) throw error;

      // Step 5: Trigger product recommendations
      const recommendations = await this.generateProductRecommendations(
        websiteId,
        analysis.keywords,
        category,
        buyingSignals.score
      );

      return {
        analysis: contentAnalysis,
        recommendations,
        shouldCreatePopup: buyingSignals.score > 0.6 // High buying intent
      };

    } catch (error) {
      console.error('Content analysis error:', error);
      throw error;
    }
  }

  // Perform detailed content analysis
  private async performContentAnalysis(content: string, title: string) {
    const text = `${title} ${content}`.toLowerCase();
    
    // Extract keywords using simple NLP
    const keywords = this.extractKeywords(text);
    
    // Calculate content score
    const score = this.calculateContentScore(text, keywords);
    
    // Analyze sentiment
    const sentiment = this.analyzeSentiment(text);

    return {
      keywords,
      score,
      sentiment,
      wordCount: text.split(' ').length,
      readabilityScore: this.calculateReadability(text)
    };
  }

  // Extract relevant keywords from content
  private extractKeywords(text: string): string[] {
    // Remove common stop words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);

    const words = text
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Return top keywords
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  // Identify buying intent in content
  private async identifyBuyingIntent(content: string) {
    const buyingKeywords = [
      'best', 'review', 'compare', 'buy', 'purchase', 'deal', 'discount', 'price',
      'cheap', 'affordable', 'recommend', 'vs', 'versus', 'alternative', 'guide',
      'how to choose', 'top', 'rating', 'recommendation', 'shopping', 'sale'
    ];

    const text = content.toLowerCase();
    let score = 0;
    const foundKeywords = [];
    const products = [];

    // Check for buying intent keywords
    buyingKeywords.forEach(keyword => {
      const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
      if (matches > 0) {
        score += matches * this.getKeywordWeight(keyword);
        foundKeywords.push({ keyword, frequency: matches });
      }
    });

    // Identify potential product mentions
    const productPatterns = [
      /\b\w+\s+(phone|laptop|camera|headphones|watch|tablet|speaker)\b/gi,
      /\b(iphone|samsung|apple|sony|nike|adidas)\s+\w+/gi,
      /\$\d+/g // Price mentions
    ];

    productPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      products.push(...matches);
    });

    // Normalize score (0-1)
    const normalizedScore = Math.min(score / 100, 1);

    return {
      score: normalizedScore,
      keywords: foundKeywords,
      products: [...new Set(products)], // Remove duplicates
      hasHighIntent: normalizedScore > 0.6
    };
  }

  private getKeywordWeight(keyword: string): number {
    const weights = {
      'buy': 10, 'purchase': 10, 'best': 8, 'review': 7, 'compare': 6,
      'deal': 8, 'discount': 7, 'recommend': 6, 'vs': 5, 'guide': 4
    };
    return weights[keyword] || 1;
  }

  // Categorize content
  private async categorizeContent(content: string): Promise<string> {
    const categories = {
      'technology': ['tech', 'software', 'computer', 'phone', 'app', 'digital', 'internet'],
      'health': ['health', 'fitness', 'medical', 'wellness', 'exercise', 'nutrition'],
      'fashion': ['fashion', 'clothing', 'style', 'outfit', 'dress', 'shoes'],
      'home': ['home', 'kitchen', 'furniture', 'decor', 'garden', 'cleaning'],
      'travel': ['travel', 'vacation', 'trip', 'hotel', 'flight', 'destination'],
      'food': ['food', 'recipe', 'cooking', 'restaurant', 'meal', 'ingredient'],
      'finance': ['money', 'finance', 'investment', 'budget', 'savings', 'credit'],
      'education': ['education', 'learning', 'course', 'study', 'school', 'training']
    };

    const text = content.toLowerCase();
    let bestCategory = 'general';
    let highestScore = 0;

    Object.entries(categories).forEach(([category, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
        score += matches;
      });

      if (score > highestScore) {
        highestScore = score;
        bestCategory = category;
      }
    });

    return bestCategory;
  }

  // Generate product recommendations based on analysis
  private async generateProductRecommendations(
    websiteId: string,
    keywords: string[],
    category: string,
    buyingIntentScore: number
  ) {
    try {
      // Get website owner
      const { data: website } = await supabase
        .from('websites')
        .select('user_id')
        .eq('id', websiteId)
        .single();

      if (!website) return [];

      // Get relevant products
      const products = await affiliateNetworkService.getProductsForRecommendation(
        website.user_id,
        keywords,
        category
      );

      // Score and rank products
      const scoredProducts = products.map(product => ({
        ...product,
        relevanceScore: this.calculateProductRelevance(product, keywords, category)
      }));

      // Sort by relevance and return top products
      return scoredProducts
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, buyingIntentScore > 0.8 ? 5 : 3); // More products for high intent

    } catch (error) {
      console.error('Error generating product recommendations:', error);
      return [];
    }
  }

  // Calculate product relevance score
  private calculateProductRelevance(product: any, keywords: string[], category: string): number {
    let score = 0;
    const productText = `${product.name} ${product.description}`.toLowerCase();

    // Keyword matching
    keywords.forEach(keyword => {
      if (productText.includes(keyword)) {
        score += 2;
      }
    });

    // Category matching
    if (product.category.toLowerCase().includes(category)) {
      score += 5;
    }

    // Commission rate bonus
    score += product.commission_rate * 0.1;

    return score;
  }

  // Analyze sentiment of content
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'best', 'awesome', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing'];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      positiveCount += (text.match(new RegExp(word, 'gi')) || []).length;
    });

    negativeWords.forEach(word => {
      negativeCount += (text.match(new RegExp(word, 'gi')) || []).length;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateContentScore(text: string, keywords: string[]): number {
    // Simple scoring based on content length and keyword density
    const wordCount = text.split(' ').length;
    const keywordDensity = keywords.length / wordCount;
    
    let score = Math.min(wordCount / 1000, 1) * 50; // Length score (0-50)
    score += Math.min(keywordDensity * 1000, 50); // Keyword density score (0-50)
    
    return Math.round(score);
  }

  private calculateReadability(text: string): number {
    // Simple readability score based on sentence and word length
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(' ').length;
    const avgWordsPerSentence = words / sentences;
    
    // Lower score = more readable
    return Math.max(0, 100 - avgWordsPerSentence * 2);
  }

  private generateContentHash(content: string): string {
    // Simple hash function for content
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

export const contentAnalysisService = ContentAnalysisService.getInstance();