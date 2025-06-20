'use client';

import type { RankedOffer, Offer, UserPointsState } from '@/lib/types';
import { useEffect, useState } from 'react';
import RankedOfferCard from '@/components/smart-deals/RankedOfferCard';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Info } from 'lucide-react';
import { handleGetRankedOffers, handleGetUserPointsState } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


// Mock initial offers
const mockOffersData: Offer[] = [
  { id: 'offer1', productName: 'High-End Laptop X1', basePrice: 120000, platform: 'Amazon.in', productUrl: '#', couponValue: 5000, cashbackPercentage: 5, cardSpecificBonusPercentage: 10, requiredCardType: 'HDFC Infinia', productImageUrl: 'https://placehold.co/300x200.png?text=LaptopX1' },
  { id: 'offer2', productName: 'Premium Smartphone Z', basePrice: 75000, platform: 'Flipkart', productUrl: '#', cashbackFlat: 2000, cardSpecificBonusFlat: 1500, requiredCardType: 'Axis Magnus', productImageUrl: 'https://placehold.co/300x200.png?text=PhoneZ' },
  { id: 'offer3', productName: 'Noise Cancelling Headphones', basePrice: 20000, platform: 'Myntra', productUrl: '#', couponValue: 1000, cashbackPercentage: 3, productImageUrl: 'https://placehold.co/300x200.png?text=Headphones' },
  { id: 'offer4', productName: 'Smart TV 55 inch', basePrice: 55000, platform: 'Amazon.in', productUrl: '#', productImageUrl: 'https://placehold.co/300x200.png?text=SmartTV', cardSpecificBonusPercentage: 5, requiredCardType: 'SBI Cashback' },
  { id: 'offer5', productName: 'Gaming Console NextGen', basePrice: 45000, platform: 'Flipkart', productUrl: '#', couponValue: 2000, productImageUrl: 'https://placehold.co/300x200.png?text=Console' },
];


export default function SmartDealsPage() {
  const [rankedOffers, setRankedOffers] = useState<RankedOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRankedDeals = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, userPointsState would be fetched for the logged-in user
      const userPointsStateResult = await handleGetUserPointsState(); // Assuming this action exists and fetches/mocks data
      if (userPointsStateResult.error || !userPointsStateResult.data) {
          throw new Error(userPointsStateResult.error || "Could not fetch user financial profile.");
      }
      
      const offersResult = await handleGetRankedOffers(mockOffersData, userPointsStateResult.data);

      if (offersResult.error) {
        setError(offersResult.error);
        toast({ title: "Error fetching deals", description: offersResult.error, variant: "destructive" });
      } else if (offersResult.data) {
        setRankedOffers(offersResult.data);
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      toast({ title: "Error", description: e.message || "Failed to load smart deals.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRankedDeals();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-headline font-semibold tracking-tight">Smart Deals</h2>
          <p className="text-sm text-muted-foreground">
            Top offers ranked by overall value, including your card perks.
          </p>
        </div>
        <Button onClick={fetchRankedDeals} variant="outline" size="sm" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg shadow animate-pulse">
              <div className="h-24 bg-muted rounded-md mb-3"></div>
              <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2 mb-1"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </div>
          ))}
        </div>
      )}

      {error && !isLoading && (
         <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Error Loading Deals</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && rankedOffers.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No Smart Deals Available</AlertTitle>
          <AlertDescription>
            We couldn't find any special deals matching your profile right now, or there might be no offers to rank. 
            Try adding some cards to your wallet for personalized recommendations.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && rankedOffers.length > 0 && (
        <div className="space-y-4">
          {rankedOffers.map((offer) => (
            <RankedOfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
       <p className="text-xs text-center text-muted-foreground pt-2">
        Ranking considers coupons, cashback, card bonuses, and potential perk unlocks. All data is illustrative.
      </p>
    </div>
  );
}
