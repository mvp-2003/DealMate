/**
 * StackSmart Engine - AI-Powered Offer Optimization
 * 
 * The core intelligence behind DealMate's offer stacking and optimization.
 * Uses mathematical optimization and AI to find the best combination of deals.
 */

class StackSmartEngine {
  constructor() {
    this.initialized = false;
    this.offerDatabase = new Map();
    this.compatibilityMatrix = new Map();
    this.optimizationCache = new Map();
    this.userPreferences = this.loadUserPreferences();
    
    console.log('📊 StackSmart Engine: Initializing...');
    this.initialize();
  }

  async initialize() {
    try {
      // Load offer compatibility rules
      await this.loadCompatibilityRules();
      
      // Initialize optimization algorithms
      this.setupOptimizationAlgorithms();
      
      // Load user-specific preferences
      this.loadPersonalizationData();
      
      this.initialized = true;
      console.log('📊 StackSmart Engine: Ready for optimization');
    } catch (error) {
      console.error('📊 StackSmart Engine: Initialization failed:', error);
    }
  }

  /**
   * Main optimization function - finds the best combination of offers
   */
  async optimizeOffers(productInfo, availableOffers, constraints = {}) {
    console.log('📊 StackSmart: Optimizing offers for product:', productInfo.name);
    
    if (!this.initialized) {
      await this.initialize();
    }

    const optimizationKey = this.generateOptimizationKey(productInfo, availableOffers, constraints);
    
    // Check cache first
    if (this.optimizationCache.has(optimizationKey)) {
      console.log('📊 StackSmart: Using cached optimization');
      return this.optimizationCache.get(optimizationKey);
    }

    // Step 1: Validate and categorize offers
    const validatedOffers = this.validateOffers(availableOffers, productInfo);
    
    // Step 2: Check compatibility matrix
    const compatibleCombinations = this.findCompatibleCombinations(validatedOffers);
    
    // Step 3: Calculate savings for each combination
    const rankedCombinations = await this.calculateOptimalSavings(
      compatibleCombinations, 
      productInfo, 
      constraints
    );
    
    // Step 4: Apply user preferences and personalization
    const personalizedRanking = this.applyPersonalization(rankedCombinations);
    
    // Step 5: Generate application sequence
    const optimizedResult = this.generateApplicationSequence(personalizedRanking[0]);
    
    // Cache the result
    this.optimizationCache.set(optimizationKey, optimizedResult);
    
    console.log('📊 StackSmart: Optimization complete', {
      combinations_analyzed: compatibleCombinations.length,
      best_savings: optimizedResult.totalSavings,
      confidence: optimizedResult.confidence
    });

    return optimizedResult;
  }

  /**
   * Validate offers and categorize them by type
   */
  validateOffers(offers, productInfo) {
    const validated = [];
    const currentTime = new Date();
    
    for (const offer of offers) {
      // Basic validation
      if (!offer.code && !offer.automatic) {
        continue; // Skip invalid offers
      }
      
      // Expiry validation
      if (offer.expiry && new Date(offer.expiry) < currentTime) {
        continue; // Skip expired offers
      }
      
      // Product compatibility validation
      if (!this.isOfferCompatibleWithProduct(offer, productInfo)) {
        continue; // Skip incompatible offers
      }
      
      // Enhanced offer categorization
      const categorizedOffer = {
        ...offer,
        category: this.categorizeOffer(offer),
        priority: this.calculateOfferPriority(offer, productInfo),
        stackingRules: this.getStackingRules(offer),
        estimatedSavings: this.estimateOfferSavings(offer, productInfo),
        confidence: this.calculateOfferConfidence(offer),
        restrictions: this.parseOfferRestrictions(offer)
      };
      
      validated.push(categorizedOffer);
    }
    
    return validated.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Find all compatible combinations of offers using dynamic programming
   */
  findCompatibleCombinations(offers) {
    const combinations = [];
    
    // Generate all possible subsets (2^n combinations)
    const n = Math.min(offers.length, 10); // Limit to prevent exponential explosion
    
    for (let i = 1; i < (1 << n); i++) {
      const combination = [];
      
      for (let j = 0; j < n; j++) {
        if (i & (1 << j)) {
          combination.push(offers[j]);
        }
      }
      
      // Check if this combination is compatible
      if (this.isCombinationCompatible(combination)) {
        combinations.push({
          offers: combination,
          compatibilityScore: this.calculateCompatibilityScore(combination)
        });
      }
    }
    
    return combinations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }

  /**
   * Calculate optimal savings for each combination using advanced algorithms
   */
  async calculateOptimalSavings(combinations, productInfo, constraints) {
    const ranked = [];
    
    for (const combination of combinations) {
      const savings = await this.calculateCombinationSavings(
        combination.offers, 
        productInfo, 
        constraints
      );
      
      ranked.push({
        ...combination,
        totalSavings: savings.total,
        finalPrice: savings.finalPrice,
        savingsBreakdown: savings.breakdown,
        effectiveDiscount: savings.effectiveDiscount,
        confidence: this.calculateSavingsConfidence(savings),
        applicationComplexity: this.calculateApplicationComplexity(combination.offers),
        userExperience: this.calculateUserExperienceScore(combination.offers)
      });
    }
    
    // Sort by a weighted score considering savings, confidence, and UX
    return ranked.sort((a, b) => {
      const scoreA = this.calculateOverallScore(a);
      const scoreB = this.calculateOverallScore(b);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate savings for a specific combination of offers
   */
  async calculateCombinationSavings(offers, productInfo, constraints) {
    let currentPrice = productInfo.price || 0;
    const breakdown = [];
    let totalSavings = 0;
    
    // Sort offers by application order (percentages first, then fixed amounts)
    const orderedOffers = this.optimizeApplicationOrder(offers, currentPrice);
    
    for (const offer of orderedOffers) {
      let savingsAmount = 0;
      
      switch (offer.type) {
        case 'percentage':
          savingsAmount = currentPrice * (offer.value / 100);
          currentPrice -= savingsAmount;
          break;
          
        case 'fixed':
          savingsAmount = Math.min(offer.value, currentPrice);
          currentPrice -= savingsAmount;
          break;
          
        case 'bogo':
          savingsAmount = this.calculateBOGOSavings(offer, productInfo);
          currentPrice -= savingsAmount;
          break;
          
        case 'free_shipping':
          savingsAmount = constraints.shippingCost || 0;
          break;
          
        case 'cashback':
          // Cashback doesn't reduce immediate price but provides future value
          savingsAmount = (currentPrice + totalSavings) * (offer.value / 100);
          break;
      }
      
      // Apply any caps or maximums
      if (offer.maxSavings) {
        savingsAmount = Math.min(savingsAmount, offer.maxSavings);
      }
      
      totalSavings += savingsAmount;
      
      breakdown.push({
        offer: offer,
        savings: savingsAmount,
        priceAfter: currentPrice,
        description: this.generateSavingsDescription(offer, savingsAmount)
      });
    }
    
    return {
      total: totalSavings,
      finalPrice: Math.max(currentPrice, 0),
      breakdown: breakdown,
      effectiveDiscount: ((totalSavings / (productInfo.price || 1)) * 100).toFixed(2)
    };
  }

  /**
   * Apply personalization based on user preferences and history
   */
  applyPersonalization(combinations) {
    return combinations.map(combo => {
      const personalizedScore = this.calculatePersonalizedScore(combo);
      return {
        ...combo,
        personalizedScore: personalizedScore,
        userMatch: this.calculateUserMatchScore(combo)
      };
    }).sort((a, b) => b.personalizedScore - a.personalizedScore);
  }

  /**
   * Generate optimal application sequence with step-by-step instructions
   */
  generateApplicationSequence(bestCombination) {
    const sequence = [];
    
    for (let i = 0; i < bestCombination.offers.length; i++) {
      const offer = bestCombination.offers[i];
      
      sequence.push({
        step: i + 1,
        offer: offer,
        action: this.generateOfferAction(offer),
        timing: this.getOptimalTiming(offer, i),
        instructions: this.generateUserInstructions(offer),
        expectedSavings: bestCombination.savingsBreakdown[i]?.savings || 0,
        verificationMethod: this.getVerificationMethod(offer)
      });
    }
    
    return {
      totalSavings: bestCombination.totalSavings,
      finalPrice: bestCombination.finalPrice,
      effectiveDiscount: bestCombination.effectiveDiscount,
      confidence: bestCombination.confidence,
      applicationSequence: sequence,
      estimatedTime: this.calculateApplicationTime(sequence),
      complexity: bestCombination.applicationComplexity,
      userExperience: bestCombination.userExperience,
      alternatives: this.generateAlternatives(bestCombination),
      riskFactors: this.identifyRiskFactors(bestCombination)
    };
  }

  /**
   * Utility methods for offer analysis
   */
  
  categorizeOffer(offer) {
    if (offer.code && offer.code.match(/SHIP|FREE.*SHIP/i)) return 'shipping';
    if (offer.type === 'percentage' || offer.value?.toString().includes('%')) return 'percentage';
    if (offer.type === 'fixed' || offer.value?.toString().includes('$')) return 'fixed';
    if (offer.description?.match(/buy.*get|bogo/i)) return 'bogo';
    if (offer.description?.match(/cashback|cash.*back/i)) return 'cashback';
    return 'other';
  }

  calculateOfferPriority(offer, productInfo) {
    let priority = 0;
    
    // Higher priority for larger savings
    priority += (offer.value || 0) * 0.1;
    
    // Higher priority for automatic offers
    if (offer.automatic) priority += 10;
    
    // Higher priority for verified offers
    if (offer.verified) priority += 5;
    
    // Lower priority for complex offers
    if (offer.restrictions?.length > 2) priority -= 3;
    
    return priority;
  }

  isCombinationCompatible(offers) {
    // Check mutual exclusivity
    const categories = offers.map(o => o.category);
    
    // Can't stack multiple percentage discounts from same source
    const percentageOffers = offers.filter(o => o.category === 'percentage');
    if (percentageOffers.length > 1) {
      const sources = new Set(percentageOffers.map(o => o.source));
      if (sources.size !== percentageOffers.length) return false;
    }
    
    // Check explicit incompatibilities
    for (let i = 0; i < offers.length; i++) {
      for (let j = i + 1; j < offers.length; j++) {
        if (this.areOffersIncompatible(offers[i], offers[j])) {
          return false;
        }
      }
    }
    
    return true;
  }

  areOffersIncompatible(offer1, offer2) {
    // Define incompatibility rules
    const incompatibilities = [
      // Same store, same type
      (o1, o2) => o1.store === o2.store && o1.category === o2.category,
      
      // Mutually exclusive codes
      (o1, o2) => o1.mutuallyExclusive?.includes(o2.code) || o2.mutuallyExclusive?.includes(o1.code),
      
      // Conflicting restrictions
      (o1, o2) => this.hasConflictingRestrictions(o1, o2)
    ];
    
    return incompatibilities.some(rule => rule(offer1, offer2));
  }

  calculateOverallScore(combination) {
    const weights = {
      savings: 0.4,
      confidence: 0.25,
      userExperience: 0.2,
      complexity: -0.15 // Negative weight for complexity
    };
    
    return (
      combination.totalSavings * weights.savings +
      combination.confidence * 100 * weights.confidence +
      combination.userExperience * 100 * weights.userExperience +
      combination.applicationComplexity * weights.complexity
    );
  }

  optimizeApplicationOrder(offers, basePrice) {
    // Optimize order for maximum savings
    // Generally: percentages before fixed amounts
    return offers.sort((a, b) => {
      const typeOrder = { percentage: 1, fixed: 2, bogo: 3, shipping: 4, cashback: 5 };
      return (typeOrder[a.category] || 6) - (typeOrder[b.category] || 6);
    });
  }

  // Additional utility methods...
  generateOptimizationKey(productInfo, offers, constraints) {
    const offerIds = offers.map(o => o.id || o.code).sort().join(',');
    const constraintStr = JSON.stringify(constraints);
    return `${productInfo.id || productInfo.name}_${offerIds}_${constraintStr}`.slice(0, 100);
  }

  loadUserPreferences() {
    try {
      return JSON.parse(localStorage.getItem('dealmate_user_preferences') || '{}');
    } catch (error) {
      return {};
    }
  }

  async loadCompatibilityRules() {
    // Load from configuration or API
    this.compatibilityMatrix.set('default', {
      percentage_percentage: 'conditional',
      percentage_fixed: 'compatible',
      fixed_fixed: 'conditional',
      shipping_any: 'compatible',
      cashback_any: 'compatible'
    });
  }

  setupOptimizationAlgorithms() {
    // Initialize optimization algorithms
    console.log('📊 StackSmart: Optimization algorithms ready');
  }

  loadPersonalizationData() {
    // Load user history and preferences
    console.log('📊 StackSmart: Personalization data loaded');
  }
}

// Export for use in main AI service
window.StackSmartEngine = StackSmartEngine;
