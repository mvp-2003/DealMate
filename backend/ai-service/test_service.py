#!/usr/bin/env python3
"""
DealPal Python AI Service Test Script

This script tests the AI service endpoints to ensure they're working correctly.
"""

import asyncio
import json
import aiohttp
import time
from typing import Dict, Any

class AIServiceTester:
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def test_health_check(self) -> Dict[str, Any]:
        """Test the health check endpoint"""
        print("🔍 Testing health check...")
        
        try:
            async with self.session.get(f"{self.base_url}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Health check passed")
                    print(f"   Status: {data.get('status')}")
                    print(f"   Models: {data.get('models_loaded', {})}")
                    return data
                else:
                    print(f"❌ Health check failed: {response.status}")
                    return None
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return None
    
    async def test_product_detection(self) -> Dict[str, Any]:
        """Test product detection endpoint"""
        print("\n🔍 Testing product detection...")
        
        test_data = {
            "url": "https://www.amazon.in/dp/B08N5WRWNW",
            "page_title": "Echo Dot (4th Gen) | Smart speaker with Alexa",
            "text_content": "Echo Dot (4th Gen) Smart speaker with Alexa. Price: ₹4,499. Buy now with free shipping. Add to cart. Great sound quality. 5 star rating.",
            "structured_data": {
                "json_ld": [{
                    "@type": "Product",
                    "name": "Echo Dot (4th Gen)",
                    "offers": {
                        "price": "4499",
                        "priceCurrency": "INR"
                    }
                }]
            },
            "local_ai_result": {
                "confidence": 0.8,
                "isProductPage": True,
                "source": "test"
            }
        }
        
        try:
            start_time = time.time()
            async with self.session.post(
                f"{self.base_url}/detect-product",
                json=test_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                processing_time = time.time() - start_time
                
                if response.status == 200:
                    data = await response.json()
                    print("✅ Product detection passed")
                    print(f"   Is Product Page: {data.get('is_product_page')}")
                    print(f"   Confidence: {data.get('confidence', 0):.3f}")
                    print(f"   Source: {data.get('source')}")
                    print(f"   Processing Time: {processing_time:.3f}s")
                    return data
                else:
                    error_text = await response.text()
                    print(f"❌ Product detection failed: {response.status}")
                    print(f"   Error: {error_text}")
                    return None
        except Exception as e:
            print(f"❌ Product detection error: {e}")
            return None
    
    async def test_sentiment_analysis(self) -> Dict[str, Any]:
        """Test sentiment analysis endpoint"""
        print("\n🔍 Testing sentiment analysis...")
        
        test_data = {
            "reviews": [
                "Great product! Love the sound quality and design. Highly recommended.",
                "Okay product but the price is too high. Could be better.",
                "Excellent value for money. Works perfectly and setup was easy.",
                "Not worth it. Poor quality and bad customer service.",
                "Amazing! Best purchase I've made this year. Five stars!"
            ],
            "product_name": "Echo Dot (4th Gen)"
        }
        
        try:
            start_time = time.time()
            async with self.session.post(
                f"{self.base_url}/analyze-sentiment",
                json=test_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                processing_time = time.time() - start_time
                
                if response.status == 200:
                    data = await response.json()
                    print("✅ Sentiment analysis passed")
                    print(f"   Overall Sentiment: {data.get('overall_sentiment')}")
                    print(f"   Sentiment Score: {data.get('sentiment_score', 0):.3f}")
                    print(f"   Summary: {data.get('review_summary', 'N/A')[:100]}...")
                    print(f"   Processing Time: {processing_time:.3f}s")
                    return data
                else:
                    error_text = await response.text()
                    print(f"❌ Sentiment analysis failed: {response.status}")
                    print(f"   Error: {error_text}")
                    return None
        except Exception as e:
            print(f"❌ Sentiment analysis error: {e}")
            return None
    
    async def test_price_prediction(self) -> Dict[str, Any]:
        """Test price prediction endpoint"""
        print("\n🔍 Testing price prediction...")
        
        test_data = {
            "product_name": "Echo Dot (4th Gen)",
            "current_price": 4499.0,
            "category": "electronics",
            "historical_prices": [
                {"price": 4999.0, "date": "2024-01-01"},
                {"price": 4799.0, "date": "2024-02-01"},
                {"price": 4599.0, "date": "2024-03-01"},
                {"price": 4499.0, "date": "2024-04-01"}
            ]
        }
        
        try:
            start_time = time.time()
            async with self.session.post(
                f"{self.base_url}/predict-price",
                json=test_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                processing_time = time.time() - start_time
                
                if response.status == 200:
                    data = await response.json()
                    print("✅ Price prediction passed")
                    print(f"   Trend: {data.get('predicted_price_trend')}")
                    print(f"   Confidence: {data.get('confidence', 0):.3f}")
                    print(f"   Recommendation: {data.get('recommendation')}")
                    print(f"   Processing Time: {processing_time:.3f}s")
                    
                    forecast = data.get('price_forecast', {})
                    if forecast:
                        print("   Price Forecast:")
                        for period, price in forecast.items():
                            print(f"     {period}: ₹{price:.2f}")
                    
                    return data
                else:
                    error_text = await response.text()
                    print(f"❌ Price prediction failed: {response.status}")
                    print(f"   Error: {error_text}")
                    return None
        except Exception as e:
            print(f"❌ Price prediction error: {e}")
            return None
    
    async def run_all_tests(self):
        """Run all tests"""
        print("🧪 Starting DealPal AI Service Tests")
        print("=" * 50)
        
        results = {}
        
        # Test health check
        results['health'] = await self.test_health_check()
        
        # Only proceed if health check passes
        if results['health']:
            results['product_detection'] = await self.test_product_detection()
            results['sentiment_analysis'] = await self.test_sentiment_analysis()
            results['price_prediction'] = await self.test_price_prediction()
        else:
            print("\n❌ Service not healthy, skipping other tests")
            return results
        
        print("\n" + "=" * 50)
        print("🎯 Test Summary:")
        
        passed = 0
        total = 0
        
        for test_name, result in results.items():
            total += 1
            if result:
                passed += 1
                print(f"   ✅ {test_name.replace('_', ' ').title()}")
            else:
                print(f"   ❌ {test_name.replace('_', ' ').title()}")
        
        print(f"\n📊 Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! AI service is working correctly.")
        else:
            print("⚠️ Some tests failed. Check the service configuration.")
        
        return results

async def main():
    """Main test function"""
    print("🤖 DealPal Python AI Service Tester")
    print("This script will test all AI service endpoints\n")
    
    async with AIServiceTester() as tester:
        await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
