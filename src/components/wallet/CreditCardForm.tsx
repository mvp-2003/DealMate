'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { UserCard } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Save } from 'lucide-react';

const cardFormSchema = z.object({
  bank: z.string().min(2, { message: "Bank name must be at least 2 characters." }),
  cardType: z.string().min(2, { message: "Card type/name must be at least 2 characters." }),
  last4Digits: z.string().length(4, { message: "Must be last 4 digits."}).optional().or(z.literal('')),
  rewardsPerRupeeSpent: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  rewardValueInRupees: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  currentPoints: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  nextRewardThreshold: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  nextRewardValueInRupees: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
});

type CardFormValues = Omit<UserCard, 'id' | 'userId'>;

interface CreditCardFormProps {
  onSubmit: (data: CardFormValues) => Promise<void>;
  initialData?: Partial<UserCard>;
  isLoading?: boolean;
}

export default function CreditCardForm({ onSubmit, initialData, isLoading }: CreditCardFormProps) {
  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      bank: initialData?.bank || "",
      cardType: initialData?.cardType || "",
      last4Digits: initialData?.last4Digits || "",
      rewardsPerRupeeSpent: initialData?.rewardsPerRupeeSpent || undefined,
      rewardValueInRupees: initialData?.rewardValueInRupees || undefined,
      currentPoints: initialData?.currentPoints || undefined,
      nextRewardThreshold: initialData?.nextRewardThreshold || undefined,
      nextRewardValueInRupees: initialData?.nextRewardValueInRupees || undefined,
    },
  });

  const processSubmit = async (values: z.infer<typeof cardFormSchema>) => {
    const submitValues: CardFormValues = {
        bank: values.bank,
        cardType: values.cardType,
        last4Digits: values.last4Digits || undefined, // Ensure empty string becomes undefined
        rewardsPerRupeeSpent: values.rewardsPerRupeeSpent,
        rewardValueInRupees: values.rewardValueInRupees,
        currentPoints: values.currentPoints,
        nextRewardThreshold: values.nextRewardThreshold,
        nextRewardValueInRupees: values.nextRewardValueInRupees,
    };
    await onSubmit(submitValues);
    form.reset(); // Reset form after submission
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(processSubmit)} className="space-y-4 p-1">
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="bank"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Bank Name</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., HDFC, ICICI" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="cardType"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Card Type/Name</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Infinia, Millennia" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="last4Digits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last 4 Digits (Optional)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="1234" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <p className="text-sm font-medium text-muted-foreground pt-2">Reward Details (Optional)</p>
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="rewardsPerRupeeSpent"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Points / Rupee</FormLabel>
                <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 1.5" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="rewardValueInRupees"
            render={({ field }) => (
                <FormItem>
                <FormLabel>1 Point Value (₹)</FormLabel>
                <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 0.25" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="currentPoints"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Current Points</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g., 5000" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="nextRewardThreshold"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Next Perk Threshold</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g., 10000 points" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
         <FormField
            control={form.control}
            name="nextRewardValueInRupees"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Next Perk Value (₹)</FormLabel>
                <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 500" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        <Button type="submit" disabled={isLoading} className="w-full">
          <Save className="mr-2 h-4 w-4" /> {isLoading ? "Saving..." : "Save Card"}
        </Button>
      </form>
    </Form>
  );
}
