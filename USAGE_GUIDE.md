# DealPal - Complete Usage Guide

## 🚀 Getting Started

### 1. Development Setup
```bash
# Start the complete DealPal system
./dev.sh

# This will start:
# - Backend (Rust): http://localhost:8000
# - Frontend (Next.js): http://localhost:9002
```

### 2. Browser Extension Setup
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `browser-extension` folder from your DealPal directory
5. The DealPal extension icon will appear in your toolbar

## 🎯 How to Use DealPal

### Frontend Web Application
**Dashboard** (`http://localhost:9002/dashboard`)
- Overview of tracked products and deals
- Savings score and price history charts
- Quick access to all features

**Smart Deals** (`http://localhost:9002/smart-deals`)
- AI-ranked deals based on your cards and preferences
- Personalized recommendations
- Real-time deal scoring

**DealBot** (`http://localhost:9002/ask-dealbot`)
- AI chat assistant for deal questions
- Natural language deal queries
- Product recommendations

**Wallet** (`http://localhost:9002/wallet`)
- Manage your credit cards
- Track reward points and cashback
- Set savings goals

**Settings** (`http://localhost:9002/settings`)
- Notification preferences
- Account configuration
- Privacy settings

### Browser Extension Features
**Automatic Deal Detection:**
- Visit any e-commerce site (Amazon, Flipkart, etc.)
- Extension automatically detects products and deals
- Shows notifications for found coupons and offers

**Extension Popup:**
- Click the DealPal icon in toolbar
- View detected deals on current page
- Quick links to DealPal dashboard
- Refresh scan functionality

### Supported E-commerce Sites
- Amazon.in / Amazon.com
- Flipkart.com
- Myntra.com
- Ajio.com
- Nykaa.com
- Walmart.com
- eBay.com
- And any site with product pages

## 🔧 Features

### ✅ Working Features
- **Frontend**: All pages responsive and functional
- **Backend**: REST API with deal analysis
- **Extension**: Real-time coupon/offer detection
- **Database**: PostgreSQL with migrations
- **UI/UX**: Modern glassmorphic design
- **Mobile**: Fully responsive on all screen sizes

### 🎨 UI/UX Highlights
- **3D Glassmorphic Design**: Modern transparent cards with blur effects
- **Purple-Blue Gradient Theme**: Consistent brand colors
- **Mobile-First**: Optimized for phones and tablets
- **Large Screen Support**: Beautiful layouts on desktop
- **Smooth Animations**: Floating cards and transitions
- **Touch-Friendly**: Proper touch targets and gestures

### 🔌 API Endpoints
- `GET /health_check` - Backend health status
- `GET /api/deals` - Fetch available deals
- `POST /api/deals` - Product detection from extension
- Wallet endpoints for card management

### 🛡️ Security & Privacy
- Local development environment
- No external data transmission
- Mock data for testing
- Secure CORS configuration

## 📱 Mobile Experience
All pages are optimized for mobile devices:
- **Navigation**: Scrollable tabs with short names
- **Touch Targets**: 44px minimum for easy tapping
- **Responsive Grids**: Adaptive layouts for all screen sizes
- **Safe Areas**: Proper padding for notched devices
- **Performance**: Optimized loading and animations

## 🔄 Real-time Features
- **Live Deal Detection**: Extension updates as you browse
- **Real-time Notifications**: Instant alerts for new deals
- **Dynamic Ranking**: AI re-ranks deals based on your profile
- **Live Data Sync**: Frontend updates from extension activity

## 🎯 Best Practices
1. **Add Your Cards**: Configure your credit cards in Wallet for personalized rankings
2. **Set Goals**: Use reward goals to optimize your savings strategy
3. **Use Extension**: Browse with extension active for maximum deal discovery
4. **Check Smart Deals**: Regularly review AI-ranked deals for best savings

## 🛠️ Development Notes
- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Rust with Axum framework
- **Database**: PostgreSQL with SQLx migrations
- **Extension**: Vanilla JavaScript with Chrome APIs
- **AI**: Firebase Genkit for deal analysis
- **Styling**: Custom CSS with glassmorphic design system

## 📊 Demo Data
The application includes realistic demo data:
- Sample credit cards with different reward rates
- Mock products from various platforms
- Simulated coupons and cashback offers
- Example price history and savings

---

**Note**: This is a development version with mock data. In production, integrate with real payment processors, e-commerce APIs, and user authentication systems.
