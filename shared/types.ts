// Core User Types
export interface User {
  id: string;
  email: string;
  createdAt: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  currency: string;
  language: string;
  notifications: NotificationSettings;
  categories: string[];
  priceAlertThreshold: number;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  priceDrops: boolean;
  newDeals: boolean;
  weeklyDigest: boolean;
}

// Financial & Reward Types
export interface Wallet {
  id: string;
  userId: string;
  bank: string;
  cardType: string;
  rewardRate: number;
  currentPoints: number;
  threshold: number;
  rewardValue: number;
  isActive: boolean;
  expiryDate?: string;
}

export interface Purchase {
  id: string;
  userId: string;
  productId: string;
  price: number;
  saved: number;
  timestamp: string;
  platform: string;
  category: string;
  paymentMethod: string;
}

export interface Reward {
  userId: string;
  goal: string;
  targetPoints: number;
  rewardValue: number;
  unlocked: boolean;
  progress: number;
  estimatedUnlockDate?: string;
}

// Product & Deal Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  imageUrl?: string;
  currentPrice: number;
  originalPrice?: number;
  currency: string;
  platform: string;
  url: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
  rating?: number;
  reviewCount?: number;
  lastUpdated: string;
}

export interface Deal {
  id: string;
  productId: string;
  title: string;
  description: string;
  dealType: 'coupon' | 'cashback' | 'discount' | 'offer' | 'bundle';
  value: number;
  valueType: 'percentage' | 'fixed' | 'points';
  code?: string;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  platform: string;
  confidence: number;
  stackable: boolean;
  terms?: string[];
}

export interface StackedDeal {
  deals: Deal[];
  totalSavings: number;
  finalPrice: number;
  confidence: number;
  applicationOrder: string[];
  warnings?: string[];
}

// Price & Comparison Types
export interface PriceHistory {
  productId: string;
  prices: PricePoint[];
  trend: 'increasing' | 'decreasing' | 'stable';
  volatility: number;
  bestPrice: PricePoint;
  averagePrice: number;
}

export interface PricePoint {
  price: number;
  date: string;
  platform: string;
  availability: boolean;
}

export interface PriceComparison {
  productId: string;
  comparisons: PlatformPrice[];
  bestDeal: PlatformPrice;
  savings: number;
  lastUpdated: string;
}

export interface PlatformPrice {
  platform: string;
  price: number;
  shipping: number;
  tax: number;
  totalPrice: number;
  availability: boolean;
  deliveryTime: string;
  deals: Deal[];
  url: string;
}

// Wishlist & Alert Types
export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  targetPrice?: number;
  alertEnabled: boolean;
  addedDate: string;
  lastChecked: string;
  priceDrops: PricePoint[];
}

export interface PriceAlert {
  id: string;
  userId: string;
  productId: string;
  alertType: 'price_drop' | 'deal_available' | 'back_in_stock' | 'best_time_to_buy';
  threshold?: number;
  isActive: boolean;
  lastTriggered?: string;
  frequency: 'immediate' | 'daily' | 'weekly';
}

// AI & Analysis Types
export interface AIAnalysis {
  productId: string;
  isProductPage: boolean;
  confidence: number;
  detectionMethod: 'ai' | 'rules' | 'hybrid';
  extractedData: ProductData;
  sentiment?: SentimentAnalysis;
  pricePredict?: PricePrediction;
  processingTime: number;
  timestamp: string;
}

export interface ProductData {
  name: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image?: string;
  description?: string;
  specifications?: Record<string, string>;
  reviews?: string[];
}

export interface SentimentAnalysis {
  overallSentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  summary: string;
  positiveAspects: string[];
  negativeAspects: string[];
  reviewCount: number;
}

export interface PricePrediction {
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  forecast: {
    oneWeek: number;
    oneMonth: number;
    threeMonths: number;
  };
  recommendation: string;
  factors: string[];
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
