// Inline type definitions to resolve errors
declare module '@/lib/api' {
  export interface UserCard {
    id: string;
    userId: string;
    bank: string;
    cardType: string;
    last4Digits?: string;
    rewards_per_rupee?: number;
    reward_value_inr?: number;
    current_points?: number;
    next_reward_threshold?: number;
    next_reward_value?: number;
  }

  export interface LoyaltyProgram {
    id: string;
    userId: string;
    programName: string;
    currentPoints: number;
    pointValueInRupees: number;
  }

  export interface UserRewardGoal {
    id: string;
    userId: string;
    description: string;
    targetType: string;
    targetValue: number;
    cardIdRef?: string;
    loyaltyProgramIdRef?: string;
    isActive: boolean;
  }

  export function fetchUserCards(): Promise<UserCard[]>;
  export function fetchLoyaltyPrograms(): Promise<LoyaltyProgram[]>;
  export function fetchUserRewardGoals(): Promise<UserRewardGoal[]>;
}
