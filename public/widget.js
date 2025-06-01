// Affiliate Widget Implementation
(function() {
  'use strict';
  
  // Widget configuration
  const WIDGET_CONFIG = {
    apiBase: 'https://api.afflient.ai',
    cdnBase: 'https://cdn.afflient.ai',
    version: '1.0.0'
  };
  
  // Get widget token from script tag
  const currentScript = document.currentScript || 
    Array.from(document.getElementsByTagName('script')).pop();
  const scriptSrc = currentScript.src;
  const urlParams = new URLSearchParams(scriptSrc.split('?')[1]);
  
  const config = {
    token: urlParams.get('token'),
    position: urlParams.get('position') || 'bottom-right',
    theme: urlParams.get('theme') || 'light',
    maxProducts: parseInt(urlParams.get('max')) || 3
  };
  
  class AffilientWidget {
    constructor(config) {
      this.config = config;
      this.container = null;
      this.isVisible = false;
      this.products = [];
      
      this.init();
    }
    
    async init() {
      try {
        // Load styles
        await this.loadStyles();
        
        // Fetch recommendations
        await this.fetchRecommendations();
        
        // Create widget DOM
        this.createWidget();
        
        // Setup scroll trigger
        this.setupScrollTrigger();
        
      } catch (error) {
        console.error('Afflient Widget Error:', error);
      }
    }
    
    async loadStyles() {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${WIDGET_CONFIG.cdnBase}/widget.css`;
      document.head.appendChild(link);
    }
    
    async fetchRecommendations() {
      try {
        const response = await fetch(`${WIDGET_CONFIG.apiBase}/recommendations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Widget-Token': this.config.token
          },
          body: JSON.stringify({
            url: window.location.href,
            maxProducts: this.config.maxProducts
          })
        });
        
        if (!response.ok) throw new Error('Failed to fetch recommendations');
        
        const data = await response.json();
        this.products = data.recommendations || [];
        
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        this.products = [];
      }
    }
    
    createWidget() {
      if (this.products.length === 0) return;
      
      this.container = document.createElement('div');
      this.container.id = 'afflient-widget';
      this.container.className = `afflient-widget afflient-${this.config.theme} afflient-${this.config.position}`;
      
      this.container.innerHTML = `
        <div class="afflient-widget-container">
          <div class="afflient-widget-header">
            <h3>Recommended Products</h3>
            <button class="afflient-close-btn" onclick="window.affilientWidget.hide()">×</button>
          </div>
          <div class="afflient-widget-content">
            ${this.renderProducts()}
          </div>
          <div class="afflient-widget-footer">
            <span>Powered by <a href="https://afflient.ai" target="_blank">Afflient.ai</a></span>
          </div>
        </div>
      `;
      
      document.body.appendChild(this.container);
    }
    
    renderProducts() {
      return this.products.map(product => `
        <div class="afflient-product">
          <div class="afflient-product-image">
            <img src="${product.imageUrl}" alt="${product.title}">
          </div>
          <div class="afflient-product-info">
            <h4>${product.title}</h4>
            <div class="afflient-product-price">$${product.price}</div>
            <a href="${product.affiliateUrl}" 
               class="afflient-buy-btn" 
               target="_blank" 
               rel="noopener sponsored">
              View Deal
            </a>
          </div>
        </div>
      `).join('');
    }
    
    setupScrollTrigger() {
      let triggered = false;
      window.addEventListener('scroll', () => {
        if (triggered) return;
        
        const scrollPercent = (window.pageYOffset / document.body.scrollHeight) * 100;
        if (scrollPercent > 25) {
          triggered = true;
          this.show();
        }
      }, { passive: true });
    }
    
    show() {
      if (this.isVisible || !this.container) return;
      this.container.classList.add('afflient-show');
      this.isVisible = true;
    }
    
    hide() {
      if (!this.isVisible || !this.container) return;
      this.container.classList.remove('afflient-show');
      this.isVisible = false;
    }
  }
  
  // Initialize widget
  if (!config.token) {
    console.error('Afflient Widget: No token provided');
    return;
  }
  
  // Create global instance
  window.affilientWidget = new AffilientWidget(config);
  
})();