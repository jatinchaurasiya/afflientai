// Afflient.ai Integration Script - Handles all client-side functionality
(function() {
  'use strict';

  // Configuration from window.AfflientConfig
  const config = window.AfflientConfig || {};
  const API_BASE = config.apiBase || 'https://api.afflient.ai';
  const INTEGRATION_KEY = config.integrationKey;
  const USER_ID = config.userId;
  const PLATFORM = config.platform;

  // State management
  let state = {
    initialized: false,
    sessionId: null,
    userId: null,
    currentUrl: window.location.href,
    contentAnalyzed: false,
    popupsDisplayed: new Set(),
    userInteractions: [],
    behaviorData: {
      scrollDepth: 0,
      timeOnPage: 0,
      clicks: 0,
      startTime: Date.now()
    }
  };

  // Initialize session
  function initializeSession() {
    state.sessionId = sessionStorage.getItem('afflient_session') || generateSessionId();
    sessionStorage.setItem('afflient_session', state.sessionId);
    
    // Get or create user ID from cookies
    state.userId = getCookie('afflient_user_id') || generateUserId();
    setCookie('afflient_user_id', state.userId, 365);
    
    console.log('Afflient.ai initialized:', { sessionId: state.sessionId, userId: state.userId });
  }

  // Generate unique IDs
  function generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Cookie utilities
  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }

  function getCookie(name) {
    return document.cookie.split('; ').reduce((r, v) => {
      const parts = v.split('=');
      return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
  }

  // Content analysis
  async function analyzePageContent() {
    if (state.contentAnalyzed) return;
    
    try {
      const content = extractPageContent();
      
      const response = await fetch(`${API_BASE}/analyze-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${INTEGRATION_KEY}`
        },
        body: JSON.stringify({
          url: window.location.href,
          title: document.title,
          content: content.text,
          excerpt: content.excerpt,
          integrationKey: INTEGRATION_KEY,
          userId: USER_ID,
          sessionId: state.sessionId
        })
      });

      if (response.ok) {
        const result = await response.json();
        state.contentAnalyzed = true;
        
        // Handle recommendations
        if (result.shouldCreatePopup && result.recommendations.length > 0) {
          await loadAndDisplayPopups(result.recommendations);
        }
        
        trackEvent('content_analyzed', {
          keywords_found: result.analysis?.keywords?.length || 0,
          buying_intent_score: result.analysis?.buying_intent_score || 0,
          recommendations_count: result.recommendations?.length || 0
        });
      }
    } catch (error) {
      console.error('Content analysis error:', error);
    }
  }

  // Extract page content
  function extractPageContent() {
    // Remove script and style elements
    const clonedDoc = document.cloneNode(true);
    const scripts = clonedDoc.querySelectorAll('script, style, nav, header, footer');
    scripts.forEach(el => el.remove());
    
    // Get main content
    const contentSelectors = [
      'main', 
      '[role="main"]', 
      '.content', 
      '.post-content', 
      '.entry-content',
      'article',
      '.article-content'
    ];
    
    let mainContent = null;
    for (const selector of contentSelectors) {
      mainContent = clonedDoc.querySelector(selector);
      if (mainContent) break;
    }
    
    const contentElement = mainContent || clonedDoc.body;
    const text = contentElement.textContent || contentElement.innerText || '';
    
    return {
      text: text.trim(),
      excerpt: text.substring(0, 300).trim(),
      wordCount: text.split(/\s+/).length
    };
  }

  // Load and display popups
  async function loadAndDisplayPopups(recommendations) {
    try {
      const response = await fetch(`${API_BASE}/get-popups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${INTEGRATION_KEY}`
        },
        body: JSON.stringify({
          userId: USER_ID,
          sessionId: state.sessionId,
          url: window.location.href,
          recommendations: recommendations
        })
      });

      if (response.ok) {
        const popups = await response.json();
        
        for (const popup of popups) {
          if (!state.popupsDisplayed.has(popup.id)) {
            await displayPopup(popup);
          }
        }
      }
    } catch (error) {
      console.error('Popup loading error:', error);
    }
  }

  // Display popup
  async function displayPopup(popup) {
    const config = popup.config;
    const triggers = config.triggers;
    
    // Check if popup should be displayed
    if (!shouldDisplayPopup(popup)) return;
    
    // Wait for triggers
    await waitForTriggers(triggers);
    
    // Create and show popup
    const popupElement = createPopupElement(popup);
    document.body.appendChild(popupElement);
    
    // Animate in
    setTimeout(() => {
      popupElement.style.opacity = '1';
      const content = popupElement.querySelector('.afflient-popup-content');
      if (content) content.style.transform = 'translateY(0) scale(1)';
    }, 10);
    
    state.popupsDisplayed.add(popup.id);
    
    trackEvent('popup_displayed', {
      popup_id: popup.id,
      trigger_type: triggers.type || 'auto'
    });
  }

  // Check if popup should be displayed
  function shouldDisplayPopup(popup) {
    const popupId = popup.id;
    
    // Check frequency limits
    const lastShown = localStorage.getItem(`afflient_popup_${popupId}_last_shown`);
    if (lastShown) {
      const timeSince = Date.now() - parseInt(lastShown);
      const cooldown = popup.config.targeting?.cooldownPeriod || 24 * 60 * 60 * 1000;
      if (timeSince < cooldown) return false;
    }
    
    // Check display limits
    const displayCount = parseInt(localStorage.getItem(`afflient_popup_${popupId}_count`) || '0');
    const maxDisplays = popup.config.targeting?.maxDisplaysPerUser || 3;
    if (displayCount >= maxDisplays) return false;
    
    return true;
  }

  // Wait for triggers
  function waitForTriggers(triggers) {
    return new Promise((resolve) => {
      let scrollTriggered = false;
      let timeTriggered = false;
      
      // Time trigger
      if (triggers.timeDelay) {
        setTimeout(() => {
          timeTriggered = true;
          if (scrollTriggered || !triggers.scrollPercentage) resolve();
        }, triggers.timeDelay);
      } else {
        timeTriggered = true;
      }
      
      // Scroll trigger
      if (triggers.scrollPercentage) {
        const checkScroll = () => {
          const scrollPercent = (window.pageYOffset / (document.body.scrollHeight - window.innerHeight)) * 100;
          if (scrollPercent >= triggers.scrollPercentage) {
            scrollTriggered = true;
            window.removeEventListener('scroll', checkScroll);
            if (timeTriggered) resolve();
          }
        };
        
        window.addEventListener('scroll', checkScroll, { passive: true });
        checkScroll(); // Check immediately
      } else {
        scrollTriggered = true;
      }
      
      // Exit intent trigger
      if (triggers.exitIntent) {
        const handleMouseLeave = (e) => {
          if (e.clientY <= 0) {
            document.removeEventListener('mouseleave', handleMouseLeave);
            resolve();
          }
        };
        document.addEventListener('mouseleave', handleMouseLeave);
      }
      
      // Resolve immediately if no triggers
      if (timeTriggered && scrollTriggered) {
        resolve();
      }
    });
  }

  // Create popup element
  function createPopupElement(popup) {
    const config = popup.config;
    const content = config.content;
    const design = config.design;
    
    const overlay = document.createElement('div');
    overlay.id = `afflient-popup-${popup.id}`;
    overlay.className = 'afflient-popup-overlay';
    overlay.style.cssText = `
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
    `;
    
    const popupContent = document.createElement('div');
    popupContent.className = 'afflient-popup-content';
    popupContent.style.cssText = `
      background: ${design.colors.background};
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      margin: 20px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      position: relative;
      transform: translateY(20px) scale(0.95);
      transition: transform 0.3s ease;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
      position: absolute;
      top: 12px;
      right: 12px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 4px;
      z-index: 1;
    `;
    closeButton.onclick = () => closePopup(popup.id);
    
    // Headline
    const headline = document.createElement('h3');
    headline.textContent = content.headline;
    headline.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 20px;
      font-weight: 600;
      color: ${design.colors.text};
      font-family: ${design.fonts.heading};
    `;
    
    // Description
    const description = document.createElement('p');
    description.textContent = content.description;
    description.style.cssText = `
      margin: 0 0 20px 0;
      color: #6b7280;
      line-height: 1.5;
      font-family: ${design.fonts.body};
    `;
    
    // Products
    const productsContainer = document.createElement('div');
    productsContainer.className = 'afflient-products';
    productsContainer.style.marginBottom = '20px';
    
    content.products.forEach(product => {
      const productElement = createProductElement(product, design);
      productsContainer.appendChild(productElement);
    });
    
    // CTA Button
    const ctaButton = document.createElement('button');
    ctaButton.textContent = content.ctaText;
    ctaButton.style.cssText = `
      background: ${design.colors.primary};
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
      width: 100%;
      font-size: 16px;
    `;
    ctaButton.onmouseover = () => {
      ctaButton.style.opacity = '0.9';
    };
    ctaButton.onmouseout = () => {
      ctaButton.style.opacity = '1';
    };
    ctaButton.onclick = () => handleCTAClick(popup);
    
    // Assemble popup
    popupContent.appendChild(closeButton);
    popupContent.appendChild(headline);
    popupContent.appendChild(description);
    popupContent.appendChild(productsContainer);
    popupContent.appendChild(ctaButton);
    overlay.appendChild(popupContent);
    
    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) closePopup(popup.id);
    };
    
    return overlay;
  }

  // Create product element
  function createProductElement(product, design) {
    const productDiv = document.createElement('div');
    productDiv.style.cssText = `
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    `;
    
    // Product image
    const img = document.createElement('img');
    img.src = product.image_url;
    img.alt = product.name;
    img.style.cssText = `
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 6px;
      margin-right: 12px;
    `;
    
    // Product info
    const infoDiv = document.createElement('div');
    infoDiv.style.flex = '1';
    
    const name = document.createElement('h4');
    name.textContent = product.name;
    name.style.cssText = `
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 500;
      color: ${design.colors.text};
    `;
    
    const price = document.createElement('div');
    price.textContent = `$${product.price}`;
    price.style.cssText = `
      font-weight: 600;
      color: ${design.colors.primary};
    `;
    
    infoDiv.appendChild(name);
    infoDiv.appendChild(price);
    
    // View button
    const viewButton = document.createElement('a');
    viewButton.href = product.affiliate_url;
    viewButton.target = '_blank';
    viewButton.textContent = 'View';
    viewButton.style.cssText = `
      background: ${design.colors.secondary};
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      text-decoration: none;
      font-size: 12px;
      transition: background-color 0.2s;
    `;
    viewButton.onclick = () => trackProductClick(product.id);
    
    productDiv.appendChild(img);
    productDiv.appendChild(infoDiv);
    productDiv.appendChild(viewButton);
    
    return productDiv;
  }

  // Close popup
  function closePopup(popupId) {
    const popup = document.getElementById(`afflient-popup-${popupId}`);
    if (popup) {
      popup.style.opacity = '0';
      setTimeout(() => {
        popup.remove();
      }, 300);
    }
    
    // Update display count
    const count = parseInt(localStorage.getItem(`afflient_popup_${popupId}_count`) || '0');
    localStorage.setItem(`afflient_popup_${popupId}_count`, (count + 1).toString());
    localStorage.setItem(`afflient_popup_${popupId}_last_shown`, Date.now().toString());
    
    trackEvent('popup_closed', { popup_id: popupId });
  }

  // Handle CTA click
  function handleCTAClick(popup) {
    trackEvent('popup_cta_clicked', { popup_id: popup.id });
    
    // If there's only one product, redirect to it
    if (popup.config.content.products.length === 1) {
      window.open(popup.config.content.products[0].affiliate_url, '_blank');
    }
    
    closePopup(popup.id);
  }

  // Track product click
  function trackProductClick(productId) {
    trackEvent('product_clicked', { product_id: productId });
  }

  // Track user behavior
  function trackUserBehavior() {
    // Track scroll depth
    const trackScroll = () => {
      const scrollPercent = (window.pageYOffset / (document.body.scrollHeight - window.innerHeight)) * 100;
      state.behaviorData.scrollDepth = Math.max(state.behaviorData.scrollDepth, scrollPercent);
    };
    
    // Track clicks
    const trackClicks = () => {
      state.behaviorData.clicks++;
    };
    
    // Track time on page
    const updateTimeOnPage = () => {
      state.behaviorData.timeOnPage = Date.now() - state.behaviorData.startTime;
    };
    
    window.addEventListener('scroll', trackScroll, { passive: true });
    document.addEventListener('click', trackClicks);
    
    // Send behavior data periodically
    setInterval(() => {
      updateTimeOnPage();
      sendBehaviorData();
    }, 30000); // Every 30 seconds
    
    // Send data when user leaves
    window.addEventListener('beforeunload', () => {
      updateTimeOnPage();
      sendBehaviorData();
    });
  }

  // Send behavior data
  function sendBehaviorData() {
    trackEvent('user_behavior', {
      scroll_depth: Math.round(state.behaviorData.scrollDepth),
      time_on_page: Math.round(state.behaviorData.timeOnPage / 1000),
      clicks: state.behaviorData.clicks,
      url: window.location.href
    });
  }

  // Track events
  function trackEvent(eventType, data = {}) {
    const eventData = {
      event_type: eventType,
      session_id: state.sessionId,
      user_id: state.userId,
      url: window.location.href,
      timestamp: Date.now(),
      integration_key: INTEGRATION_KEY,
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      ...data
    };
    
    // Send to analytics
    fetch(`${API_BASE}/track-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INTEGRATION_KEY}`
      },
      body: JSON.stringify(eventData)
    }).catch(error => {
      console.error('Event tracking error:', error);
    });
    
    // Store locally as backup
    state.userInteractions.push(eventData);
    
    // Limit stored interactions
    if (state.userInteractions.length > 100) {
      state.userInteractions = state.userInteractions.slice(-50);
    }
  }

  // Initialize when DOM is ready
  function initialize() {
    if (state.initialized) return;
    
    initializeSession();
    trackUserBehavior();
    
    // Analyze content after a short delay
    setTimeout(analyzePageContent, 1000);
    
    state.initialized = true;
    
    trackEvent('page_view', {
      title: document.title,
      platform: PLATFORM
    });
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Expose global API
  window.Afflient = {
    trackEvent: trackEvent,
    getSessionId: () => state.sessionId,
    getUserId: () => state.userId,
    analyzeContent: analyzePageContent,
    version: '1.0.0'
  };

})();