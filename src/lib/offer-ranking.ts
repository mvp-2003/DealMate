
import type { Offer, UserCard, RankedOffer, UserPointsState, LoyaltyProgram } from './types';

const MIN_SPEND_FOR_PERK_CONSIDERATION = 100; // Don't consider tiny purchases for big perks

export function calculateRankedOffers(offers: Offer[], userPointsState: UserPointsState): RankedOffer[] {
  const rankedOffers: RankedOffer[] = offers.map(offer => {
    let finalPrice = offer.basePrice;
    let totalDiscountValue = 0;
    let totalCashbackValue = 0;
    let cardBonusValue = 0;
    let potentialPerkValue = 0;
    const rankingExplanation: string[] = [];

    // Apply coupon
    if (offer.couponValue && offer.couponValue > 0) {
      const discountFromCoupon = Math.min(finalPrice, offer.couponValue);
      finalPrice -= discountFromCoupon;
      totalDiscountValue += discountFromCoupon;
      rankingExplanation.push(`₹${discountFromCoupon.toFixed(2)} off with coupon.`);
    }

    // Calculate general cashback
    if (offer.cashbackFlat && offer.cashbackFlat > 0) {
      totalCashbackValue += offer.cashbackFlat;
      rankingExplanation.push(`₹${offer.cashbackFlat.toFixed(2)} flat cashback.`);
    }
    if (offer.cashbackPercentage && offer.cashbackPercentage > 0) {
      const cashbackFromPercentage = (finalPrice * offer.cashbackPercentage) / 100;
      totalCashbackValue += cashbackFromPercentage;
      rankingExplanation.push(`₹${cashbackFromPercentage.toFixed(2)} (${offer.cashbackPercentage}%) cashback.`);
    }
    
    let achievedPerkDescription: string | undefined = undefined;

    // Card-specific bonuses and perk unlocking
    // This is a simplified check; a real system might iterate through all user cards
    // to find the best match or if the offer is generic.
    // For now, let's assume an offer might specify a card type or we check against all user cards.
    
    let bestCardForOffer: UserCard | null = null;
    let maxCardRelatedValue = 0;

    for (const card of userPointsState.cards) {
      let currentCardBonus = 0;
      let currentPotentialPerk = 0;
      const tempExplanations: string[] = [];

      // Check if offer requires a specific card, or if card matches offer's general criteria
      if (!offer.requiredCardType || `${card.bank} ${card.cardType}`.toLowerCase().includes(offer.requiredCardType.toLowerCase())) {
        if (offer.cardSpecificBonusFlat && offer.cardSpecificBonusFlat > 0) {
          currentCardBonus += offer.cardSpecificBonusFlat;
          tempExplanations.push(`₹${offer.cardSpecificBonusFlat.toFixed(2)} extra with ${card.bank} ${card.cardType}.`);
        }
        if (offer.cardSpecificBonusPercentage && offer.cardSpecificBonusPercentage > 0) {
          const bonus = (finalPrice * offer.cardSpecificBonusPercentage) / 100;
          currentCardBonus += bonus;
          tempExplanations.push(`₹${bonus.toFixed(2)} (${offer.cardSpecificBonusPercentage}%) extra with ${card.bank} ${card.cardType}.`);
        }
      }

      // Perk unlocking logic
      if (card.currentPoints !== undefined && card.nextRewardThreshold && card.nextRewardValueInRupees && card.rewardsPerRupeeSpent) {
        const pointsFromThisPurchase = Math.floor(finalPrice * card.rewardsPerRupeeSpent);
        const totalPointsAfterPurchase = card.currentPoints + pointsFromThisPurchase;
        
        if (card.currentPoints < card.nextRewardThreshold && totalPointsAfterPurchase >= card.nextRewardThreshold) {
          // Perk is unlocked by this purchase
          if (finalPrice >= MIN_SPEND_FOR_PERK_CONSIDERATION) { // Only consider perk if purchase is somewhat significant
            currentPotentialPerk = card.nextRewardValueInRupees;
            tempExplanations.push(`Unlocks ₹${card.nextRewardValueInRupees.toFixed(2)} perk on ${card.bank} ${card.cardType}!`);
          }
        }
      }
      
      if (currentCardBonus + currentPotentialPerk > maxCardRelatedValue) {
        maxCardRelatedValue = currentCardBonus + currentPotentialPerk;
        bestCardForOffer = card;
        cardBonusValue = currentCardBonus; // This is the direct bonus for *this* transaction
        potentialPerkValue = currentPotentialPerk; // This is the future value unlocked
        // Clear previous explanations and add new best ones
        rankingExplanation.splice(rankingExplanation.findIndex(e => e.includes("extra with") || e.includes("Unlocks ₹")), rankingExplanation.length);
        rankingExplanation.push(...tempExplanations);
        if (currentPotentialPerk > 0) {
            achievedPerkDescription = `Unlocks ₹${currentPotentialPerk.toFixed(2)} perk on ${card.bank} ${card.cardType}!`;
        }
      }
    }


    // Composite Score: Lower final price is better, higher savings/perks are better.
    // Effective price = finalPrice - totalCashback - cardBonus - potentialPerk
    // Score = basePrice - effectivePrice (higher is better)
    const effectivePrice = finalPrice - totalCashbackValue - cardBonusValue - potentialPerkValue;
    const compositeScore = offer.basePrice - effectivePrice;

    if (totalCashbackValue > 0) {
      rankingExplanation.push(`Net cashback considered: ₹${totalCashbackValue.toFixed(2)}.`);
    }
    if (cardBonusValue > 0 && !rankingExplanation.some(e => e.includes("extra with"))) {
        rankingExplanation.push(`Includes ₹${cardBonusValue.toFixed(2)} card bonus.`);
    }
    if (potentialPerkValue > 0 && !rankingExplanation.some(e => e.includes("Unlocks ₹"))) {
        rankingExplanation.push(`Helps unlock future perk value of ₹${potentialPerkValue.toFixed(2)}.`);
    }
    if (rankingExplanation.length === 0) {
      rankingExplanation.push("Standard price, no extra discounts or perks identified for this item with your current setup.");
    }


    return {
      ...offer,
      finalPrice: finalPrice, // Price after direct coupon, before cashback/bonuses
      totalDiscountValue,
      totalCashbackValue,
      cardBonusValue,
      potentialPerkValue,
      compositeScore,
      rankingExplanation,
      achievedPerkDescription,
    };
  });

  // Sort by composite score (higher is better)
  return rankedOffers.sort((a, b) => b.compositeScore - a.compositeScore);
}
