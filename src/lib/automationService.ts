import { supabase } from './supabase';
import { AffiliateService } from './affiliateService';

// Content Analysis Service
export class ContentAnalyzer {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeContent(websiteId: string, content: string) {
    try {
      const keywords = await this.extractKeywords(content);
      const products = await this.identifyProducts(keywords);
      const affiliateOpportunities = await this.matchAffiliatePrograms(products);
      
      return {
        keywords,
        products,
        affiliateOpportunities,
        contentId: this.generateContentId()
      };
    } catch (error) {
      console.error('Content analysis failed:', error);
      return null;
    }
  }

  private async extractKeywords(content: string): Promise<string[]> {
    // AI-powered keyword extraction using OpenAI or similar
    try {
      const response = await fetch('/api/ai/extract-keywords', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      
      const data = await response.json();
      return data.keywords || [];
    } catch (error) {
      // Fallback to simple keyword extraction
      return this.simpleKeywordExtraction(content);
    }
  }

  private simpleKeywordExtraction(content: string): string[] {
    // Simple keyword extraction as fallback
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private async identifyProducts(keywords: string[]): Promise<any[]> {
    const productMatches = [];
    
    for (const keyword of keywords) {
      const matches = await this.searchProductDatabase(keyword);
      productMatches.push(...matches);
    }
    
    return this.deduplicateProducts(productMatches);
  }

  private async searchProductDatabase(keyword: string): Promise<any[]> {
    // Search for products based on keywords
    // This would integrate with product APIs or databases
    return [
      {
        id: `product_${keyword}_${Date.now()}`,
        name: `${keyword} Product`,
        url: `https://example.com/product/${keyword}`,
        price: Math.floor(Math.random() * 100) + 10,
        category: 'general',
        keywords: [keyword]
      }
    ];
  }

  private deduplicateProducts(products: any[]): any[] {
    const seen = new Set();
    return products.filter(product => {
      const key = product.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async matchAffiliatePrograms(products: any[]): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get user's affiliate accounts
    const { data: accounts } = await supabase
      .from('affiliate_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const affiliateLinks = [];
    
    for (const product of products) {
      for (const account of accounts || []) {
        affiliateLinks.push({
          product,
          affiliateProgram: {
            networkId: account.id,
            platform: account.platform,
            commission: 5.0, // Default commission
            baseUrl: product.url
          }
        });
      }
    }
    
    return affiliateLinks;
  }

  private generateContentId(): string {
    return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Smart Popup System
export class SmartPopupSystem {
  private websiteId: string;
  private config: any;

  constructor(websiteId: string, config: any) {
    this.websiteId = websiteId;
    this.config = config;
  }

  async createSmartPopup(affiliateData: any, contentContext: any) {
    const popupConfig = {
      id: `popup_${Date.now()}`,
      websiteId: this.websiteId,
      affiliateLink: affiliateData.affiliateUrl,
      product: affiliateData.product,
      trigger: await this.determineOptimalTrigger(contentContext),
      design: await this.generatePopupDesign(affiliateData.product),
      targeting: this.createTargetingRules(contentContext),
      schedule: this.createScheduleRules()
    };

    return this.deployPopup(popupConfig);
  }

  private async determineOptimalTrigger(contentContext: any) {
    // AI-driven trigger optimization based on user behavior
    const behaviorData = await this.getUserBehaviorPatterns();
    
    return {
      type: 'scroll_percentage',
      value: this.calculateOptimalScrollPoint(behaviorData, contentContext),
      delay: this.calculateOptimalDelay(behaviorData),
      conditions: this.createTriggerConditions(contentContext)
    };
  }

  private async getUserBehaviorPatterns() {
    const { data } = await supabase
      .from('user_behavior_patterns')
      .select('*')
      .eq('website_id', this.websiteId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!data || data.length === 0) {
      return { scrollEngagement: 60, timeOnPage: 120, bounceRate: 0.4 };
    }

    const avgScrollDepth = data.reduce((sum, p) => sum + p.scroll_depth, 0) / data.length;
    const avgTimeOnPage = data.reduce((sum, p) => sum + p.time_on_page, 0) / data.length;

    return {
      scrollEngagement: avgScrollDepth,
      timeOnPage: avgTimeOnPage,
      bounceRate: 0.3
    };
  }

  private calculateOptimalScrollPoint(behaviorData: any, contentContext: any): number {
    const avgEngagementPoint = behaviorData.scrollEngagement || 60;
    const contentLength = contentContext.wordCount || 1000;
    
    if (contentLength > 2000) return Math.min(avgEngagementPoint + 10, 80);
    return Math.max(avgEngagementPoint - 10, 40);
  }

  private calculateOptimalDelay(behaviorData: any): number {
    return Math.max(behaviorData.timeOnPage / 4, 5000); // At least 5 seconds
  }

  private createTriggerConditions(contentContext: any) {
    return {
      minTimeOnPage: 10000, // 10 seconds
      excludeReturning: false,
      maxFrequency: 'once_per_session'
    };
  }

  private async generatePopupDesign(product: any) {
    return {
      template: 'modern_minimal',
      colors: {
        primary: '#4F46E5',
        secondary: '#10B981',
        background: '#FFFFFF',
        text: '#1F2937'
      },
      content: {
        headline: `Discover ${product.name}`,
        description: product.description || `Check out this amazing ${product.name}`,
        cta: 'Learn More',
        image: product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'
      },
      animation: 'slide_up',
      size: 'medium',
      position: 'center'
    };
  }

  private createTargetingRules(contentContext: any) {
    return {
      pageTypes: ['blog-post', 'article'],
      keywords: contentContext.keywords,
      userSegment: 'engaged_readers',
      frequency: 'once_per_session',
      excludeReturning: false
    };
  }

  private createScheduleRules() {
    return {
      startTime: '09:00',
      endTime: '22:00',
      timezone: 'UTC',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7] // All days
    };
  }

  private async deployPopup(popupConfig: any) {
    // Save popup configuration to database
    const { data, error } = await supabase
      .from('popups')
      .insert({
        website_id: this.websiteId,
        name: `Auto-generated popup for ${popupConfig.product.name}`,
        config: popupConfig,
        trigger_rules: popupConfig.trigger,
        design_settings: popupConfig.design,
        targeting_rules: popupConfig.targeting,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    // Generate popup script
    const script = this.generatePopupScript(popupConfig);
    
    return {
      popupId: data.id,
      integrationScript: script,
      config: popupConfig
    };
  }

  private generatePopupScript(config: any): string {
    return `
// Auto-generated popup script for ${this.websiteId}
(function() {
  var popupConfig = ${JSON.stringify(config, null, 2)};
  
  function createPopup() {
    var popup = document.createElement('div');
    popup.id = '${config.id}';
    popup.innerHTML = generatePopupHTML(popupConfig);
    popup.style.cssText = generatePopupCSS(popupConfig);
    
    document.body.appendChild(popup);
    addPopupEventListeners(popup, popupConfig);
    trackPopupEvent('displayed', popupConfig.id);
  }
  
  function generatePopupHTML(config) {
    return \`
      <div class="popup-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
        <div class="popup-content" style="background: white; border-radius: 12px; padding: 24px; max-width: 400px; margin: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
          <button class="popup-close" style="float: right; background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
          <img src="\${config.design.content.image}" alt="\${config.product.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #1f2937;">\${config.design.content.headline}</h3>
          <p style="margin: 0 0 20px 0; color: #6b7280; line-height: 1.5;">\${config.design.content.description}</p>
          <a href="\${config.affiliateLink}" class="popup-cta" target="_blank" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; transition: background-color 0.2s;">
            \${config.design.content.cta}
          </a>
        </div>
      </div>
    \`;
  }
  
  function generatePopupCSS(config) {
    return \`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
    \`;
  }
  
  function addPopupEventListeners(popup, config) {
    var closeBtn = popup.querySelector('.popup-close');
    var overlay = popup.querySelector('.popup-overlay');
    var ctaBtn = popup.querySelector('.popup-cta');
    
    closeBtn.addEventListener('click', function() {
      popup.remove();
      trackPopupEvent('closed', config.id);
    });
    
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        popup.remove();
        trackPopupEvent('closed', config.id);
      }
    });
    
    ctaBtn.addEventListener('click', function() {
      trackPopupEvent('clicked', config.id);
    });
  }
  
  function trackPopupEvent(eventType, popupId) {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'popup_' + eventType,
        popup_id: popupId,
        session_id: sessionStorage.getItem('session_id') || 'anonymous',
        timestamp: Date.now()
      })
    }).catch(console.error);
  }
  
  // Trigger logic
  var triggered = false;
  function checkTrigger() {
    if (triggered) return;
    
    var scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    
    if (scrollPercent >= popupConfig.trigger.value) {
      setTimeout(createPopup, popupConfig.trigger.delay || 0);
      triggered = true;
    }
  }
  
  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.addEventListener('scroll', checkTrigger);
    });
  } else {
    window.addEventListener('scroll', checkTrigger);
  }
})();`;
  }
}

// User Behavior Tracker
export class UserBehaviorTracker {
  private websiteId: string;

  constructor(websiteId: string) {
    this.websiteId = websiteId;
  }

  async trackPageView(url: string) {
    const sessionId = this.getSessionId();
    const startTime = Date.now();

    // Track scroll behavior
    let maxScrollDepth = 0;
    const trackScroll = () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      maxScrollDepth = Math.max(maxScrollDepth, scrollPercent);
    };

    window.addEventListener('scroll', trackScroll, { passive: true });

    // Track time on page
    const trackTimeOnPage = () => {
      const timeOnPage = Date.now() - startTime;
      
      this.saveBehaviorData({
        website_id: this.websiteId,
        session_id: sessionId,
        page_url: url,
        scroll_depth: Math.round(maxScrollDepth),
        time_on_page: Math.round(timeOnPage / 1000),
        device_type: this.getDeviceType(),
        interactions: this.getInteractions()
      });
    };

    // Save data when user leaves page
    window.addEventListener('beforeunload', trackTimeOnPage);
    
    // Also save periodically
    setInterval(trackTimeOnPage, 30000); // Every 30 seconds
  }

  private async saveBehaviorData(data: any) {
    try {
      await supabase
        .from('user_behavior_patterns')
        .insert(data);
    } catch (error) {
      console.error('Error saving behavior data:', error);
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  private getDeviceType(): string {
    return /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop';
  }

  private getInteractions(): any {
    return {
      clicks: 0, // Would track actual clicks
      scrolls: 0, // Would track scroll events
      timeSpent: 0 // Would track active time
    };
  }
}

// Main Automation Controller
export class AffiliateAutomationController {
  private userId: string;
  private websiteId: string;
  private contentAnalyzer: ContentAnalyzer;
  private popupSystem: SmartPopupSystem;
  private behaviorTracker: UserBehaviorTracker;

  constructor(userId: string, websiteId: string) {
    this.userId = userId;
    this.websiteId = websiteId;
    this.contentAnalyzer = new ContentAnalyzer(this.getApiKey());
    this.popupSystem = new SmartPopupSystem(websiteId, this.getPopupConfig());
    this.behaviorTracker = new UserBehaviorTracker(websiteId);
  }

  async processContent(contentData: { content: string; url: string; timestamp: number }) {
    try {
      // Step 1: Analyze content
      const analysis = await this.contentAnalyzer.analyzeContent(
        this.websiteId, 
        contentData.content
      );

      if (!analysis || !analysis.affiliateOpportunities.length) {
        return { success: false, message: 'No affiliate opportunities found' };
      }

      // Step 2: Generate affiliate links
      const affiliateLinks = [];
      for (const opportunity of analysis.affiliateOpportunities.slice(0, 3)) {
        try {
          const link = await AffiliateService.createAffiliateLink(
            opportunity.affiliateProgram.networkId,
            opportunity.product.id,
            opportunity.product.url,
            opportunity.product.name,
            opportunity.product.description
          );
          affiliateLinks.push({
            ...link.link,
            product: opportunity.product
          });
        } catch (error) {
          console.error('Error creating affiliate link:', error);
        }
      }

      // Step 3: Create smart popups
      const popups = [];
      for (const link of affiliateLinks.slice(0, 2)) { // Limit to top 2
        try {
          const popup = await this.popupSystem.createSmartPopup(link, {
            keywords: analysis.keywords,
            wordCount: contentData.content.split(' ').length
          });
          popups.push(popup);
        } catch (error) {
          console.error('Error creating popup:', error);
        }
      }

      // Step 4: Start behavior tracking
      this.behaviorTracker.trackPageView(contentData.url);

      return {
        success: true,
        data: {
          contentId: analysis.contentId,
          affiliateLinks,
          popups,
          analytics: {
            keywordsFound: analysis.keywords.length,
            opportunitiesCreated: affiliateLinks.length,
            popupsGenerated: popups.length
          }
        }
      };

    } catch (error) {
      console.error('Automation process failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private getApiKey(): string {
    return import.meta.env.VITE_OPENAI_API_KEY || 'demo-key';
  }

  private getPopupConfig() {
    return {
      maxPopupsPerSession: 2,
      respectUserPreferences: true,
      gdprCompliant: true
    };
  }
}

// Initialize automation for a website
export async function initializeAutomation(userId: string, websiteId: string, blogContent: string) {
  const controller = new AffiliateAutomationController(userId, websiteId);
  
  const result = await controller.processContent({
    content: blogContent,
    url: window.location.href,
    timestamp: Date.now()
  });
  
  if (result.success && result.data) {
    console.log('Automation successful:', result.data);
    
    // Automatically integrate popups
    result.data.popups.forEach(popup => {
      const script = document.createElement('script');
      script.textContent = popup.integrationScript;
      document.head.appendChild(script);
    });
  }
  
  return result;
}