// DealPal Auto Coupon Tester - Automatically tests and applies the best coupon codes

class AutoCouponTester {
  constructor() {
    this.isTestingInProgress = false;
    this.testResults = [];
    this.originalPrice = null;
    this.checkoutSelectors = [
      // Generic selectors
      'input[name*="coupon" i]', 'input[id*="coupon" i]', 
      'input[name*="promo" i]', 'input[id*="promo" i]',
      'input[name*="discount" i]', 'input[id*="discount" i]',
      '#coupon-code', '#promo-code', '#discount-code',
      '.coupon-input', '.promo-input', '.discount-input',
      '[data-testid*="coupon"]', '[data-testid*="promo"]',
      
      // Site-specific selectors
      '#twotabsearchtextbox', // Amazon
      '.cart-promotion-code-input', // Shopify
      '.promocode-input', // Generic
      '[placeholder*="coupon" i]', '[placeholder*="promo" i]'
    ];
    
    this.applyButtonSelectors = [
      'button[class*="apply" i]', 'input[value*="Apply" i]',
      'button[id*="apply" i]', 'button[class*="coupon" i]',
      '[data-testid*="apply"]', '.apply-btn', '.coupon-apply',
      'button:has-text("Apply")', 'button:has-text("Submit")',
      'input[type="submit"][value*="apply" i]'
    ];
    
    this.priceSelectors = [
      '.total', '.grand-total', '.final-total', '.order-total',
      '[data-testid*="total"]', '.price-total', '.checkout-total',
      '.cart-total', '.summary-total', '.payment-total'
    ];
  }

  async detectCheckoutPage() {
    const url = window.location.href.toLowerCase();
    const checkoutIndicators = [
      'checkout', 'cart', 'payment', 'billing', 'shipping',
      'order', 'purchase', 'pay', 'buy'
    ];
    
    const isCheckoutPage = checkoutIndicators.some(indicator => 
      url.includes(indicator) || document.title.toLowerCase().includes(indicator)
    );
    
    // Also check for checkout form elements
    const hasCheckoutElements = this.findElement(this.checkoutSelectors) !== null;
    
    return isCheckoutPage || hasCheckoutElements;
  }

  findElement(selectors) {
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element && this.isElementVisible(element)) {
          return element;
        }
      } catch (e) {
        // Invalid selector, continue to next
        continue;
      }
    }
    return null;
  }

  isElementVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0;
  }

  getCurrentPrice() {
    const priceElement = this.findElement(this.priceSelectors);
    if (priceElement) {
      const priceText = priceElement.textContent || priceElement.innerText || '';
      const priceMatch = priceText.match(/[\d,]+\.?\d*/);
      return priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : null;
    }
    return null;
  }

  async testCoupon(couponCode, couponInput, applyButton) {
    if (!couponInput || !applyButton) return null;

    try {
      // Clear existing value
      couponInput.value = '';
      couponInput.dispatchEvent(new Event('input', { bubbles: true }));
      couponInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      await this.delay(500);
      
      // Enter coupon code
      couponInput.value = couponCode;
      couponInput.dispatchEvent(new Event('input', { bubbles: true }));
      couponInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      await this.delay(500);
      
      // Get price before applying
      const priceBefore = this.getCurrentPrice();
      
      // Click apply button
      applyButton.click();
      
      // Wait for processing
      await this.delay(3000);
      
      // Check for success/error messages
      const result = await this.checkCouponResult(couponCode, priceBefore);
      
      return result;
      
    } catch (error) {
      console.error('Error testing coupon:', couponCode, error);
      return {
        code: couponCode,
        success: false,
        error: error.message,
        savings: 0
      };
    }
  }

  async checkCouponResult(couponCode, priceBefore) {
    // Check for success indicators
    const successSelectors = [
      '.success', '.coupon-success', '.promo-success',
      '[class*="success"]', '.applied', '.coupon-applied',
      '.discount-applied', '[data-testid*="success"]'
    ];
    
    // Check for error indicators
    const errorSelectors = [
      '.error', '.coupon-error', '.promo-error',
      '[class*="error"]', '.invalid', '.expired',
      '.not-applicable', '[data-testid*="error"]'
    ];
    
    const successElement = this.findElement(successSelectors);
    const errorElement = this.findElement(errorSelectors);
    
    const priceAfter = this.getCurrentPrice();
    const savings = priceBefore && priceAfter ? priceBefore - priceAfter : 0;
    
    let success = false;
    let message = '';
    
    if (successElement) {
      success = true;
      message = successElement.textContent || 'Coupon applied successfully';
    } else if (errorElement) {
      success = false;
      message = errorElement.textContent || 'Coupon not valid';
    } else if (savings > 0) {
      success = true;
      message = `Saved $${savings.toFixed(2)}`;
    } else {
      success = false;
      message = 'No discount applied';
    }
    
    return {
      code: couponCode,
      success,
      message,
      savings,
      priceBefore,
      priceAfter
    };
  }

  getMerchantFromURL() {
    const hostname = window.location.hostname;
    // This is a simple implementation. A more robust solution would use a
    // library or a more comprehensive list of mappings.
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    return hostname;
  }

  async autoTestCoupons() {
    if (this.isTestingInProgress) {
      console.log('🎯 DealPal: Coupon testing already in progress');
      return this.testResults;
    }

    const isCheckout = await this.detectCheckoutPage();
    if (!isCheckout) {
      console.log('🎯 DealPal: Not on checkout page, skipping auto-test');
      return [];
    }

    this.isTestingInProgress = true;
    this.testResults = [];
    this.originalPrice = this.getCurrentPrice();

    const merchant = this.getMerchantFromURL();
    if (!merchant) {
        console.warn('🎯 DealPal: Could not determine merchant from URL.');
        this.isTestingInProgress = false;
        return [];
    }

    console.log(`🎯 DealPal: Starting automatic coupon testing for ${merchant}...`);

    const availableCoupons = await this.fetchCouponsForMerchant(merchant);

    if (availableCoupons.length === 0) {
        console.log('🎯 DealPal: No coupons found for this merchant.');
        this.isTestingInProgress = false;
        return [];
    }
    
    // Show testing notification
    this.showTestingNotification(availableCoupons.length);
    
    const couponInput = this.findElement(this.checkoutSelectors);
    const applyButton = this.findElement(this.applyButtonSelectors);
    
    if (!couponInput || !applyButton) {
      console.warn('🎯 DealPal: Could not find coupon input or apply button');
      this.isTestingInProgress = false;
      return [];
    }

    // Test each coupon
    for (let i = 0; i < availableCoupons.length; i++) {
      const coupon = availableCoupons[i];
      console.log(`🎯 DealPal: Testing coupon ${i + 1}/${availableCoupons.length}: ${coupon.coupon_code}`);
      
      this.updateTestingProgress(i + 1, availableCoupons.length, coupon.coupon_code);
      
      const result = await this.testCoupon(coupon.coupon_code, couponInput, applyButton);
      if (result) {
        this.testResults.push({
          ...result,
          originalCoupon: coupon
        });
      }
      
      // Small delay between tests
      await this.delay(1000);
    }

    // Find and apply the best coupon
    const bestCoupon = this.findBestCoupon();
    if (bestCoupon) {
      await this.applyBestCoupon(bestCoupon, couponInput, applyButton);
    }

    this.isTestingInProgress = false;
    this.showTestingComplete(bestCoupon);
    
    return this.testResults;
  }

  findBestCoupon() {
    const successfulCoupons = this.testResults.filter(result => result.success && result.savings > 0);
    
    if (successfulCoupons.length === 0) return null;
    
    // Sort by savings amount (highest first)
    successfulCoupons.sort((a, b) => b.savings - a.savings);
    
    return successfulCoupons[0];
  }

  async applyBestCoupon(bestCoupon, couponInput, applyButton) {
    console.log('🎯 DealPal: Applying best coupon:', bestCoupon.code);
    
    // Clear and apply the best coupon
    couponInput.value = '';
    await this.delay(500);
    
    couponInput.value = bestCoupon.code;
    couponInput.dispatchEvent(new Event('input', { bubbles: true }));
    couponInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    await this.delay(500);
    applyButton.click();
  }

  showTestingNotification(couponCount) {
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'dealpal-testing-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <div style="width: 20px; height: 20px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
        <strong>🎯 DealPal Testing Coupons</strong>
      </div>
      <div id="dealpal-progress-text">Testing ${couponCount} available coupons...</div>
      <div style="background: rgba(255,255,255,0.2); height: 4px; border-radius: 2px; margin-top: 8px;">
        <div id="dealpal-progress-bar" style="background: #fff; height: 100%; border-radius: 2px; width: 0%; transition: width 0.3s ease;"></div>
      </div>
    `;
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
  }

  updateTestingProgress(current, total, currentCode) {
    const progressText = document.getElementById('dealpal-progress-text');
    const progressBar = document.getElementById('dealpal-progress-bar');
    
    if (progressText) {
      progressText.textContent = `Testing ${current}/${total}: ${currentCode}`;
    }
    
    if (progressBar) {
      progressBar.style.width = `${(current / total) * 100}%`;
    }
  }

  showTestingComplete(bestCoupon) {
    const notification = document.getElementById('dealpal-testing-notification');
    if (!notification) return;
    
    setTimeout(() => {
      if (bestCoupon) {
        notification.innerHTML = `
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 20px; margin-right: 10px;">✅</span>
            <strong>Best Coupon Applied!</strong>
          </div>
          <div>Code: <strong>${bestCoupon.code}</strong></div>
          <div>Savings: <strong>$${bestCoupon.savings.toFixed(2)}</strong></div>
        `;
      } else {
        notification.innerHTML = `
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 20px; margin-right: 10px;">ℹ️</span>
            <strong>Testing Complete</strong>
          </div>
          <div>No working coupons found</div>
        `;
      }
      
      // Remove notification after 5 seconds
      setTimeout(() => {
        notification.remove();
      }, 5000);
    }, 1000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchCouponsForMerchant(merchant) {
    try {
      const domain = window.location.hostname;
      const response = await fetch(`http://localhost:8000/api/v1/coupons/search?merchant_domain=${domain}&active_only=true`);
      if (!response.ok) {
        console.error('🎯 DealPal: Failed to fetch coupons from backend');
        return [];
      }
      const coupons = await response.json();
      console.log(`🎯 DealPal: Fetched ${coupons.length} coupons for ${domain}`);
      return coupons.map(coupon => ({
        coupon_code: coupon.code,
        title: coupon.title,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value
      }));
    } catch (error) {
      console.error('🎯 DealPal: Error fetching coupons:', error);
      return [];
    }
  }
}

// Initialize and export
const autoCouponTester = new AutoCouponTester();

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startCouponTesting') {
    autoCouponTester.autoTestCoupons().then(results => {
      sendResponse({ success: true, results });
    });
    return true; // Indicates async response
  }
});

console.log('🎯 DealPal: Auto Coupon Tester loaded');
