import type { UserCard, LoyaltyProgram, UserRewardGoal } from './types';

export async function fetchUserCards(): Promise<UserCard[]> {
  // Replace with actual API call
  return [
    { id: 'card1', userId: 'mockUserId', bank: 'HDFC', cardType: 'Infinia', last4Digits: '1234', rewards_per_rupee: 0.165, reward_value_inr: 1, current_points: 25000, next_reward_threshold: 30000, next_reward_value: 2500 },
    { id: 'card2', userId: 'mockUserId', bank: 'Axis', cardType: 'Magnus', last4Digits: '5678', rewards_per_rupee: 0.048 , reward_value_inr: 1, current_points: 120000, next_reward_threshold: 100000, next_reward_value: 10000 },
    { id: 'card3', userId: 'mockUserId', bank: 'SBI', cardType: 'Cashback', last4Digits: '9012', rewards_per_rupee: 0.05, reward_value_inr: 1 },
  ];
}

export async function fetchLoyaltyPrograms(): Promise<LoyaltyProgram[]> {
  // Replace with actual API call
  return [
    { id: 'lp1', userId: 'mockUserId', programName: 'Flipkart SuperCoins', currentPoints: 350, pointValueInRupees: 1},
    { id: 'lp2', userId: 'mockUserId', programName: 'Amazon Pay Rewards', currentPoints: 150, pointValueInRupees: 1},
  ];
}

export async function fetchUserRewardGoals(): Promise<UserRewardGoal[]> {
  // Replace with actual API call
  return [
    { id: 'goal1', userId: 'mockUserId', description: 'Maximize HDFC Infinia Flight Vouchers', targetType: 'points_milestone_card', targetValue: 30000, cardIdRef: 'card1', isActive: true },
    { id: 'goal2', userId: 'mockUserId', description: 'Save ₹2000 this month on electronics', targetType: 'monetary_savings_monthly', targetValue: 2000, isActive: true },
  ];
}
