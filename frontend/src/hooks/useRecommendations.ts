import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { RecommendationsResponse, Recommendation } from '@/types/recommendations';
import RecommendationsService from '@/services/recommendations';

interface UseRecommendationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useRecommendations(options: UseRecommendationsOptions = {}) {
  const { user } = useUser();
  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { autoRefresh = false, refreshInterval = 300000 } = options; // 5 minutes default

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const recommendations = await RecommendationsService.getRecommendations(
        user?.sub || undefined
      );
      
      setData(recommendations);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch recommendations'));
    } finally {
      setLoading(false);
    }
  }, [user?.sub]);

  const markNotInterested = useCallback(async (productId: string) => {
    if (!user?.sub) return;
    
    try {
      await RecommendationsService.markNotInterested(user.sub, productId);
      
      // Remove the product from current recommendations
      setData(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          sections: prev.sections.map(section => ({
            ...section,
            recommendations: section.recommendations.filter(
              rec => rec.id !== productId
            ),
          })),
        };
      });
    } catch (err) {
      console.error('Failed to mark as not interested:', err);
    }
  }, [user?.sub]);

  const trackActivity = useCallback(async (
    productId: string,
    action: 'view' | 'click' | 'purchase' | 'wishlist' | 'search',
    metadata?: any
  ) => {
    if (!user?.sub) return;
    
    try {
      await RecommendationsService.trackUserActivity({
        userId: user.sub,
        productId,
        action,
        metadata,
      });
    } catch (err) {
      console.error('Failed to track activity:', err);
    }
  }, [user?.sub]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchRecommendations, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchRecommendations]);

  return {
    data,
    loading,
    error,
    refetch: fetchRecommendations,
    markNotInterested,
    trackActivity,
  };
}

export default useRecommendations;
