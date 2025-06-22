// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001';

// Platform Configuration
export const SUPPORTED_PLATFORMS = [
  'amazon.com', 'amazon.in', 'amazon.co.uk', 'amazon.ca', 'amazon.de',
  'flipkart.com', 'myntra.com', 'ajio.com', 'nykaa.com', 'meesho.com',
  'ebay.com', 'ebay.in', 'walmart.com', 'target.com', 'bestbuy.com',
  'paytmmall.com', 'snapdeal.com', 'tatacliq.com', 'reliancedigital.in',
  'croma.com', 'vijaysales.com'
] as const;

// Deal Types
export const DEAL_TYPES = {
  COUPON: 'coupon',
  CASHBACK: 'cashback', 
  DISCOUNT: 'discount',
  OFFER: 'offer',
  BUNDLE: 'bundle',
  MEMBERSHIP: 'membership'
} as const;

// Currency Configuration
export const SUPPORTED_CURRENCIES = {
  INR: { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  USD: { symbol: '$', code: 'USD', name: 'US Dollar' },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro' },
  GBP: { symbol: '£', code: 'GBP', name: 'British Pound' }
} as const;

// Default Values
export const DEFAULT_CURRENCY = 'INR';
export const DEFAULT_LANGUAGE = 'en';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_WISHLIST_ITEMS = 100;
export const MAX_PRICE_ALERTS = 50;

// AI Configuration
export const AI_CONFIDENCE_THRESHOLD = 0.6;
export const PRICE_PREDICTION_DAYS = [7, 30, 90];

// Cache Configuration
export const CACHE_DURATION = {
  PRODUCT_DATA: 5 * 60 * 1000, // 5 minutes
  PRICE_COMPARISON: 10 * 60 * 1000, // 10 minutes
  DEALS: 2 * 60 * 1000, // 2 minutes
  USER_PREFERENCES: 60 * 60 * 1000 // 1 hour
} as const;
