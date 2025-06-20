
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Send } from 'lucide-react';

const dealBotFormSchema = z.object({
  query: z.string().min(5, { message: "Query must be at least 5 characters." }).max(300, {message: "Query too long (max 300 chars)."}),
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
              <FormLabel htmlFor="dealbot-query" className="text-lg font-medium">Your Question for DealBot</FormLabel>
              <FormControl>
                <Textarea
                  id="dealbot-query"
                  placeholder="e.g., 'Find the best deal on a 65-inch 4K TV with good HDFC card offers.'"
                  className="resize-none min-h-[100px] bg-card/80 border-border/70 focus:border-primary ring-offset-background placeholder:text-muted-foreground text-base p-3 shadow-inner"
                  {...field}
                  aria-describedby="dealbot-query-message"
                />
              </FormControl>
              <FormMessage id="dealbot-query-message" />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full py-3 text-base font-semibold shadow-lg hover:shadow-primary/40">
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Send className="mr-2 h-5 w-5" />
          )}
          Ask DealBot
        </Button>
      </form>
    </Form>
  );
}

