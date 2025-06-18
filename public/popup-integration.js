/**
 * Popup Integration Script
 * Integrates the PopupRenderingEngine and PopupBehaviorTracker
 */
(function() {
  'use strict';
  
  // Configuration from global object
  const config = window.AffiliateAI?.config || {};
  
  // Default configuration
  const defaultConfig = {
    siteId: '',
    apiKey: '',
    popupId: '',
    baseUrl: 'https://api.affiliateai.com',
    options: {
      scrollThreshold: 0.7,
      timeDelay: 5000,
      maxPopupsPerSession: 3,
      cooldownPeriod: 300000, // 5 minutes
      enableLogging: false,
      respectDoNotTrack: true
    }
  };
  
  // Merge configurations
  const mergedConfig = {
    ...defaultConfig,
    ...config,
    options: {
      ...defaultConfig.options,
      ...(config.options || {})
    }
  };
  
  // State management
  const state = {
    initialized: false,
    renderer: null,
    behaviorTracker: null,
    popupsShown: 0,
    lastPopupTime: 0
  };
  
  /**
   * Initialize the integration
   */
  function initialize() {
    if (state.initialized) {
      console.log('[PopupIntegration] Already initialized');
      return;
    }
    
    // Check if Do Not Track is enabled
    if (mergedConfig.options.respectDoNotTrack && isDoNotTrackEnabled()) {
      console.log('[PopupIntegration] Do Not Track enabled, skipping initialization');
      return;
    }
    
    // Check if we've reached the maximum popups per session
    if (getPopupsShown() >= mergedConfig.options.maxPopupsPerSession) {
      console.log('[PopupIntegration] Maximum popups per session reached');
      return;
    }
    
    // Initialize renderer
    state.renderer = new PopupRenderingEngine({
      enableAnimations: true,
      enableAnalytics: true,
      theme: 'modern',
      position: 'center',
      autoCloseDelay: 30000,
      enableLogging: mergedConfig.options.enableLogging
    });
    
    // Initialize behavior tracker
    state.behaviorTracker = new PopupBehaviorTracker({
      scrollThreshold: mergedConfig.options.scrollThreshold,
      timeDelay: mergedConfig.options.timeDelay,
      contentId: window.currentContentId || null,
      enableLogging: mergedConfig.options.enableLogging
    });
    
    // Listen for popup trigger messages
    window.addEventListener('message', handleMessage);
    
    // Initialize behavior tracker
    state.behaviorTracker.init();
    
    state.initialized = true;
    console.log('[PopupIntegration] Initialized successfully');
  }
  
  /**
   * Handle messages from behavior tracker
   */
  function handleMessage(event) {
    // Validate message
    if (event.data && event.data.type === 'SHOW_POPUP') {
      const { contentId, triggerType } = event.data;
      
      // Check if we can show a popup
      if (!canShowPopup()) {
        console.log('[PopupIntegration] Cannot show popup due to limits or cooldown');
        return;
      }
      
      // Fetch recommendations and show popup
      fetchRecommendations(contentId)
        .then(recommendations => {
          if (recommendations && recommendations.length > 0) {
            showPopup(recommendations, triggerType);
          }
        })
        .catch(error => {
          console.error('[PopupIntegration] Error fetching recommendations:', error);
        });
    }
  }
  
  /**
   * Fetch recommendations from API
   */
  async function fetchRecommendations(contentId) {
    try {
      const url = contentId
        ? `${mergedConfig.baseUrl}/api/recommendations/${encodeURIComponent(contentId)}`
        : `${mergedConfig.baseUrl}/api/recommendations/widget/${encodeURIComponent(window.location.href)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${mergedConfig.apiKey}`,
          'Content-Type': 'application/json',
          'X-Site-ID': mergedConfig.siteId
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.recommendations)) {
        return data.recommendations;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('[PopupIntegration] Recommendation fetch error:', error);
      return [];
    }
  }
  
  /**
   * Show popup with recommendations
   */
  function showPopup(recommendations, triggerType) {
    if (!state.renderer) {
      console.error('[PopupIntegration] Renderer not initialized');
      return;
    }
    
    // Render popup
    state.renderer.renderPopup(recommendations, {
      title: 'Recommended for You',
      description: 'Products you might be interested in',
      theme: 'modern',
      position: 'center',
      triggerType: triggerType
    });
    
    // Update state
    updatePopupState();
  }
  
  /**
   * Check if popup can be shown based on limits and cooldown
   */
  function canShowPopup() {
    const popupsShown = getPopupsShown();
    const lastPopupTime = getLastPopupTime();
    const now = Date.now();
    
    // Check maximum popups per session
    if (popupsShown >= mergedConfig.options.maxPopupsPerSession) {
      return false;
    }
    
    // Check cooldown period
    if (lastPopupTime && (now - lastPopupTime) < mergedConfig.options.cooldownPeriod) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Update popup state after showing a popup
   */
  function updatePopupState() {
    const popupsShown = getPopupsShown() + 1;
    const now = Date.now();
    
    // Update session storage
    sessionStorage.setItem('afflient_popups_shown', popupsShown);
    sessionStorage.setItem('afflient_last_popup_time', now);
    
    // Update state
    state.popupsShown = popupsShown;
    state.lastPopupTime = now;
  }
  
  /**
   * Get number of popups shown in this session
   */
  function getPopupsShown() {
    return parseInt(sessionStorage.getItem('afflient_popups_shown') || '0', 10);
  }
  
  /**
   * Get timestamp of last popup shown
   */
  function getLastPopupTime() {
    return parseInt(sessionStorage.getItem('afflient_last_popup_time') || '0', 10);
  }
  
  /**
   * Check if Do Not Track is enabled
   */
  function isDoNotTrackEnabled() {
    return navigator.doNotTrack === '1' || 
           window.doNotTrack === '1' || 
           navigator.msDoNotTrack === '1';
  }
  
  /**
   * Clean up resources
   */
  function destroy() {
    if (state.behaviorTracker) {
      state.behaviorTracker.destroy();
    }
    
    if (state.renderer) {
      state.renderer.destroy();
    }
    
    window.removeEventListener('message', handleMessage);
    state.initialized = false;
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // Expose public API
  window.AffiliateAI = window.AffiliateAI || {};
  window.AffiliateAI.api = {
    showPopup: (contentId) => {
      if (canShowPopup()) {
        fetchRecommendations(contentId)
          .then(recommendations => {
            if (recommendations && recommendations.length > 0) {
              showPopup(recommendations, 'manual');
            }
          });
      }
    },
    destroy: destroy,
    getState: () => ({
      initialized: state.initialized,
      popupsShown: getPopupsShown(),
      lastPopupTime: getLastPopupTime()
    })
  };
})();