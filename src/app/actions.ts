'use server';

import { askDealBot, type AskDealBotInput, type AskDealBotOutput } from '@/ai/flows/ask-deal-bot';
import { explainDealRank, type ExplainDealRankInput, type ExplainDealRankOutput } from '@/ai/flows/explain-deal-rank-flow';
import { z } from 'zod';
import type { Offer, RankedOffer, UserCard, UserPointsState } from '@/lib/types';
import { calculateRankedOffers } from '@/lib/offer-ranking';

// Mock database for cards - in a real app, this would be Firestore or another DB
let mockUserCards: UserCard[] = [
  { id: 'card1', userId: 'mockUserId', bank: 'HDFC', cardType: 'Infinia', last4Digits: '1234', rewardsPerRupeeSpent: 3, rewardValueInRupees: 0.75, currentPoints: 490, nextRewardThreshold: 500, nextRewardValueInRupees: 500 },
  { id: 'card2', userId: 'mockUserId', bank: 'Axis', cardType: 'Magnus', last4Digits: '5678', rewardsPerRupeeSpent: 2, rewardValueInRupees: 0.50, currentPoints: 1200, nextRewardThreshold: 2000, nextRewardValueInRupees: 1000 },
  { id: 'card3', userId: 'mockUserId', bank: 'SBI', cardType: 'Cashback', last4Digits: '9012', rewardsPerRupeeSpent: 1, rewardValueInRupees: 1, currentPoints: 100}, // No specific threshold perk, direct value
];
let mockLoyaltyPrograms = [
    { id: 'lp1', userId: 'mockUserId', programName: 'Flipkart SuperCoins', currentPoints: 350, pointValueInRupees: 1},
];


const AskDealBotActionInputSchema = z.object({
  query: z.string().min(5, "Query must be at least 5 characters long."),
});

export async function handleAskDealBot(formData: FormData): Promise<{ data: AskDealBotOutput | null; error: string | null }> {
  const rawInput = {
    query: formData.get('query'),
  };

  const validationResult = AskDealBotActionInputSchema.safeParse(rawInput);

  if (!validationResult.success) {
    return { data: null, error: validationResult.error.errors.map(e => e.message).join(', ') };
  }
  
  const input: AskDealBotInput = validationResult.data;

  try {
    const result = await askDealBot(input);
    return { data: result, error: null };
  } catch (e) {
    console.error("Error calling askDealBot:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred with the AI assistant.";
    return { data: null, error: errorMessage };
  }
}

// Action to get ranked offers
export async function handleGetRankedOffers(
  offers: Offer[], 
  userPointsState: UserPointsState
): Promise<{ data: RankedOffer[] | null; error: string | null }> {
  try {
    // Simulate fetching/receiving offers if not passed directly
    // For now, we assume `offers` are passed in, e.g., from a mock source or API call in the component
    if (!offers || offers.length === 0) {
      return { data: [], error: null }; // No offers to rank
    }
    if (!userPointsState) {
        return { data: null, error: "User financial profile not available." };
    }

    const rankedOffers = calculateRankedOffers(offers, userPointsState);
    return { data: rankedOffers, error: null };
  } catch (e) {
    console.error("Error ranking offers:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while ranking offers.";
    return { data: null, error: errorMessage };
  }
}

// Action to get user's financial profile (cards, loyalty points)
export async function handleGetUserPointsState(): Promise<{ data: UserPointsState | null; error: string | null }> {
    try {
        // In a real app, fetch this for the logged-in user from Firestore
        // For now, returning mock data:
        const userPointsState: UserPointsState = {
            cards: mockUserCards, // from mock DB above
            loyaltyPrograms: mockLoyaltyPrograms, // mock
        };
        return { data: userPointsState, error: null };
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to get user financial profile.";
        return { data: null, error: errorMessage };
    }
}


// Actions for managing UserCards
const UserCardSchema = z.object({
  userId: z.string(), // Will come from auth in a real app
  bank: z.string().min(2),
  cardType: z.string().min(2),
  last4Digits: z.string().length(4).optional(),
  rewardsPerRupeeSpent: z.coerce.number().min(0).optional(),
  rewardValueInRupees: z.coerce.number().min(0).optional(),
  currentPoints: z.coerce.number().min(0).optional(),
  nextRewardThreshold: z.coerce.number().min(0).optional(),
  nextRewardValueInRupees: z.coerce.number().min(0).optional(),
});


export async function handleGetUserCards(): Promise<{ data: UserCard[] | null; error: string | null }> {
  try {
    // Simulate fetching cards for current user (e.g., 'mockUserId')
    return { data: mockUserCards.filter(card => card.userId === 'mockUserId'), error: null };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Failed to get user cards.";
    return { data: null, error: errorMessage };
  }
}

export async function handleAddUserCard(formData: FormData): Promise<{ data: UserCard | null; error: string | null }> {
  const rawData = Object.fromEntries(formData.entries());
  // Manually convert checkbox value if needed, or ensure form sends correct types
  const validation = UserCardSchema.safeParse({
    ...rawData,
    userId: 'mockUserId', // Replace with actual authenticated user ID
    rewardsPerRupeeSpent: rawData.rewardsPerRupeeSpent ? parseFloat(rawData.rewardsPerRupeeSpent as string) : undefined,
    rewardValueInRupees: rawData.rewardValueInRupees ? parseFloat(rawData.rewardValueInRupees as string) : undefined,
    currentPoints: rawData.currentPoints ? parseInt(rawData.currentPoints as string, 10) : undefined,
    nextRewardThreshold: rawData.nextRewardThreshold ? parseInt(rawData.nextRewardThreshold as string, 10) : undefined,
    nextRewardValueInRupees: rawData.nextRewardValueInRupees ? parseFloat(rawData.nextRewardValueInRupees as string) : undefined,
  });

  if (!validation.success) {
    return { data: null, error: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') };
  }
  try {
    const newCard: UserCard = { ...validation.data, id: `card${Date.now()}` };
    mockUserCards.push(newCard);
    return { data: newCard, error: null };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Failed to add card.";
    return { data: null, error: errorMessage };
  }
}

export async function handleRemoveUserCard(formData: FormData): Promise<{ success: boolean; error: string | null }> {
  const cardId = formData.get('cardId') as string;
  if (!cardId) return { success: false, error: "Card ID is required." };

  try {
    const initialLength = mockUserCards.length;
    mockUserCards = mockUserCards.filter(card => card.id !== cardId);
    if (mockUserCards.length < initialLength) {
        return { success: true, error: null };
    }
    return { success: false, error: "Card not found." };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Failed to remove card.";
    return { success: false, error: errorMessage };
  }
}

// Action for Genkit explanation
const ExplainDealRankActionInputSchema = z.object({
  offerDetails: z.string().transform((str, ctx) => {
    try {
      return JSON.parse(str) as RankedOffer;
    } catch (e) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid JSON for offerDetails" });
      return z.NEVER;
    }
  }),
});

export async function handleExplainDealRank(formData: FormData): Promise<{ data: ExplainDealRankOutput | null; error: string | null }> {
  const rawInput = {
    offerDetails: formData.get('offerDetails'),
  };

  const validationResult = ExplainDealRankActionInputSchema.safeParse(rawInput);

  if (!validationResult.success) {
    return { data: null, error: validationResult.error.errors.map(e => e.message).join(', ') };
  }
  
  const input: ExplainDealRankInput = {
    offer: validationResult.data.offerDetails,
    // Potentially add userPointsState here if needed by the prompt,
    // but the ranked offer already contains explanations.
    // userContext: await handleGetUserPointsState().then(res => res.data) // Example
  };

  try {
    const result = await explainDealRank(input);
    return { data: result, error: null };
  } catch (e) {
    console.error("Error calling explainDealRank:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred with the AI explanation.";
    return { data: null, error: errorMessage };
  }
}
