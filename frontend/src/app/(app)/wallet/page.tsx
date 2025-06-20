
'use client';

import { useState, useEffect } from 'react';
import type { UserCard, UserRewardGoal, LoyaltyProgram, UserPointsState } from '@/lib/types';
import CreditCardForm from '@/components/wallet/CreditCardForm';
import CreditCardList from '@/components/wallet/CreditCardList';
import RewardGoalsList from '@/components/wallet/RewardGoalsList'; // New component
import RewardGoalForm from '@/components/wallet/RewardGoalForm'; // New component
import LoyaltyProgramList from '@/components/wallet/LoyaltyProgramList'; // New component
import RewardProgressChart from '@/components/wallet/RewardProgressChart'; // New component

import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Target, Award as LoyaltyIcon } from 'lucide-react';
import { handleAddUserCard, handleGetUserCards, handleRemoveUserCard, handleAddUserRewardGoal, handleGetUserPointsState, handleUpdateUserRewardGoalActivity, handleRemoveUserRewardGoal } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


export default function WalletPage() {
  const [userPointsState, setUserPointsState] = useState<UserPointsState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCardFormOpen, setIsCardFormOpen] = useState(false);
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    const result = await handleGetUserPointsState(); 
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      setUserPointsState({ cards: [], loyaltyPrograms: [], rewardGoals: [] }); // Ensure state is not null
    } else if (result.data) {
      setUserPointsState(result.data);
    } else {
       setUserPointsState({ cards: [], loyaltyPrograms: [], rewardGoals: [] });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCard = async (cardData: Omit<UserCard, 'id' | 'userId'>) => {
    const formData = new FormData();
    Object.entries(cardData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
             formData.append(key, String(value));
        }
    });
    
    const result = await handleAddUserCard(formData);
    if (result.error) {
      toast({ title: "Error adding card", description: result.error, variant: "destructive" });
    } else if (result.data) {
      toast({ title: "Card Added", description: `${result.data.bank} ${result.data.cardType} added successfully.` });
      setUserPointsState(prev => ({
        ...prev!,
        cards: [...(prev?.cards || []), result.data!],
      }));
      setIsCardFormOpen(false);
    }
  };

  const handleRemoveCard = async (cardId: string) => {
    const formData = new FormData();
    formData.append('cardId', cardId);
    const result = await handleRemoveUserCard(formData);
    if (result.error || !result.success) {
      toast({ title: "Error removing card", description: result.error || "Failed to remove card.", variant: "destructive" });
    } else {
      toast({ title: "Card Removed", description: "Card removed successfully." });
      setUserPointsState(prev => ({
        ...prev!,
        cards: (prev?.cards || []).filter(card => card.id !== cardId),
      }));
    }
  };

  const handleAddGoal = async (goalData: Omit<UserRewardGoal, 'id' | 'userId'>) => {
    const formData = new FormData();
     Object.entries(goalData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
             formData.append(key, String(value));
        }
    });
    formData.append('isActive', String(goalData.isActive)); // Ensure boolean is stringified

    const result = await handleAddUserRewardGoal(formData);
    if (result.error) {
      toast({ title: "Error adding goal", description: result.error, variant: "destructive" });
    } else if (result.data) {
      toast({ title: "Goal Added", description: `Goal "${result.data.description}" added.`});
      setUserPointsState(prev => ({
        ...prev!,
        rewardGoals: [...(prev?.rewardGoals || []), result.data!],
      }));
      setIsGoalFormOpen(false);
    }
  };

  const handleToggleGoalActivity = async (goalId: string, isActive: boolean) => {
    const result = await handleUpdateUserRewardGoalActivity(goalId, isActive);
     if (result.error || !result.success) {
      toast({ title: "Error updating goal", description: result.error || "Failed to update goal.", variant: "destructive" });
    } else {
      toast({ title: "Goal Updated", description: `Goal activity changed.` });
      setUserPointsState(prev => ({
        ...prev!,
        rewardGoals: (prev?.rewardGoals || []).map(g => g.id === goalId ? {...g, isActive} : g),
      }));
    }
  };
  
  const handleRemoveGoal = async (goalId: string) => {
    const result = await handleRemoveUserRewardGoal(goalId);
    if (result.error || !result.success) {
      toast({ title: "Error removing goal", description: result.error || "Failed to remove goal.", variant: "destructive" });
    } else {
      toast({ title: "Goal Removed", description: "Goal removed successfully." });
      setUserPointsState(prev => ({
        ...prev!,
        rewardGoals: (prev?.rewardGoals || []).filter(g => g.id !== goalId),
      }));
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!userPointsState) {
    return <p>Error loading wallet data.</p>; // Should be handled by error state from fetchData
  }


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-headline font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">My Wallet & Rewards</h2>
        <p className="text-md text-muted-foreground">
          Manage cards, track loyalty points, and set reward goals.
        </p>
      </div>

      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cards" className="transform transition-transform duration-150 ease-in-out hover:scale-105 active:translate-y-px data-[state=active]:shadow-md data-[state=active]:shadow-primary/30">My Cards</TabsTrigger>
          <TabsTrigger value="goals" className="transform transition-transform duration-150 ease-in-out hover:scale-105 active:translate-y-px data-[state=active]:shadow-md data-[state=active]:shadow-primary/30">Reward Goals</TabsTrigger>
          <TabsTrigger value="loyalty" className="transform transition-transform duration-150 ease-in-out hover:scale-105 active:translate-y-px data-[state=active]:shadow-md data-[state=active]:shadow-primary/30">Loyalty Programs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cards" className="mt-4">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Your Credit Cards</CardTitle>
               <Dialog open={isCardFormOpen} onOpenChange={setIsCardFormOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="transform transition-transform duration-150 ease-in-out hover:scale-105 active:translate-y-px">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Card
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[520px] bg-card border-border shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Add New Credit Card</DialogTitle>
                    <DialogDescription>
                      Enter your card details for personalized ranking. We only store metadata.
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[70vh] pr-3">
                    <CreditCardForm onSubmit={handleAddCard} onCancel={() => setIsCardFormOpen(false)} />
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <CreditCardList cards={userPointsState.cards} onRemoveCard={handleRemoveCard} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Your Reward Goals</CardTitle>
              <Dialog open={isGoalFormOpen} onOpenChange={setIsGoalFormOpen}>
                  <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="transform transition-transform duration-150 ease-in-out hover:scale-105 active:translate-y-px">
                      <Target className="mr-2 h-4 w-4" /> Add Goal
                  </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[480px] bg-card border-border shadow-2xl">
                  <DialogHeader>
                      <DialogTitle>Set a New Reward Goal</DialogTitle>
                      <DialogDescription>Define what you're aiming for with your rewards.</DialogDescription>
                  </DialogHeader>
                   <RewardGoalForm 
                        onSubmit={handleAddGoal} 
                        cards={userPointsState.cards} 
                        loyaltyPrograms={userPointsState.loyaltyPrograms}
                        onCancel={() => setIsGoalFormOpen(false)}
                    />
                  </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <RewardGoalsList 
                goals={userPointsState.rewardGoals || []} 
                onToggleActivity={handleToggleGoalActivity}
                onRemoveGoal={handleRemoveGoal}
              />
            </CardContent>
          </Card>
           {userPointsState.rewardGoals && userPointsState.rewardGoals.length > 0 && userPointsState.cards.length > 0 && (
            <Card className="mt-4 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Goal Progress Overview</CardTitle>
              </CardHeader>
              <CardContent className="h-[200px]">
                 <RewardProgressChart goals={userPointsState.rewardGoals} cards={userPointsState.cards} loyaltyPrograms={userPointsState.loyaltyPrograms} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="loyalty" className="mt-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Connected Loyalty Programs</CardTitle>
              {/* Placeholder for Add Loyalty Program button - complex due to potential OAuth/CSV */}
               <Button size="sm" variant="outline" disabled className="transform transition-transform duration-150 ease-in-out hover:scale-105 active:translate-y-px">
                    <LoyaltyIcon className="mr-2 h-4 w-4" /> Add Program (Soon)
               </Button>
            </CardHeader>
            <CardContent>
              <LoyaltyProgramList programs={userPointsState.loyaltyPrograms} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <p className="text-xs text-center text-muted-foreground pt-2">
        DealPal securely stores only card metadata (like bank and type) to personalize deals. Full card numbers are never stored.
      </p>
    </div>
  );
}
