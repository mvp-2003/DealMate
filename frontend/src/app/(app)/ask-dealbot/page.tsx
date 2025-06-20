'use client';

import { useState } from 'react';
import DealBotForm from '@/components/ask-dealbot/DealBotForm';
import DealBotResponse from '@/components/ask-dealbot/DealBotResponse';
import { handleAskDealBot } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { AskDealBotOutput } from '@/ai/flows/ask-deal-bot';

interface DealBotFormValues {
  query: string;
}

export default function AskDealBotPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AskDealBotOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submittedQuery, setSubmittedQuery] = useState<string | undefined>(undefined); // Update `submittedQuery` state to use `string | undefined`
  const { toast } = useToast();

  const onSubmitQuery = async (data: DealBotFormValues) => {
    setIsLoading(true);
    setAiResponse(null);
    setError(null);
    setSubmittedQuery(data.query); // Store the submitted query

    const formData = new FormData();
    formData.append('query', data.query);

    const result = await handleAskDealBot(formData);

    if (result.error) {
      setError(result.error);
      toast({
        title: "DealBot Error",
        description: result.error,
        variant: "destructive",
      });
    } else if (result.data) {
      setAiResponse(result.data);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Ask DealBot AI</h2>
        <p className="text-md text-muted-foreground mt-1">
          Get personalized deal advice and product recommendations from our AI assistant.
        </p>
      </div>
      <DealBotForm onSubmitQuery={onSubmitQuery} isLoading={isLoading} />
      <DealBotResponse 
        userQuery={submittedQuery} // Pass submitted query
        response={aiResponse?.response} 
        error={error} 
        isLoading={isLoading} 
      />
    </div>
  );
}

