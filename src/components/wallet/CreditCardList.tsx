'use client';

import type { UserCard } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit3, Sparkles, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard as CreditCardIcon } from 'lucide-react'; // Renamed to avoid conflict

interface CreditCardListProps {
  cards: UserCard[];
  onRemoveCard: (cardId: string) => void;
  // onEditCard: (card: UserCard) => void; // For future implementation
}

export default function CreditCardList({ cards, onRemoveCard }: CreditCardListProps) {
  if (cards.length === 0) {
    return (
      <Alert>
        <CreditCardIcon className="h-4 w-4" />
        <AlertTitle>No Cards Yet!</AlertTitle>
        <AlertDescription>
          Add your credit cards to get personalized deal rankings and track rewards.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {cards.map((card) => (
        <Card key={card.id} className="shadow-md">
          <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-lg flex items-center">
                        <CreditCardIcon className="mr-2 h-5 w-5 text-primary" />
                        {card.bank} - {card.cardType}
                    </CardTitle>
                    {card.last4Digits && <CardDescription>Ending in **** {card.last4Digits}</CardDescription>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => onRemoveCard(card.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove card</span>
                </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            { (card.rewardsPerRupeeSpent || card.rewardValueInRupees) &&
                <div className="flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-accent" />
                    <span>
                        {card.rewardsPerRupeeSpent || 'N/A'} pts/₹ spent. Value: ₹{card.rewardValueInRupees?.toFixed(2) || 'N/A'} /pt.
                    </span>
                </div>
            }
            { (card.currentPoints !== undefined || card.nextRewardThreshold) &&
                <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                    <span>
                       Current: {card.currentPoints === undefined ? 'N/A' : card.currentPoints } pts. 
                       {card.nextRewardThreshold && card.nextRewardValueInRupees && ` Next Perk: ${card.nextRewardValueInRupees} at ${card.nextRewardThreshold} pts.`}
                    </span>
                </div>
            }
             { !(card.rewardsPerRupeeSpent || card.rewardValueInRupees || card.currentPoints !== undefined || card.nextRewardThreshold) &&
                <p className="text-xs text-muted-foreground">No reward details provided for this card.</p>
            }
          </CardContent>
          {/* 
          <CardFooter className="border-t pt-3">
             <Button variant="outline" size="sm" onClick={() => onEditCard(card)} disabled> // Edit feature for later
              <Edit3 className="mr-2 h-3 w-3" /> Edit
            </Button> 
          </CardFooter>
          */}
        </Card>
      ))}
    </div>
  );
}
