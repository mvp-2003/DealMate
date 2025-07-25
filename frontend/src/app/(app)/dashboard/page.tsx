"use client";

import { useEffect, useState } from 'react';
import { TicketPercent, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  LazyProductInfoCard,
  LazyPriceComparisonTable,
  LazyOffersList,
  LazySavingsScore,
  LazyPriceHistoryChart,
  LazyMonthlySavingsChart,
  WithSuspense
} from '@/components/common/LazyComponents';
import { ComponentLoader, CardSkeleton } from '@/components/ui/component-loader';

export default function DashboardPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [visibleSections, setVisibleSections] = useState({
    hero: true,
    charts: false,
    comparison: false,
    offers: false,
    actions: false
  });

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
        
        {/* Hero Section with Product Cards - Responsive Grid */}
        {visibleSections.hero && (
          <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-8 mb-12 xs:mb-16">
            <div className="relative">
              <WithSuspense>
                <LazyProductInfoCard
                  title="Cool Gadget Pro X"
                  currentPrice="₹999"
                  originalPrice="₹1,299"
                  discount="23%"
                  platform="Amazon.in"
                  imageUrl="https://placehold.co/600x400.png"
                />
              </WithSuspense>
            </div>
            <div className="relative" style={{animationDelay: '0.1s'}}>
              <WithSuspense>
                <LazyProductInfoCard
                  title="Smart Headphones Ultra"
                  currentPrice="₹1,499"
                  originalPrice="₹2,299"
                  discount="35%"
                  platform="Flipkart"
                  imageUrl="https://placehold.co/600x400.png"
                />
              </WithSuspense>
            </div>
            <div className="relative sm:col-span-2 lg:col-span-1" style={{animationDelay: '0.2s'}}>
              <WithSuspense>
                <LazyProductInfoCard
                  title="Wireless Speaker Pro"
                  currentPrice="₹799"
                  originalPrice="₹1,199"
                  discount="33%"
                  platform="Myntra"
                  imageUrl="https://placehold.co/600x400.png"
                />
              </WithSuspense>
            </div>
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
