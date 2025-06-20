'use server';

import { askDealBot, type AskDealBotInput, type AskDealBotOutput } from '@/ai/flows/ask-deal-bot';
import { z } from 'zod';

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
