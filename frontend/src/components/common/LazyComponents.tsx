'use client';

import { lazy, Suspense } from 'react';
import { AuthLoader } from '@/components/ui/animated-loader';

// Lazy load dashboard components
export const LazyProductInfoCard = lazy(() => 
  import('@/components/dashboard/ProductInfoCard').then(module => ({ default: module.default }))
);

export const LazyPriceComparisonTable = lazy(() => 
  import('@/components/dashboard/PriceComparisonTable').then(module => ({ default: module.default }))
);

export const LazyOffersList = lazy(() => 
  import('@/components/dashboard/OffersList').then(module => ({ default: module.default }))
);

export const LazySavingsScore = lazy(() => 
  import('@/components/dashboard/SavingsScore').then(module => ({ default: module.default }))
);

export const LazyPriceHistoryChart = lazy(() => 
  import('@/components/dashboard/PriceHistoryChart').then(module => ({ default: module.default }))
);

export const LazyMonthlySavingsChart = lazy(() => 
  import('@/components/dashboard/MonthlySavingsChart').then(module => ({ default: module.default }))
);

// Lazy load wallet components
export const LazyCreditCardList = lazy(() => 
  import('@/components/wallet/CreditCardList').then(module => ({ default: module.default }))
);

export const LazyCardVaultForm = lazy(() => 
  import('@/components/wallet/CardVaultForm').then(module => ({ default: module.default }))
);

export const LazyRewardProgressChart = lazy(() => 
  import('@/components/wallet/RewardProgressChart').then(module => ({ default: module.default }))
);

export const LazyRewardGoalsList = lazy(() => 
  import('@/components/wallet/RewardGoalsList').then(module => ({ default: module.default }))
);

export const LazyLoyaltyProgramList = lazy(() => 
  import('@/components/wallet/LoyaltyProgramList').then(module => ({ default: module.default }))
);

// Lazy load lootpack components
export const LazyRewardsInventory = lazy(() => 
  import('@/components/lootpacks/RewardsInventory').then(module => ({ default: module.default }))
);

export const LazyDailyStreakTracker = lazy(() => 
  import('@/components/lootpacks/DailyStreakTracker').then(module => ({ default: module.default }))
);

export const LazyPackOpeningModal = lazy(() => 
  import('@/components/lootpacks/PackOpeningModal').then(module => ({ default: module.default }))
);

export const LazyLootPackCard = lazy(() => 
  import('@/components/lootpacks/LootPackCard').then(module => ({ default: module.default }))
);

// Lazy load smart deals components
export const LazyRankedOfferCard = lazy(() => 
  import('@/components/smart-deals/RankedOfferCard').then(module => ({ default: module.default }))
);

// Component wrapper with suspense
export function WithSuspense({ 
  children, 
  fallback = <AuthLoader size="sm" />,
  className = ""
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}) {
  return (
    <Suspense fallback={<div className={className}>{fallback}</div>}>
      {children}
    </Suspense>
  );
}

export default {
  LazyProductInfoCard,
  LazyPriceComparisonTable,
  LazyOffersList,
  LazySavingsScore,
  LazyPriceHistoryChart,
  LazyMonthlySavingsChart,
  LazyCreditCardList,
  LazyCardVaultForm,
  LazyRewardProgressChart,
  LazyRewardGoalsList,
  LazyLoyaltyProgramList,
  LazyRewardsInventory,
  LazyDailyStreakTracker,
  LazyPackOpeningModal,
  LazyLootPackCard,
  LazyRankedOfferCard,
  WithSuspense,
};
