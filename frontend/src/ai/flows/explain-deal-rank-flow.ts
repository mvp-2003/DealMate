
'use server';

/**
 * @fileOverview An AI agent to explain deal rankings.
 *
 * - explainDealRank - A function that provides an explanation for a deal's ranking.
 * - ExplainDealRankInput - The input type for the explainDealRank function.
 * - ExplainDealRankOutput - The return type for the explainDealRank function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { RankedOffer, UserPointsState, UserCard, LoyaltyProgram, UserRewardGoal } from '@/lib/types';
import Handlebars from 'handlebars';


// Zod Schemas for nested types in UserPointsState (if not already global)
const ZodUserCardSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bank: z.string(),
  cardType: z.string(),
  last4Digits: z.string().optional(),
  rewards_per_rupee: z.number().optional(),
  reward_value_inr: z.number().optional(),
  current_points: z.number().optional(),
  next_reward_threshold: z.number().optional(),
  next_reward_value: z.number().optional(),
});

const ZodLoyaltyProgramSchema = z.object({
  id: z.string(),
  userId: z.string(),
  programName: z.string(),
  currentPoints: z.number(),
  pointValueInRupees: z.number().optional(),
  nextTier: z.string().optional(),
  pointsToNextTier: z.number().optional(),
  nextTierBenefits: z.string().optional(),
});

const ZodUserRewardGoalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  description: z.string(),
  targetType: z.enum(['monetary_savings_monthly', 'points_milestone_card', 'points_milestone_program']),
  targetValue: z.number(),
  cardIdRef: z.string().optional(),
  loyaltyProgramIdRef: z.string().optional(),
  isActive: z.boolean(),
});


const ZodUserPointsStateSchema = z.object({
    cards: z.array(ZodUserCardSchema).optional(),
    loyaltyPrograms: z.array(ZodLoyaltyProgramSchema).optional(),
    rewardGoals: z.array(ZodUserRewardGoalSchema).optional(),
}).optional();


const ZodRankedOfferSchema = z.object({
  id: z.string(),
  productName: z.string(),
  platform: z.string(),
  basePrice: z.number(),
  finalPrice: z.number(), 
  effectivePrice: z.number(), 
  totalDiscountValue: z.number(),
  totalCashbackValue: z.number(),
  cardBonusValue: z.number(),
  potentialPerkValue: z.number(),
  goalContributionScore: z.number(),
  compositeScore: z.number(),
  rankingExplanation: z.array(z.string()),
  achievedPerkDescription: z.string().optional(),
  productUrl: z.string(),
  couponValue: z.number().optional(),
  cashbackPercentage: z.number().optional(),
  cashbackFlat: z.number().optional(),
  tags: z.array(z.string()).optional(),
});


export const ExplainDealRankInputSchema = z.object({
  offer: ZodRankedOfferSchema.describe("The ranked offer details for which an explanation is sought."),
  userContext: ZodUserPointsStateSchema.describe("Optional: The user's current financial context like cards, loyalty points, and goals which influenced the ranking."),
});
export type ExplainDealRankInput = z.infer<typeof ExplainDealRankInputSchema>;

export const ExplainDealRankOutputSchema = z.object({
  explanation: z.string().describe('The AI-generated explanation for the deal ranking.'),
});
export type ExplainDealRankOutput = z.infer<typeof ExplainDealRankOutputSchema>;

export async function explainDealRank(input: ExplainDealRankInput): Promise<ExplainDealRankOutput> {
  return explainDealRankFlow(input);
}

Handlebars.registerHelper('subtract', function(a: number, b: number) {
  return (a - b).toFixed(2);
});
Handlebars.registerHelper('formatCurrency', function(amount: number) {
  return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
});
Handlebars.registerHelper('toLowerCase', function(str: string) {
  return str.toLowerCase();
});


const prompt = ai.definePrompt({
  name: 'explainDealRankPrompt',
  input: { schema: ExplainDealRankInputSchema },
  output: { schema: ExplainDealRankOutputSchema },
  prompt: `You are DealPal's AI Deal Explainer. A user wants a clear, concise, and friendly explanation for why a specific deal for "{{offer.productName}}" is ranked highly.
The deal's attractiveness is based on its "Composite Score" ({{{offer.compositeScore}}}), which considers direct savings, cashback, card bonuses, any future perks unlocked, and alignment with user's financial goals.
The user is NOT asking for general deal advice, but specifically about THIS deal.

Key Financial Details for this Offer:
- Product: {{{offer.productName}}} on {{{offer.platform}}}
- Base Price: ₹{{{formatCurrency offer.basePrice}}}
- Price After Coupon(s): ₹{{{formatCurrency offer.finalPrice}}}
- Total Cashback Expected: ₹{{{formatCurrency offer.totalCashbackValue}}}
- Card Specific Bonus/Value for this transaction: ₹{{{formatCurrency offer.cardBonusValue}}}
- Effective Price (what user pays after immediate discounts & cashback): ₹{{{formatCurrency offer.effectivePrice}}}
- Future Perk Unlocked Value (included in score, not in effective price): ₹{{{formatCurrency offer.potentialPerkValue}}}
{{#if offer.achievedPerkDescription}}
- Perk Details: {{{offer.achievedPerkDescription}}}
{{/if}}

Factors contributing to this deal's rank (already calculated and summarized):
{{#each offer.rankingExplanation}}
- {{{this}}}
{{/each}}

{{#if userContext.rewardGoals.length}}
User's Active Reward Goals:
{{#each userContext.rewardGoals}}
  {{#if this.isActive}}
  - Goal: "{{this.description}}" (Target: {{this.targetValue}} {{#if (eq this.targetType "monetary_savings_monthly")}}INR savings{{else}}points{{/if}})
    {{#if (eq ../offer.goalContributionScore 0)}} (This offer doesn't directly contribute to this specific goal, but offers other value.)
    {{else if (gt ../offer.goalContributionScore 0)}} (This offer helps progress this goal!)
    {{/if}}
  {{/if}}
{{/each}}
{{/if}}

Based on ALL the information above (especially the rankingExplanation array and any goal alignment), provide a 2-3 paragraph, easy-to-understand summary.
Focus on:
1. The most impactful savings (e.g., significant discount, high cashback, good card bonus).
2. How any future perk is unlocked and its value.
3. If and how this deal aligns with the user's active reward goals (if provided and relevant from rankingExplanation).
4. Why the overall "Composite Score" ({{{offer.compositeScore}}}) is good.

Be positive and reinforce the value DealPal provides. Do not invent new reasons not present in rankingExplanation.
If there are many small factors, summarize them generally (e.g., "multiple small discounts add up").
`,
});


const explainDealRankFlow = ai.defineFlow(
  {
    name: 'explainDealRankFlow',
    inputSchema: ExplainDealRankInputSchema,
    outputSchema: ExplainDealRankOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        throw new Error("AI failed to generate an explanation.");
    }
    return output;
  }
);
