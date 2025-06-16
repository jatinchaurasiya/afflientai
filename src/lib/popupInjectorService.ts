/**
 * Popup Injector Service
 * Handles the generation and management of popup injector code
 */
export class PopupInjectorService {
  /**
   * Generate popup injector code for a specific website and popup
   */
  static generatePopupInjectorCode(
    websiteId: string,
    popupId: string,
    integrationKey: string,
    options: {
      scrollThreshold?: number;
      timeDelay?: number;
      maxPopupsPerSession?: number;
      advanced?: boolean;
    } = {}
  ): string {
    const {
      scrollThreshold = 0.7,
      timeDelay = 5000,
      maxPopupsPerSession = 3,
      advanced = false
    } = options;

    const baseCode = `<!-- AffiliateAI Popup Integration -->
<script>
  (function() {
    window.AffiliateAI = window.AffiliateAI || {};
    window.AffiliateAI.config = {
      siteId: '${websiteId}',
      apiKey: '${integrationKey}',
      popupId: '${popupId}',
      baseUrl: 'https://api.affilient.ai',
      options: {
        scrollThreshold: ${scrollThreshold},
        timeDelay: ${timeDelay},
        maxPopupsPerSession: ${maxPopupsPerSession}
      }
    };
    
    var script = document.createElement('script');
    script.src = 'https://cdn.affilient.ai/popup-injector.min.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;

    if (!advanced) return baseCode;

    return `<!-- AffiliateAI Popup Integration (Advanced) -->
<script>
  (function() {
    window.AffiliateAI = window.AffiliateAI || {};
    window.AffiliateAI.config = {
      siteId: '${websiteId}',
      apiKey: '${integrationKey}',
      popupId: '${popupId}',
      baseUrl: 'https://api.affilient.ai',
      options: {
        scrollThreshold: ${scrollThreshold},
        timeDelay: ${timeDelay},
        maxPopupsPerSession: ${maxPopupsPerSession},
        cooldownPeriod: 300000, // 5 minutes
        respectDoNotTrack: true,
        enableLogging: false,
        maxRetries: 3,
        retryDelay: 1000
      }
    };
    
    var script = document.createElement('script');
    script.src = 'https://cdn.affilient.ai/popup-injector.min.js';
    script.async = true;
    document.head.appendChild(script);
    
    // Optional: Custom event listeners
    window.addEventListener('AffiliateAI:popupShown', function(e) {
      console.log('Popup shown:', e.detail);
    });
    
    window.addEventListener('AffiliateAI:popupClicked', function(e) {
      console.log('Popup clicked:', e.detail);
    });
  })();
</script>`;
  }

  /**
   * Generate widget integration code for a website
   */
  static generateWidgetIntegrationCode(
    websiteId: string,
    integrationKey: string
  ): string {
    return `<!-- AffiliateAI Widget Integration -->
<script>
  (function() {
    window.AffiliateAI = window.AffiliateAI || {};
    window.AffiliateAI.config = {
      siteId: '${websiteId}',
      apiKey: '${integrationKey}',
      baseUrl: 'https://api.affilient.ai'
    };
    
    var script = document.createElement('script');
    script.src = 'https://cdn.affilient.ai/widget.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
<div id="affiliate-ai-widget"></div>`;
  }

  /**
   * Generate CSS styles for popups
   */
  static generatePopupStyles(): string {
    return `
.aai-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999999;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.aai-popup-show {
  opacity: 1;
  visibility: visible;
}

.aai-popup-hide {
  opacity: 0;
  visibility: hidden;
}

.aai-popup-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
}

.aai-popup-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
}

.aai-close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  z-index: 1;
}

.aai-popup-title {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
}

.aai-products {
  display: grid;
  grid-gap: 16px;
  margin-bottom: 16px;
}

.aai-product {
  display: flex;
  text-decoration: none;
  color: inherit;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.aai-product:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.aai-product img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.aai-details {
  margin-left: 12px;
  flex: 1;
}

.aai-details h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
}

.aai-price {
  font-weight: 600;
  color: #4F46E5;
}

.aai-footer {
  text-align: center;
  margin-top: 16px;
  font-size: 12px;
  color: #666;
}

@media (max-width: 480px) {
  .aai-popup-content {
    width: 95%;
    padding: 16px;
  }
  
  .aai-product img {
    width: 60px;
    height: 60px;
  }
  
  .aai-details h4 {
    font-size: 14px;
  }
}
`;
  }
}