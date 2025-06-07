import { supabase } from './supabase';
import { platformIntegration } from './platformIntegration';
import { contentAnalysisService } from './contentAnalysisService';
import { smartPopupService } from './smartPopupService';
import { affiliateNetworkService } from './affiliateNetworkService';

// Automation Orchestrator - Coordinates all interconnected processes
export class AutomationOrchestrator {
  private static instance: AutomationOrchestrator;

  static getInstance(): AutomationOrchestrator {
    if (!AutomationOrchestrator.instance) {
      AutomationOrchestrator.instance = new AutomationOrchestrator();
    }
    return AutomationOrchestrator.instance;
  }

  // Main orchestration method - triggered when new blog post is detected
  async processBlogPost(websiteId: string, postData: {
    url: string;
    title: string;
    content: string;
    excerpt?: string;
    publishedAt: string;
  }) {
    try {
      console.log(`Processing new blog post: ${postData.title}`);

      // Step 1: Analyze content and extract insights
      const analysisResult = await contentAnalysisService.analyzeBlogPost(websiteId, postData);

      // Step 2: Get website and user information
      const { data: website } = await supabase
        .from('websites')
        .select('user_id, settings')
        .eq('id', websiteId)
        .single();

      if (!website) throw new Error('Website not found');

      // Step 3: Check if user has automation rules enabled
      const { data: automationRules } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('user_id', website.user_id)
        .eq('is_active', true);

      // Step 4: Process automation rules
      for (const rule of automationRules || []) {
        await this.processAutomationRule(rule, analysisResult, postData, websiteId);
      }

      // Step 5: Create smart popups if conditions are met
      if (analysisResult.shouldCreatePopup && analysisResult.recommendations.length > 0) {
        await this.createAutomaticPopup(website.user_id, websiteId, analysisResult);
      }

      // Step 6: Update analytics and tracking
      await this.updateAnalytics(websiteId, analysisResult, postData);

      return {
        success: true,
        analysis: analysisResult.analysis,
        popupsCreated: analysisResult.shouldCreatePopup ? 1 : 0,
        recommendationsGenerated: analysisResult.recommendations.length
      };

    } catch (error) {
      console.error('Blog post processing error:', error);
      throw error;
    }
  }

  // Process individual automation rule
  private async processAutomationRule(rule: any, analysisResult: any, postData: any, websiteId: string) {
    try {
      const conditions = rule.conditions;
      const actions = rule.actions;

      // Check if conditions are met
      const conditionsMet = this.evaluateConditions(conditions, analysisResult, postData);

      if (conditionsMet) {
        console.log(`Automation rule "${rule.name}" triggered`);

        // Execute actions
        if (actions.autoCreateLinks) {
          await this.createAutomaticAffiliateLinks(rule.user_id, analysisResult.recommendations);
        }

        if (actions.autoCreatePopups) {
          await this.createAutomaticPopup(rule.user_id, websiteId, analysisResult);
        }

        if (actions.notifyUser) {
          await this.notifyUser(rule.user_id, rule.name, analysisResult);
        }

        // Log automation execution
        await this.logAutomationExecution(rule.id, analysisResult.analysis.id, actions);
      }

    } catch (error) {
      console.error('Automation rule processing error:', error);
    }
  }

  // Evaluate automation conditions
  private evaluateConditions(conditions: any, analysisResult: any, postData: any): boolean {
    try {
      // Check keyword conditions
      if (conditions.keywords && conditions.keywords.length > 0) {
        const hasKeywords = conditions.keywords.some(keyword =>
          analysisResult.analysis.keywords.includes(keyword.toLowerCase())
        );
        if (!hasKeywords) return false;
      }

      // Check buying intent threshold
      if (conditions.minBuyingIntent) {
        if (analysisResult.analysis.buying_intent_score < conditions.minBuyingIntent) {
          return false;
        }
      }

      // Check content category
      if (conditions.categories && conditions.categories.length > 0) {
        if (!conditions.categories.includes(analysisResult.analysis.category)) {
          return false;
        }
      }

      // Check minimum commission
      if (conditions.minCommission) {
        const hasHighCommissionProducts = analysisResult.recommendations.some(
          product => product.commission_rate >= conditions.minCommission
        );
        if (!hasHighCommissionProducts) return false;
      }

      return true;
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false;
    }
  }

  // Create automatic affiliate links
  private async createAutomaticAffiliateLinks(userId: string, recommendations: any[]) {
    try {
      const linkPromises = recommendations.slice(0, 5).map(async (product) => {
        return await affiliateNetworkService.createAffiliateLink(userId, product.id);
      });

      const links = await Promise.all(linkPromises);
      console.log(`Created ${links.length} automatic affiliate links`);
      return links;
    } catch (error) {
      console.error('Automatic link creation error:', error);
      return [];
    }
  }

  // Create automatic popup
  private async createAutomaticPopup(userId: string, websiteId: string, analysisResult: any) {
    try {
      const popupName = `Auto: ${analysisResult.analysis.category} - ${new Date().toLocaleDateString()}`;
      
      const popup = await smartPopupService.createSmartPopup(userId, {
        websiteId,
        name: popupName,
        products: analysisResult.recommendations.slice(0, 3),
        contentAnalysis: analysisResult.analysis,
        triggerRules: {
          scrollPercentage: analysisResult.analysis.buying_intent_score > 0.7 ? 30 : 50,
          timeDelay: analysisResult.analysis.buying_intent_score > 0.7 ? 3000 : 5000
        }
      });

      console.log(`Created automatic popup: ${popupName}`);
      return popup;
    } catch (error) {
      console.error('Automatic popup creation error:', error);
      return null;
    }
  }

  // Notify user about automation execution
  private async notifyUser(userId: string, ruleName: string, analysisResult: any) {
    try {
      // Create notification record
      await supabase
        .from('user_notifications')
        .insert({
          user_id: userId,
          type: 'automation_triggered',
          title: 'Automation Rule Triggered',
          message: `Your automation rule "${ruleName}" was triggered and created ${analysisResult.recommendations.length} product recommendations.`,
          data: {
            rule_name: ruleName,
            recommendations_count: analysisResult.recommendations.length,
            buying_intent_score: analysisResult.analysis.buying_intent_score
          }
        });

      console.log(`Notified user ${userId} about automation execution`);
    } catch (error) {
      console.error('User notification error:', error);
    }
  }

  // Log automation execution
  private async logAutomationExecution(ruleId: string, analysisId: string, actions: any) {
    try {
      await supabase
        .from('automation_executions')
        .insert({
          rule_id: ruleId,
          content_analysis_id: analysisId,
          actions_executed: actions,
          executed_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Automation logging error:', error);
    }
  }

  // Update analytics and tracking
  private async updateAnalytics(websiteId: string, analysisResult: any, postData: any) {
    try {
      // Update website analytics
      await supabase
        .from('website_analytics')
        .upsert({
          website_id: websiteId,
          date: new Date().toISOString().split('T')[0],
          posts_analyzed: 1,
          keywords_extracted: analysisResult.analysis.keywords.length,
          products_recommended: analysisResult.recommendations.length,
          avg_buying_intent: analysisResult.analysis.buying_intent_score
        }, {
          onConflict: 'website_id,date',
          ignoreDuplicates: false
        });

      console.log('Updated analytics for website', websiteId);
    } catch (error) {
      console.error('Analytics update error:', error);
    }
  }

  // Handle user interactions (clicks, purchases, etc.)
  async trackUserInteraction(interactionData: {
    websiteId: string;
    sessionId: string;
    userId?: string;
    type: 'click' | 'view' | 'purchase' | 'popup_interaction';
    productId?: string;
    popupId?: string;
    value?: number;
    metadata?: any;
  }) {
    try {
      // Store interaction
      await supabase
        .from('user_interactions')
        .insert({
          website_id: interactionData.websiteId,
          session_id: interactionData.sessionId,
          user_id: interactionData.userId,
          event_type: interactionData.type,
          product_id: interactionData.productId,
          popup_id: interactionData.popupId,
          event_value: interactionData.value,
          metadata: interactionData.metadata || {},
          timestamp: new Date().toISOString()
        });

      // Update real-time analytics
      await this.updateRealTimeAnalytics(interactionData);

      // Check for conversion tracking
      if (interactionData.type === 'purchase') {
        await this.trackConversion(interactionData);
      }

      // Update user behavior profile
      await this.updateUserBehaviorProfile(interactionData);

    } catch (error) {
      console.error('User interaction tracking error:', error);
    }
  }

  // Update real-time analytics
  private async updateRealTimeAnalytics(interactionData: any) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Update daily metrics
      await supabase.rpc('update_daily_metrics', {
        p_website_id: interactionData.websiteId,
        p_date: today,
        p_metric_type: interactionData.type,
        p_increment: 1,
        p_value: interactionData.value || 0
      });

    } catch (error) {
      console.error('Real-time analytics update error:', error);
    }
  }

  // Track conversions
  private async trackConversion(interactionData: any) {
    try {
      // Find the affiliate link that led to this conversion
      const { data: link } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('product_id', interactionData.productId)
        .single();

      if (link) {
        // Update link analytics
        await supabase
          .from('link_analytics')
          .upsert({
            user_id: link.user_id,
            account_id: link.account_id,
            link_id: link.id,
            date: new Date().toISOString().split('T')[0],
            conversions: 1,
            revenue: interactionData.value || 0,
            commissions: (interactionData.value || 0) * (link.commission / 100)
          }, {
            onConflict: 'user_id,account_id,link_id,date'
          });

        console.log(`Tracked conversion for link ${link.id}: $${interactionData.value}`);
      }

    } catch (error) {
      console.error('Conversion tracking error:', error);
    }
  }

  // Update user behavior profile
  private async updateUserBehaviorProfile(interactionData: any) {
    try {
      if (!interactionData.userId) return;

      // Update user preferences based on interactions
      await supabase.rpc('update_user_preferences', {
        p_user_id: interactionData.userId,
        p_interaction_type: interactionData.type,
        p_product_id: interactionData.productId,
        p_value: interactionData.value || 0
      });

    } catch (error) {
      console.error('User behavior profile update error:', error);
    }
  }

  // Monitor website for new content
  async monitorWebsiteContent(websiteId: string) {
    try {
      const { data: website } = await supabase
        .from('websites')
        .select('*')
        .eq('id', websiteId)
        .single();

      if (!website || website.status !== 'active') return;

      // Check for new content (this would be implemented with webhooks or RSS feeds)
      const newPosts = await this.detectNewContent(website);

      for (const post of newPosts) {
        await this.processBlogPost(websiteId, post);
      }

    } catch (error) {
      console.error('Website monitoring error:', error);
    }
  }

  // Detect new content (placeholder - would use RSS, webhooks, or API polling)
  private async detectNewContent(website: any): Promise<any[]> {
    // This would implement actual content detection logic
    // For now, return empty array
    return [];
  }

  // Initialize automation for a user
  async initializeUserAutomation(userId: string) {
    try {
      // Get user's websites
      const { data: websites } = await supabase
        .from('websites')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      // Set up monitoring for each website
      for (const website of websites || []) {
        await this.setupWebsiteMonitoring(website.id);
      }

      console.log(`Initialized automation for user ${userId} with ${websites?.length || 0} websites`);
    } catch (error) {
      console.error('User automation initialization error:', error);
    }
  }

  // Set up website monitoring
  private async setupWebsiteMonitoring(websiteId: string) {
    try {
      // This would set up real-time monitoring (webhooks, RSS feeds, etc.)
      console.log(`Setting up monitoring for website ${websiteId}`);
      
      // Store monitoring configuration
      await supabase
        .from('website_monitoring')
        .upsert({
          website_id: websiteId,
          status: 'active',
          last_check: new Date().toISOString(),
          check_interval: 300000 // 5 minutes
        });

    } catch (error) {
      console.error('Website monitoring setup error:', error);
    }
  }
}

export const automationOrchestrator = AutomationOrchestrator.getInstance();