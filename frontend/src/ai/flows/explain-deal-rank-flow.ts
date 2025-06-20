
'use server';

/**
 * @fileOverview An AI agent to explain deal rankings.
 *
 * - explainDealRank - A function that provides an explanation for a deal's ranking.
 * - ExplainDealRankInput - The input type for the explainDealRank function.
 * - ExplainDealRankOutput - The return type for the explainDealRank function.
 */

import { ai } from '@/ai/genkit';
import Handlebars from 'handlebars';
import {
    ExplainDealRankInputSchema,
    ExplainDealRankOutputSchema,
    type ExplainDealRankInput,
    type ExplainDealRankOutput,
} from './explain-deal-rank-flow.schemas';

export { type ExplainDealRankInput, type ExplainDealRankOutput };

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
