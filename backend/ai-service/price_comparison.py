"""
Real-Time Price Comparison Service

This service implements comprehensive price comparison across multiple retailers,
factoring in shipping, taxes, and final checkout savings.
"""

import logging
import asyncio
import aiohttp
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import json
import re
from urllib.parse import urlparse, parse_qs
import hashlib

logger = logging.getLogger(__name__)


@dataclass
class PlatformPrice:
    platform: str
    base_price: float
    shipping_cost: float
    tax_amount: float
    total_price: float
    currency: str
    availability: bool
    delivery_time: str
    url: str
    last_updated: datetime
    deals: List[Dict[str, Any]]
    confidence: float = 1.0


@dataclass
class PriceComparisonResult:
    product_name: str
    product_id: str
    comparisons: List[PlatformPrice]
    best_deal: PlatformPrice
    total_savings: float
    average_price: float
    price_range: Tuple[float, float]
    last_updated: datetime
    processing_time: float


class PriceComparisonService:
    """
    Real-time price comparison service across multiple platforms
    """
    
    def __init__(self):
        self.platform_configs = self._load_platform_configs()
        self.cache = {}
        self.cache_duration = timedelta(minutes=10)
        
    def _load_platform_configs(self) -> Dict[str, Dict[str, Any]]:
        """Load platform-specific configuration"""
        return {
            "amazon.in": {
                "name": "Amazon India",
                "base_shipping": 0.0,  # Free shipping for Prime
                "tax_rate": 0.18,  # GST
                "currency": "INR",
                "api_endpoint": None,  # Would use Product Advertising API
                "selectors": {
                    "price": ".a-price-whole, .a-price .a-offscreen",
                    "shipping": ".a-color-secondary",
                    "availability": ".a-size-medium"
                }
            },
            "flipkart.com": {
                "name": "Flipkart",
                "base_shipping": 40.0,
                "tax_rate": 0.18,
                "currency": "INR",
                "api_endpoint": None,
                "selectors": {
                    "price": "._25b18c, ._30jeq3 ._16Jk6d",
                    "shipping": "._2Kn22P",
                    "availability": "._16FRp0"
                }
            },
            "myntra.com": {
                "name": "Myntra",
                "base_shipping": 0.0,  # Free shipping above ₹799
                "tax_rate": 0.18,
                "currency": "INR",
                "api_endpoint": None,
                "selectors": {
                    "price": ".pdp-price",
                    "shipping": ".shipping-info",
                    "availability": ".size-buttons"
                }
            },
            "ebay.in": {
                "name": "eBay India",
                "base_shipping": 50.0,
                "tax_rate": 0.18,
                "currency": "INR",
                "api_endpoint": None,
                "selectors": {
                    "price": ".u-flL",
                    "shipping": ".vi-price .u-flL",
                    "availability": ".qtyTxt"
                }
            },
            "walmart.com": {
                "name": "Walmart",
                "base_shipping": 5.99,
                "tax_rate": 0.08,  # Average US sales tax
                "currency": "USD",
                "api_endpoint": None,
                "selectors": {
                    "price": "[data-automation-id='product-price']",
                    "shipping": ".shipping-info",
                    "availability": ".prod-ProductOffer-oosMsg"
                }
            }
        }
    
    async def compare_prices(
        self, 
        product_name: str,
        product_urls: List[str],
        user_location: Optional[Dict[str, str]] = None
    ) -> PriceComparisonResult:
        """
        Compare prices across multiple platforms
        """
        start_time = datetime.now()
        
        try:
            # Check cache first
            cache_key = self._generate_cache_key(product_name, product_urls)
            if cache_key in self.cache:
                cached_result, cache_time = self.cache[cache_key]
                if datetime.now() - cache_time < self.cache_duration:
                    logger.info(f"💰 Price comparison: Using cached result for {product_name}")
                    return cached_result
            
            # Fetch prices from all platforms
            price_tasks = []
            for url in product_urls:
                platform = self._identify_platform(url)
                if platform:
                    task = self._fetch_platform_price(url, platform, user_location)
                    price_tasks.append(task)
            
            # Execute all price fetching tasks concurrently
            platform_prices = await asyncio.gather(*price_tasks, return_exceptions=True)
            
            # Filter successful results
            valid_prices = []
            for result in platform_prices:
                if isinstance(result, PlatformPrice):
                    valid_prices.append(result)
                elif isinstance(result, Exception):
                    logger.warning(f"Price fetch failed: {result}")
            
            if not valid_prices:
                raise ValueError("No valid prices found")
            
            # Calculate comparison metrics
            result = self._calculate_comparison_result(
                product_name, valid_prices, start_time
            )
            
            # Cache the result
            self.cache[cache_key] = (result, datetime.now())
            
            logger.info(f"💰 Price comparison complete: {len(valid_prices)} platforms compared")
            return result
            
        except Exception as e:
            logger.error(f"❌ Price comparison failed: {e}")
            raise
    
    def _identify_platform(self, url: str) -> Optional[str]:
        """Identify platform from URL"""
        parsed_url = urlparse(url)
        domain = parsed_url.netloc.lower()
        
        for platform_key in self.platform_configs.keys():
            if platform_key in domain:
                return platform_key
                
        return None
    
    async def _fetch_platform_price(
        self, 
        url: str, 
        platform: str,
        user_location: Optional[Dict[str, str]]
    ) -> PlatformPrice:
        """Fetch price from a specific platform"""
        config = self.platform_configs[platform]
        
        try:
            # Use API if available, otherwise scrape
            if config.get("api_endpoint"):
                return await self._fetch_via_api(url, platform, config, user_location)
            else:
                return await self._fetch_via_scraping(url, platform, config, user_location)
                
        except Exception as e:
            logger.error(f"❌ Failed to fetch price from {platform}: {e}")
            raise
    
    async def _fetch_via_api(
        self, 
        url: str, 
        platform: str, 
        config: Dict[str, Any],
        user_location: Optional[Dict[str, str]]
    ) -> PlatformPrice:
        """Fetch price using platform API"""
        # This would implement actual API calls to partner platforms
        # For now, return a mock result
        
        return PlatformPrice(
            platform=config["name"],
            base_price=999.0,
            shipping_cost=config["base_shipping"],
            tax_amount=999.0 * config["tax_rate"],
            total_price=999.0 + config["base_shipping"] + (999.0 * config["tax_rate"]),
            currency=config["currency"],
            availability=True,
            delivery_time="2-3 days",
            url=url,
            last_updated=datetime.now(),
            deals=[],
            confidence=0.9
        )
    
    async def _fetch_via_scraping(
        self, 
        url: str, 
        platform: str, 
        config: Dict[str, Any],
        user_location: Optional[Dict[str, str]]
    ) -> PlatformPrice:
        """Fetch price via web scraping"""
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
        
        async with aiohttp.ClientSession(headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as session:
            try:
                async with session.get(url) as response:
                    if response.status != 200:
                        raise Exception(f"HTTP {response.status}")
                    
                    html_content = await response.text()
                    
                    # Extract price information
                    price_info = self._extract_price_info(html_content, config, platform)
                    
                    # Calculate shipping and taxes
                    shipping_cost = self._calculate_shipping(
                        price_info["base_price"], platform, user_location
                    )
                    tax_amount = self._calculate_tax(
                        price_info["base_price"], platform, user_location
                    )
                    
                    return PlatformPrice(
                        platform=config["name"],
                        base_price=price_info["base_price"],
                        shipping_cost=shipping_cost,
                        tax_amount=tax_amount,
                        total_price=price_info["base_price"] + shipping_cost + tax_amount,
                        currency=config["currency"],
                        availability=price_info["availability"],
                        delivery_time=price_info["delivery_time"],
                        url=url,
                        last_updated=datetime.now(),
                        deals=price_info["deals"],
                        confidence=price_info["confidence"]
                    )
                    
            except Exception as e:
                logger.error(f"❌ Scraping failed for {platform}: {e}")
                raise
    
    def _extract_price_info(
        self, 
        html_content: str, 
        config: Dict[str, Any], 
        platform: str
    ) -> Dict[str, Any]:
        """Extract price information from HTML content"""
        
        # This is a simplified implementation
        # In production, you'd use proper HTML parsing with BeautifulSoup or similar
        
        # Extract price using regex patterns
        price_patterns = [
            r'₹\s*([0-9,]+\.?[0-9]*)',
            r'\$\s*([0-9,]+\.?[0-9]*)',
            r'price["\']:\s*["\']?([0-9,]+\.?[0-9]*)',
            r'amount["\']:\s*["\']?([0-9,]+\.?[0-9]*)'
        ]
        
        base_price = 0.0
        for pattern in price_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            if matches:
                try:
                    price_str = matches[0].replace(',', '')
                    base_price = float(price_str)
                    break
                except ValueError:
                    continue
        
        # Check availability
        availability = True
        out_of_stock_patterns = [
            r'out of stock',
            r'currently unavailable',
            r'sold out',
            r'not available'
        ]
        
        for pattern in out_of_stock_patterns:
            if re.search(pattern, html_content, re.IGNORECASE):
                availability = False
                break
        
        # Extract delivery time
        delivery_time = "3-5 days"  # Default
        delivery_patterns = [
            r'delivery in (\d+-?\d* days?)',
            r'ships in (\d+-?\d* days?)',
            r'arrives (\w+ \d+)'
        ]
        
        for pattern in delivery_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            if matches:
                delivery_time = matches[0]
                break
        
        return {
            "base_price": base_price,
            "availability": availability,
            "delivery_time": delivery_time,
            "deals": [],  # Would extract deals/offers
            "confidence": 0.8 if base_price > 0 else 0.3
        }
    
    def _calculate_shipping(
        self, 
        base_price: float, 
        platform: str, 
        user_location: Optional[Dict[str, str]]
    ) -> float:
        """Calculate shipping cost based on platform and location"""
        config = self.platform_configs[platform]
        base_shipping = config["base_shipping"]
        
        # Apply free shipping thresholds
        if platform == "amazon.in" and base_price >= 499:
            return 0.0
        elif platform == "flipkart.com" and base_price >= 500:
            return 0.0
        elif platform == "myntra.com" and base_price >= 799:
            return 0.0
        
        # International shipping adjustments
        if user_location and user_location.get("country") != "IN" and platform.endswith(".in"):
            base_shipping += 200.0  # International shipping
        
        return base_shipping
    
    def _calculate_tax(
        self, 
        base_price: float, 
        platform: str, 
        user_location: Optional[Dict[str, str]]
    ) -> float:
        """Calculate tax amount based on platform and location"""
        config = self.platform_configs[platform]
        tax_rate = config["tax_rate"]
        
        # Adjust tax rate based on user location
        if user_location:
            country = user_location.get("country", "IN")
            if country == "US":
                tax_rate = 0.08  # Average US sales tax
            elif country == "UK":
                tax_rate = 0.20  # UK VAT
            elif country == "IN":
                tax_rate = 0.18  # GST
        
        return base_price * tax_rate
    
    def _calculate_comparison_result(
        self, 
        product_name: str, 
        platform_prices: List[PlatformPrice],
        start_time: datetime
    ) -> PriceComparisonResult:
        """Calculate final comparison result"""
        
        if not platform_prices:
            raise ValueError("No platform prices available")
        
        # Find best deal (lowest total price)
        best_deal = min(platform_prices, key=lambda p: p.total_price)
        
        # Calculate metrics
        total_prices = [p.total_price for p in platform_prices]
        average_price = sum(total_prices) / len(total_prices)
        price_range = (min(total_prices), max(total_prices))
        
        # Calculate savings compared to highest price
        highest_price = max(total_prices)
        total_savings = highest_price - best_deal.total_price
        
        # Generate product ID
        product_id = hashlib.md5(product_name.encode()).hexdigest()[:8]
        
        return PriceComparisonResult(
            product_name=product_name,
            product_id=product_id,
            comparisons=platform_prices,
            best_deal=best_deal,
            total_savings=total_savings,
            average_price=average_price,
            price_range=price_range,
            last_updated=datetime.now(),
            processing_time=(datetime.now() - start_time).total_seconds()
        )
    
    def _generate_cache_key(self, product_name: str, urls: List[str]) -> str:
        """Generate cache key for price comparison"""
        key_data = f"{product_name}:{':'.join(sorted(urls))}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    async def get_price_history(
        self, 
        product_id: str, 
        platform: str,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get price history for a product (mock implementation)"""
        
        # This would fetch from a database in production
        # For now, return mock historical data
        
        history = []
        base_price = 1000.0
        
        for i in range(days):
            date = datetime.now() - timedelta(days=i)
            # Simulate price fluctuations
            price_variation = (i % 7) * 50 - 100  # Weekly pattern
            price = max(base_price + price_variation, base_price * 0.7)
            
            history.append({
                "date": date.isoformat(),
                "price": round(price, 2),
                "platform": platform,
                "availability": True
            })
        
        return list(reversed(history))
    
    async def predict_price_trend(
        self, 
        product_id: str, 
        historical_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Predict price trend based on historical data"""
        
        if len(historical_data) < 7:
            return {
                "trend": "insufficient_data",
                "confidence": 0.0,
                "recommendation": "Need more historical data for prediction"
            }
        
        # Simple trend analysis
        prices = [float(d["price"]) for d in historical_data[-7:]]
        
        if prices[-1] > prices[0] * 1.05:
            trend = "increasing"
            recommendation = "Consider buying soon as prices are rising"
        elif prices[-1] < prices[0] * 0.95:
            trend = "decreasing"
            recommendation = "Wait for better prices as trend is downward"
        else:
            trend = "stable"
            recommendation = "Prices are stable, buy when convenient"
        
        # Calculate confidence based on data consistency
        price_changes = [abs(prices[i] - prices[i-1]) for i in range(1, len(prices))]
        avg_change = sum(price_changes) / len(price_changes)
        volatility = avg_change / prices[-1]
        confidence = max(0.5, 1.0 - volatility * 2)
        
        return {
            "trend": trend,
            "confidence": round(confidence, 2),
            "recommendation": recommendation,
            "volatility": round(volatility, 3),
            "price_range": {
                "min": min(prices),
                "max": max(prices),
                "current": prices[-1]
            }
        }


# Export the main class
__all__ = ["PriceComparisonService", "PlatformPrice", "PriceComparisonResult"]