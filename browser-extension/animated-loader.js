// DealPal Animated Loading Utilities for Browser Extension
// This file provides animated loading components that can be used throughout the extension

class DealPalLoader {
  constructor() {
    this.defaultWords = ['deals', 'offers', 'coupons', 'savings', 'deals'];
    this.loadingTexts = {
      deals: 'finding',
      products: 'searching',
      coupons: 'fetching',
      auth: 'loading',
      payment: 'processing'
    };
  }

  // Create the CSS for the animated loader
  createLoaderCSS() {
    return `
      @keyframes word-spin {
        10% { transform: translateY(-102%); }
        25% { transform: translateY(-100%); }
        35% { transform: translateY(-202%); }
        50% { transform: translateY(-200%); }
        60% { transform: translateY(-302%); }
        75% { transform: translateY(-300%); }
        85% { transform: translateY(-402%); }
        100% { transform: translateY(-400%); }
      }

      .dealpal-animate-word-spin {
        animation: word-spin 4s infinite;
      }

      .dealpal-loader-container {
        display: inline-block;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 12px 16px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .dealpal-loader-content {
        color: #9ca3af;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        line-height: 24px;
      }

      .dealpal-loader-words {
        overflow: hidden;
        position: relative;
        min-width: 80px;
      }

      .dealpal-loader-words::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(
          rgba(0, 0, 0, 0.9) 10%,
          transparent 30%,
          transparent 70%,
          rgba(0, 0, 0, 0.9) 90%
        );
        z-index: 20;
        pointer-events: none;
      }

      .dealpal-loader-word {
        display: block;
        height: 100%;
        padding-left: 6px;
        color: #a855f7;
        font-weight: 600;
      }

      .dealpal-loader-dots {
        display: flex;
        gap: 4px;
        margin-left: 8px;
      }

      .dealpal-loader-dot {
        width: 4px;
        height: 4px;
        background-color: #a855f7;
        border-radius: 50%;
        animation: pulse 1.5s ease-in-out infinite;
      }

      .dealpal-loader-dot:nth-child(1) { animation-delay: 0ms; }
      .dealpal-loader-dot:nth-child(2) { animation-delay: 200ms; }
      .dealpal-loader-dot:nth-child(3) { animation-delay: 400ms; }

      @keyframes pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }

      /* Size variants */
      .dealpal-loader-sm .dealpal-loader-content {
        font-size: 14px;
        line-height: 20px;
      }

      .dealpal-loader-sm {
        padding: 8px 12px;
        border-radius: 8px;
      }

      .dealpal-loader-lg .dealpal-loader-content {
        font-size: 20px;
        line-height: 28px;
      }

      .dealpal-loader-lg {
        padding: 16px 24px;
        border-radius: 16px;
      }
    `;
  }

  // Inject CSS into the page
  injectCSS() {
    if (!document.getElementById('dealpal-loader-styles')) {
      const style = document.createElement('style');
      style.id = 'dealpal-loader-styles';
      style.textContent = this.createLoaderCSS();
      document.head.appendChild(style);
    }
  }

  // Create animated loader element
  createLoader(options = {}) {
    const {
      words = this.defaultWords,
      loadingText = 'loading',
      size = 'md',
      showDots = true,
      className = ''
    } = options;

    this.injectCSS();

    const container = document.createElement('div');
    container.className = `dealpal-loader-container dealpal-loader-${size} ${className}`;

    const content = document.createElement('div');
    content.className = 'dealpal-loader-content';

    const textSpan = document.createElement('span');
    textSpan.textContent = loadingText;

    const wordsContainer = document.createElement('div');
    wordsContainer.className = 'dealpal-loader-words';

    words.forEach((word, index) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'dealpal-loader-word dealpal-animate-word-spin';
      wordSpan.textContent = word;
      wordSpan.style.animationDelay = `${index * 0.8}s`;
      wordSpan.style.animationDuration = `${words.length * 0.8}s`;
      wordsContainer.appendChild(wordSpan);
    });

    content.appendChild(textSpan);
    content.appendChild(wordsContainer);

    if (showDots) {
      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'dealpal-loader-dots';
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'dealpal-loader-dot';
        dotsContainer.appendChild(dot);
      }
      content.appendChild(dotsContainer);
    }

    container.appendChild(content);
    return container;
  }

  // Predefined loaders for different contexts
  createDealLoader(size = 'md') {
    return this.createLoader({
      words: ['deals', 'offers', 'coupons', 'savings', 'deals'],
      loadingText: 'finding',
      size
    });
  }

  createSearchLoader(size = 'md') {
    return this.createLoader({
      words: ['products', 'prices', 'reviews', 'options', 'products'],
      loadingText: 'searching',
      size
    });
  }

  createCouponLoader(size = 'md') {
    return this.createLoader({
      words: ['coupons', 'codes', 'discounts', 'offers', 'coupons'],
      loadingText: 'fetching',
      size
    });
  }

  createAuthLoader(size = 'md') {
    return this.createLoader({
      words: ['account', 'profile', 'settings', 'data', 'account'],
      loadingText: 'loading',
      size
    });
  }

  // Utility method to show loader in a specific element
  showLoaderInElement(elementId, loaderType = 'deal', size = 'md') {
    const element = document.getElementById(elementId);
    if (!element) return null;

    let loader;
    switch (loaderType) {
      case 'search':
        loader = this.createSearchLoader(size);
        break;
      case 'coupon':
        loader = this.createCouponLoader(size);
        break;
      case 'auth':
        loader = this.createAuthLoader(size);
        break;
      default:
        loader = this.createDealLoader(size);
    }

    element.innerHTML = '';
    element.appendChild(loader);
    return loader;
  }

  // Hide loader and restore original content
  hideLoader(elementId, originalContent = '') {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = originalContent;
    }
  }
}

// Create global instance
window.DealPalLoader = new DealPalLoader();

// For Node.js environments or modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DealPalLoader;
}
