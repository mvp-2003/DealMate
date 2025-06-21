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
  { id: 'offer1', description: 'Offer 1', value: 'Value 1', type: 'coupon', productName: 'High-End Laptop X1', basePrice: 120000, platform: 'Amazon.in', productUrl: '#', couponValue: 5000, cashbackPercentage: 5, cardSpecificBonusPercentage: 10, requiredCardType: 'HDFC Infinia', productImageUrl: 'https://placehold.co/300x200.png?text=LaptopX1' },
  { id: 'offer2', description: 'Offer 2', value: 'Value 2', type: 'cashback', productName: 'Premium Smartphone Z', basePrice: 75000, platform: 'Flipkart', productUrl: '#', cashbackFlat: 2000, cardSpecificBonusFlat: 1500, requiredCardType: 'Axis Magnus', productImageUrl: 'https://placehold.co/300x200.png?text=PhoneZ' },
  { id: 'offer3', description: 'Offer 3', value: 'Value 3', type: 'coupon', productName: 'Noise Cancelling Headphones', basePrice: 20000, platform: 'Myntra', productUrl: '#', couponValue: 1000, cashbackPercentage: 3, productImageUrl: 'https://placehold.co/300x200.png?text=Headphones' },
  { id: 'offer4', description: 'Offer 4', value: 'Value 4', type: 'reward', productName: 'Smart TV 55 inch', basePrice: 55000, platform: 'Amazon.in', productUrl: '#', productImageUrl: 'https://placehold.co/300x200.png?text=SmartTV', cardSpecificBonusPercentage: 5, requiredCardType: 'SBI Cashback' },
  { id: 'offer5', description: 'Offer 5', value: 'Value 5', type: 'coupon', productName: 'Gaming Console NextGen', basePrice: 45000, platform: 'Flipkart', productUrl: '#', couponValue: 2000, productImageUrl: 'https://placehold.co/300x200.png?text=Console' },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="glass-card p-6 flex-1 mr-4">
            <h2 className="text-3xl font-headline font-bold tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              🎯 Smart Deals
            </h2>
            <p className="text-sm text-muted-foreground/80 mt-2">
              AI-powered deals ranked by your cards, spending patterns, and maximum savings potential.
            </p>
          </div>
          <div className="glass-card p-4">
            <Button onClick={fetchRankedDeals} variant="outline" size="sm" disabled={isLoading} 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none hover:from-purple-600 hover:to-blue-600">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh Deals
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-32 bg-muted/20 rounded-md mb-4"></div>
                <div className="h-6 bg-muted/20 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-muted/20 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted/20 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="glass-card p-6">
            <Alert variant="destructive" className="bg-red-950/50 border-red-500/50">
              <Info className="h-4 w-4" />
              <AlertTitle>Error Loading Deals</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {!isLoading && !error && rankedOffers.length === 0 && (
          <div className="glass-card p-8 text-center">
            <Alert className="bg-blue-950/50 border-blue-500/50">
              <Info className="h-4 w-4" />
              <AlertTitle>🔍 No Smart Deals Available</AlertTitle>
              <AlertDescription>
                Add some cards to your wallet and browse e-commerce sites with our extension for personalized deal recommendations.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {!isLoading && !error && rankedOffers.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rankedOffers.map((offer, index) => (
              <div key={offer.id} className="floating-card" style={{animationDelay: `${index * 0.1}s`}}>
                <RankedOfferCard offer={offer} />
              </div>
            ))}
          </div>
        )}
        
        <div className="glass-card p-4">
          <p className="text-xs text-center text-muted-foreground/60">
            🤖 AI analyzes coupons, cashback, card bonuses, and spending patterns. Data refreshed in real-time from extension browsing.
          </p>
        </div>
      </div>
    </div>
  );
}
