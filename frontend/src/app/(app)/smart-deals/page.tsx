'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Info, Filter, SortDesc, TrendingUp, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DealLoader } from '@/components/ui/animated-loader';
import { useAuth0 } from '@auth0/auth0-react';
import { offerRankingService } from '@/services/offer-ranking';
import { 
  RankedOffer, 
  OfferRankingRequest,
  SortOption,
  OfferFilters 
} from '@/types/offer-ranking';
import IntelligentOfferCard from '@/components/smart-deals/IntelligentOfferCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

// Mock deal IDs for demo - in production, these would come from a deals search
const DEMO_DEAL_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function SmartDealsPage() {
  const { user, isLoading: isAuthLoading } = useAuth0();
  const [rankedOffers, setRankedOffers] = useState<RankedOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('ranking_score');
  const [filters, setFilters] = useState<OfferFilters>({
    verified_only: true,
    expiring_soon: false,
    stackable_only: false,
  });
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const { toast } = useToast();

  const fetchRankedDeals = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Get user location if enabled
      let userLocation = undefined;
      if (isLocationEnabled) {
        const location = await offerRankingService.getCurrentLocation();
        if (location) {
          userLocation = {
            latitude: location.latitude,
            longitude: location.longitude,
          };
        }
      }

      const request: OfferRankingRequest = {
        user_id: user.sub || '',
        deals: DEMO_DEAL_IDS,
        user_location: userLocation,
        max_results: 50,
      };

      const response = await offerRankingService.rankOffers(request);
      
      // Apply client-side sorting
      let sortedOffers = [...response.ranked_offers];
      switch (sortOption) {
        case 'net_savings':
          sortedOffers.sort((a, b) => 
            parseFloat(b.original_price) - parseFloat(b.discounted_price || b.original_price) -
            (parseFloat(a.original_price) - parseFloat(a.discounted_price || a.original_price))
          );
          break;
        case 'cashback_realization':
          sortedOffers.sort((a, b) => 
            b.ranking_components.cashback_realization_score - a.ranking_components.cashback_realization_score
          );
          break;
        case 'popularity':
          sortedOffers.sort((a, b) => b.usage_count - a.usage_count);
          break;
        case 'urgency':
          sortedOffers.sort((a, b) => 
            b.ranking_components.urgency_score - a.ranking_components.urgency_score
          );
          break;
        case 'price_low_to_high':
          sortedOffers.sort((a, b) => 
            parseFloat(a.discounted_price || a.original_price) - 
            parseFloat(b.discounted_price || b.original_price)
          );
          break;
        case 'price_high_to_low':
          sortedOffers.sort((a, b) => 
            parseFloat(b.discounted_price || b.original_price) - 
            parseFloat(a.discounted_price || a.original_price)
          );
          break;
        default:
          // Keep original ranking score order
          break;
      }

      // Apply filters
      sortedOffers = sortedOffers.filter(offer => {
        if (filters.verified_only && !offer.is_verified) return false;
        if (filters.expiring_soon && offer.ranking_components.urgency_score < 0.6) return false;
        if (filters.stackable_only && offer.stacking_opportunities.length === 0) return false;
        if (filters.min_savings && 
            parseFloat(offer.original_price) - parseFloat(offer.discounted_price || offer.original_price) < filters.min_savings) {
          return false;
        }
        if (filters.max_price && parseFloat(offer.discounted_price || offer.original_price) > filters.max_price) {
          return false;
        }
        return true;
      });

      setRankedOffers(sortedOffers);
    } catch (e: any) {
      setError(e.message || "Failed to fetch ranked deals");
      toast({ 
        title: "Error", 
        description: e.message || "Failed to load smart deals.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading && user) {
      fetchRankedDeals();
    } else if (!isAuthLoading && !user) {
      setIsLoading(false);
      setError("Please login to view personalized deals");
    }
  }, [isAuthLoading, user, sortOption, filters, isLocationEnabled]);

  const toggleLocationServices = () => {
    setIsLocationEnabled(!isLocationEnabled);
    if (!isLocationEnabled) {
      toast({
        title: "Location Enabled",
        description: "We'll show you deals from nearby stores",
      });
    }
  };

  return (
    <div className="min-h-screen-safe bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="space-responsive">
        
        {/* Header Section */}
        <div className="flex flex-col gap-3 xs:gap-4 mb-4 xs:mb-6 sm:mb-8">
          <div className="glass-card p-3 xs:p-4 sm:p-6">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-headline font-bold tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  🎯 Smart Deals
                </h2>
                <p className="text-xs xs:text-sm sm:text-base text-muted-foreground/80 mt-1 xs:mt-2">
                  AI-powered deals ranked by your preferences and spending patterns
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  onClick={toggleLocationServices}
                  variant="outline"
                  size="sm"
                  className={`touch-target ${isLocationEnabled ? 'bg-green-500/20 border-green-500' : ''}`}
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Location</span>
                </Button>
                <Button 
                  onClick={fetchRankedDeals} 
                  variant="outline" 
                  size="sm" 
                  disabled={isLoading} 
                  className="touch-target bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-8">
            <DealLoader size="lg" />
            <p className="text-muted-foreground animate-pulse">
              Analyzing deals with AI to find the best matches for you...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="glass-card p-3 xs:p-4 sm:p-6">
            <Alert variant="destructive" className="bg-red-950/50 border-red-500/50">
              <Info className="h-4 w-4 flex-shrink-0" />
              <div className="ml-2">
                <AlertTitle className="text-sm xs:text-base">Error Loading Deals</AlertTitle>
                <AlertDescription className="text-xs xs:text-sm mt-1">{error}</AlertDescription>
              </div>
            </Alert>
            {!user && (
              <div className="mt-4 flex justify-center">
                <Button 
                  onClick={() => window.location.href = '/auth'}
                  variant="outline"
                  size="sm"
                  className="touch-target"
                >
                  Login to Continue
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Deals Section */}
        {!isLoading && !error && rankedOffers.length > 0 && (
          <>
            {/* Filter/Sort Bar */}
            <div className="glass-card p-3 xs:p-4 mb-4 xs:mb-6">
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
                <div className="text-sm xs:text-base font-medium">
                  {rankedOffers.length} deals found
                  {isLocationEnabled && (
                    <span className="ml-2 text-xs text-green-400">
                      📍 Near you
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                    <SelectTrigger className="w-[140px] xs:w-[180px]">
                      <SortDesc className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ranking_score">
                        <span className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Best Match
                        </span>
                      </SelectItem>
                      <SelectItem value="net_savings">Highest Savings</SelectItem>
                      <SelectItem value="cashback_realization">Fastest Cashback</SelectItem>
                      <SelectItem value="popularity">Most Popular</SelectItem>
                      <SelectItem value="urgency">Expiring Soon</SelectItem>
                      <SelectItem value="price_low_to_high">Price: Low to High</SelectItem>
                      <SelectItem value="price_high_to_low">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Filter Deals</SheetTitle>
                        <SheetDescription>
                          Refine your search to find the perfect deals
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6 space-y-6">
                        <div className="space-y-4">
                          <h3 className="font-medium">Deal Type</h3>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="verified"
                                checked={filters.verified_only}
                                onCheckedChange={(checked) => 
                                  setFilters({...filters, verified_only: !!checked})
                                }
                              />
                              <Label htmlFor="verified">Verified deals only</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="expiring"
                                checked={filters.expiring_soon}
                                onCheckedChange={(checked) => 
                                  setFilters({...filters, expiring_soon: !!checked})
                                }
                              />
                              <Label htmlFor="expiring">Expiring soon</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="stackable"
                                checked={filters.stackable_only}
                                onCheckedChange={(checked) => 
                                  setFilters({...filters, stackable_only: !!checked})
                                }
                              />
                              <Label htmlFor="stackable">Stackable offers only</Label>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="font-medium">Price Range</h3>
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="max-price">Maximum Price: ₹{filters.max_price || 'Any'}</Label>
                              <Slider
                                id="max-price"
                                min={0}
                                max={100000}
                                step={1000}
                                value={[filters.max_price || 100000]}
                                onValueChange={(value) => 
                                  setFilters({...filters, max_price: value[0] === 100000 ? undefined : value[0]})
                                }
                                className="mt-2"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </div>
            
            {/* Responsive Deals Grid */}
            <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 xs:gap-4 sm:gap-6 lg:gap-8 mb-6 xs:mb-8">
              {rankedOffers.map((offer, index) => (
                <div 
                  key={offer.id} 
                  className="floating-card w-full animate-fade-in" 
                  style={{animationDelay: `${index * 0.05}s`}}
                >
                  <IntelligentOfferCard offer={offer} rank={index + 1} />
                </div>
              ))}
            </div>
            
            {/* Enhanced Stats Card */}
            <div className="glass-card p-4 xs:p-6 lg:p-8 text-center">
              <h3 className="text-base xs:text-lg lg:text-xl font-semibold mb-3 xs:mb-4">Deal Insights</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 xs:gap-4">
                <div className="p-2 xs:p-3 rounded-lg bg-purple-500/10">
                  <div className="text-lg xs:text-xl sm:text-2xl font-bold text-purple-400">
                    {rankedOffers.length}
                  </div>
                  <div className="text-xs xs:text-sm text-muted-foreground">Total Deals</div>
                </div>
                <div className="p-2 xs:p-3 rounded-lg bg-blue-500/10">
                  <div className="text-lg xs:text-xl sm:text-2xl font-bold text-blue-400">
                    ₹{rankedOffers.reduce((sum, offer) => {
                      const savings = parseFloat(offer.original_price) - parseFloat(offer.discounted_price || offer.original_price);
                      return sum + savings;
                    }, 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs xs:text-sm text-muted-foreground">Total Savings</div>
                </div>
                <div className="p-2 xs:p-3 rounded-lg bg-green-500/10">
                  <div className="text-lg xs:text-xl sm:text-2xl font-bold text-green-400">
                    {Math.round(rankedOffers.reduce((sum, offer) => sum + offer.ranking_score, 0) / rankedOffers.length * 100)}
                  </div>
                  <div className="text-xs xs:text-sm text-muted-foreground">Avg Match Score</div>
                </div>
                <div className="p-2 xs:p-3 rounded-lg bg-orange-500/10">
                  <div className="text-lg xs:text-xl sm:text-2xl font-bold text-orange-400">
                    {rankedOffers.filter(offer => offer.stacking_opportunities.length > 0).length}
                  </div>
                  <div className="text-xs xs:text-sm text-muted-foreground">Stackable Deals</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* No Deals State */}
        {!isLoading && !error && rankedOffers.length === 0 && (
          <div className="glass-card p-4 xs:p-6 sm:p-8 text-center">
            <div className="text-4xl xs:text-5xl sm:text-6xl mb-4">🔍</div>
            <Alert className="bg-blue-950/50 border-blue-500/50 text-left">
              <Info className="h-4 w-4 flex-shrink-0" />
              <div className="ml-2">
                <AlertTitle className="text-base xs:text-lg">No Deals Match Your Criteria</AlertTitle>
                <AlertDescription className="text-xs xs:text-sm mt-2">
                  Try adjusting your filters or check back later for new deals.
                </AlertDescription>
              </div>
            </Alert>
          </div>
        )}
        
        <div className="glass-card p-3 xs:p-4 mt-4 xs:mt-6 mb-safe-bottom">
          <p className="text-xs xs:text-sm text-center text-muted-foreground/60">
            🤖 AI analyzes your spending patterns, card benefits, and preferences to rank deals. 
            {isLocationEnabled && " Location-based deals are prioritized."}
          </p>
        </div>
      </div>
    </div>
  );
}
