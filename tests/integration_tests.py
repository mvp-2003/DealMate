#!/usr/bin/env python3
"""
DealMate AI Enhancement Test Suite - Integration Tests
Simple integration tests for the AI service endpoints
"""

import asyncio
import json
import httpx
import time
from typing import Dict, Any

class DealPalIntegrationTest:
    def __init__(self):
        self.base_url = "http://localhost:8001"
        self.client = httpx.AsyncClient(timeout=30.0)
        self.results = {}

    async def test_health_endpoint(self):
        """Test the health endpoint"""
        try:
            response = await self.client.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "PASSED",
                    "models_loaded": data.get("models_loaded", {}),
                    "features": data.get("features", {})
                }
            else:
                return {"status": "FAILED", "error": f"Status code: {response.status_code}"}
        except Exception as e:
            return {"status": "FAILED", "error": str(e)}

    async def test_product_detection(self):
        """Test product detection endpoint"""
        try:
            test_data = {
                "url": "https://example.com/iphone",
                "page_title": "Apple iPhone 15 Pro - Best Price",
                "text_content": "Apple iPhone 15 Pro smartphone with advanced camera system. Price: $999.99",
                "html_content": "<div class='product'><h1>Apple iPhone 15 Pro</h1><span class='price'>$999.99</span></div>"
            }
            response = await self.client.post(f"{self.base_url}/detect-product", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "PASSED",
                    "detected": data.get("is_product_page", False),
                    "confidence": data.get("confidence", 0),
                    "source": data.get("source", "")
                }
            else:
                return {"status": "FAILED", "error": f"Status code: {response.status_code}"}
        except Exception as e:
            return {"status": "FAILED", "error": str(e)}

    async def test_sentiment_analysis(self):
        """Test sentiment analysis endpoint"""
        try:
            test_data = {
                "reviews": ["This product is absolutely amazing! Best purchase I've ever made.", "Great quality and fast shipping."],
                "product_name": "iPhone 15 Pro"
            }
            response = await self.client.post(f"{self.base_url}/analyze-sentiment", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "PASSED",
                    "sentiment": data.get("overall_sentiment", ""),
                    "score": data.get("sentiment_score", 0),
                    "summary": data.get("review_summary", "")
                }
            else:
                return {"status": "FAILED", "error": f"Status code: {response.status_code}"}
        except Exception as e:
            return {"status": "FAILED", "error": str(e)}

    async def test_enhancement_endpoint(self):
        """Test the enhancement endpoint"""
        try:
            test_data = {
                "product_data": {
                    "name": "iPhone 15 Pro",
                    "price": 999.99,
                    "category": "electronics"
                },
                "context": {
                    "page_url": "https://example.com",
                    "html_snippet": "<div>Product page</div>"
                }
            }
            response = await self.client.post(f"{self.base_url}/analyze/enhance", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "PASSED",
                    "enhanced": True,
                    "confidence": data.get("confidence", 0)
                }
            else:
                return {"status": "FAILED", "error": f"Status code: {response.status_code}"}
        except Exception as e:
            return {"status": "FAILED", "error": str(e)}

    async def test_stacksmart_endpoint(self):
        """Test the StackSmart optimization endpoint"""
        try:
            test_data = {
                "offers": [
                    {"type": "percentage", "value": 10, "min_spend": 50},
                    {"type": "cashback", "value": 5, "max_cashback": 25}
                ],
                "cart_total": 100.0,
                "product_categories": ["electronics"]
            }
            response = await self.client.post(f"{self.base_url}/analyze/stacksmart", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "PASSED",
                    "optimization": data.get("optimization", {}),
                    "savings": data.get("total_savings", 0)
                }
            else:
                return {"status": "FAILED", "error": f"Status code: {response.status_code}"}
        except Exception as e:
            return {"status": "FAILED", "error": str(e)}

    async def test_price_intelligence(self):
        """Test the price intelligence endpoint"""
        try:
            test_data = {
                "product": {
                    "name": "iPhone 15 Pro",
                    "current_price": 999.99,
                    "category": "electronics"
                },
                "market_data": {
                    "competitors": [1099.99, 989.99, 1049.99],
                    "historical_prices": [999.99, 1099.99, 999.99]
                }
            }
            response = await self.client.post(f"{self.base_url}/analyze/price-intelligence", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "PASSED",
                    "analysis": data.get("analysis", {}),
                    "prediction": data.get("prediction", {})
                }
            else:
                return {"status": "FAILED", "error": f"Status code: {response.status_code}"}
        except Exception as e:
            return {"status": "FAILED", "error": str(e)}

    async def test_deal_quality(self):
        """Test the deal quality analysis endpoint"""
        try:
            test_data = {
                "deal": {
                    "product_name": "iPhone 15 Pro",
                    "original_price": 1099.99,
                    "sale_price": 999.99,
                    "discount_percentage": 9.1
                },
                "context": {
                    "store_reputation": 4.5,
                    "deal_urgency": "limited_time"
                }
            }
            response = await self.client.post(f"{self.base_url}/analyze/deal-quality", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "PASSED",
                    "quality_score": data.get("quality_score", 0),
                    "analysis": data.get("analysis", {})
                }
            else:
                return {"status": "FAILED", "error": f"Status code: {response.status_code}"}
        except Exception as e:
            return {"status": "FAILED", "error": str(e)}

    async def run_all_tests(self):
        """Run all integration tests"""
        print("🧪 DealMate AI Service Integration Tests")
        print("=" * 50)
        
        tests = [
            ("Health Check", self.test_health_endpoint),
            ("Product Detection", self.test_product_detection),
            ("Sentiment Analysis", self.test_sentiment_analysis),
            ("Enhancement Analysis", self.test_enhancement_endpoint),
            ("StackSmart Optimization", self.test_stacksmart_endpoint),
            ("Price Intelligence", self.test_price_intelligence),
            ("Deal Quality Analysis", self.test_deal_quality)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🔍 Testing {test_name}...")
            start_time = time.time()
            
            try:
                result = await test_func()
                elapsed = time.time() - start_time
                
                if result["status"] == "PASSED":
                    print(f"✅ {test_name} PASSED ({elapsed:.2f}s)")
                    passed += 1
                else:
                    print(f"❌ {test_name} FAILED: {result.get('error', 'Unknown error')}")
                
                self.results[test_name.lower().replace(" ", "_")] = result
                    
            except Exception as e:
                print(f"❌ {test_name} FAILED: {str(e)}")
                self.results[test_name.lower().replace(" ", "_")] = {"status": "FAILED", "error": str(e)}
        
        await self.client.aclose()
        
        # Summary
        print("\n" + "=" * 50)
        print(f"📊 TEST SUMMARY")
        print("=" * 50)
        print(f"✅ Passed: {passed}/{total} ({(passed/total)*100:.1f}%)")
        print(f"❌ Failed: {total-passed}/{total}")
        
        if passed == total:
            print("\n🎉 All tests passed! AI service is fully functional.")
        elif passed > 0:
            print(f"\n⚠️  Partial success. {passed} tests passed.")
        else:
            print("\n💥 All tests failed. Check service configuration.")
        
        # Save detailed results
        with open("integration_test_results.json", "w") as f:
            json.dump({
                "summary": {"passed": passed, "total": total, "success_rate": (passed/total)*100},
                "details": self.results,
                "timestamp": time.time()
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to integration_test_results.json")
        
        return passed == total

async def main():
    """Main test runner"""
    tester = DealPalIntegrationTest()
    success = await tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    import sys
    sys.exit(asyncio.run(main()))
