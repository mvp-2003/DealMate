export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  bank: string;
  cardType: string;
  rewardRate: number;
  currentPoints: number;
  threshold: number;
  rewardValue: number;
}

export interface Purchase {
  id: string;
  userId: string;
  productId: string;
  price: number;
  saved: number;
  timestamp: string;
}

export interface Reward {
  userId: string;
  goal: string;
  targetPoints: number;
  rewardValue: number;
  unlocked: boolean;
}
