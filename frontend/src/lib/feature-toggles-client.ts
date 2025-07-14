'use client';

interface FeatureToggles {
  Login: boolean;
}

const defaultToggles: FeatureToggles = {
  Login: true,
};

export async function getFeatureToggles(): Promise<FeatureToggles> {
  try {
    const response = await fetch('/api/feature-toggles');
    if (response.ok) {
      const toggles = await response.json();
      console.log('Fetched toggles:', toggles);
      return { ...defaultToggles, ...toggles };
    }
  } catch (error) {
    console.warn('Failed to fetch feature toggles, using defaults:', error);
  }
  
  return defaultToggles;
}

export async function isFeatureEnabled(feature: keyof FeatureToggles): Promise<boolean> {
  const toggles = await getFeatureToggles();
  console.log(`Feature ${feature} is:`, toggles[feature]);
  return toggles[feature];
}