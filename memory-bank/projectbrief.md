# Project Brief: DealPal

## 🌟 Vision

DealPal is a next-generation product deals and savings assistant designed to help users maximize savings on every purchase. It operates as a comprehensive platform, including a web dashboard, a future mobile app, and a cross-browser extension.

The core mission is to aggregate, rank, and apply the best combination of offers, coupon codes, card discounts, and reward optimizations in real-time, personalized for each user.

---

## 🧠 Core Features

The platform will be built around the following key features:

1.  **Global Offer Scanner:** Automatically detects product pages and fetches offers from various sources.
2.  **StackSmart Engine:** Intelligently combines stackable offers to provide the best value.
3.  **Card-linked Offer Integration:** Displays bank and card-specific discounts.
4.  **Real-Time Price Comparison:** Shows prices from other retailers for the same product.
5.  **Price History Tracker:** Visualizes price trends over time.
6.  **Reward Intelligence Engine:** Calculates the monetary value of credit card points and loyalty rewards.
7.  **Value-Based Offer Ranking (VBOR):** Sorts offers based on their net effective savings for the user.
8.  **Wishlist + Price Drop Alerts:** Notifies users of price drops and new offers for desired products.
9.  **Coupon Management:** Allows users to save, manage, and test coupons across the dashboard and extension.
10. **Sell & Save Marketplace:** A C2C marketplace for users to sell used electronics for cash or store credit.
11. **Local & In-Store Deals:** Future scope includes a mobile feature for in-store price comparisons.

---

## 🔧 Technical Stack

### Frontend (Web Dashboard)
-   **Framework:** Next.js (App Router)
-   **Styling:** Tailwind CSS
-   **UI Components:** Shadcn UI
-   **Key Features:** Dark mode, responsive design, accessibility-focused.

### Backend
-   **Framework:** Axum (Rust)
-   **Authentication:** Auth0
-   **Purpose:** Power the API for offers, coupons, user data, and other core services.

### Database
-   **System:** PostgreSQL
-   **Deployment:** Railway or Supabase
-   **Core Tables:** `users`, `coupons`, `offers`, `resale_items`, `wishlists`, `price_history`.

### Browser Extension
-   **Standard:** Manifest v3
-   **Compatibility:** Chrome, Firefox, Edge, Safari, Brave
-   **Functionality:** Detects product pages, displays offers, and allows for coupon application.
