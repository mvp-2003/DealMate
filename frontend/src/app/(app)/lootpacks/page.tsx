"use client";

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Package2, Sparkles, Gift, Clock, Zap, Crown, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AuthLoader } from '@/components/ui/animated-loader';
import { useLazyLoading, useProgressiveLoading } from '@/hooks/useLazyLoading';
import { cn } from '@/lib/utils';

// Lazy load heavy components
const LootPackCard = dynamic(() => import('@/components/lootpacks/LootPackCard'), {
  loading: () => <AuthLoader size="sm" />,
  ssr: false
});

const PackOpeningModal = dynamic(() => import('@/components/lootpacks/PackOpeningModal'), {
  loading: () => <AuthLoader size="sm" />,
  ssr: false
});

const RewardsInventory = dynamic(() => import('@/components/lootpacks/RewardsInventory'), {
  loading: () => <AuthLoader size="sm" />,
  ssr: false
});

const DailyStreakTracker = dynamic(() => import('@/components/lootpacks/DailyStreakTracker'), {
  loading: () => <AuthLoader size="sm" />,
  ssr: false
});

// Mock data for available packs
const availablePacks = [
  {
    id: '1',
    name: 'Daily Free Pack',
    type: 'free' as const,
    description: 'Your daily dose of rewards!',
    icon: Gift,
    color: 'from-green-400 to-emerald-600',
    available: true,
    cooldown: 24 * 60 * 60 * 1000, // 24 hours
    rewards: {
      min: 1,
      max: 3,
      possibleTypes: ['coupon', 'cashback', 'points']
    }
  },
  {
    id: '2',
    name: 'Bronze Pack',
    type: 'premium' as const,
    description: 'Basic rewards with guaranteed value',
    icon: Package2,
    color: 'from-orange-400 to-amber-600',
    price: 99,
    rewards: {
      min: 3,
      max: 5,
      possibleTypes: ['coupon', 'cashback', 'points', 'voucher']
    }
  },
  {
    id: '3',
    name: 'Silver Pack',
    type: 'premium' as const,
    description: 'Enhanced rewards with rare items',
    icon: Sparkles,
    color: 'from-gray-400 to-slate-600',
    price: 299,
    rewards: {
      min: 5,
      max: 8,
      possibleTypes: ['coupon', 'cashback', 'points', 'voucher', 'exclusive']
    }
  },
  {
    id: '4',
    name: 'Gold Pack',
    type: 'premium' as const,
    description: 'Premium rewards with exclusive deals',
    icon: Crown,
    color: 'from-yellow-400 to-yellow-600',
    price: 599,
    rewards: {
      min: 8,
      max: 12,
      possibleTypes: ['coupon', 'cashback', 'points', 'voucher', 'exclusive', 'jackpot']
    }
  }
];

// Mock user data
const mockUserData = {
  dealCoins: 1250,
  dailyStreak: 5,
  totalPacksOpened: 47,
  level: 12,
  levelProgress: 65,
  nextLevelReward: 'Gold Pack'
};

export default function LootPacksPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [isOpeningPack, setIsOpeningPack] = useState(false);
  const [userStats, setUserStats] = useState(mockUserData);
  const [lastFreePackTime, setLastFreePackTime] = useState<number | null>(null);
  const [timeUntilFree, setTimeUntilFree] = useState<string>('');
  
  // Progressive loading states
  const [visibleSections, setVisibleSections] = useState({
    hero: true,
    packs: false,
    inventory: false,
    streak: false
  });

  // Use progressive loading hook
  const shouldLoadHeavyComponents = useProgressiveLoading(500);
  const { isVisible: inventoryVisible } = useLazyLoading();

  useEffect(() => {
    setIsLoaded(true);
    // Load last free pack time from localStorage
    const savedTime = localStorage.getItem('lastFreePackTime');
    if (savedTime) {
      setLastFreePackTime(parseInt(savedTime));
    }
    
    // Progressive section loading
    const timer1 = setTimeout(() => setVisibleSections(prev => ({ ...prev, packs: true })), 200);
    const timer2 = setTimeout(() => setVisibleSections(prev => ({ ...prev, streak: true })), 400);
    const timer3 = setTimeout(() => setVisibleSections(prev => ({ ...prev, inventory: true })), 600);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  useEffect(() => {
    // Update countdown timer
    const interval = setInterval(() => {
      if (lastFreePackTime) {
        const timePassed = Date.now() - lastFreePackTime;
        const timeRemaining = 24 * 60 * 60 * 1000 - timePassed;
        
        if (timeRemaining > 0) {
          const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
          const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
          const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
          setTimeUntilFree(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeUntilFree('');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastFreePackTime]);

  const handlePackSelect = (pack: any) => {
    // Check if free pack is on cooldown
    if (pack.type === 'free' && lastFreePackTime) {
      const timePassed = Date.now() - lastFreePackTime;
      if (timePassed < pack.cooldown) {
        return; // Pack is on cooldown
      }
    }

    setSelectedPack(pack);
    setIsOpeningPack(true);
  };

  const handlePackOpened = (rewards: any[]) => {
    // Update user stats
    setUserStats(prev => ({
      ...prev,
      totalPacksOpened: prev.totalPacksOpened + 1,
      levelProgress: Math.min(prev.levelProgress + 10, 100)
    }));

    // If it was a free pack, save the timestamp
    if (selectedPack?.type === 'free') {
      const now = Date.now();
      setLastFreePackTime(now);
      localStorage.setItem('lastFreePackTime', now.toString());
    }

    // Close modal after a delay
    setTimeout(() => {
      setIsOpeningPack(false);
      setSelectedPack(null);
    }, 3000);
  };

  const canOpenFreePack = !lastFreePackTime || (Date.now() - lastFreePackTime) >= (24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen-safe">
      <div className={cn("space-responsive", isLoaded ? 'animate-fade-in' : 'opacity-0')}>
        
        {/* Header Section */}
        <div className="glass-card p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                LootPacks
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Open packs to discover amazing deals and rewards!
              </p>
            </div>
            
            {/* User Stats */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="text-xl font-bold">{userStats.dealCoins}</span>
                </div>
                <p className="text-xs text-muted-foreground">DealCoins</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold mb-1">Lv. {userStats.level}</div>
                <Progress value={userStats.levelProgress} className="w-20 h-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Streak Tracker */}
        {visibleSections.streak && (
          <Suspense fallback={<AuthLoader size="sm" />}>
            <DailyStreakTracker streak={userStats.dailyStreak} />
          </Suspense>
        )}

        {/* Special Events Banner */}
        <div className="glass-card p-4 mb-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-500" />
            <div>
              <h3 className="font-semibold">Double Rewards Weekend!</h3>
              <p className="text-sm text-muted-foreground">All packs contain 2x rewards until Sunday</p>
            </div>
          </div>
        </div>

        {/* Available Packs Grid */}
        {visibleSections.packs && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Available Packs</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {availablePacks.map((pack, index) => (
                <Suspense key={pack.id} fallback={<AuthLoader size="sm" />}>
                  <LootPackCard
                    pack={pack}
                    onSelect={handlePackSelect}
                    disabled={pack.type === 'free' && !canOpenFreePack}
                    cooldownText={pack.type === 'free' && !canOpenFreePack ? timeUntilFree : undefined}
                    animationDelay={index * 0.1}
                  />
                </Suspense>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4 text-center">
            <Package2 className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{userStats.totalPacksOpened}</div>
            <p className="text-sm text-muted-foreground">Packs Opened</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Gift className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{userStats.dailyStreak}</div>
            <p className="text-sm text-muted-foreground">Day Streak</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">₹2,450</div>
            <p className="text-sm text-muted-foreground">Total Saved</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Crown className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">Elite</div>
            <p className="text-sm text-muted-foreground">Member Status</p>
          </div>
        </div>

        {/* Rewards Inventory */}
        {visibleSections.inventory && shouldLoadHeavyComponents && (
          <Suspense fallback={<AuthLoader size="md" />}>
            <RewardsInventory />
          </Suspense>
        )}

        {/* Pack Opening Modal */}
        {isOpeningPack && selectedPack && (
          <Suspense fallback={<AuthLoader size="lg" />}>
            <PackOpeningModal
              pack={selectedPack}
              isOpen={isOpeningPack}
              onClose={() => {
                setIsOpeningPack(false);
                setSelectedPack(null);
              }}
              onRewardsRevealed={handlePackOpened}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
