import { supabase } from './supabase';

// Smart Popup Service - Creates and manages intelligent popups
export class SmartPopupService {
  private static instance: SmartPopupService;

  static getInstance(): SmartPopupService {
    if (!SmartPopupService.instance) {
      SmartPopupService.instance = new SmartPopupService();
    }
    return SmartPopupService.instance;
  }

  // Create smart popup based on content analysis and user preferences
  async createSmartPopup(userId: string, popupData: {
    websiteId: string;
    name: string;
    products: any[];
    contentAnalysis?: any;
    userPreferences?: any;
    triggerRules?: any;
  }) {
    try {
      // Step 1: Generate optimal popup configuration
      const config = await this.generatePopupConfig(popupData);

      // Step 2: Create popup in database
      const { data: popup, error } = await supabase
        .from('popups')
        .insert({
          website_id: popupData.websiteId,
          name: popupData.name,
          config: config,
          trigger_rules: config.triggers,
          design_settings: config.design,
          targeting_rules: config.targeting,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Step 3: Link products to popup
      if (popupData.products.length > 0) {
        await this.linkProductsToPopup(popup.id, popupData.products);
      }

      // Step 4: Generate popup script
      const popupScript = this.generatePopupScript(popup);

      return {
        success: true,
        popup,
        script: popupScript
      };

    } catch (error) {
      console.error('Smart popup creation error:', error);
      throw error;
    }
  }

  // Generate optimal popup configuration based on data
  private async generatePopupConfig(popupData: any) {
    const config = {
      id: `popup_${Date.now()}`,
      type: this.determineOptimalPopupType(popupData),
      design: await this.generateDesignSettings(popupData),
      triggers: this.generateTriggerRules(popupData),
      targeting: this.generateTargetingRules(popupData),
      content: this.generateContentSettings(popupData),
      behavior: this.generateBehaviorSettings(popupData)
    };

    return config;
  }

  // Determine optimal popup type based on content and user behavior
  private determineOptimalPopupType(popupData: any): string {
    const { contentAnalysis, userPreferences } = popupData;

    // High buying intent = immediate overlay
    if (contentAnalysis?.buying_intent_score > 0.8) {
      return 'overlay-center';
    }

    // Medium intent = slide-in
    if (contentAnalysis?.buying_intent_score > 0.5) {
      return 'slide-in-bottom';
    }

    // Low intent = subtle banner
    return 'top-banner';
  }

  // Generate design settings
  private async generateDesignSettings(popupData: any) {
    const { userPreferences, contentAnalysis } = popupData;

    return {
      template: this.determineOptimalPopupType(popupData),
      colors: {
        primary: userPreferences?.brandColor || '#4F46E5',
        secondary: '#10B981',
        background: '#FFFFFF',
        text: '#1F2937'
      },
      fonts: {
        heading: 'Inter, sans-serif',
        body: 'Inter, sans-serif'
      },
      animations: {
        entrance: 'fadeInUp',
        exit: 'fadeOut',
        duration: 300
      },
      responsive: true,
      mobileOptimized: true
    };
  }

  // Generate trigger rules based on user behavior patterns
  private generateTriggerRules(popupData: any) {
    const { contentAnalysis, userPreferences } = popupData;

    const baseRules = {
      scrollPercentage: 50,
      timeDelay: 5000,
      exitIntent: true,
      frequency: 'once-per-session'
    };

    // Adjust based on buying intent
    if (contentAnalysis?.buying_intent_score > 0.7) {
      baseRules.scrollPercentage = 30; // Show earlier for high intent
      baseRules.timeDelay = 3000;
    }

    // Adjust based on user preferences
    if (userPreferences?.aggressivePopups === false) {
      baseRules.scrollPercentage = 70;
      baseRules.timeDelay = 10000;
      baseRules.frequency = 'once-per-day';
    }

    return baseRules;
  }

  // Generate targeting rules
  private generateTargetingRules(popupData: any) {
    return {
      deviceTypes: ['desktop', 'mobile', 'tablet'],
      browsers: ['chrome', 'firefox', 'safari', 'edge'],
      geoTargeting: null, // Can be configured later
      userSegments: ['all'],
      excludeReturning: false,
      maxDisplaysPerUser: 3,
      cooldownPeriod: 24 * 60 * 60 * 1000 // 24 hours
    };
  }

  // Generate content settings
  private generateContentSettings(popupData: any) {
    const { products, contentAnalysis } = popupData;

    const headlines = this.generateSmartHeadlines(products, contentAnalysis);
    const descriptions = this.generateSmartDescriptions(products, contentAnalysis);

    return {
      headline: headlines[0],
      description: descriptions[0],
      ctaText: this.generateCTAText(contentAnalysis),
      products: products.slice(0, 3), // Limit to 3 products
      showPrices: true,
      showRatings: true,
      showDiscounts: true
    };
  }

  // Generate behavior settings
  private generateBehaviorSettings(popupData: any) {
    return {
      closeOnOverlayClick: true,
      showCloseButton: true,
      autoClose: false,
      autoCloseDelay: 0,
      soundEnabled: false,
      trackingEnabled: true,
      analyticsEnabled: true
    };
  }

  // Generate smart headlines based on content
  private generateSmartHeadlines(products: any[], contentAnalysis: any): string[] {
    const headlines = [];

    if (contentAnalysis?.buying_intent_score > 0.7) {
      headlines.push('Perfect Products for You!');
      headlines.push('Don\'t Miss These Deals!');
    } else {
      headlines.push('You Might Also Like');
      headlines.push('Recommended Products');
    }

    if (products.length > 0) {
      headlines.push(`Great ${products[0].category} Products`);
    }

    return headlines;
  }

  // Generate smart descriptions
  private generateSmartDescriptions(products: any[], contentAnalysis: any): string[] {
    const descriptions = [];

    if (contentAnalysis?.buying_intent_score > 0.7) {
      descriptions.push('Based on what you\'re reading, these products are perfect for you!');
      descriptions.push('Limited time offers on products mentioned in this article.');
    } else {
      descriptions.push('Discover products related to this content.');
      descriptions.push('Handpicked recommendations just for you.');
    }

    return descriptions;
  }

  // Generate CTA text based on intent
  private generateCTAText(contentAnalysis: any): string {
    if (contentAnalysis?.buying_intent_score > 0.7) {
      return 'Shop Now';
    } else if (contentAnalysis?.buying_intent_score > 0.4) {
      return 'Learn More';
    } else {
      return 'View Details';
    }
  }

  // Link products to popup
  private async linkProductsToPopup(popupId: string, products: any[]) {
    const linkPromises = products.map(product =>
      supabase
        .from('popup_products')
        .insert({
          popup_id: popupId,
          product_id: product.id,
          position: products.indexOf(product),
          custom_title: product.name,
          custom_description: product.description
        })
    );

    await Promise.all(linkPromises);
  }

  // Generate popup script for website integration
  private generatePopupScript(popup: any): string {
    return `
<!-- Afflient.ai Smart Popup Script -->
<script>
(function() {
  var popupConfig = ${JSON.stringify(popup.config, null, 2)};
  
  // Popup state management
  var popupState = {
    displayed: false,
    dismissed: false,
    interacted: false,
    sessionId: sessionStorage.getItem('afflient_session') || Math.random().toString(36).substr(2, 9)
  };
  
  sessionStorage.setItem('afflient_session', popupState.sessionId);
  
  // Check if popup should be displayed
  function shouldDisplayPopup() {
    if (popupState.displayed || popupState.dismissed) return false;
    
    var lastShown = localStorage.getItem('afflient_popup_${popup.id}_last_shown');
    if (lastShown) {
      var timeSince = Date.now() - parseInt(lastShown);
      if (timeSince < popupConfig.targeting.cooldownPeriod) return false;
    }
    
    return true;
  }
  
  // Create popup HTML
  function createPopupHTML() {
    return \`
      <div id="afflient-popup-${popup.id}" class="afflient-popup-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      ">
        <div class="afflient-popup-content" style="
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          margin: 20px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          position: relative;
          transform: translateY(20px);
          transition: transform 0.3s ease;
        ">
          <button class="afflient-popup-close" style="
            position: absolute;
            top: 12px;
            right: 12px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 4px;
          ">&times;</button>
          
          <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #1f2937;">
            \${popupConfig.content.headline}
          </h3>
          
          <p style="margin: 0 0 20px 0; color: #6b7280; line-height: 1.5;">
            \${popupConfig.content.description}
          </p>
          
          <div class="afflient-products" style="margin-bottom: 20px;">
            \${generateProductsHTML()}
          </div>
          
          <div style="text-align: center;">
            <button class="afflient-popup-cta" style="
              background: \${popupConfig.design.colors.primary};
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              font-weight: 500;
              cursor: pointer;
              transition: background-color 0.2s;
            ">
              \${popupConfig.content.ctaText}
            </button>
          </div>
        </div>
      </div>
    \`;
  }
  
  function generateProductsHTML() {
    return popupConfig.content.products.map(function(product) {
      return \`
        <div class="afflient-product" style="
          display: flex;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #eee;
        ">
          <img src="\${product.image_url}" alt="\${product.name}" style="
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 6px;
            margin-right: 12px;
          ">
          <div style="flex: 1;">
            <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500;">
              \${product.name}
            </h4>
            <div style="font-weight: 600; color: \${popupConfig.design.colors.primary};">
              $\${product.price}
            </div>
          </div>
          <a href="\${product.affiliate_url}" target="_blank" style="
            background: \${popupConfig.design.colors.secondary};
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            text-decoration: none;
            font-size: 12px;
          " onclick="trackProductClick('\${product.id}')">
            View
          </a>
        </div>
      \`;
    }).join('');
  }
  
  // Display popup
  function displayPopup() {
    if (!shouldDisplayPopup()) return;
    
    var popupHTML = createPopupHTML();
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    var popup = document.getElementById('afflient-popup-${popup.id}');
    var content = popup.querySelector('.afflient-popup-content');
    
    // Animate in
    setTimeout(function() {
      popup.style.opacity = '1';
      content.style.transform = 'translateY(0)';
    }, 10);
    
    // Add event listeners
    popup.querySelector('.afflient-popup-close').addEventListener('click', closePopup);
    popup.addEventListener('click', function(e) {
      if (e.target === popup) closePopup();
    });
    
    popup.querySelector('.afflient-popup-cta').addEventListener('click', function() {
      trackEvent('cta_clicked');
      // Handle CTA action
    });
    
    popupState.displayed = true;
    localStorage.setItem('afflient_popup_${popup.id}_last_shown', Date.now().toString());
    
    trackEvent('popup_displayed');
  }
  
  // Close popup
  function closePopup() {
    var popup = document.getElementById('afflient-popup-${popup.id}');
    if (popup) {
      popup.style.opacity = '0';
      setTimeout(function() {
        popup.remove();
      }, 300);
    }
    popupState.dismissed = true;
    trackEvent('popup_closed');
  }
  
  // Track events
  function trackEvent(eventType, data) {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        popup_id: '${popup.id}',
        session_id: popupState.sessionId,
        data: data || {},
        timestamp: Date.now(),
        url: window.location.href
      })
    }).catch(console.error);
  }
  
  function trackProductClick(productId) {
    trackEvent('product_clicked', { product_id: productId });
  }
  
  // Trigger logic
  var triggered = false;
  var scrollTriggered = false;
  var timeTriggered = false;
  
  function checkTriggers() {
    if (triggered) return;
    
    // Scroll trigger
    if (!scrollTriggered) {
      var scrollPercent = (window.pageYOffset / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent >= popupConfig.triggers.scrollPercentage) {
        scrollTriggered = true;
      }
    }
    
    // Time trigger
    if (!timeTriggered) {
      setTimeout(function() {
        timeTriggered = true;
        checkTriggers();
      }, popupConfig.triggers.timeDelay);
    }
    
    // Display if both conditions met
    if (scrollTriggered && timeTriggered) {
      triggered = true;
      displayPopup();
    }
  }
  
  // Exit intent trigger
  if (popupConfig.triggers.exitIntent) {
    document.addEventListener('mouseleave', function(e) {
      if (e.clientY <= 0 && !triggered) {
        triggered = true;
        displayPopup();
      }
    });
  }
  
  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkTriggers);
  } else {
    checkTriggers();
  }
  
  window.addEventListener('scroll', checkTriggers, { passive: true });
  
})();
</script>`;
  }

  // Track popup performance
  async trackPopupEvent(popupId: string, eventType: string, eventData: any) {
    try {
      await supabase
        .from('popup_events')
        .insert({
          popup_id: popupId,
          event_type: eventType,
          user_session: eventData.session_id,
          user_agent: eventData.user_agent,
          ip_address: eventData.ip_address,
          referrer: eventData.referrer,
          page_url: eventData.url,
          metadata: eventData.data || {}
        });
    } catch (error) {
      console.error('Error tracking popup event:', error);
    }
  }
}

export const smartPopupService = SmartPopupService.getInstance();