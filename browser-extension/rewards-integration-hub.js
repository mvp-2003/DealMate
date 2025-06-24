// DealPal Rewards Integration Hub
// Connects with multiple reward programs and loyalty systems

class RewardsIntegrationHub {
  constructor() {
    this.integrations = new Map();
    this.userTokens = new Map();
    this.rewardBalances = new Map();
    this.exchangeRates = new Map();
    
    this.initializeIntegrations();
  }

  initializeIntegrations() {
    // Popular loyalty programs
    this.integrations.set('starbucks', {
      name: 'Starbucks Rewards',
      type: 'coffee',
      apiEndpoint: 'https://api.starbucks.com/rewards',
      pointsName: 'Stars',
      exchangeRate: 0.04, // $1 = 25 stars, 1 star = $0.04
      tier: 'gold',
      benefits: ['Free drinks', 'Birthday rewards', 'Mobile ordering']
    });
    
    this.integrations.set('amazon', {
      name: 'Amazon Prime',
      type: 'ecommerce',
      apiEndpoint: 'https://api.amazon.com/rewards',
      pointsName: 'Prime Points',
      exchangeRate: 0.01, // 1 point = $0.01
      tier: 'prime',
      benefits: ['Free shipping', 'Prime Video', 'Exclusive deals']
    });
    
    this.integrations.set('delta', {
      name: 'Delta SkyMiles',
      type: 'airline',
      apiEndpoint: 'https://api.delta.com/skymiles',
      pointsName: 'Miles',
      exchangeRate: 0.012, // Approximate value
      tier: 'silver',
      benefits: ['Flight upgrades', 'Priority boarding', 'Lounge access']
    });
    
    this.integrations.set('marriott', {
      name: 'Marriott Bonvoy',
      type: 'hotel',
      apiEndpoint: 'https://api.marriott.com/bonvoy',
      pointsName: 'Points',
      exchangeRate: 0.007, // Approximate value
      tier: 'gold',
      benefits: ['Room upgrades', 'Late checkout', 'Free WiFi']
    });
    
    this.integrations.set('target', {
      name: 'Target Circle',
      type: 'retail',
      apiEndpoint: 'https://api.target.com/circle',
      pointsName: 'Circle Earnings',
      exchangeRate: 0.01,
      tier: 'member',
      benefits: ['1% earnings', 'Special offers', 'Birthday gift']
    });
    
    this.integrations.set('sephora', {
      name: 'Sephora Beauty Insider',
      type: 'beauty',
      apiEndpoint: 'https://api.sephora.com/beauty-insider',
      pointsName: 'Beauty Points',
      exchangeRate: 0.01,
      tier: 'vib',
      benefits: ['Product samples', 'Birthday gifts', 'Exclusive events']
    });
    
    this.integrations.set('nike', {
      name: 'NikePlus',
      type: 'sports',
      apiEndpoint: 'https://api.nike.com/plus',
      pointsName: 'Nike Points',
      exchangeRate: 0.01,
      tier: 'member',
      benefits: ['Member pricing', 'Early access', 'Free shipping']
    });
    
    this.integrations.set('uber', {
      name: 'Uber Rewards',
      type: 'transportation',
      apiEndpoint: 'https://api.uber.com/rewards',
      pointsName: 'Uber Points',
      exchangeRate: 0.01,
      tier: 'gold',
      benefits: ['Price protection', 'Flexible cancellation', 'Priority support']
    });
  }

  // Connect user account to a reward program
  async connectRewardProgram(programId, userCredentials) {
    const integration = this.integrations.get(programId);
    if (!integration) {
      throw new Error(`Unknown reward program: ${programId}`);
    }

    try {
      // In a real implementation, use OAuth or API tokens
      const authResponse = await this.authenticateWithProgram(integration, userCredentials);
      
      if (authResponse.success) {
        this.userTokens.set(programId, authResponse.token);
        
        // Fetch current balance
        const balance = await this.fetchRewardBalance(programId);
        this.rewardBalances.set(programId, balance);
        
        // Store connection
        await this.saveConnection(programId, authResponse);
        
        return {
          success: true,
          program: integration.name,
          balance: balance,
          tier: integration.tier
        };
      }
    } catch (error) {
      console.error(`Failed to connect to ${integration.name}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Mock authentication (replace with real OAuth flows)
  async authenticateWithProgram(integration, credentials) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock success response
    return {
      success: true,
      token: `mock_token_${Date.now()}`,
      expiresIn: 3600,
      refreshToken: `refresh_${Date.now()}`
    };
  }

  // Fetch reward balance from a program
  async fetchRewardBalance(programId) {
    const integration = this.integrations.get(programId);
    const token = this.userTokens.get(programId);
    
    if (!token) {
      throw new Error(`Not connected to ${integration.name}`);
    }

    try {
      // Mock API call to fetch balance
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock balance data
      const mockBalances = {
        'starbucks': { points: 1250, dollarValue: 50, tier: 'Gold Star' },
        'amazon': { points: 5000, dollarValue: 50, tier: 'Prime' },
        'delta': { points: 25000, dollarValue: 300, tier: 'Silver Medallion' },
        'marriott': { points: 80000, dollarValue: 560, tier: 'Gold Elite' },
        'target': { points: 2500, dollarValue: 25, tier: 'Circle Member' },
        'sephora': { points: 1000, dollarValue: 10, tier: 'VIB' },
        'nike': { points: 800, dollarValue: 8, tier: 'Member' },
        'uber': { points: 1500, dollarValue: 15, tier: 'Gold' }
      };
      
      return mockBalances[programId] || { points: 0, dollarValue: 0, tier: 'Member' };
    } catch (error) {
      console.error(`Failed to fetch balance for ${integration.name}:`, error);
      return { points: 0, dollarValue: 0, tier: 'Unknown' };
    }
  }

  // Get opportunities to earn rewards for a purchase
  async getRewardOpportunities(purchaseData) {
    const { merchant, amount, category, location } = purchaseData;
    const opportunities = [];

    for (const [programId, integration] of this.integrations) {
      const token = this.userTokens.get(programId);
      if (!token) continue; // Skip if not connected

      const opportunity = await this.checkRewardOpportunity(
        programId, integration, purchaseData
      );
      
      if (opportunity.available) {
        opportunities.push(opportunity);
      }
    }

    // Sort by potential reward value
    opportunities.sort((a, b) => b.potentialReward - a.potentialReward);
    
    return opportunities;
  }

  async checkRewardOpportunity(programId, integration, purchaseData) {
    const { merchant, amount, category } = purchaseData;
    
    // Check if merchant participates in the program
    const merchantMatch = await this.checkMerchantParticipation(programId, merchant);
    
    if (!merchantMatch.participates) {
      return { available: false, programId, programName: integration.name };
    }

    // Calculate potential rewards
    const baseRate = merchantMatch.rate || this.getBaseRewardRate(programId, category);
    const potentialPoints = Math.floor(amount * baseRate);
    const potentialReward = potentialPoints * integration.exchangeRate;
    
    // Check for bonus offers
    const bonusOffer = await this.checkBonusOffers(programId, merchant, category);
    
    return {
      available: true,
      programId,
      programName: integration.name,
      pointsName: integration.pointsName,
      potentialPoints,
      potentialReward,
      baseRate,
      bonusOffer,
      activation: merchantMatch.requiresActivation ? {
        required: true,
        method: merchantMatch.activationMethod,
        link: merchantMatch.activationLink
      } : null
    };
  }

  async checkMerchantParticipation(programId, merchant) {
    // Mock merchant participation data
    const participatingMerchants = {
      'starbucks': {
        'starbucks.com': { participates: true, rate: 2, requiresActivation: false },
        'starbucks': { participates: true, rate: 2, requiresActivation: false }
      },
      'amazon': {
        'amazon.com': { participates: true, rate: 1, requiresActivation: false },
        'amazon.in': { participates: true, rate: 1, requiresActivation: false },
        'whole foods': { participates: true, rate: 1.5, requiresActivation: false }
      },
      'delta': {
        'delta.com': { participates: true, rate: 2, requiresActivation: false },
        'hotels.com': { participates: true, rate: 1, requiresActivation: true }
      },
      'target': {
        'target.com': { participates: true, rate: 1, requiresActivation: false },
        'target': { participates: true, rate: 1, requiresActivation: false }
      }
    };

    const merchants = participatingMerchants[programId] || {};
    const merchantKey = Object.keys(merchants).find(key => 
      merchant.toLowerCase().includes(key.toLowerCase())
    );
    
    return merchants[merchantKey] || { participates: false };
  }

  getBaseRewardRate(programId, category) {
    const categoryRates = {
      'starbucks': { 'coffee': 2, 'food': 1 },
      'amazon': { 'all': 1 },
      'delta': { 'travel': 2, 'dining': 1 },
      'marriott': { 'hotel': 3, 'dining': 1 },
      'target': { 'all': 1 },
      'sephora': { 'beauty': 1 },
      'nike': { 'sports': 1 },
      'uber': { 'transportation': 1 }
    };

    const rates = categoryRates[programId] || {};
    return rates[category] || rates['all'] || 1;
  }

  async checkBonusOffers(programId, merchant, category) {
    // Mock bonus offers
    const bonusOffers = {
      'starbucks': {
        current: 'Double Stars on handcrafted beverages',
        multiplier: 2,
        validUntil: '2024-07-31'
      },
      'amazon': {
        current: '5% back with Prime Card',
        multiplier: 5,
        validUntil: '2024-12-31'
      },
      'delta': {
        current: 'Triple miles on hotel bookings',
        multiplier: 3,
        validUntil: '2024-08-15'
      }
    };

    return bonusOffers[programId] || null;
  }

  // Stack multiple reward opportunities
  async stackRewards(purchaseData, selectedPrograms) {
    const stackedRewards = {
      totalPoints: 0,
      totalValue: 0,
      programs: [],
      conflicts: [],
      recommendations: []
    };

    for (const programId of selectedPrograms) {
      const integration = this.integrations.get(programId);
      if (!integration) continue;

      const opportunity = await this.checkRewardOpportunity(
        programId, integration, purchaseData
      );

      if (opportunity.available) {
        // Check for conflicts with other programs
        const conflicts = this.checkStackingConflicts(programId, selectedPrograms);
        
        if (conflicts.length === 0) {
          stackedRewards.programs.push(opportunity);
          stackedRewards.totalPoints += opportunity.potentialPoints;
          stackedRewards.totalValue += opportunity.potentialReward;
        } else {
          stackedRewards.conflicts.push({
            program: programId,
            conflicts: conflicts
          });
        }
      }
    }

    // Add stacking recommendations
    stackedRewards.recommendations = this.getStackingRecommendations(
      purchaseData, stackedRewards
    );

    return stackedRewards;
  }

  checkStackingConflicts(programId, otherPrograms) {
    // Some programs may conflict (e.g., can't earn both airline miles and hotel points on the same booking)
    const conflicts = [];
    
    const conflictRules = {
      'delta': ['marriott'], // Can't earn both airline and hotel points on same booking
      'marriott': ['delta']
    };

    const programConflicts = conflictRules[programId] || [];
    for (const conflictProgram of programConflicts) {
      if (otherPrograms.includes(conflictProgram)) {
        conflicts.push(conflictProgram);
      }
    }

    return conflicts;
  }

  getStackingRecommendations(purchaseData, stackedRewards) {
    const recommendations = [];

    if (stackedRewards.totalValue < purchaseData.amount * 0.02) {
      recommendations.push({
        type: 'improve',
        message: 'Consider using a cash-back credit card for better returns',
        potential: purchaseData.amount * 0.02
      });
    }

    if (stackedRewards.conflicts.length > 0) {
      recommendations.push({
        type: 'conflict',
        message: 'Some programs conflict. Choose the highest value option.',
        action: 'resolve_conflicts'
      });
    }

    return recommendations;
  }

  // Redeem rewards for a purchase
  async redeemRewards(programId, redemptionData) {
    const integration = this.integrations.get(programId);
    const token = this.userTokens.get(programId);

    if (!token) {
      throw new Error(`Not connected to ${integration.name}`);
    }

    try {
      // Mock redemption API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const redemption = {
        success: true,
        transactionId: `txn_${Date.now()}`,
        pointsRedeemed: redemptionData.points,
        dollarValue: redemptionData.points * integration.exchangeRate,
        newBalance: this.rewardBalances.get(programId).points - redemptionData.points
      };

      // Update local balance
      const currentBalance = this.rewardBalances.get(programId);
      this.rewardBalances.set(programId, {
        ...currentBalance,
        points: redemption.newBalance,
        dollarValue: redemption.newBalance * integration.exchangeRate
      });

      return redemption;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get personalized reward recommendations
  getPersonalizedRecommendations(userProfile) {
    const recommendations = [];
    const { spendingCategories, location, preferences } = userProfile;

    // Analyze top spending categories
    for (const [category, monthlySpend] of Object.entries(spendingCategories)) {
      const relevantPrograms = this.findProgramsForCategory(category);
      
      for (const programId of relevantPrograms) {
        if (!this.userTokens.has(programId)) {
          const integration = this.integrations.get(programId);
          const potentialAnnualReward = monthlySpend * 12 * integration.exchangeRate;
          
          recommendations.push({
            type: 'new_program',
            programId,
            programName: integration.name,
            category,
            monthlySpend,
            potentialAnnualReward,
            reasoning: `You spend $${monthlySpend}/month on ${category}`
          });
        }
      }
    }

    return recommendations.sort((a, b) => b.potentialAnnualReward - a.potentialAnnualReward);
  }

  findProgramsForCategory(category) {
    const categoryMappings = {
      'coffee': ['starbucks'],
      'ecommerce': ['amazon', 'target'],
      'travel': ['delta', 'marriott', 'uber'],
      'beauty': ['sephora'],
      'sports': ['nike'],
      'dining': ['delta', 'uber'],
      'retail': ['target', 'amazon']
    };

    return categoryMappings[category] || [];
  }

  // Export rewards data
  exportRewardsData() {
    const exportData = {
      timestamp: new Date().toISOString(),
      connectedPrograms: Array.from(this.integrations.keys()).filter(id => 
        this.userTokens.has(id)
      ),
      balances: Object.fromEntries(this.rewardBalances),
      totalValue: Array.from(this.rewardBalances.values()).reduce(
        (sum, balance) => sum + balance.dollarValue, 0
      )
    };

    return exportData;
  }

  // Save connection data
  async saveConnection(programId, authData) {
    await chrome.storage.local.set({
      [`reward_connection_${programId}`]: {
        connected: true,
        connectedAt: Date.now(),
        token: authData.token, // In production, encrypt this
        refreshToken: authData.refreshToken
      }
    });
  }

  // Load saved connections
  async loadSavedConnections() {
    const keys = Array.from(this.integrations.keys()).map(id => `reward_connection_${id}`);
    const result = await chrome.storage.local.get(keys);
    
    for (const [key, value] of Object.entries(result)) {
      if (value.connected) {
        const programId = key.replace('reward_connection_', '');
        this.userTokens.set(programId, value.token);
        
        // Refresh balance
        try {
          const balance = await this.fetchRewardBalance(programId);
          this.rewardBalances.set(programId, balance);
        } catch (error) {
          console.error(`Failed to refresh balance for ${programId}:`, error);
        }
      }
    }
  }
}

// Initialize rewards integration
const rewardsHub = new RewardsIntegrationHub();

// Load saved connections on startup
rewardsHub.loadSavedConnections();

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'connectRewardProgram') {
    rewardsHub.connectRewardProgram(request.programId, request.credentials).then(result => {
      sendResponse(result);
    });
    return true;
  }
  
  if (request.action === 'getRewardOpportunities') {
    rewardsHub.getRewardOpportunities(request.purchaseData).then(opportunities => {
      sendResponse({ success: true, opportunities });
    });
    return true;
  }
  
  if (request.action === 'stackRewards') {
    rewardsHub.stackRewards(request.purchaseData, request.programs).then(result => {
      sendResponse({ success: true, result });
    });
    return true;
  }
  
  if (request.action === 'getRewardsBalance') {
    const balances = Object.fromEntries(rewardsHub.rewardBalances);
    sendResponse({ success: true, balances });
  }
});

console.log('🎯 DealPal: Rewards Integration Hub loaded');
