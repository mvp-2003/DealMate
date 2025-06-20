
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
  last4Digits?: string; // Optional, for display only
  
  // Detailed reward structure
  rewards_per_rupee?: number; // Points or value earned per Rupee spent (e.g., 0.05 for 5% direct value, or 3 for 3 points)
  reward_value_inr?: number; // Value of 1 reward point in Rupees (e.g., 0.25 if rewards_per_rupee gives points)
  
  current_points?: number; // Current loyalty points balance on this card
  next_reward_threshold?: number; // Points needed for the next significant perk/milestone
  next_reward_value?: number; // Monetary value (INR) of that perk/milestone
}

export interface LoyaltyProgram {
  id: string;
  userId: string;
  programName: string; // e.g., "Flipkart SuperCoins", "Myntra Insider"
  currentPoints: number;
  pointValueInRupees?: number; // If points can be directly converted or have a general value
  // Potentially add structure for specific tiers/perks if API provides it
  nextTier?: string;
  pointsToNextTier?: number;
  nextTierBenefits?: string;
}

export interface UserRewardGoal {
  id: string;
  userId: string;
  description: string; // e.g., "Save for new headphones", "Maximize HDFC points"
  targetType: 'monetary_savings_monthly' | 'points_milestone_card' | 'points_milestone_program';
  targetValue: number; // e.g., 2000 (for INR) or 5000 (for points)
  cardIdRef?: string; // if targetType is 'points_milestone_card'
  loyaltyProgramIdRef?: string; // if targetType is 'points_milestone_program'
  isActive: boolean;
  // progress can be calculated or stored if updated frequently
}

export interface RankedOffer extends Offer {
  finalPrice: number; // Price after direct coupon, before most cashback/bonuses considered for ranking unless directly reducing payable amount
  effectivePrice: number; // The final price to the user after all discounts, cashback, and card bonuses.
  totalDiscountValue: number; // Sum of coupon and other direct price reductions
  totalCashbackValue: number; // Sum of all cashback (flat, percentage)
  cardBonusValue: number; // Value from card-specific bonuses for this transaction
  potentialPerkValue: number; // Value of a future perk unlocked/contributed to by this purchase
  goalContributionScore: number; // Bonus score if this offer helps with a user's goal
  compositeScore: number;
  rankingExplanation: string[];
  achievedPerkDescription?: string; // e.g., "Unlocks ₹500 HDFC Infinia perk"
  tags?: Array<'Best Combo' | 'Reward Unlock' | 'Extra Cashback' | 'Goal Aligned'>;
}

// Represents the user's state for points/rewards relevant to ranking
export interface UserPointsState {
  cards: UserCard[];
  loyaltyPrograms: LoyaltyProgram[];
  rewardGoals?: UserRewardGoal[];
}

