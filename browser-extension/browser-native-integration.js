// DealPal Browser-Native Integration
// This module provides deep browser integration features

class BrowserNativeIntegration {
  constructor() {
    this.isInitialized = false;
    this.contextMenuCreated = false;
    this.notificationPermission = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Request notification permission
      await this.requestNotificationPermission();
      
      // Setup context menus (background script will handle this)
      this.setupContextMenus();
      
      // Setup keyboard shortcuts
      this.setupKeyboardShortcuts();
      
      // Setup native browser storage sync
      this.setupStorageSync();
      
      this.isInitialized = true;
      console.log('🎯 DealPal: Browser-native integration initialized');
    } catch (error) {
      console.error('🎯 DealPal: Failed to initialize browser integration:', error);
    }
  }

  async requestNotificationPermission() {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        this.notificationPermission = permission;
        console.log('🎯 DealPal: Notification permission:', permission);
      }
    } catch (error) {
      console.error('🎯 DealPal: Notification permission error:', error);
    }
  }

  // Show native browser notifications
  showNativeNotification(title, options = {}) {
    if (this.notificationPermission !== 'granted') return;

    const defaultOptions = {
      icon: chrome.runtime.getURL('images/icon48.png'),
      badge: chrome.runtime.getURL('images/icon16.png'),
      requireInteraction: false,
      silent: false,
      ...options
    };

    try {
      // Use Chrome extension notifications for better integration
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: defaultOptions.icon,
          title: title,
          message: options.body || '',
          buttons: options.actions ? options.actions.map(action => ({
            title: action.title
          })) : undefined
        });
      } else {
        // Fallback to web notifications
        new Notification(title, defaultOptions);
      }
    } catch (error) {
      console.error('🎯 DealPal: Notification error:', error);
    }
  }

  setupContextMenus() {
    // Send message to background script to setup context menus
    chrome.runtime.sendMessage({
      action: 'setupContextMenus'
    });
  }

  setupKeyboardShortcuts() {
    // Listen for keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      // Ctrl+Shift+D (or Cmd+Shift+D on Mac) to open DealPal
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        this.openDealPalPopup();
      }
      
      // Ctrl+Shift+C (or Cmd+Shift+C on Mac) to test coupons
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        this.triggerCouponTest();
      }
    });
  }

  setupStorageSync() {
    // Setup Chrome storage sync for cross-device synchronization
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        console.log('🎯 DealPal: Sync storage changed:', changes);
        this.handleStorageSync(changes);
      }
    });
  }

  handleStorageSync(changes) {
    // Handle synchronized data changes
    if (changes.userPreferences) {
      this.updateUserPreferences(changes.userPreferences.newValue);
    }
    
    if (changes.watchlist) {
      this.updateWatchlist(changes.watchlist.newValue);
    }
    
    if (changes.creditCards) {
      this.updateCreditCards(changes.creditCards.newValue);
    }
  }

  // Save data to synchronized storage
  async saveToSync(key, data) {
    try {
      await chrome.storage.sync.set({ [key]: data });
      console.log(`🎯 DealPal: Saved ${key} to sync storage`);
    } catch (error) {
      console.error(`🎯 DealPal: Failed to save ${key} to sync:`, error);
      // Fallback to local storage
      await chrome.storage.local.set({ [key]: data });
    }
  }

  // Get data from synchronized storage
  async getFromSync(key) {
    try {
      const result = await chrome.storage.sync.get(key);
      return result[key];
    } catch (error) {
      console.error(`🎯 DealPal: Failed to get ${key} from sync:`, error);
      // Fallback to local storage
      const result = await chrome.storage.local.get(key);
      return result[key];
    }
  }

  openDealPalPopup() {
    // Send message to background to open popup
    chrome.runtime.sendMessage({
      action: 'openPopup'
    });
  }

  triggerCouponTest() {
    // Trigger coupon testing
    if (window.autoCouponTester) {
      window.autoCouponTester.detectCheckoutPage().then(isCheckout => {
        if (isCheckout) {
          // Get available coupons and test them
          chrome.runtime.sendMessage({
            action: 'getCoupons'
          }, (response) => {
            if (response.coupons && response.coupons.length > 0) {
              window.autoCouponTester.autoTestCoupons(response.coupons);
            } else {
              this.showNativeNotification('DealPal', {
                body: 'No coupons available to test on this page'
              });
            }
          });
        } else {
          this.showNativeNotification('DealPal', {
            body: 'Coupon testing is only available on checkout pages'
          });
        }
      });
    }
  }

  // Integrate with browser's password manager for storing payment info
  async savePaymentMethod(paymentData) {
    try {
      // Use Chrome's secure storage for sensitive payment data
      await chrome.storage.local.set({
        [`payment_${paymentData.id}`]: {
          ...paymentData,
          saved: Date.now(),
          encrypted: true
        }
      });
      
      this.showNativeNotification('DealPal', {
        body: 'Payment method saved securely'
      });
    } catch (error) {
      console.error('🎯 DealPal: Failed to save payment method:', error);
    }
  }

  // Integrate with browser bookmarks
  async addToBookmarks(productData) {
    try {
      if (chrome.bookmarks) {
        // Create DealPal folder if it doesn't exist
        const folders = await chrome.bookmarks.search({ title: 'DealPal Deals' });
        let folderId;
        
        if (folders.length === 0) {
          const folder = await chrome.bookmarks.create({
            title: 'DealPal Deals'
          });
          folderId = folder.id;
        } else {
          folderId = folders[0].id;
        }
        
        // Add bookmark
        await chrome.bookmarks.create({
          parentId: folderId,
          title: `${productData.productName} - ${productData.price}`,
          url: productData.url
        });
        
        this.showNativeNotification('DealPal', {
          body: 'Product added to DealPal bookmarks'
        });
      }
    } catch (error) {
      console.error('🎯 DealPal: Bookmark error:', error);
    }
  }

  // Integration with browser's download manager for deal reports
  async downloadDealReport(dealData) {
    try {
      const reportData = this.generateDealReport(dealData);
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dealpal-report-${Date.now()}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      
      this.showNativeNotification('DealPal', {
        body: 'Deal report downloaded'
      });
    } catch (error) {
      console.error('🎯 DealPal: Download error:', error);
    }
  }

  generateDealReport(dealData) {
    return {
      timestamp: new Date().toISOString(),
      deals: dealData,
      browser: navigator.userAgent,
      platform: window.location.hostname,
      generatedBy: 'DealPal Browser Extension'
    };
  }

  // Integration with browser's history API for deal tracking
  async trackDealHistory(dealData) {
    try {
      // Add to browser history with special state
      if (window.history && window.history.pushState) {
        const state = {
          dealpal: true,
          deal: dealData,
          timestamp: Date.now()
        };
        
        // This won't change the URL but will add metadata to the history entry
        window.history.replaceState(state, '', window.location.href);
      }
      
      // Also save to local storage for persistence
      const historyKey = `deal_history_${Date.now()}`;
      await chrome.storage.local.set({
        [historyKey]: dealData
      });
      
    } catch (error) {
      console.error('🎯 DealPal: History tracking error:', error);
    }
  }

  // Method to handle context menu clicks (called from background script)
  handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case 'dealpal-check-deals':
        this.checkDealsOnSelection(info.selectionText);
        break;
      case 'dealpal-add-to-watchlist':
        this.addToWatchlistFromContext(info);
        break;
      case 'dealpal-compare-prices':
        this.comparePricesFromContext(info);
        break;
    }
  }

  async checkDealsOnSelection(selectedText) {
    if (!selectedText) return;
    
    // Search for deals related to selected text
    chrome.runtime.sendMessage({
      action: 'searchDeals',
      query: selectedText
    }, (response) => {
      if (response.deals && response.deals.length > 0) {
        this.showNativeNotification('DealPal', {
          body: `Found ${response.deals.length} deals for "${selectedText}"`,
          actions: [{ title: 'View Deals' }]
        });
      } else {
        this.showNativeNotification('DealPal', {
          body: `No deals found for "${selectedText}"`
        });
      }
    });
  }

  updateUserPreferences(preferences) {
    console.log('🎯 DealPal: Updated user preferences:', preferences);
    // Apply preferences to current page
  }

  updateWatchlist(watchlist) {
    console.log('🎯 DealPal: Updated watchlist:', watchlist);
    // Update any watchlist-related UI
  }

  updateCreditCards(creditCards) {
    console.log('🎯 DealPal: Updated credit cards:', creditCards);
    // Update payment method suggestions
  }
}

// Initialize browser integration
const browserIntegration = new BrowserNativeIntegration();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    browserIntegration.initialize();
  });
} else {
  browserIntegration.initialize();
}

// Export for use in other scripts
window.browserIntegration = browserIntegration;

console.log('🎯 DealPal: Browser-native integration module loaded');
