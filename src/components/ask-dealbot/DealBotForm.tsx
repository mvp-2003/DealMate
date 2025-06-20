'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Send } from 'lucide-react';

const dealBotFormSchema = z.object({
  query: z.string().min(5, { message: "Query must be at least 5 characters." }).max(200, {message: "Query too long (max 200 chars)."}),
});

type DealBotFormValues = z.infer<typeof dealBotFormSchema>;

interface DealBotFormProps {
  onSubmitQuery: (data: DealBotFormValues) => Promise<void>;
  isLoading: boolean;
}

export default function DealBotForm({ onSubmitQuery, isLoading }: DealBotFormProps) {
  const form = useForm<DealBotFormValues>({
    resolver: zodResolver(dealBotFormSchema),
    defaultValues: {
      query: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitQuery)} className="space-y-4">
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="dealbot-query">Ask DealBot</FormLabel>
              <FormControl>
                <Textarea
                  id="dealbot-query"
                  placeholder="e.g., 'Where is iPhone 15 cheapest with coupons and cashback?'"
                  className="resize-none min-h-[80px]"
                  {...field}
                  aria-describedby="dealbot-query-message"
                />
              </FormControl>
              <FormMessage id="dealbot-query-message" />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Get Deal Advice
        </Button>
      </form>
    </Form>
  );
}
