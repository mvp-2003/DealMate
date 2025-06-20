import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, AlertTriangle } from 'lucide-react';

interface DealBotResponseProps {
  response?: string | null;
  error?: string | null;
  isLoading: boolean;
}

export default function DealBotResponse({ response, error, isLoading }: DealBotResponseProps) {
  if (!response && !error && !isLoading) {
    return null; // Nothing to show initially
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-md flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          DealBot's Advice
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-[100px]">
        {isLoading && <p className="text-sm text-muted-foreground animate-pulse">DealBot is thinking...</p>}
        {error && !isLoading && (
          <div className="text-destructive flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Oops! Something went wrong.</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
        {response && !isLoading && !error && (
          <p className="text-sm whitespace-pre-wrap">{response}</p>
        )}
      </CardContent>
    </Card>
  );
}
