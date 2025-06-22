"""
StackSmart Engine - Intelligent Offer Stacking Service

This service implements the core StackSmart algorithm that identifies and combines
stackable offers from various sources to create the most optimized deal for users.
"""

import logging
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import json
from datetime import datetime, timedelta
import re

logger = logging.getLogger(__name__)


class DealType(Enum):
    COUPON = "coupon"
    CASHBACK = "cashback"
    DISCOUNT = "discount"
    CARD_OFFER = "card_offer"
    WALLET_OFFER = "wallet_offer"
    MEMBERSHIP = "membership"
    REFERRAL = "referral"
    BUNDLE = "bundle"


class CompatibilityRule(Enum):
    STACKABLE = "stackable"
    EXCLUSIVE = "exclusive"
    CONDITIONAL = "conditional"


@dataclass
class Deal:
    id: str
    title: str
    description: str
    deal_type: DealType
    value: float
    value_type: str  # 'percentage', 'fixed', 'points'
    code: Optional[str] = None
    min_purchase: Optional[float] = None
    max_discount: Optional[float] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    platform: str = ""
    confidence: float = 1.0
    stackable: bool = True
    terms: List[str] = None
    priority: int = 0
    
    def __post_init__(self):
        if self.terms is None:
            self.terms = []


@dataclass
class StackedDealResult:
    deals: List[Deal]
    total_savings: float
    final_price: float
    original_price: float
    confidence: float
    application_order: List[str]
    warnings: List[str]
    processing_time: float


class StackSmartEngine:
    """
    Intelligent offer stacking engine that optimizes deal combinations
    """
    
    def __init__(self):
        self.compatibility_matrix = self._build_compatibility_matrix()
        self.optimization_rules = self._build_optimization_rules()
        
    def _build_compatibility_matrix(self) -> Dict[Tuple[DealType, DealType], CompatibilityRule]:
        """Build compatibility matrix for different deal types"""
        matrix = {}
        
        # Define stackable combinations
        stackable_pairs = [
            (DealType.COUPON, DealType.CASHBACK),
            (DealType.COUPON, DealType.CARD_OFFER),
            (DealType.COUPON, DealType.WALLET_OFFER),
            (DealType.DISCOUNT, DealType.CASHBACK),
            (DealType.DISCOUNT, DealType.CARD_OFFER),
            (DealType.CASHBACK, DealType.CARD_OFFER),
            (DealType.CASHBACK, DealType.WALLET_OFFER),
            (DealType.MEMBERSHIP, DealType.COUPON),
            (DealType.MEMBERSHIP, DealType.CASHBACK),
            (DealType.REFERRAL, DealType.COUPON),
        ]
        
        # Define exclusive combinations (cannot be stacked)
        exclusive_pairs = [
            (DealType.COUPON, DealType.COUPON),
            (DealType.DISCOUNT, DealType.DISCOUNT),
            (DealType.BUNDLE, DealType.COUPON),
            (DealType.BUNDLE, DealType.DISCOUNT),
        ]
        
        # Populate matrix
        for pair in stackable_pairs:
            matrix[pair] = CompatibilityRule.STACKABLE
            matrix[(pair[1], pair[0])] = CompatibilityRule.STACKABLE
            
        for pair in exclusive_pairs:
            matrix[pair] = CompatibilityRule.EXCLUSIVE
            matrix[(pair[1], pair[0])] = CompatibilityRule.EXCLUSIVE
            
        return matrix
    
    def _build_optimization_rules(self) -> Dict[str, Any]:
        """Build optimization rules for deal application order"""
        return {
            "priority_order": [
                DealType.MEMBERSHIP,  # Apply membership discounts first
                DealType.BUNDLE,      # Bundle deals next
                DealType.DISCOUNT,    # Store discounts
                DealType.COUPON,      # Coupon codes
                DealType.CARD_OFFER,  # Card-linked offers
                DealType.CASHBACK,    # Cashback last (usually on final amount)
                DealType.WALLET_OFFER,
                DealType.REFERRAL,
            ],
            "max_stack_size": 5,
            "min_confidence_threshold": 0.6,
        }
    
    async def optimize_deals(
        self, 
        available_deals: List[Dict[str, Any]], 
        base_price: float,
        user_context: Optional[Dict[str, Any]] = None
    ) -> StackedDealResult:
        """
        Main optimization function that finds the best deal combination
        """
        start_time = datetime.now()
        
        try:
            # Convert input deals to Deal objects
            deals = self._parse_deals(available_deals)
            
            # Filter valid deals
            valid_deals = self._filter_valid_deals(deals, base_price, user_context)
            
            # Generate all possible combinations
            combinations = self._generate_combinations(valid_deals)
            
            # Evaluate each combination
            best_combination = await self._evaluate_combinations(
                combinations, base_price, user_context
            )
            
            # Calculate final result
            result = self._calculate_final_result(
                best_combination, base_price, start_time
            )
            
            logger.info(f"StackSmart: Optimized {len(available_deals)} deals into {len(result.deals)} stacked deals")
            return result
            
        except Exception as e:
            logger.error(f"StackSmart optimization failed: {e}")
            # Return fallback result
            return StackedDealResult(
                deals=[],
                total_savings=0.0,
                final_price=base_price,
                original_price=base_price,
                confidence=0.0,
                application_order=[],
                warnings=[f"Optimization failed: {str(e)}"],
                processing_time=(datetime.now() - start_time).total_seconds()
            )
    
    def _parse_deals(self, deal_data: List[Dict[str, Any]]) -> List[Deal]:
        """Parse input deal data into Deal objects"""
        deals = []
        
        for data in deal_data:
            try:
                deal = Deal(
                    id=data.get('id', f"deal_{len(deals)}"),
                    title=data.get('title', ''),
                    description=data.get('description', ''),
                    deal_type=DealType(data.get('deal_type', 'coupon')),
                    value=float(data.get('value', 0)),
                    value_type=data.get('value_type', 'percentage'),
                    code=data.get('code'),
                    min_purchase=data.get('min_purchase'),
                    max_discount=data.get('max_discount'),
                    platform=data.get('platform', ''),
                    confidence=float(data.get('confidence', 1.0)),
                    stackable=data.get('stackable', True),
                    terms=data.get('terms', []),
                    priority=data.get('priority', 0)
                )
                deals.append(deal)
            except Exception as e:
                logger.warning(f"Failed to parse deal: {data}, error: {e}")
                
        return deals
    
    def _filter_valid_deals(
        self, 
        deals: List[Deal], 
        base_price: float,
        user_context: Optional[Dict[str, Any]]
    ) -> List[Deal]:
        """Filter deals based on validity and user context"""
        valid_deals = []
        
        for deal in deals:
            # Check minimum purchase requirement
            if deal.min_purchase and base_price < deal.min_purchase:
                continue
                
            # Check confidence threshold
            if deal.confidence < self.optimization_rules["min_confidence_threshold"]:
                continue
                
            # Check if deal is stackable
            if not deal.stackable and len(valid_deals) > 0:
                continue
                
            # Check user context (e.g., card availability, membership status)
            if not self._check_user_eligibility(deal, user_context):
                continue
                
            valid_deals.append(deal)
            
        return valid_deals
    
    def _check_user_eligibility(
        self, 
        deal: Deal, 
        user_context: Optional[Dict[str, Any]]
    ) -> bool:
        """Check if user is eligible for the deal"""
        if not user_context:
            return True
            
        # Check card-specific offers
        if deal.deal_type == DealType.CARD_OFFER:
            user_cards = user_context.get('cards', [])
            required_card = deal.terms and any('card' in term.lower() for term in deal.terms)
            if required_card and not user_cards:
                return False
                
        # Check membership requirements
        if deal.deal_type == DealType.MEMBERSHIP:
            memberships = user_context.get('memberships', [])
            if not memberships:
                return False
                
        return True
    
    def _generate_combinations(self, deals: List[Deal]) -> List[List[Deal]]:
        """Generate all valid deal combinations"""
        combinations = []
        max_size = min(len(deals), self.optimization_rules["max_stack_size"])
        
        # Single deals
        for deal in deals:
            combinations.append([deal])
            
        # Combinations of 2 or more
        for size in range(2, max_size + 1):
            combinations.extend(self._get_combinations_of_size(deals, size))
            
        return combinations
    
    def _get_combinations_of_size(self, deals: List[Deal], size: int) -> List[List[Deal]]:
        """Get all valid combinations of specific size"""
        from itertools import combinations
        
        valid_combinations = []
        
        for combo in combinations(deals, size):
            if self._is_valid_combination(list(combo)):
                valid_combinations.append(list(combo))
                
        return valid_combinations
    
    def _is_valid_combination(self, deals: List[Deal]) -> bool:
        """Check if a combination of deals is valid (stackable)"""
        for i, deal1 in enumerate(deals):
            for j, deal2 in enumerate(deals[i+1:], i+1):
                compatibility = self.compatibility_matrix.get(
                    (deal1.deal_type, deal2.deal_type),
                    CompatibilityRule.CONDITIONAL
                )
                
                if compatibility == CompatibilityRule.EXCLUSIVE:
                    return False
                    
        return True
    
    async def _evaluate_combinations(
        self, 
        combinations: List[List[Deal]], 
        base_price: float,
        user_context: Optional[Dict[str, Any]]
    ) -> List[Deal]:
        """Evaluate all combinations and return the best one"""
        best_combination = []
        best_savings = 0.0
        best_score = 0.0
        
        for combination in combinations:
            try:
                # Calculate savings for this combination
                savings, final_price = self._calculate_combination_savings(
                    combination, base_price
                )
                
                # Calculate confidence score
                confidence = self._calculate_combination_confidence(combination)
                
                # Calculate overall score (savings weighted by confidence)
                score = savings * confidence
                
                # Consider user preferences
                if user_context:
                    preference_bonus = self._calculate_preference_bonus(
                        combination, user_context
                    )
                    score += preference_bonus
                
                if score > best_score:
                    best_score = score
                    best_savings = savings
                    best_combination = combination
                    
            except Exception as e:
                logger.warning(f"Failed to evaluate combination: {e}")
                
        return best_combination
    
    def _calculate_combination_savings(
        self, 
        deals: List[Deal], 
        base_price: float
    ) -> Tuple[float, float]:
        """Calculate total savings and final price for a deal combination"""
        current_price = base_price
        total_savings = 0.0
        
        # Sort deals by application priority
        sorted_deals = sorted(
            deals, 
            key=lambda d: self.optimization_rules["priority_order"].index(d.deal_type)
        )
        
        for deal in sorted_deals:
            if deal.value_type == 'percentage':
                discount = min(
                    current_price * (deal.value / 100),
                    deal.max_discount or float('inf')
                )
            elif deal.value_type == 'fixed':
                discount = min(deal.value, current_price)
            else:  # points or other
                discount = deal.value  # Simplified for now
                
            current_price -= discount
            total_savings += discount
            
        return total_savings, current_price
    
    def _calculate_combination_confidence(self, deals: List[Deal]) -> float:
        """Calculate overall confidence for a deal combination"""
        if not deals:
            return 0.0
            
        # Average confidence with penalty for larger combinations
        avg_confidence = sum(deal.confidence for deal in deals) / len(deals)
        size_penalty = 0.95 ** (len(deals) - 1)  # Slight penalty for complexity
        
        return avg_confidence * size_penalty
    
    def _calculate_preference_bonus(
        self, 
        deals: List[Deal], 
        user_context: Dict[str, Any]
    ) -> float:
        """Calculate bonus score based on user preferences"""
        bonus = 0.0
        
        # Prefer certain deal types based on user history
        preferred_types = user_context.get('preferred_deal_types', [])
        for deal in deals:
            if deal.deal_type.value in preferred_types:
                bonus += 5.0
                
        # Prefer deals from frequently used platforms
        preferred_platforms = user_context.get('preferred_platforms', [])
        for deal in deals:
            if deal.platform in preferred_platforms:
                bonus += 2.0
                
        return bonus
    
    def _calculate_final_result(
        self, 
        best_combination: List[Deal], 
        base_price: float,
        start_time: datetime
    ) -> StackedDealResult:
        """Calculate and format the final optimization result"""
        if not best_combination:
            return StackedDealResult(
                deals=[],
                total_savings=0.0,
                final_price=base_price,
                original_price=base_price,
                confidence=0.0,
                application_order=[],
                warnings=["No valid deal combinations found"],
                processing_time=(datetime.now() - start_time).total_seconds()
            )
        
        # Calculate final savings and price
        total_savings, final_price = self._calculate_combination_savings(
            best_combination, base_price
        )
        
        # Calculate overall confidence
        confidence = self._calculate_combination_confidence(best_combination)
        
        # Generate application order
        sorted_deals = sorted(
            best_combination,
            key=lambda d: self.optimization_rules["priority_order"].index(d.deal_type)
        )
        application_order = [f"{deal.deal_type.value}: {deal.title}" for deal in sorted_deals]
        
        # Generate warnings
        warnings = []
        if len(best_combination) > 3:
            warnings.append("Complex deal stack - verify all terms apply")
        if confidence < 0.8:
            warnings.append("Some deals have lower confidence - double-check availability")
            
        return StackedDealResult(
            deals=best_combination,
            total_savings=total_savings,
            final_price=final_price,
            original_price=base_price,
            confidence=confidence,
            application_order=application_order,
            warnings=warnings,
            processing_time=(datetime.now() - start_time).total_seconds()
        )
    
    async def validate_deal_stack(
        self, 
        deals: List[Dict[str, Any]], 
        base_price: float
    ) -> Dict[str, Any]:
        """Validate if a specific deal stack is valid and calculate savings"""
        try:
            parsed_deals = self._parse_deals(deals)
            
            if not self._is_valid_combination(parsed_deals):
                return {
                    "valid": False,
                    "error": "Deal combination is not stackable",
                    "suggestions": []
                }
            
            savings, final_price = self._calculate_combination_savings(parsed_deals, base_price)
            confidence = self._calculate_combination_confidence(parsed_deals)
            
            return {
                "valid": True,
                "total_savings": savings,
                "final_price": final_price,
                "confidence": confidence,
                "warnings": self._generate_stack_warnings(parsed_deals)
            }
            
        except Exception as e:
            return {
                "valid": False,
                "error": f"Validation failed: {str(e)}",
                "suggestions": []
            }
    
    def _generate_stack_warnings(self, deals: List[Deal]) -> List[str]:
        """Generate warnings for a deal stack"""
        warnings = []
        
        # Check for expiring deals
        now = datetime.now()
        for deal in deals:
            if deal.valid_until and deal.valid_until < now + timedelta(days=1):
                warnings.append(f"Deal '{deal.title}' expires soon")
                
        # Check for minimum purchase requirements
        total_min_purchase = sum(
            deal.min_purchase or 0 for deal in deals if deal.min_purchase
        )
        if total_min_purchase > 0:
            warnings.append(f"Minimum purchase requirement: ₹{total_min_purchase}")
            
        return warnings


# Export the main class
__all__ = ["StackSmartEngine", "Deal", "DealType", "StackedDealResult"]