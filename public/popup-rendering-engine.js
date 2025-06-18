/**
 * Production-Ready Popup Rendering Engine
 * Advanced popup system with security, accessibility, and performance optimizations
 */

class PopupRenderingEngine {
  constructor(config = {}) {
    this.config = {
      maxProducts: config.maxProducts || 6,
      animationDuration: config.animationDuration || 300,
      autoCloseDelay: config.autoCloseDelay || 30000,
      enableAnimations: config.enableAnimations !== false,
      enableAnalytics: config.enableAnalytics !== false,
      enableAccessibility: config.enableAccessibility !== false,
      theme: config.theme || 'modern',
      position: config.position || 'center',
      zIndex: config.zIndex || 10000,
      ...config
    };

    this.state = {
      activePopup: null,
      renderCount: 0,
      lastRenderTime: 0,
      isRendering: false
    };

    this.templates = this.initializeTemplates();
    this.observers = {
      intersection: null,
      mutation: null
    };

    // Bind methods
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
  }

  /**
   * Initialize templates for different popup styles
   */
  initializeTemplates() {
    return {
      modern: {
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      },
      minimal: {
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      },
      classic: {
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
        fontFamily: 'Georgia, serif'
      }
    };
  }

  /**
   * Main popup rendering method with comprehensive error handling
   */
  async renderPopup(recommendations, options = {}) {
    try {
      // Validate inputs
      if (!this.validateRecommendations(recommendations)) {
        throw new Error('Invalid recommendations data provided');
      }

      // Prevent concurrent renders
      if (this.state.isRendering) {
        console.warn('[PopupRenderer] Render already in progress, skipping');
        return null;
      }

      this.state.isRendering = true;

      // Remove existing popup if present
      await this.removeExistingPopup();

      // Process and sanitize recommendations
      const processedRecommendations = this.processRecommendations(recommendations);
      
      if (processedRecommendations.length === 0) {
        throw new Error('No valid recommendations to display');
      }

      // Create popup structure
      const popup = await this.createPopupStructure(processedRecommendations, options);
      
      // Apply theme and positioning
      this.applyTheme(popup, options.theme || this.config.theme);
      this.applyPositioning(popup, options.position || this.config.position);

      // Add to DOM with proper insertion point
      const insertionPoint = this.getInsertionPoint();
      insertionPoint.appendChild(popup);

      // Initialize interactive features
      await this.initializePopupFeatures(popup, processedRecommendations, options);

      // Animate in
      await this.animateIn(popup);

      // Setup auto-close timer
      this.setupAutoClose(popup);

      // Update state
      this.updateRenderState(popup);

      console.log(`[PopupRenderer] Successfully rendered popup with ${processedRecommendations.length} products`);
      return popup;

    } catch (error) {
      console.error('[PopupRenderer] Failed to render popup:', error);
      this.handleRenderError(error);
      return null;
    } finally {
      this.state.isRendering = false;
    }
  }

  /**
   * Validate recommendations data structure
   */
  validateRecommendations(recommendations) {
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      return false;
    }

    return recommendations.every(product => 
      product &&
      typeof product === 'object' &&
      this.isValidString(product.title) &&
      this.isValidUrl(product.affiliateLink || product.affiliate_url) &&
      this.isValidUrl(product.image || product.image_url)
    );
  }

  /**
   * Process and sanitize recommendations
   */
  processRecommendations(recommendations) {
    return recommendations
      .slice(0, this.config.maxProducts)
      .map(product => this.sanitizeProduct(product))
      .filter(product => product !== null);
  }

  /**
   * Sanitize individual product data
   */
  sanitizeProduct(product) {
    try {
      const sanitized = {
        id: this.sanitizeText(product.id || `product_${Date.now()}_${Math.random()}`),
        title: this.sanitizeText(product.title, 100),
        price: this.sanitizeText(product.price || 'View Details', 50),
        description: this.sanitizeText(product.description || '', 200),
        affiliateLink: this.sanitizeUrl(product.affiliateLink || product.affiliate_url),
        image: this.sanitizeUrl(product.image || product.image_url),
        category: this.sanitizeText(product.category || 'Product', 50),
        rating: this.sanitizeRating(product.rating),
        originalPrice: this.sanitizeText(product.originalPrice || '', 50),
        discount: this.sanitizeText(product.discount || '', 20)
      };

      // Additional validation
      if (!sanitized.title || !sanitized.affiliateLink || !sanitized.image) {
        return null;
      }

      return sanitized;
    } catch (error) {
      console.warn('[PopupRenderer] Failed to sanitize product:', error);
      return null;
    }
  }

  /**
   * Create the main popup structure
   */
  async createPopupStructure(recommendations, options = {}) {
    const popup = document.createElement('div');
    popup.className = this.buildPopupClasses(options);
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');
    popup.setAttribute('aria-labelledby', 'popup-title');
    popup.setAttribute('aria-describedby', 'popup-description');
    popup.setAttribute('tabindex', '-1');
    popup.style.zIndex = this.config.zIndex;

    // Create popup content
    const content = this.createPopupContent(recommendations, options);
    popup.appendChild(content);

    // Add overlay if needed
    if (options.overlay !== false) {
      const overlay = this.createOverlay();
      popup.insertBefore(overlay, content);
    }

    return popup;
  }

  /**
   * Create overlay element
   */
  createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'aai-popup-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    return overlay;
  }

  /**
   * Create popup content structure
   */
  createPopupContent(recommendations, options) {
    const content = document.createElement('div');
    content.className = 'aai-popup-content';
    content.setAttribute('role', 'document');

    // Header
    const header = this.createHeader(options);
    content.appendChild(header);

    // Products grid
    const productsGrid = this.createProductsGrid(recommendations, options);
    content.appendChild(productsGrid);

    // Footer
    const footer = this.createFooter(options);
    content.appendChild(footer);

    return content;
  }

  /**
   * Create popup header with close button and title
   */
  createHeader(options) {
    const header = document.createElement('div');
    header.className = 'aai-popup-header';

    // Close button
    const closeButton = document.createElement('button');
    closeButton.className = 'aai-close-btn';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close recommendations popup');
    closeButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;

    // Title
    const title = document.createElement('h2');
    title.id = 'popup-title';
    title.className = 'aai-popup-title';
    title.textContent = options.title || 'Recommended for You';

    // Subtitle/description
    const description = document.createElement('p');
    description.id = 'popup-description';
    description.className = 'aai-popup-description';
    description.textContent = options.description || 'Curated products based on your interests';

    header.appendChild(closeButton);
    header.appendChild(title);
    header.appendChild(description);

    return header;
  }

  /**
   * Create products grid with advanced layout
   */
  createProductsGrid(recommendations, options) {
    const grid = document.createElement('div');
    grid.className = 'aai-products-grid';
    grid.setAttribute('role', 'list');

    const gridColumns = this.calculateGridColumns(recommendations.length);
    grid.style.gridTemplateColumns = `repeat(${gridColumns}, 1fr)`;

    recommendations.forEach((product, index) => {
      const productCard = this.createProductCard(product, index, options);
      grid.appendChild(productCard);
    });

    return grid;
  }

  /**
   * Create individual product card
   */
  createProductCard(product, index, options) {
    const card = document.createElement('div');
    card.className = 'aai-product-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('data-product-id', product.id);
    card.setAttribute('tabindex', '0');

    // Create product link
    const link = document.createElement('a');
    link.href = product.affiliateLink;
    link.className = 'aai-product-link';
    link.target = '_blank';
    link.rel = 'noopener noreferrer nofollow';
    link.setAttribute('aria-label', `View ${product.title} - Opens in new tab`);

    // Product image with lazy loading
    const imageContainer = this.createImageContainer(product, index);
    link.appendChild(imageContainer);

    // Product details
    const details = this.createProductDetails(product);
    link.appendChild(details);

    // Add interaction enhancements
    this.addCardInteractions(card, link, product);

    card.appendChild(link);
    return card;
  }

  /**
   * Create product image container with lazy loading and fallbacks
   */
  createImageContainer(product, index) {
    const container = document.createElement('div');
    container.className = 'aai-image-container';

    const img = document.createElement('img');
    img.className = 'aai-product-image';
    img.alt = `${product.title} product image`;
    img.loading = 'lazy';
    img.decoding = 'async';
    
    // Implement progressive image loading
    img.addEventListener('load', () => {
      img.classList.add('loaded');
    });

    img.addEventListener('error', () => {
      this.handleImageError(img, product);
    });

    // Set image source with optimization
    img.src = this.optimizeImageUrl(product.image);

    // Add loading placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'aai-image-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');

    container.appendChild(placeholder);
    container.appendChild(img);

    // Add badge if product has discount
    if (product.discount) {
      const badge = this.createDiscountBadge(product.discount);
      container.appendChild(badge);
    }

    return container;
  }

  /**
   * Create discount badge
   */
  createDiscountBadge(discount) {
    const badge = document.createElement('div');
    badge.className = 'aai-discount-badge';
    badge.textContent = discount;
    return badge;
  }

  /**
   * Handle image loading error
   */
  handleImageError(img, product) {
    // Set fallback image
    img.src = 'https://via.placeholder.com/300x300?text=Product+Image';
    img.classList.add('aai-image-error');
    
    // Log error for analytics
    console.warn(`[PopupRenderer] Failed to load image for product: ${product.id}`);
  }

  /**
   * Create product details section
   */
  createProductDetails(product) {
    const details = document.createElement('div');
    details.className = 'aai-product-details';

    // Title
    const title = document.createElement('h3');
    title.className = 'aai-product-title';
    title.textContent = product.title;

    // Price section
    const priceSection = this.createPriceSection(product);

    // Rating if available
    const rating = product.rating ? this.createRatingDisplay(product.rating) : null;

    // Category
    const category = document.createElement('span');
    category.className = 'aai-product-category';
    category.textContent = product.category;

    details.appendChild(category);
    details.appendChild(title);
    if (rating) details.appendChild(rating);
    details.appendChild(priceSection);

    return details;
  }

  /**
   * Create rating display
   */
  createRatingDisplay(rating) {
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'aai-rating';
    ratingContainer.setAttribute('aria-label', `Rating: ${rating} out of 5 stars`);
    
    // Create star display
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      if (i <= fullStars) {
        star.className = 'aai-star aai-star-full';
        star.innerHTML = '★';
      } else if (i === fullStars + 1 && hasHalfStar) {
        star.className = 'aai-star aai-star-half';
        star.innerHTML = '★';
        star.style.clipPath = 'inset(0 50% 0 0)';
      } else {
        star.className = 'aai-star aai-star-empty';
        star.innerHTML = '☆';
      }
      ratingContainer.appendChild(star);
    }
    
    // Add numeric rating
    const ratingText = document.createElement('span');
    ratingText.className = 'aai-rating-text';
    ratingText.textContent = rating.toFixed(1);
    ratingContainer.appendChild(ratingText);
    
    return ratingContainer;
  }

  /**
   * Create price section with original price and discount
   */
  createPriceSection(product) {
    const priceSection = document.createElement('div');
    priceSection.className = 'aai-price-section';

    const currentPrice = document.createElement('span');
    currentPrice.className = 'aai-current-price';
    currentPrice.textContent = product.price;

    priceSection.appendChild(currentPrice);

    if (product.originalPrice && product.originalPrice !== product.price) {
      const originalPrice = document.createElement('span');
      originalPrice.className = 'aai-original-price';
      originalPrice.textContent = product.originalPrice;
      priceSection.appendChild(originalPrice);
    }

    return priceSection;
  }

  /**
   * Create footer with disclaimer and branding
   */
  createFooter(options) {
    const footer = document.createElement('div');
    footer.className = 'aai-popup-footer';

    const disclaimer = document.createElement('small');
    disclaimer.className = 'aai-disclaimer';
    disclaimer.textContent = options.disclaimer || 'Affiliate links - we may earn a commission from purchases';

    const branding = document.createElement('div');
    branding.className = 'aai-branding';
    branding.innerHTML = options.branding || 'Powered by <strong>AffiliateAI</strong>';

    footer.appendChild(disclaimer);
    footer.appendChild(branding);

    return footer;
  }

  /**
   * Initialize all popup interactive features
   */
  async initializePopupFeatures(popup, recommendations, options) {
    // Add event listeners
    this.addEventListeners(popup, recommendations, options);

    // Initialize accessibility features
    if (this.config.enableAccessibility) {
      this.initializeAccessibility(popup);
    }

    // Setup intersection observer for analytics
    if (this.config.enableAnalytics) {
      this.setupIntersectionObserver(popup, recommendations);
    }

    // Initialize keyboard navigation
    this.initializeKeyboardNavigation(popup);

    // Setup focus management
    this.setupFocusManagement(popup);
  }

  /**
   * Add comprehensive event listeners
   */
  addEventListeners(popup, recommendations, options) {
    // Close button
    const closeBtn = popup.querySelector('.aai-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closePopup(popup, 'close_button');
      });
    }

    // Overlay click to close
    const overlay = popup.querySelector('.aai-popup-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closePopup(popup, 'overlay_click');
        }
      });
    }

    // Product click tracking
    const productLinks = popup.querySelectorAll('.aai-product-link');
    productLinks.forEach((link, index) => {
      const product = recommendations[index];
      
      link.addEventListener('click', (e) => {
        this.trackProductClick(product, index, options);
      });

      // Hover tracking for engagement analytics
      link.addEventListener('mouseenter', () => {
        this.trackProductHover(product, index);
      });
    });

    // Global event listeners
    document.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('focusin', this.handleFocus);
  }

  /**
   * Add card interactions for better UX
   */
  addCardInteractions(card, link, product) {
    // Add hover effects
    card.addEventListener('mouseenter', () => {
      card.classList.add('aai-card-hover');
    });
    
    card.addEventListener('mouseleave', () => {
      card.classList.remove('aai-card-hover');
    });
    
    // Add focus effects
    card.addEventListener('focus', () => {
      card.classList.add('aai-card-focus');
    });
    
    card.addEventListener('blur', () => {
      card.classList.remove('aai-card-focus');
    });
    
    // Add click effect
    card.addEventListener('mousedown', () => {
      card.classList.add('aai-card-active');
    });
    
    card.addEventListener('mouseup', () => {
      card.classList.remove('aai-card-active');
    });
    
    // Keyboard activation
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        link.click();
      }
    });
  }

  /**
   * Handle keyboard interactions
   */
  handleKeydown(e) {
    if (!this.state.activePopup) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.closePopup(this.state.activePopup, 'escape_key');
        break;
      case 'Tab':
        this.handleTabNavigation(e);
        break;
      case 'Enter':
      case ' ':
        this.handleEnterSpace(e);
        break;
    }
  }

  /**
   * Handle Tab key navigation for focus trapping
   */
  handleTabNavigation(e) {
    if (!this.state.activePopup) return;
    
    const focusableElements = this.getFocusableElements(this.state.activePopup);
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Trap focus within popup
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }

  /**
   * Handle Enter/Space key for interactive elements
   */
  handleEnterSpace(e) {
    if (!this.state.activePopup || !document.activeElement) return;
    
    // Only handle for non-button/link elements that should be interactive
    const isInteractiveElement = document.activeElement.tagName === 'BUTTON' || 
                                document.activeElement.tagName === 'A' ||
                                document.activeElement.tagName === 'INPUT';
    
    if (!isInteractiveElement && document.activeElement.classList.contains('aai-product-card')) {
      e.preventDefault();
      const link = document.activeElement.querySelector('.aai-product-link');
      if (link) link.click();
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (this.state.activePopup) {
      this.adjustPopupPosition(this.state.activePopup);
    }
  }

  /**
   * Handle focus management
   */
  handleFocus(e) {
    if (!this.state.activePopup) return;
    
    // Check if focus is moving outside the popup
    const isInPopup = this.state.activePopup.contains(e.target);
    if (!isInPopup) {
      // Bring focus back into popup
      const focusableElements = this.getFocusableElements(this.state.activePopup);
      if (focusableElements.length > 0) {
        e.preventDefault();
        focusableElements[0].focus();
      }
    }
  }

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container) {
    return Array.from(container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
  }

  /**
   * Apply theme styling to popup
   */
  applyTheme(popup, theme) {
    const themeSettings = this.templates[theme] || this.templates.modern;
    const content = popup.querySelector('.aai-popup-content');
    
    if (content) {
      content.style.borderRadius = themeSettings.borderRadius;
      content.style.boxShadow = themeSettings.boxShadow;
      content.style.fontFamily = themeSettings.fontFamily;
    }
    
    popup.classList.add(`aai-theme-${theme}`);
  }

  /**
   * Apply positioning to popup
   */
  applyPositioning(popup, position) {
    popup.classList.add(`aai-position-${position}`);
    
    const content = popup.querySelector('.aai-popup-content');
    if (!content) return;
    
    switch (position) {
      case 'center':
        content.style.top = '50%';
        content.style.left = '50%';
        content.style.transform = 'translate(-50%, -50%)';
        break;
      case 'top':
        content.style.top = '20px';
        content.style.left = '50%';
        content.style.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        content.style.bottom = '20px';
        content.style.left = '50%';
        content.style.transform = 'translateX(-50%)';
        break;
      case 'left':
        content.style.left = '20px';
        content.style.top = '50%';
        content.style.transform = 'translateY(-50%)';
        break;
      case 'right':
        content.style.right = '20px';
        content.style.top = '50%';
        content.style.transform = 'translateY(-50%)';
        break;
      case 'bottom-right':
        content.style.bottom = '20px';
        content.style.right = '20px';
        break;
      case 'bottom-left':
        content.style.bottom = '20px';
        content.style.left = '20px';
        break;
      case 'top-right':
        content.style.top = '20px';
        content.style.right = '20px';
        break;
      case 'top-left':
        content.style.top = '20px';
        content.style.left = '20px';
        break;
    }
  }

  /**
   * Adjust popup position on window resize
   */
  adjustPopupPosition(popup) {
    const content = popup.querySelector('.aai-popup-content');
    if (!content) return;
    
    // Get current position class
    const positionClass = Array.from(popup.classList)
      .find(cls => cls.startsWith('aai-position-'));
    
    if (positionClass) {
      const position = positionClass.replace('aai-position-', '');
      this.applyPositioning(popup, position);
    }
    
    // Ensure popup is fully visible in viewport
    const rect = content.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Adjust if off-screen
    if (rect.right > viewportWidth) {
      content.style.right = '20px';
      content.style.left = 'auto';
    }
    
    if (rect.bottom > viewportHeight) {
      content.style.bottom = '20px';
      content.style.top = 'auto';
    }
  }

  /**
   * Initialize accessibility features
   */
  initializeAccessibility(popup) {
    // Set initial focus
    setTimeout(() => {
      const closeButton = popup.querySelector('.aai-close-btn');
      if (closeButton) {
        closeButton.focus();
      } else {
        popup.focus();
      }
    }, 100);
    
    // Add aria attributes to interactive elements
    const productCards = popup.querySelectorAll('.aai-product-card');
    productCards.forEach((card, index) => {
      card.setAttribute('aria-posinset', index + 1);
      card.setAttribute('aria-setsize', productCards.length);
    });
    
    // Save previously focused element to restore later
    this.previouslyFocusedElement = document.activeElement;
  }

  /**
   * Setup intersection observer for visibility tracking
   */
  setupIntersectionObserver(popup, recommendations) {
    if (!('IntersectionObserver' in window)) return;
    
    // Track when popup becomes visible
    this.observers.intersection = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.logImpression(recommendations);
          this.observers.intersection.disconnect();
        }
      });
    }, { threshold: 0.5 });
    
    this.observers.intersection.observe(popup);
    
    // Track product visibility
    const productCards = popup.querySelectorAll('.aai-product-card');
    const productObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const productId = entry.target.getAttribute('data-product-id');
          const productIndex = Array.from(productCards).findIndex(card => 
            card.getAttribute('data-product-id') === productId
          );
          
          if (productIndex !== -1) {
            this.trackProductImpression(recommendations[productIndex], productIndex);
          }
        }
      });
    }, { threshold: 0.7, root: popup });
    
    productCards.forEach(card => {
      productObserver.observe(card);
    });
  }

  /**
   * Initialize keyboard navigation
   */
  initializeKeyboardNavigation(popup) {
    const productCards = popup.querySelectorAll('.aai-product-card');
    
    // Add keyboard navigation between products
    productCards.forEach((card, index) => {
      card.addEventListener('keydown', (e) => {
        let nextIndex;
        
        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            nextIndex = (index + 1) % productCards.length;
            productCards[nextIndex].focus();
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            nextIndex = (index - 1 + productCards.length) % productCards.length;
            productCards[nextIndex].focus();
            break;
          case 'Home':
            e.preventDefault();
            productCards[0].focus();
            break;
          case 'End':
            e.preventDefault();
            productCards[productCards.length - 1].focus();
            break;
        }
      });
    });
  }

  /**
   * Setup focus management
   */
  setupFocusManagement(popup) {
    // Save previously focused element
    this.previouslyFocusedElement = document.activeElement;
    
    // Set initial focus to the popup
    setTimeout(() => {
      popup.focus();
    }, 100);
  }

  /**
   * Animate popup entrance
   */
  async animateIn(popup) {
    if (!this.config.enableAnimations) {
      popup.classList.add('aai-popup-visible');
      return;
    }

    popup.style.opacity = '0';
    popup.style.transform = 'scale(0.9) translateY(-20px)';
    popup.classList.add('aai-popup-visible');

    // Force reflow
    popup.offsetHeight;

    // Animate in
    popup.style.transition = `opacity ${this.config.animationDuration}ms ease-out, transform ${this.config.animationDuration}ms ease-out`;
    popup.style.opacity = '1';
    popup.style.transform = 'scale(1) translateY(0)';

    return new Promise(resolve => {
      setTimeout(resolve, this.config.animationDuration);
    });
  }

  /**
   * Close popup with animation
   */
  async closePopup(popup, reason = 'unknown') {
    if (!popup || !popup.parentNode) return;

    console.log(`[PopupRenderer] Closing popup due to: ${reason}`);

    // Track close event
    this.trackPopupClose(reason);

    if (this.config.enableAnimations) {
      popup.style.transition = `opacity ${this.config.animationDuration}ms ease-in, transform ${this.config.animationDuration}ms ease-in`;
      popup.style.opacity = '0';
      popup.style.transform = 'scale(0.9) translateY(-20px)';

      await new Promise(resolve => setTimeout(resolve, this.config.animationDuration));
    }

    // Cleanup
    this.cleanupPopup(popup);
    popup.remove();

    // Restore focus to previously focused element
    if (this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === 'function') {
      this.previouslyFocusedElement.focus();
    }

    // Update state
    this.state.activePopup = null;
  }

  /**
   * Remove existing popup if present
   */
  async removeExistingPopup() {
    const existingPopup = document.querySelector('.aai-popup');
    if (existingPopup) {
      await this.closePopup(existingPopup, 'new_popup_render');
    }
  }

  /**
   * Setup auto-close timer
   */
  setupAutoClose(popup) {
    if (this.config.autoCloseDelay > 0) {
      setTimeout(() => {
        if (popup.parentNode) {
          this.closePopup(popup, 'auto_close');
        }
      }, this.config.autoCloseDelay);
    }
  }

  /**
   * Track analytics events
   */
  async logImpression(recommendations, options = {}) {
    if (!this.config.enableAnalytics) return;

    try {
      const impressionData = {
        type: 'popup_impression',
        timestamp: Date.now(),
        products: recommendations.map(p => ({
          id: p.id,
          title: p.title,
          category: p.category
        })),
        renderConfig: {
          theme: options.theme || this.config.theme,
          position: options.position || this.config.position,
          productCount: recommendations.length
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      // Send to analytics endpoint
      await this.sendAnalytics('impression', impressionData);
      console.log('[PopupRenderer] Impression logged successfully');

    } catch (error) {
      console.error('[PopupRenderer] Failed to log impression:', error);
    }
  }

  /**
   * Track product impression
   */
  trackProductImpression(product, index) {
    if (!this.config.enableAnalytics) return;
    
    try {
      const data = {
        type: 'product_impression',
        timestamp: Date.now(),
        product: {
          id: product.id,
          title: product.title,
          position: index
        },
        url: window.location.href
      };
      
      this.sendAnalytics('product_impression', data);
    } catch (error) {
      console.error('[PopupRenderer] Failed to track product impression:', error);
    }
  }

  /**
   * Track product click
   */
  async trackProductClick(product, index, options) {
    if (!this.config.enableAnalytics) return;

    try {
      const clickData = {
        type: 'product_click',
        timestamp: Date.now(),
        product: {
          id: product.id,
          title: product.title,
          category: product.category,
          position: index
        },
        url: window.location.href
      };

      await this.sendAnalytics('click', clickData);
      console.log(`[PopupRenderer] Product click tracked: ${product.title}`);

    } catch (error) {
      console.error('[PopupRenderer] Failed to track product click:', error);
    }
  }

  /**
   * Track product hover
   */
  trackProductHover(product, index) {
    if (!this.config.enableAnalytics) return;
    
    try {
      const data = {
        type: 'product_hover',
        timestamp: Date.now(),
        product: {
          id: product.id,
          title: product.title,
          position: index
        },
        url: window.location.href
      };
      
      this.sendAnalytics('hover', data);
    } catch (error) {
      console.error('[PopupRenderer] Failed to track product hover:', error);
    }
  }

  /**
   * Track popup close event
   */
  trackPopupClose(reason) {
    if (!this.config.enableAnalytics) return;
    
    try {
      const data = {
        type: 'popup_close',
        timestamp: Date.now(),
        reason: reason,
        displayDuration: Date.now() - this.state.lastRenderTime,
        url: window.location.href
      };
      
      this.sendAnalytics('close', data);
    } catch (error) {
      console.error('[PopupRenderer] Failed to track popup close:', error);
    }
  }

  /**
   * Send analytics data to server
   */
  async sendAnalytics(eventType, data) {
    if (!this.config.enableAnalytics) return;
    
    try {
      // Use sendBeacon for better reliability when page is unloading
      if (navigator.sendBeacon && (eventType === 'close' || document.visibilityState === 'hidden')) {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        return navigator.sendBeacon(`${this.config.analyticsEndpoint || '/api/analytics'}/${eventType}`, blob);
      }
      
      // Fall back to fetch for normal operation
      const response = await fetch(`${this.config.analyticsEndpoint || '/api/analytics'}/${eventType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        // Use keepalive for better reliability
        keepalive: true
      });
      
      return response.ok;
    } catch (error) {
      console.error(`[PopupRenderer] Analytics error (${eventType}):`, error);
      return false;
    }
  }

  /**
   * Utility methods
   */
  isValidString(str) {
    return typeof str === 'string' && str.trim().length > 0;
  }

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  sanitizeText(text, maxLength = 255) {
    if (!text || typeof text !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = text.trim();
    const sanitized = div.innerHTML;
    
    return maxLength ? sanitized.substring(0, maxLength) : sanitized;
  }

  sanitizeUrl(url) {
    if (!this.isValidUrl(url)) return '';
    
    try {
      const urlObj = new URL(url);
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return '';
      }
      return urlObj.toString();
    } catch {
      return '';
    }
  }

  sanitizeRating(rating) {
    const num = parseFloat(rating);
    return !isNaN(num) && num >= 0 && num <= 5 ? num : null;
  }

  buildPopupClasses(options) {
    const classes = ['aai-popup'];
    
    if (options.theme) classes.push(`aai-theme-${options.theme}`);
    if (options.position) classes.push(`aai-position-${options.position}`);
    if (options.size) classes.push(`aai-size-${options.size}`);
    
    return classes.join(' ');
  }

  calculateGridColumns(productCount) {
    if (productCount <= 2) return 1;
    if (productCount <= 4) return 2;
    return 3;
  }

  optimizeImageUrl(url) {
    // Add image optimization parameters if supported
    if (url.includes('?')) {
      return `${url}&w=300&h=300&fit=crop&auto=format`;
    }
    return `${url}?w=300&h=300&fit=crop&auto=format`;
  }

  getInsertionPoint() {
    return document.body;
  }

  updateRenderState(popup) {
    this.state.activePopup = popup;
    this.state.renderCount++;
    this.state.lastRenderTime = Date.now();
  }

  handleRenderError(error) {
    // Emit custom event for error handling
    const errorEvent = new CustomEvent('popupRenderError', {
      detail: { error, timestamp: Date.now() }
    });
    window.dispatchEvent(errorEvent);
  }

  // Cleanup methods
  cleanupPopup(popup) {
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('focusin', this.handleFocus);

    // Cleanup observers
    if (this.observers.intersection) {
      this.observers.intersection.disconnect();
    }
    if (this.observers.mutation) {
      this.observers.mutation.disconnect();
    }
  }

  destroy() {
    if (this.state.activePopup) {
      this.closePopup(this.state.activePopup, 'destroy');
    }
    this.cleanupPopup();
  }

  // Public API
  getState() {
    return { ...this.state };
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PopupRenderingEngine;
} else if (typeof window !== 'undefined') {
  window.PopupRenderingEngine = PopupRenderingEngine;
}

/* Usage Example:
const renderer = new PopupRenderingEngine({
  maxProducts: 4,
  theme: 'modern',
  position: 'center',
  enableAnimations: true,
  enableAnalytics: true,
  autoCloseDelay: 30000
});

renderer.renderPopup(recommendations, {
  title: 'Hand-picked for You',
  description: 'Products you might love',
  theme: 'dark'
});
*/