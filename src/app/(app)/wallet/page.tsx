'use client';

import { useState, useEffect } from 'react';
import type { UserCard } from '@/lib/types';
import CreditCardForm from '@/components/wallet/CreditCardForm';
import CreditCardList from '@/components/wallet/CreditCardList';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';
import { handleAddUserCard, handleGetUserCards, handleRemoveUserCard } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function WalletPage() {
  const [cards, setCards] = useState<UserCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const fetchCards = async () => {
    setIsLoading(true);
    const result = await handleGetUserCards(); // Assuming current user context is handled in action
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else if (result.data) {
      setCards(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleAddCard = async (cardData: Omit<UserCard, 'id' | 'userId'>) => {
    // In a real app, userId would come from auth state
    const newCardData = { ...cardData, userId: 'mockUserId' }; 
    const formData = new FormData();
    Object.keys(newCardData).forEach(key => {
        const value = (newCardData as any)[key];
        if (value !== undefined && value !== null) {
             formData.append(key, String(value));
        }
    });
    
    const result = await handleAddUserCard(formData);
    if (result.error) {
      toast({ title: "Error adding card", description: result.error, variant: "destructive" });
    } else if (result.data) {
      toast({ title: "Card Added", description: `${result.data.bank} ${result.data.cardType} added successfully.` });
      setCards(prev => [...prev, result.data!]);
      setIsFormOpen(false); // Close dialog on success
    }
  };

  const handleRemoveCard = async (cardId: string) => {
    const formData = new FormData();
    formData.append('cardId', cardId);
    const result = await handleRemoveUserCard(formData);
    if (result.error) {
      toast({ title: "Error removing card", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Card Removed", description: "Card removed successfully." });
      setCards(prev => prev.filter(card => card.id !== cardId));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-headline font-semibold tracking-tight">My Wallet</h2>
          <p className="text-sm text-muted-foreground">
            Manage your credit cards for personalized deal ranking.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Card
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Add New Credit Card</DialogTitle>
              <DialogDescription>
                Enter your card details. We only store metadata, not full card numbers.
              </DialogDescription>
            </DialogHeader>
            <CreditCardForm onSubmit={handleAddCard} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <CreditCardList cards={cards} onRemoveCard={handleRemoveCard} />
      )}
      <p className="text-xs text-center text-muted-foreground pt-2">
        ShopSavvy securely stores only card metadata (like bank and type) to personalize deals. Full card numbers are never stored.
      </p>
    </div>
  );
}
