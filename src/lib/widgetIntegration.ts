// Widget Integration Script Generator
export class WidgetIntegrationService {
  static generateIntegrationScript(websiteId: string, userId: string): string {
    return `
<!-- Afflient.ai Widget Integration -->
<script>
(function() {
  // Configuration
  var config = {
    websiteId: '${websiteId}',
    userId: '${userId}',
    apiBase: '${window.location.origin}',
    version: '1.0.0'
  };

  // Initialize automation
  function initializeAfflientAutomation() {
    // Extract page content
    var content = document.body.innerText || document.body.textContent || '';
    
    // Send content for analysis
    fetch(config.apiBase + '/api/automation/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        websiteId: config.websiteId,
        userId: config.userId,
        content: content,
        url: window.location.href,
        timestamp: Date.now()
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.popups) {
        // Execute popup scripts
        data.popups.forEach(function(popup) {
          if (popup.integrationScript) {
            var script = document.createElement('script');
            script.textContent = popup.integrationScript;
            document.head.appendChild(script);
          }
        });
      }
    })
    .catch(function(error) {
      console.error('Afflient automation error:', error);
    });
  }

  // Track user behavior
  function trackUserBehavior() {
    var startTime = Date.now();
    var maxScrollDepth = 0;
    var sessionId = sessionStorage.getItem('afflient_session') || 
                   Math.random().toString(36).substr(2, 9);
    
    sessionStorage.setItem('afflient_session', sessionId);

    // Track scroll depth
    function updateScrollDepth() {
      var scrollPercent = (window.pageYOffset / (document.body.scrollHeight - window.innerHeight)) * 100;
      maxScrollDepth = Math.max(maxScrollDepth, scrollPercent || 0);
    }

    window.addEventListener('scroll', updateScrollDepth, { passive: true });

    // Send behavior data when user leaves
    function sendBehaviorData() {
      var timeOnPage = Math.round((Date.now() - startTime) / 1000);
      
      fetch(config.apiBase + '/api/behavior/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          websiteId: config.websiteId,
          sessionId: sessionId,
          pageUrl: window.location.href,
          scrollDepth: Math.round(maxScrollDepth),
          timeOnPage: timeOnPage,
          deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'
        })
      }).catch(function(error) {
        console.error('Behavior tracking error:', error);
      });
    }

    window.addEventListener('beforeunload', sendBehaviorData);
    
    // Also send data periodically
    setInterval(sendBehaviorData, 30000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initializeAfflientAutomation();
      trackUserBehavior();
    });
  } else {
    initializeAfflientAutomation();
    trackUserBehavior();
  }
})();
</script>
<!-- End Afflient.ai Widget Integration -->`;
  }

  static generateManualPopupScript(popupConfig: any): string {
    return `
<script>
(function() {
  var popupConfig = ${JSON.stringify(popupConfig, null, 2)};
  
  function createPopup() {
    // Check if popup already exists
    if (document.getElementById(popupConfig.id)) return;
    
    var popup = document.createElement('div');
    popup.id = popupConfig.id;
    popup.innerHTML = \`
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; border-radius: 12px; padding: 24px; max-width: 400px; margin: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); position: relative;">
          <button onclick="this.closest('#\${popupConfig.id}').remove()" style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
          <img src="\${popupConfig.design.content.image}" alt="\${popupConfig.product.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #1f2937;">\${popupConfig.design.content.headline}</h3>
          <p style="margin: 0 0 20px 0; color: #6b7280; line-height: 1.5;">\${popupConfig.design.content.description}</p>
          <a href="\${popupConfig.affiliateLink}" target="_blank" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
            \${popupConfig.design.content.cta}
          </a>
        </div>
      </div>
    \`;
    
    document.body.appendChild(popup);
    
    // Track popup display
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'popup_displayed',
        popup_id: popupConfig.id,
        session_id: sessionStorage.getItem('afflient_session') || 'anonymous'
      })
    }).catch(console.error);
  }
  
  // Trigger logic based on configuration
  var triggered = false;
  function checkTrigger() {
    if (triggered) return;
    
    var scrollPercent = (window.pageYOffset / (document.body.scrollHeight - window.innerHeight)) * 100;
    
    if (popupConfig.trigger.type === 'scroll_percentage' && scrollPercent >= popupConfig.trigger.value) {
      setTimeout(createPopup, popupConfig.trigger.delay || 0);
      triggered = true;
    } else if (popupConfig.trigger.type === 'time_delay') {
      setTimeout(createPopup, popupConfig.trigger.value * 1000);
      triggered = true;
    }
  }
  
  // Initialize trigger
  if (popupConfig.trigger.type === 'scroll_percentage') {
    window.addEventListener('scroll', checkTrigger, { passive: true });
  } else if (popupConfig.trigger.type === 'time_delay') {
    checkTrigger();
  }
})();
</script>`;
  }
}