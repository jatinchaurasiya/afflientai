/**
 * Popup Behavior Tracker
 * Tracks user behavior and triggers popups at optimal moments
 */
class PopupBehaviorTracker {
  constructor(config = {}) {
    this.config = {
      scrollThreshold: config.scrollThreshold || 0.7, // 70% of page
      timeDelay: config.timeDelay || 5000, // 5 seconds
      exitIntentSensitivity: config.exitIntentSensitivity || 20, // pixels from top
      enableLogging: config.enableLogging || false,
      contentId: config.contentId || window.currentContentId || null,
      ...config
    };

    this.state = {
      initialized: false,
      scrollTriggered: false,
      exitIntentTriggered: false,
      timeDelayTriggered: false,
      lastTriggerTime: 0,
      cooldownPeriod: 60000 // 1 minute between triggers
    };

    // Bind methods
    this.handleScroll = this.throttle(this.handleScroll.bind(this), 100);
    this.handleMouseOut = this.handleMouseOut.bind(this);
    this.triggerPopup = this.triggerPopup.bind(this);
  }

  /**
   * Initialize behavior tracking
   */
  init() {
    if (this.state.initialized) {
      this.log('Behavior tracker already initialized');
      return;
    }

    this.setupBehaviorTracker();
    this.state.initialized = true;
    this.log('Behavior tracker initialized');
  }

  /**
   * Setup behavior tracking and triggers
   */
  setupBehaviorTracker() {
    let scrollTriggered = false;
    let exitIntentTriggered = false;

    // Scroll trigger (70% of page)
    window.addEventListener('scroll', this.handleScroll, { passive: true });

    // Exit intent detection
    document.addEventListener('mouseout', this.handleMouseOut);

    // Time-based trigger (5s after page load)
    setTimeout(() => {
      if (!scrollTriggered && !exitIntentTriggered) {
        this.state.timeDelayTriggered = true;
        this.triggerPopup('time_delay');
      }
    }, this.config.timeDelay);
  }

  /**
   * Handle scroll events
   */
  handleScroll() {
    if (this.state.scrollTriggered) return;
    
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    
    if (scrollPercent >= this.config.scrollThreshold) {
      this.state.scrollTriggered = true;
      this.triggerPopup('scroll');
    }
  }

  /**
   * Handle mouse exit events
   */
  handleMouseOut(e) {
    if (this.state.exitIntentTriggered) return;
    
    // Only trigger when mouse leaves through the top of the page
    if (e.clientY <= this.config.exitIntentSensitivity && !e.relatedTarget) {
      this.state.exitIntentTriggered = true;
      this.triggerPopup('exit_intent');
    }
  }

  /**
   * Trigger popup display
   */
  triggerPopup(triggerType) {
    const now = Date.now();
    
    // Check cooldown period
    if (now - this.state.lastTriggerTime < this.state.cooldownPeriod) {
      this.log(`Trigger ${triggerType} ignored due to cooldown period`);
      return;
    }
    
    this.state.lastTriggerTime = now;
    this.log(`Triggering popup with type: ${triggerType}`);
    
    // Send message to main SDK
    window.postMessage({ 
      type: 'SHOW_POPUP',
      contentId: this.config.contentId,
      triggerType: triggerType
    }, '*');
  }

  /**
   * Utility: Throttle function to limit execution rate
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Utility: Log messages if logging is enabled
   */
  log(message) {
    if (this.config.enableLogging) {
      console.log(`[PopupBehaviorTracker] ${message}`);
    }
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    window.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('mouseout', this.handleMouseOut);
    this.state.initialized = false;
    this.log('Behavior tracker destroyed');
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PopupBehaviorTracker;
} else if (typeof window !== 'undefined') {
  window.PopupBehaviorTracker = PopupBehaviorTracker;
}