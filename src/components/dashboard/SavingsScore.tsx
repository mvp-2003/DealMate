import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface SavingsScoreProps {
  score: string;
  percentageOff: string;
}

export default function SavingsScore({ score = "₹250", percentageOff = "20%" }: SavingsScoreProps) {
  return (
    <Card className="bg-primary text-primary-foreground">
      <CardHeader>
        <CardTitle className="text-md flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Unified Savings
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-3xl font-bold">{score}</p>
        <p className="text-sm opacity-90">({percentageOff} potential savings)</p>
      </CardContent>
    </Card>
  );
}
