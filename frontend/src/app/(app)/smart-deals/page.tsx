'use client';

import type { RankedOffer, Offer, UserPointsState } from '@/lib/types';
import { useEffect, useState } from 'react';
import RankedOfferCard from '@/components/smart-deals/RankedOfferCard';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Info } from 'lucide-react';
import { handleGetRankedOffers, handleGetUserPointsState } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DealLoader } from '@/components/ui/animated-loader';


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
    <div className="min-h-screen-safe bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="space-responsive">
        
        {/* Header Section - Mobile First */}
        <div className="flex flex-col gap-3 xs:gap-4 mb-4 xs:mb-6 sm:mb-8">
          <div className="glass-card p-3 xs:p-4 sm:p-6">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-headline font-bold tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  🎯 Smart Deals
                </h2>
                <p className="text-xs xs:text-sm sm:text-base text-muted-foreground/80 mt-1 xs:mt-2">
                  AI-powered deals ranked by your preferences
                </p>
              </div>
              <div className="flex-shrink-0">
                <Button 
                  onClick={fetchRankedDeals} 
                  variant="outline" 
                  size="sm" 
                  disabled={isLoading} 
                  className="w-full xs:w-auto touch-target bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Refresh Deals</span>
                  <span className="sm:hidden">Refresh</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State - Enhanced Mobile */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-8">
            <DealLoader size="lg" />
            <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 w-full opacity-30">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="glass-card p-3 xs:p-4 sm:p-6 animate-pulse">
                  <div className="h-20 xs:h-24 sm:h-32 bg-muted/20 rounded-md mb-3 xs:mb-4"></div>
                  <div className="space-y-2 xs:space-y-3">
                    <div className="h-3 xs:h-4 bg-muted/20 rounded w-3/4"></div>
                    <div className="h-2 xs:h-3 bg-muted/20 rounded w-1/2"></div>
                    <div className="h-2 xs:h-3 bg-muted/20 rounded w-1/3"></div>
                    <div className="flex gap-2 mt-3">
                      <div className="h-6 xs:h-8 bg-muted/20 rounded flex-1"></div>
                      <div className="h-6 xs:h-8 bg-muted/20 rounded w-8 xs:w-10"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error State - Mobile Optimized */}
        {error && !isLoading && (
          <div className="glass-card p-3 xs:p-4 sm:p-6">
            <Alert variant="destructive" className="bg-red-950/50 border-red-500/50">
              <Info className="h-4 w-4 flex-shrink-0" />
              <div className="ml-2">
                <AlertTitle className="text-sm xs:text-base">Error Loading Deals</AlertTitle>
                <AlertDescription className="text-xs xs:text-sm mt-1">{error}</AlertDescription>
              </div>
            </Alert>
            <div className="mt-4 flex justify-center">
              <Button 
                onClick={fetchRankedDeals}
                variant="outline"
                size="sm"
                className="touch-target"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* No Deals State - Enhanced Mobile */}
        {!isLoading && !error && rankedOffers.length === 0 && (
          <div className="glass-card p-4 xs:p-6 sm:p-8 text-center">
            <div className="text-4xl xs:text-5xl sm:text-6xl mb-4">🔍</div>
            <Alert className="bg-blue-950/50 border-blue-500/50 text-left">
              <Info className="h-4 w-4 flex-shrink-0" />
              <div className="ml-2">
                <AlertTitle className="text-base xs:text-lg">No Smart Deals Available</AlertTitle>
                <AlertDescription className="text-xs xs:text-sm mt-2">
                  Add payment cards and browse with our extension for personalized recommendations.
                </AlertDescription>
              </div>
            </Alert>
            <div className="mt-4 xs:mt-6 space-y-3 xs:space-y-4">
              <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 justify-center">
                <Button variant="outline" className="touch-target flex-1 xs:flex-none">
                  💳 Add Cards
                </Button>
                <Button variant="outline" className="touch-target flex-1 xs:flex-none">
                  🔗 Get Extension
                </Button>
              </div>
              <p className="text-xs xs:text-sm text-muted-foreground px-2">
                Install our browser extension to automatically detect deals while shopping
              </p>
            </div>
          </div>
        )}

        {/* Deals Grid - Mobile First Layout */}
        {!isLoading && !error && rankedOffers.length > 0 && (
          <>
            {/* Filter/Sort Bar - Mobile Friendly */}
            <div className="glass-card p-3 xs:p-4 mb-4 xs:mb-6">
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-4">
                <div className="text-sm xs:text-base font-medium">
                  {rankedOffers.length} deals found
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  <button className="touch-target px-3 py-1.5 text-xs xs:text-sm bg-primary/20 text-primary rounded-full whitespace-nowrap">
                    Best Value
                  </button>
                  <button className="touch-target px-3 py-1.5 text-xs xs:text-sm bg-muted/20 text-muted-foreground rounded-full whitespace-nowrap">
                    Highest Discount
                  </button>
                  <button className="touch-target px-3 py-1.5 text-xs xs:text-sm bg-muted/20 text-muted-foreground rounded-full whitespace-nowrap">
                    Most Cashback
                  </button>
                </div>
              </div>
            </div>
            
            {/* Responsive Deals Grid - Enhanced for Large Screens */}
            <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4xl:grid-cols-8 gap-3 xs:gap-4 sm:gap-6 lg:gap-8 mb-6 xs:mb-8">
              {rankedOffers.map((offer, index) => (
                <div 
                  key={offer.id} 
                  className="floating-card w-full animate-fade-in" 
                  style={{animationDelay: `${index * 0.05}s`}}
                >
                  <RankedOfferCard offer={offer} />
                </div>
              ))}
            </div>
            
            {/* Enhanced Stats Card - Large Screen Optimized */}
            <div className="glass-card p-4 xs:p-6 lg:p-8 xl:p-10 text-center">
              <h3 className="text-base xs:text-lg lg:text-xl xl:text-2xl font-semibold mb-3 xs:mb-4 lg:mb-6">Deal Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3 xs:gap-4 lg:gap-6">
                <div className="p-2 xs:p-3 lg:p-4 xl:p-6 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors">
                  <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-purple-400">{rankedOffers.length}</div>
                  <div className="text-xs xs:text-sm lg:text-base text-muted-foreground">Deals</div>
                </div>
                <div className="p-2 xs:p-3 lg:p-4 xl:p-6 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors">
                  <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-blue-400">
                    ₹{rankedOffers.reduce((sum, offer) => sum + (offer.totalDiscountValue || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-xs xs:text-sm lg:text-base text-muted-foreground">Savings</div>
                </div>
                <div className="p-2 xs:p-3 lg:p-4 xl:p-6 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors">
                  <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-green-400">
                    {Math.round(rankedOffers.reduce((sum, offer) => sum + (offer.compositeScore || 0), 0) / rankedOffers.length)}
                  </div>
                  <div className="text-xs xs:text-sm lg:text-base text-muted-foreground">Avg Score</div>
                </div>
                <div className="p-2 xs:p-3 lg:p-4 xl:p-6 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 transition-colors">
                  <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-orange-400">
                    ₹{Math.round(rankedOffers.reduce((sum, offer) => sum + (offer.totalCashbackValue || 0), 0))}
                  </div>
                  <div className="text-xs xs:text-sm lg:text-base text-muted-foreground">Cashback</div>
                </div>
                
                {/* Additional stats for larger screens */}
                <div className="hidden xl:block p-2 xs:p-3 lg:p-4 xl:p-6 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 transition-colors">
                  <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-pink-400">
                    {rankedOffers.filter(offer => {
                      const discountPercent = ((offer.basePrice - offer.finalPrice) / offer.basePrice) * 100;
                      return discountPercent > 30;
                    }).length}
                  </div>
                  <div className="text-xs xs:text-sm lg:text-base text-muted-foreground">30%+ Off</div>
                </div>
                
                <div className="hidden xl:block p-2 xs:p-3 lg:p-4 xl:p-6 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors">
                  <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-cyan-400">
                    {rankedOffers.filter(offer => offer.tags?.includes('Best Combo')).length}
                  </div>
                  <div className="text-xs xs:text-sm lg:text-base text-muted-foreground">Best Combos</div>
                </div>
                
                <div className="hidden xl:block p-2 xs:p-3 lg:p-4 xl:p-6 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors">
                  <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-yellow-400">
                    {new Set(rankedOffers.map(offer => offer.platform)).size}
                  </div>
                  <div className="text-xs xs:text-sm lg:text-base text-muted-foreground">Platforms</div>
                </div>
                
                <div className="hidden xl:block p-2 xs:p-3 lg:p-4 xl:p-6 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors">
                  <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-indigo-400">
                    {rankedOffers.filter(offer => offer.rank <= 3).length}
                  </div>
                  <div className="text-xs xs:text-sm lg:text-base text-muted-foreground">Top Ranked</div>
                </div>
              </div>
            </div>
          </>
        )}
        
        <div className="glass-card p-3 xs:p-4 mt-4 xs:mt-6 mb-safe-bottom">
          <p className="text-xs xs:text-sm text-center text-muted-foreground/60">
            🤖 AI analyzes coupons, cashback, card bonuses, and spending patterns. Data refreshed in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
