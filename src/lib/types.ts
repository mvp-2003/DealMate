
export interface Offer {
  id: string;
  productName: string;
  productImageUrl?: string;
  platform: string; // e.g., "Amazon.in", "Flipkart"
  basePrice: number;
  couponValue?: number; // Direct discount from coupon
  cashbackPercentage?: number; // e.g., 5 for 5%
  cashbackFlat?: number; // e.g., 50 for ₹50
  cardSpecificBonusPercentage?: number; // Bonus if paid with a specific card type
  cardSpecificBonusFlat?: number;
  requiredCardType?: string; // e.g., "HDFC Infinia" for card specific bonus
  productUrl: string;
}

export interface UserCard {
  id: string; // Unique ID for the card entry
  userId: string; // Firebase Auth UID
  bank: string; // e.g., "HDFC"
  cardType: string; // e.g., "Infinia", "Millennia" - user-defined, for matching offers
  rewardsPerRupeeSpent?: number; // Points earned per Rupee spent
  rewardValueInRupees?: number; // Value of 1 reward point in Rupees
  currentPoints?: number;
  nextRewardThreshold?: number; // Points needed for next significant perk
  nextRewardValueInRupees?: number; // Value of that perk in Rupees
  // We do not store full card numbers or sensitive details
  last4Digits?: string; // Optional, for display only
}

export interface RankedOffer extends Offer {
  finalPrice: number;
  totalDiscountValue: number;
  totalCashbackValue: number;
  cardBonusValue: number;
  potentialPerkValue: number;
  compositeScore: number;
  rankingExplanation: string[];
  achievedPerkDescription?: string; // e.g., "Unlocks ₹500 HDFC Infinia perk"
}

export interface LoyaltyProgram {
  id: string;
  userId: string;
  programName: string; // e.g., "Flipkart SuperCoins", "Myntra Insider"
  currentPoints: number;
  pointsToNextTier?: number;
  nextTierBenefits?: string; // Description of benefits
  pointValueInRupees?: number; // If points can be directly converted
}

// Represents the user's state for points/rewards relevant to ranking
export interface UserPointsState {
  cards: UserCard[];
  loyaltyPrograms: LoyaltyProgram[];
}
