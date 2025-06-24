// Enhanced Credit Card Integration Service
// Provides advanced credit card management and reward optimization

class CreditCardIntegrationService {
  constructor() {
    this.cardNetworks = {
      'visa': { patterns: [/^4/], name: 'Visa' },
      'mastercard': { patterns: [/^5[1-5]/, /^2[2-7]/], name: 'Mastercard' },
      'amex': { patterns: [/^3[47]/], name: 'American Express' },
      'discover': { patterns: [/^6(?:011|5)/], name: 'Discover' },
      'diners': { patterns: [/^3[0689]/], name: 'Diners Club' },
      'jcb': { patterns: [/^35/], name: 'JCB' }
    };
    
    this.cardBenefits = new Map(); // Store card-specific benefits
    this.merchantCategories = new Map(); // Store merchant category codes
  }

  // Detect card network from card number
  detectCardNetwork(cardNumber) {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    for (const [network, data] of Object.entries(this.cardNetworks)) {
      for (const pattern of data.patterns) {
        if (pattern.test(cleanNumber)) {
          return { network, name: data.name };
        }
      }
    }
    
    return { network: 'unknown', name: 'Unknown' };
  }

  // Validate card number using Luhn algorithm
  validateCardNumber(cardNumber) {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  // Enhanced card analysis with benefits detection
  analyzeCard(cardData) {
    const network = this.detectCardNetwork(cardData.number || '');
    const isValid = this.validateCardNumber(cardData.number || '');
    
    // Detect card benefits based on card name and bank
    const benefits = this.detectCardBenefits(cardData);
    
    // Get merchant category bonus categories
    const bonusCategories = this.getBonusCategories(cardData);
    
    return {
      network,
      isValid,
      benefits,
      bonusCategories,
      recommendedUse: this.getRecommendedUse(cardData, benefits),
      securityFeatures: this.getSecurityFeatures(network.network)
    };
  }

  // Detect card benefits based on card name and issuer
  detectCardBenefits(cardData) {
    const cardName = (cardData.cardName || cardData.cardType || '').toLowerCase();
    const bank = (cardData.bank || '').toLowerCase();
    
    const benefits = {
      cashbackRate: cardData.defaultCashbackRate || 1.0,
      bonusCategories: [],
      annualFee: 0,
      signupBonus: null,
      travelBenefits: [],
      protections: [],
      rewardsProgram: null
    };

    // Enhanced pattern matching for popular cards
    const cardPatterns = [
      {
        patterns: ['chase freedom', 'freedom unlimited'],
        benefits: {
          cashbackRate: 1.5,
          bonusCategories: ['rotating', 'drugstore', 'gas'],
          rewardsProgram: 'Chase Ultimate Rewards'
        }
      },
      {
        patterns: ['sapphire preferred', 'sapphire reserve'],
        benefits: {
          cashbackRate: 2.0,
          bonusCategories: ['travel', 'dining'],
          travelBenefits: ['airport_lounge', 'travel_insurance'],
          rewardsProgram: 'Chase Ultimate Rewards'
        }
      },
      {
        patterns: ['discover it', 'discover'],
        benefits: {
          cashbackRate: 1.0,
          bonusCategories: ['rotating'],
          protections: ['price_protection', 'extended_warranty']
        }
      },
      {
        patterns: ['amex gold', 'american express gold'],
        benefits: {
          cashbackRate: 4.0,
          bonusCategories: ['dining', 'groceries'],
          rewardsProgram: 'Membership Rewards'
        }
      },
      {
        patterns: ['amex platinum', 'american express platinum'],
        benefits: {
          cashbackRate: 5.0,
          bonusCategories: ['travel', 'flights'],
          travelBenefits: ['airport_lounge', 'hotel_status', 'uber_credits'],
          rewardsProgram: 'Membership Rewards'
        }
      },
      {
        patterns: ['citi double cash', 'doublecash'],
        benefits: {
          cashbackRate: 2.0,
          bonusCategories: ['all_purchases']
        }
      }
    ];

    // Match card against patterns
    for (const pattern of cardPatterns) {
      if (pattern.patterns.some(p => cardName.includes(p))) {
        Object.assign(benefits, pattern.benefits);
        break;
      }
    }

    return benefits;
  }

  // Get bonus categories for a card
  getBonusCategories(cardData) {
    const benefits = this.detectCardBenefits(cardData);
    
    const categoryMappings = {
      'dining': ['restaurants', 'food delivery', 'coffee shops'],
      'travel': ['airlines', 'hotels', 'rental cars', 'parking'],
      'groceries': ['supermarkets', 'grocery stores'],
      'gas': ['gas stations', 'fuel'],
      'drugstore': ['pharmacies', 'drug stores'],
      'rotating': ['varies quarterly'],
      'all_purchases': ['everything']
    };

    return benefits.bonusCategories.map(category => ({
      category,
      subcategories: categoryMappings[category] || [category],
      rate: this.getCategoryRate(category, benefits.cashbackRate)
    }));
  }

  getCategoryRate(category, baseRate) {
    const multipliers = {
      'dining': 3,
      'travel': 3,
      'groceries': 2,
      'gas': 2,
      'rotating': 5,
      'all_purchases': 1
    };
    
    return baseRate * (multipliers[category] || 1);
  }

  // Get recommended use for this card
  getRecommendedUse(cardData, benefits) {
    const recommendations = [];
    
    if (benefits.bonusCategories.includes('dining')) {
      recommendations.push('Use for restaurant purchases and food delivery');
    }
    
    if (benefits.bonusCategories.includes('travel')) {
      recommendations.push('Best for travel bookings and transportation');
    }
    
    if (benefits.bonusCategories.includes('groceries')) {
      recommendations.push('Optimal for grocery shopping');
    }
    
    if (benefits.bonusCategories.includes('all_purchases')) {
      recommendations.push('Great everyday card for all purchases');
    }
    
    if (benefits.travelBenefits.length > 0) {
      recommendations.push('Excellent travel benefits and protections');
    }

    return recommendations.length > 0 ? recommendations : ['General purpose credit card'];
  }

  // Get security features by network
  getSecurityFeatures(network) {
    const features = {
      'visa': ['Visa Secure', 'Zero Liability', 'Contactless Payments'],
      'mastercard': ['SecureCode', 'Zero Liability', 'Contactless Payments'],
      'amex': ['SafeKey', 'Purchase Protection', 'Extended Warranty'],
      'discover': ['Identity Theft Protection', 'Fraud Alerts', 'Freeze Card']
    };
    
    return features[network] || ['Standard Security Features'];
  }

  // Optimize payment method for a purchase
  optimizePaymentMethod(userCards, purchaseData) {
    const { merchant, amount, category } = purchaseData;
    
    let bestCard = null;
    let maxReward = 0;
    let recommendations = [];

    for (const card of userCards) {
      const benefits = this.detectCardBenefits(card);
      const categoryBonus = this.getCategoryBonus(benefits, category);
      const reward = amount * (categoryBonus / 100);
      
      if (reward > maxReward) {
        maxReward = reward;
        bestCard = card;
      }
      
      recommendations.push({
        card,
        reward,
        rate: categoryBonus,
        reasoning: this.getRewardReasoning(benefits, category)
      });
    }

    // Sort recommendations by reward amount
    recommendations.sort((a, b) => b.reward - a.reward);

    return {
      bestCard,
      maxReward,
      recommendations,
      savings: maxReward - (recommendations[recommendations.length - 1]?.reward || 0)
    };
  }

  getCategoryBonus(benefits, category) {
    const categoryMap = {
      'restaurant': 'dining',
      'food': 'dining',
      'gas_station': 'gas',
      'grocery': 'groceries',
      'travel': 'travel',
      'hotel': 'travel',
      'airline': 'travel'
    };
    
    const mappedCategory = categoryMap[category] || 'all_purchases';
    
    if (benefits.bonusCategories.includes(mappedCategory)) {
      return this.getCategoryRate(mappedCategory, benefits.cashbackRate);
    }
    
    return benefits.cashbackRate;
  }

  getRewardReasoning(benefits, category) {
    const categoryMap = {
      'restaurant': 'dining',
      'food': 'dining',
      'gas_station': 'gas',
      'grocery': 'groceries',
      'travel': 'travel'
    };
    
    const mappedCategory = categoryMap[category];
    
    if (mappedCategory && benefits.bonusCategories.includes(mappedCategory)) {
      return `Bonus rate for ${mappedCategory} category`;
    }
    
    return 'Base reward rate';
  }

  // Track spending by category for insights
  trackSpending(cardId, transaction) {
    const spendingKey = `spending_${cardId}`;
    const spending = JSON.parse(localStorage.getItem(spendingKey) || '{}');
    
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    if (!spending[month]) {
      spending[month] = {};
    }
    
    if (!spending[month][transaction.category]) {
      spending[month][transaction.category] = 0;
    }
    
    spending[month][transaction.category] += transaction.amount;
    
    localStorage.setItem(spendingKey, JSON.stringify(spending));
    
    return this.getSpendingInsights(cardId);
  }

  getSpendingInsights(cardId) {
    const spendingKey = `spending_${cardId}`;
    const spending = JSON.parse(localStorage.getItem(spendingKey) || '{}');
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlySpending = spending[currentMonth] || {};
    
    const totalSpent = Object.values(monthlySpending).reduce((sum, amount) => sum + amount, 0);
    const topCategories = Object.entries(monthlySpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    return {
      totalSpent,
      topCategories,
      categoryBreakdown: monthlySpending
    };
  }

  // Generate card recommendations based on spending patterns
  generateCardRecommendations(spendingPattern) {
    const recommendations = [];
    
    // Analyze top spending categories
    const topCategories = Object.entries(spendingPattern)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    for (const [category, amount] of topCategories) {
      const cardRecs = this.getCardRecommendationsForCategory(category, amount);
      recommendations.push(...cardRecs);
    }
    
    return recommendations;
  }

  getCardRecommendationsForCategory(category, monthlySpend) {
    const recommendations = [];
    
    if (category === 'dining' && monthlySpend > 200) {
      recommendations.push({
        cardType: 'Dining Rewards Card',
        reason: `You spend $${monthlySpend}/month on dining`,
        potentialEarnings: monthlySpend * 0.03 * 12, // 3% back annually
        examples: ['Chase Sapphire Preferred', 'Amex Gold Card']
      });
    }
    
    if (category === 'travel' && monthlySpend > 300) {
      recommendations.push({
        cardType: 'Travel Rewards Card',
        reason: `You spend $${monthlySpend}/month on travel`,
        potentialEarnings: monthlySpend * 0.05 * 12, // 5% back annually
        examples: ['Chase Sapphire Reserve', 'Amex Platinum']
      });
    }
    
    if (category === 'groceries' && monthlySpend > 400) {
      recommendations.push({
        cardType: 'Grocery Rewards Card',
        reason: `You spend $${monthlySpend}/month on groceries`,
        potentialEarnings: monthlySpend * 0.04 * 12, // 4% back annually
        examples: ['Amex Gold Card', 'Blue Cash Preferred']
      });
    }
    
    return recommendations;
  }

  // Secure card data handling
  encryptCardData(cardData) {
    // In a real implementation, use proper encryption
    // This is a placeholder for demonstration
    return {
      ...cardData,
      number: cardData.number ? this.maskCardNumber(cardData.number) : '',
      cvv: '***'
    };
  }

  maskCardNumber(cardNumber) {
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.length < 4) return clean;
    
    const lastFour = clean.slice(-4);
    const masked = '*'.repeat(clean.length - 4) + lastFour;
    
    // Format with spaces
    return masked.replace(/(.{4})/g, '$1 ').trim();
  }

  // Export card data for user
  exportCardData(userCards) {
    const exportData = {
      timestamp: new Date().toISOString(),
      cards: userCards.map(card => ({
        id: card.id,
        bank: card.bank,
        cardType: card.cardType,
        network: this.detectCardNetwork(card.number || '').name,
        benefits: this.detectCardBenefits(card),
        lastUsed: card.lastUsed,
        totalRewards: card.totalRewards || 0
      })),
      recommendations: this.generateCardRecommendations(this.getOverallSpendingPattern(userCards))
    };
    
    return exportData;
  }

  getOverallSpendingPattern(userCards) {
    const pattern = {};
    
    for (const card of userCards) {
      const insights = this.getSpendingInsights(card.id);
      for (const [category, amount] of Object.entries(insights.categoryBreakdown)) {
        pattern[category] = (pattern[category] || 0) + amount;
      }
    }
    
    return pattern;
  }
}

// Initialize and export
const creditCardIntegration = new CreditCardIntegrationService();

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'optimizePayment') {
    const optimization = creditCardIntegration.optimizePaymentMethod(
      request.userCards,
      request.purchaseData
    );
    sendResponse({ success: true, optimization });
  }
  
  if (request.action === 'analyzeCard') {
    const analysis = creditCardIntegration.analyzeCard(request.cardData);
    sendResponse({ success: true, analysis });
  }
  
  if (request.action === 'getCardRecommendations') {
    const recommendations = creditCardIntegration.generateCardRecommendations(
      request.spendingPattern
    );
    sendResponse({ success: true, recommendations });
  }
});

console.log('🎯 DealPal: Enhanced Credit Card Integration loaded');
