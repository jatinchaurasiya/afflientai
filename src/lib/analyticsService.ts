import { supabase } from './supabase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

// Analytics Service - Comprehensive analytics and reporting
export class AnalyticsService {
  private static instance: AnalyticsService;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Get comprehensive dashboard metrics
  async getDashboardMetrics(userId: string, dateRange: { start: Date; end: Date }) {
    try {
      const metrics = {
        overview: await this.getOverviewMetrics(userId, dateRange),
        trends: await this.getTrendMetrics(userId, dateRange),
        performance: await this.getPerformanceMetrics(userId, dateRange),
        user_behavior: await this.getUserBehaviorMetrics(userId, dateRange),
        predictions: await this.getPredictiveMetrics(userId, dateRange)
      };

      return metrics;
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      throw error;
    }
  }

  // Get overview metrics
  private async getOverviewMetrics(userId: string, dateRange: { start: Date; end: Date }) {
    try {
      // Get basic counts
      const [websitesResult, linksResult, popupsResult, automationResult] = await Promise.all([
        supabase.from('websites').select('id').eq('user_id', userId),
        supabase.from('affiliate_links').select('id').eq('user_id', userId).eq('is_active', true),
        supabase.from('popups').select('id').eq('status', 'active'),
        supabase.from('automation_rules').select('id').eq('user_id', userId).eq('is_active', true)
      ]);

      // Get analytics data
      const { data: analytics } = await supabase
        .from('link_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.end, 'yyyy-MM-dd'));

      // Calculate totals
      const totals = analytics?.reduce((acc, record) => ({
        clicks: acc.clicks + (record.clicks || 0),
        conversions: acc.conversions + (record.conversions || 0),
        revenue: acc.revenue + (record.revenue || 0),
        commissions: acc.commissions + (record.commissions || 0)
      }), { clicks: 0, conversions: 0, revenue: 0, commissions: 0 }) || 
      { clicks: 0, conversions: 0, revenue: 0, commissions: 0 };

      return {
        total_websites: websitesResult.data?.length || 0,
        total_affiliate_links: linksResult.data?.length || 0,
        active_popups: popupsResult.data?.length || 0,
        automation_rules: automationResult.data?.length || 0,
        total_clicks: totals.clicks,
        total_conversions: totals.conversions,
        total_revenue: totals.revenue,
        total_commissions: totals.commissions,
        conversion_rate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0,
        avg_order_value: totals.conversions > 0 ? totals.revenue / totals.conversions : 0
      };
    } catch (error) {
      console.error('Overview metrics error:', error);
      return {
        total_websites: 0,
        total_affiliate_links: 0,
        active_popups: 0,
        automation_rules: 0,
        total_clicks: 0,
        total_conversions: 0,
        total_revenue: 0,
        total_commissions: 0,
        conversion_rate: 0,
        avg_order_value: 0
      };
    }
  }

  // Get trend metrics
  private async getTrendMetrics(userId: string, dateRange: { start: Date; end: Date }) {
    try {
      const { data: analytics } = await supabase
        .from('link_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.end, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      // Group by date
      const dailyMetrics = new Map();
      
      analytics?.forEach(record => {
        const date = record.date;
        if (!dailyMetrics.has(date)) {
          dailyMetrics.set(date, {
            date,
            clicks: 0,
            conversions: 0,
            revenue: 0,
            commissions: 0
          });
        }
        
        const day = dailyMetrics.get(date);
        day.clicks += record.clicks || 0;
        day.conversions += record.conversions || 0;
        day.revenue += record.revenue || 0;
        day.commissions += record.commissions || 0;
      });

      const revenue_trend = Array.from(dailyMetrics.values());
      const clicks_trend = revenue_trend.map(day => ({ date: day.date, clicks: day.clicks }));
      const conversion_trend = revenue_trend.map(day => ({ 
        date: day.date, 
        conversion_rate: day.clicks > 0 ? (day.conversions / day.clicks) * 100 : 0 
      }));

      return {
        revenue_trend,
        clicks_trend,
        conversion_trend
      };
    } catch (error) {
      console.error('Trend metrics error:', error);
      return {
        revenue_trend: [],
        clicks_trend: [],
        conversion_trend: []
      };
    }
  }

  // Get performance metrics
  private async getPerformanceMetrics(userId: string, dateRange: { start: Date; end: Date }) {
    try {
      // Top performing popups
      const { data: popupPerformance } = await supabase
        .from('popup_events')
        .select(`
          popup_id,
          popups!inner(name),
          event_type
        `)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      // Group popup performance
      const popupMetrics = new Map();
      popupPerformance?.forEach(event => {
        const popupId = event.popup_id;
        if (!popupMetrics.has(popupId)) {
          popupMetrics.set(popupId, {
            id: popupId,
            name: event.popups.name,
            displays: 0,
            clicks: 0,
            conversions: 0,
            revenue: 0
          });
        }
        
        const metrics = popupMetrics.get(popupId);
        if (event.event_type === 'popup_displayed') metrics.displays++;
        if (event.event_type === 'popup_clicked') metrics.clicks++;
        if (event.event_type === 'conversion') {
          metrics.conversions++;
          metrics.revenue += event.metadata?.value || 0;
        }
      });

      const top_performing_popups = Array.from(popupMetrics.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Top performing affiliate links
      const { data: linkPerformance } = await supabase
        .from('link_analytics')
        .select(`
          *,
          affiliate_links!inner(title, product_id)
        `)
        .eq('user_id', userId)
        .gte('date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.end, 'yyyy-MM-dd'))
        .order('revenue', { ascending: false })
        .limit(10);

      const top_performing_links = linkPerformance?.map(link => ({
        id: link.link_id,
        title: link.affiliate_links.title,
        clicks: link.clicks,
        conversions: link.conversions,
        revenue: link.revenue,
        conversion_rate: link.clicks > 0 ? (link.conversions / link.clicks) * 100 : 0
      })) || [];

      // Platform performance
      const { data: platformPerformance } = await supabase
        .from('link_analytics')
        .select(`
          *,
          affiliate_accounts!inner(platform)
        `)
        .eq('user_id', userId)
        .gte('date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.end, 'yyyy-MM-dd'));

      const platformMetrics = new Map();
      platformPerformance?.forEach(record => {
        const platform = record.affiliate_accounts.platform;
        if (!platformMetrics.has(platform)) {
          platformMetrics.set(platform, {
            platform,
            clicks: 0,
            conversions: 0,
            revenue: 0,
            commissions: 0
          });
        }
        
        const metrics = platformMetrics.get(platform);
        metrics.clicks += record.clicks || 0;
        metrics.conversions += record.conversions || 0;
        metrics.revenue += record.revenue || 0;
        metrics.commissions += record.commissions || 0;
      });

      const platform_performance = Array.from(platformMetrics.values());

      return {
        top_performing_popups,
        top_performing_links,
        platform_performance
      };
    } catch (error) {
      console.error('Performance metrics error:', error);
      return {
        top_performing_popups: [],
        top_performing_links: [],
        platform_performance: []
      };
    }
  }

  // Get user behavior metrics
  private async getUserBehaviorMetrics(userId: string, dateRange: { start: Date; end: Date }) {
    try {
      const { data: interactions } = await supabase
        .from('user_interactions')
        .select('*')
        .gte('timestamp', dateRange.start.toISOString())
        .lte('timestamp', dateRange.end.toISOString());

      // Analyze user behavior patterns
      const sessionMetrics = new Map();
      const deviceMetrics = new Map();
      const timeMetrics = new Map();

      interactions?.forEach(interaction => {
        const sessionId = interaction.session_id;
        const hour = new Date(interaction.timestamp).getHours();
        const device = interaction.metadata?.device || 'unknown';

        // Session metrics
        if (!sessionMetrics.has(sessionId)) {
          sessionMetrics.set(sessionId, {
            session_id: sessionId,
            interactions: 0,
            duration: 0,
            conversions: 0,
            value: 0
          });
        }
        
        const session = sessionMetrics.get(sessionId);
        session.interactions++;
        if (interaction.event_type === 'purchase') {
          session.conversions++;
          session.value += interaction.event_value || 0;
        }

        // Device metrics
        if (!deviceMetrics.has(device)) {
          deviceMetrics.set(device, { device, count: 0, conversions: 0 });
        }
        deviceMetrics.get(device).count++;
        if (interaction.event_type === 'purchase') {
          deviceMetrics.get(device).conversions++;
        }

        // Time metrics
        if (!timeMetrics.has(hour)) {
          timeMetrics.set(hour, { hour, interactions: 0, conversions: 0 });
        }
        timeMetrics.get(hour).interactions++;
        if (interaction.event_type === 'purchase') {
          timeMetrics.get(hour).conversions++;
        }
      });

      return {
        session_metrics: Array.from(sessionMetrics.values()),
        device_distribution: Array.from(deviceMetrics.values()),
        hourly_activity: Array.from(timeMetrics.values()).sort((a, b) => a.hour - b.hour),
        total_sessions: sessionMetrics.size,
        avg_session_interactions: sessionMetrics.size > 0 ? 
          Array.from(sessionMetrics.values()).reduce((sum, s) => sum + s.interactions, 0) / sessionMetrics.size : 0
      };
    } catch (error) {
      console.error('User behavior metrics error:', error);
      return {
        session_metrics: [],
        device_distribution: [],
        hourly_activity: [],
        total_sessions: 0,
        avg_session_interactions: 0
      };
    }
  }

  // Get predictive metrics (mock implementation)
  private async getPredictiveMetrics(userId: string, dateRange: { start: Date; end: Date }) {
    try {
      // This would use actual ML models in production
      // For now, return mock predictive data
      
      const { data: recentAnalytics } = await supabase
        .from('link_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('date', format(subDays(new Date(), 30), 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      const recentRevenue = recentAnalytics?.reduce((sum, record) => sum + (record.revenue || 0), 0) || 0;
      const recentClicks = recentAnalytics?.reduce((sum, record) => sum + (record.clicks || 0), 0) || 0;

      // Mock predictions based on recent performance
      const predicted_revenue_next_30_days = recentRevenue * 1.1; // 10% growth prediction
      const predicted_conversion_rate = recentClicks > 0 ? 
        (recentAnalytics?.reduce((sum, record) => sum + (record.conversions || 0), 0) || 0) / recentClicks * 100 * 1.05 : 0;

      const churn_risk_users = Math.floor(Math.random() * 50) + 10; // Mock churn risk
      const high_value_opportunities = Math.floor(Math.random() * 20) + 5; // Mock opportunities

      return {
        predicted_revenue_next_30_days,
        predicted_conversion_rate,
        churn_risk_users,
        high_value_opportunities,
        confidence_score: 0.85,
        model_accuracy: 0.87
      };
    } catch (error) {
      console.error('Predictive metrics error:', error);
      return {
        predicted_revenue_next_30_days: 0,
        predicted_conversion_rate: 0,
        churn_risk_users: 0,
        high_value_opportunities: 0,
        confidence_score: 0,
        model_accuracy: 0
      };
    }
  }

  // Track real-time events
  async trackEvent(eventData: {
    userId?: string;
    websiteId?: string;
    sessionId: string;
    eventType: string;
    productId?: string;
    popupId?: string;
    linkId?: string;
    value?: number;
    metadata?: any;
  }) {
    try {
      await supabase
        .from('user_interactions')
        .insert({
          user_id: eventData.userId,
          website_id: eventData.websiteId,
          session_id: eventData.sessionId,
          event_type: eventData.eventType,
          product_id: eventData.productId,
          popup_id: eventData.popupId,
          link_id: eventData.linkId,
          event_value: eventData.value,
          metadata: eventData.metadata || {},
          timestamp: new Date().toISOString()
        });

      // Update real-time metrics
      await this.updateRealTimeMetrics(eventData);

    } catch (error) {
      console.error('Event tracking error:', error);
    }
  }

  // Update real-time metrics
  private async updateRealTimeMetrics(eventData: any) {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Update daily aggregates
      if (eventData.linkId) {
        await supabase.rpc('increment_link_metric', {
          p_link_id: eventData.linkId,
          p_date: today,
          p_metric: eventData.eventType,
          p_value: eventData.value || 1
        });
      }

      if (eventData.popupId) {
        await supabase.rpc('increment_popup_metric', {
          p_popup_id: eventData.popupId,
          p_date: today,
          p_metric: eventData.eventType,
          p_value: eventData.value || 1
        });
      }

    } catch (error) {
      console.error('Real-time metrics update error:', error);
    }
  }

  // Generate analytics report
  async generateReport(userId: string, reportType: string, dateRange: { start: Date; end: Date }) {
    try {
      const metrics = await this.getDashboardMetrics(userId, dateRange);
      
      const report = {
        report_type: reportType,
        generated_at: new Date().toISOString(),
        date_range: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString()
        },
        user_id: userId,
        data: metrics,
        summary: this.generateReportSummary(metrics),
        recommendations: this.generateRecommendations(metrics)
      };

      // Store report
      await supabase
        .from('analytics_reports')
        .insert({
          user_id: userId,
          report_type: reportType,
          report_data: report,
          generated_at: new Date().toISOString()
        });

      return report;
    } catch (error) {
      console.error('Report generation error:', error);
      throw error;
    }
  }

  // Generate report summary
  private generateReportSummary(metrics: any) {
    const overview = metrics.overview;
    
    return {
      total_revenue: overview.total_revenue,
      total_clicks: overview.total_clicks,
      conversion_rate: overview.conversion_rate,
      top_performing_platform: metrics.performance.platform_performance[0]?.platform || 'N/A',
      growth_trend: this.calculateGrowthTrend(metrics.trends.revenue_trend),
      key_insights: [
        `Generated ${overview.total_revenue} in revenue from ${overview.total_clicks} clicks`,
        `Conversion rate of ${overview.conversion_rate.toFixed(2)}%`,
        `${overview.active_popups} active popups driving engagement`,
        `${overview.automation_rules} automation rules optimizing performance`
      ]
    };
  }

  // Generate recommendations
  private generateRecommendations(metrics: any) {
    const recommendations = [];
    const overview = metrics.overview;

    if (overview.conversion_rate < 2) {
      recommendations.push({
        type: 'conversion_optimization',
        priority: 'high',
        title: 'Improve Conversion Rate',
        description: 'Your conversion rate is below average. Consider optimizing popup timing and product selection.',
        action: 'Review popup triggers and product relevance'
      });
    }

    if (overview.active_popups < 3) {
      recommendations.push({
        type: 'popup_expansion',
        priority: 'medium',
        title: 'Create More Popups',
        description: 'You have few active popups. Creating more targeted popups could increase revenue.',
        action: 'Create popups for different content categories'
      });
    }

    if (overview.automation_rules === 0) {
      recommendations.push({
        type: 'automation_setup',
        priority: 'high',
        title: 'Set Up Automation',
        description: 'Automation rules can significantly improve efficiency and revenue.',
        action: 'Create automation rules for content analysis and popup creation'
      });
    }

    return recommendations;
  }

  // Calculate growth trend
  private calculateGrowthTrend(revenueTrend: any[]) {
    if (revenueTrend.length < 2) return 0;
    
    const recent = revenueTrend.slice(-7); // Last 7 days
    const previous = revenueTrend.slice(-14, -7); // Previous 7 days
    
    const recentTotal = recent.reduce((sum, day) => sum + day.revenue, 0);
    const previousTotal = previous.reduce((sum, day) => sum + day.revenue, 0);
    
    if (previousTotal === 0) return 0;
    
    return ((recentTotal - previousTotal) / previousTotal) * 100;
  }
}

export const analyticsService = AnalyticsService.getInstance();