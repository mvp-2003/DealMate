# DealPal Browser Extension - Installation & Testing Guide

## 🚀 Installation Instructions

### For Chrome & Edge:

1. **Open Extension Management:**
   - Chrome: Go to `chrome://extensions/`
   - Edge: Go to `edge://extensions/`

2. **Enable Developer Mode:**
   - Toggle "Developer mode" switch in the top-right corner

3. **Load the Extension:**
   - Click "Load unpacked"
   - Select the `browser-extension` folder from your DealPal project
   - The extension should now appear in your extensions list

4. **Verify Installation:**
   - Look for the DealPal icon in your browser toolbar
   - Extension should show as "Enabled"

## 🧪 Testing the Extension

### Test 1: Using the Test Page
1. Open `/browser-extension/test-page.html` in your browser
2. Open browser console (F12 → Console tab)
3. Look for "🎯 DealPal" messages in console
4. Click the DealPal extension icon
5. Expected: Should detect product and 5 deals total

### Test 2: Real E-commerce Sites
Visit any of these supported sites:
- **Amazon India:** https://amazon.in
- **Flipkart:** https://flipkart.com  
- **Myntra:** https://myntra.com
- **Ajio:** https://ajio.com
- **Amazon US:** https://amazon.com

Navigate to any product page and check:
1. Console logs showing detection
2. Extension popup showing detected product
3. Deal notification in top-right corner (if deals found)

## 🔧 Troubleshooting

### Extension Not Loading:
- Ensure you selected the correct `browser-extension` folder
- Check that all required files are present:
  - `manifest.json`
  - `content.js`
  - `background.js` 
  - `popup.html`
  - `popup.js`
  - `images/` folder with icons

### No Product Detection:
- Check browser console for error messages
- Ensure you're on a product page (not homepage/category page)
- Try refreshing the page
- Click "Refresh Scan" in extension popup

### Backend Connection Issues:
- Ensure backend is running on `http://localhost:8000`
- Check `curl http://localhost:8000/health_check` returns "OK"
- Extension will still work locally even if backend is down

## 📊 Expected Behavior

### Successful Detection Shows:
1. **Console Messages:**
   ```
   🎯 DealPal: Content script loaded on [hostname]
   🎯 DealPal: E-commerce site detected
   🎯 DealPal: Product detected: [product info]
   🎯 DealPal: Deals found: [deal count]
   🎯 DealPal: Data sent successfully
   ```

2. **Extension Popup:**
   - Product name (truncated)
   - Number of coupons/offers found
   - "Refresh Scan" button works

3. **Deal Notification:**
   - Purple notification box in top-right
   - Shows found deals
   - "View All Deals in DealPal" link

### Sites Currently Supported:
✅ **Chrome & Edge** - Full compatibility
❌ **Firefox** - Requires Manifest V2 conversion  
❌ **Safari** - Requires complete restructuring

## 🛠️ Debugging

### Enable Detailed Logging:
Open browser console and filter by "DealPal" to see all extension messages.

### Check Extension Status:
- Extension icon should be visible in toolbar
- Right-click extension icon → "Inspect popup" for popup debugging
- Go to Extensions page to see any load errors

### Test Backend Connection:
```bash
curl -X POST http://localhost:8000/api/deals \
  -H "Content-Type: application/json" \
  -d '{"product":{"productName":"Test"},"deals":{"coupons":[],"offers":[]},"timestamp":123}'
```

## 🎯 What's Fixed

1. **Enhanced Product Detection:**
   - Added 20+ more e-commerce domains
   - Better selectors for Amazon, Flipkart, Myntra
   - Improved fallback detection methods

2. **Better Deal Detection:**
   - More comprehensive coupon/offer patterns
   - Duplicate removal
   - Enhanced text analysis

3. **Improved Error Handling:**
   - Graceful failures when backend unavailable
   - Better user feedback in popup
   - Console logging for debugging

4. **Broader Site Support:**
   - Updated manifest permissions
   - More URL patterns covered
   - Better SPA navigation detection

The extension should now work much better at detecting products and deals across various e-commerce platforms!
