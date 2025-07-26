"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TicketPercent, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  LazyProductInfoCard,
  LazyPriceComparisonTable,
  LazyOffersList,
  LazySavingsScore,
  LazyPriceHistoryChart,
  LazyMonthlySavingsChart,
  LazyRecommendationSection,
  WithSuspense
} from '@/components/common/LazyComponents';
import { ComponentLoader, CardSkeleton } from '@/components/ui/component-loader';
import { useRecommendations } from '@/hooks/useRecommendations';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [visibleSections, setVisibleSections] = useState({
    hero: true,
    charts: false,
    comparison: false,
    offers: false,
    actions: false
  });

  const { 
    data: recommendations, 
    loading: recommendationsLoading, 
    markNotInterested,
    trackActivity 
  } = useRecommendations({ autoRefresh: true });

  useEffect(() => {
    setIsLoaded(true);
    
    // Progressive loading with intersection observer simulation
    const timer1 = setTimeout(() => setVisibleSections(prev => ({ ...prev, charts: true })), 300);
    const timer2 = setTimeout(() => setVisibleSections(prev => ({ ...prev, comparison: true })), 600);
    const timer3 = setTimeout(() => setVisibleSections(prev => ({ ...prev, offers: true })), 900);
    const timer4 = setTimeout(() => setVisibleSections(prev => ({ ...prev, actions: true })), 1200);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  const handleProductClick = (productId: string) => {
    trackActivity(productId, 'click');
    // Navigate to product details or comparison page
    router.push(`/compare?product=${productId}`);
  };

  const handleAddToWishlist = (productId: string) => {
    trackActivity(productId, 'wishlist');
    // Add to wishlist logic
  };

  const handleCompare = (productId: string) => {
    trackActivity(productId, 'click');
    router.push(`/compare?product=${productId}`);
  };

  const handleViewMore = (sectionType: string) => {
    // Navigate to dedicated page for that recommendation type
    router.push(`/smart-deals?type=${sectionType}`);
  };
  return (
    <div className="min-h-screen-safe">
      <div className={cn("space-responsive", isLoaded ? 'animate-fade-in' : 'opacity-0')}>
        
        {/* Welcome Section - Mobile Optimized */}
        <div className="glass-card p-3 xs:p-4 sm:p-6 mb-4 xs:mb-6">
          <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-headline font-bold tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Welcome to DealMate
          </h1>
          <p className="text-sm xs:text-base text-muted-foreground/80">
            Your personalized deals dashboard
          </p>
        </div>
        
        {/* Personalized Recommendations */}
        {visibleSections.hero && recommendations?.sections && (
          <div className="space-y-8 xs:space-y-12 mb-8 xs:mb-12">
            {recommendations.sections.map((section, index) => (
              <div
                key={section.type}
                style={{ animationDelay: `${index * 0.1}s` }}
                className="animate-fade-in"
              >
                <WithSuspense fallback={<CardSkeleton />}>
                  <LazyRecommendationSection
                    section={section}
                    onNotInterested={markNotInterested}
                    onAddToWishlist={handleAddToWishlist}
                    onViewDetails={handleProductClick}
                    onCompare={handleCompare}
                    onViewMore={() => handleViewMore(section.type)}
                    loading={recommendationsLoading}
                  />
                </WithSuspense>
              </div>
            ))}
          </div>
        )}

        {/* Fallback for no recommendations */}
        {visibleSections.hero && !recommendationsLoading && !recommendations?.sections?.length && (
          <div className="glass-card p-8 text-center mb-8">
            <p className="text-muted-foreground mb-4">
              No personalized recommendations available yet. Start browsing to get personalized deals!
            </p>
            <button
              onClick={() => router.push('/smart-deals')}
              className="btn-primary"
            >
              Browse All Deals
            </button>
          </div>
        )}
        
        {/* Savings Overview - Mobile First Layout */}
        {visibleSections.charts && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 mb-6 xs:mb-8">
            <div className="lg:col-span-1 order-2 lg:order-1 transition-transform duration-200 hover:scale-105">
              <WithSuspense>
                <LazySavingsScore score="₹300" percentageOff="23%" />
              </WithSuspense>
            </div>
            <div className="lg:col-span-3 order-1 lg:order-2 grid grid-cols-1 md:grid-cols-2 gap-3 xs:gap-4 sm:gap-6">
              <div className="transition-transform duration-200 hover:scale-105">
                <WithSuspense>
                  <LazyPriceHistoryChart />
                </WithSuspense>
              </div>
              <div className="transition-transform duration-200 hover:scale-105">
                <WithSuspense>
                  <LazyMonthlySavingsChart />
                </WithSuspense>
              </div>
            </div>
          </div>
        )}

        {/* Price Comparison - Enhanced Mobile Table */}
        {visibleSections.comparison && (
          <div className="glass-card p-3 xs:p-4 sm:p-6 mb-6 xs:mb-8">
            <div className="overflow-x-auto scrollbar-thin">
              <WithSuspense>
                <LazyPriceComparisonTable />
              </WithSuspense>
            </div>
          </div>
        )}

        {/* Offers Section - Responsive Stack */}
        {visibleSections.offers && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 xs:gap-4 sm:gap-6 mb-6 xs:mb-8">
            <div>
              <WithSuspense>
                <LazyOffersList 
                  title="Available Coupons" 
                  icon={TicketPercent} 
                  offers={[
                    { type: 'coupon', description: 'WELCOME50', value: '₹50 OFF' },
                    { type: 'coupon', description: 'GADGET10', value: '10% OFF' },
                  ]}
                />
              </WithSuspense>
            </div>
            
            <div style={{animationDelay: '0.1s'}}>
              <WithSuspense>
                <LazyOffersList 
                  title="Cashback Offers" 
                  icon={CreditCard} 
                  offers={[
                    { type: 'cashback', description: 'ICICI Credit Card', value: '5% Back' },
                    { type: 'cashback', description: 'Paytm Wallet', value: '₹25 CB' },
                  ]}
                />
              </WithSuspense>
            </div>
          </div>
        )}
        
        {/* Quick Actions - Responsive Grid */}
        {visibleSections.actions && (
          <div className="glass-card p-3 xs:p-4 sm:p-6 lg:p-8 mb-6">
            <h3 className="text-lg xs:text-xl lg:text-2xl font-semibold mb-3 xs:mb-4 lg:mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 xs:gap-3 lg:gap-4">
              <button className="touch-target glass-card p-3 xs:p-4 lg:p-6 text-center hover:bg-primary/10 transition-all duration-200 rounded-lg hover:scale-105">
                <div className="text-2xl lg:text-3xl xl:text-4xl mb-1 lg:mb-2">🔍</div>
                <div className="text-xs xs:text-sm lg:text-base font-medium">Search Deals</div>
              </button>
              <button className="touch-target glass-card p-3 xs:p-4 lg:p-6 text-center hover:bg-primary/10 transition-all duration-200 rounded-lg hover:scale-105">
                <div className="text-2xl lg:text-3xl xl:text-4xl mb-1 lg:mb-2">💳</div>
                <div className="text-xs xs:text-sm lg:text-base font-medium">Add Card</div>
              </button>
              <button className="touch-target glass-card p-3 xs:p-4 lg:p-6 text-center hover:bg-primary/10 transition-all duration-200 rounded-lg hover:scale-105">
                <div className="text-2xl lg:text-3xl xl:text-4xl mb-1 lg:mb-2">📊</div>
                <div className="text-xs xs:text-sm lg:text-base font-medium">Analytics</div>
              </button>
              <button className="touch-target glass-card p-3 xs:p-4 lg:p-6 text-center hover:bg-primary/10 transition-all duration-200 rounded-lg hover:scale-105">
                <div className="text-2xl lg:text-3xl xl:text-4xl mb-1 lg:mb-2">⚙️</div>
                <div className="text-xs xs:text-sm lg:text-base font-medium">Settings</div>
              </button>
              
              {/* Additional actions for larger screens */}
              <button className="hidden lg:flex touch-target glass-card p-3 xs:p-4 lg:p-6 text-center hover:bg-primary/10 transition-all duration-200 rounded-lg hover:scale-105 flex-col items-center justify-center">
                <div className="text-2xl lg:text-3xl xl:text-4xl mb-1 lg:mb-2">📈</div>
                <div className="text-xs xs:text-sm lg:text-base font-medium">Reports</div>
              </button>
              
              <button className="hidden lg:flex touch-target glass-card p-3 xs:p-4 lg:p-6 text-center hover:bg-primary/10 transition-all duration-200 rounded-lg hover:scale-105 flex-col items-center justify-center">
                <div className="text-2xl lg:text-3xl xl:text-4xl mb-1 lg:mb-2">🎁</div>
                <div className="text-xs xs:text-sm lg:text-base font-medium">Rewards</div>
              </button>
              
              <button className="hidden xl:flex touch-target glass-card p-3 xs:p-4 lg:p-6 text-center hover:bg-primary/10 transition-all duration-200 rounded-lg hover:scale-105 flex-col items-center justify-center">
                <div className="text-2xl lg:text-3xl xl:text-4xl mb-1 lg:mb-2">🔔</div>
                <div className="text-xs xs:text-sm lg:text-base font-medium">Alerts</div>
              </button>
              
              <button className="hidden xl:flex touch-target glass-card p-3 xs:p-4 lg:p-6 text-center hover:bg-primary/10 transition-all duration-200 rounded-lg hover:scale-105 flex-col items-center justify-center">
                <div className="text-2xl lg:text-3xl xl:text-4xl mb-1 lg:mb-2">💼</div>
                <div className="text-xs xs:text-sm lg:text-base font-medium">Business</div>
              </button>
            </div>
          </div>
        )}
        
        <p className="text-xs xs:text-sm text-center text-muted-foreground/60 pt-2 xs:pt-4 pb-safe-bottom">
          Product data for demonstration purposes. Prices and offers may vary.
        </p>
      </div>
    </div>
  );
}
