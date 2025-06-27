#!/usr/bin/env python3
"""
DealPal AI Enhancement Test Suite

Comprehensive testing of the enhanced AI features including:
- Gemini integration
- StackSmart offer optimization
- Price intelligence
- Multi-modal analysis
- Advanced sentiment analysis
"""

import asyncio
import json
import time
import sys
import httpx
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from AI service
env_path = Path(__file__).parent / "backend" / "ai-service" / ".env"
load_dotenv(env_path)

# Add the ai-service directory to path
sys.path.append(str(Path(__file__).parent / "backend" / "ai-service"))

from models import GeminiAIManager, initialize_models, get_model_manager
from services import ProductAnalysisService
from config import settings

class DealPalAITestSuite:
    def __init__(self):
        self.test_results = {}
        self.model_manager = None
        self.analysis_service = None
    
    async def setup(self):
        """Initialize AI services for testing"""
        print("🧪 Setting up DealPal AI Test Suite...")
        
        try:
            await initialize_models()
            self.model_manager = get_model_manager()
            self.analysis_service = ProductAnalysisService()
            
            print("✅ AI services initialized")
            return True
        except Exception as e:
            print(f"❌ Setup failed: {e}")
            return False
    
    async def run_all_tests(self):
        """Run comprehensive test suite"""
        print("\n🚀 Starting comprehensive AI tests...\n")
        
        # Test 1: Basic Gemini connectivity
        await self.test_gemini_connectivity()
        
        # Test 2: Advanced sentiment analysis
        await self.test_advanced_sentiment_analysis()
        
        # Test 3: Text classification
        await self.test_advanced_text_classification()
        
        # Test 4: Image analysis (if available)
        await self.test_image_analysis()
        
        # Test 5: Deal quality analysis
        await self.test_deal_quality_analysis()
        
        # Test 6: Product analysis enhancement
        await self.test_product_analysis_enhancement()
        
        # Test 7: API endpoints
        await self.test_api_endpoints()
        
        # Test 8: Performance benchmarks
        await self.test_performance_benchmarks()
        
        # Generate report
        self.generate_test_report()
    
    async def test_gemini_connectivity(self):
        """Test basic Gemini AI connectivity"""
        print("🔗 Testing Gemini AI connectivity...")
        
        try:
            if not self.model_manager.is_model_available("gemini"):
                self.test_results["gemini_connectivity"] = {
                    "status": "FAILED",
                    "error": "Gemini model not available"
                }
                print("❌ Gemini model not available")
                return
            
            # Simple test call
            messages = [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Respond with a simple JSON: {\"status\": \"working\", \"message\": \"Gemini is operational\"}"}
            ]
            
            start_time = time.time()
            response = await self.model_manager.call_gemini(messages, response_format="json")
            end_time = time.time()
            
            if response["success"]:
                self.test_results["gemini_connectivity"] = {
                    "status": "PASSED",
                    "response_time": f"{(end_time - start_time):.2f}s",
                    "model": response.get("model", "gemini"),
                    "tokens_used": response.get("tokens_used", 0)
                }
                print(f"✅ Gemini connectivity test passed ({(end_time - start_time):.2f}s)")
            else:
                self.test_results["gemini_connectivity"] = {
                    "status": "FAILED", 
                    "error": response.get("error", "Unknown error")
                }
                print(f"❌ Gemini connectivity test failed: {response.get('error')}")
        
        except Exception as e:
            self.test_results["gemini_connectivity"] = {
                "status": "FAILED",
                "error": str(e)
            }
            print(f"❌ Gemini connectivity test failed: {e}")
    
    async def test_advanced_sentiment_analysis(self):
        """Test enhanced sentiment analysis capabilities"""
        print("\n🎭 Testing advanced sentiment analysis...")
        
        test_reviews = [
            "This product is absolutely amazing! Best purchase I've made this year.",
            "Terrible quality, broke after one day. Complete waste of money.",
            "It's okay, does what it's supposed to do. Nothing special but works.",
            "Love the design but the price is too high for what you get.",
            "Fast shipping and great customer service, would buy again!"
        ]
        
        try:
            start_time = time.time()
            results = await self.model_manager.analyze_sentiment_advanced(test_reviews)
            end_time = time.time()
            
            if results and len(results) > 0:
                # Analyze results quality
                has_detailed_analysis = all(
                    'emotional_indicators' in result and 'key_phrases' in result 
                    for result in results
                )
                
                sentiment_distribution = {}
                for result in results:
                    sentiment = result.get('sentiment', 'UNKNOWN')
                    sentiment_distribution[sentiment] = sentiment_distribution.get(sentiment, 0) + 1
                
                self.test_results["advanced_sentiment_analysis"] = {
                    "status": "PASSED",
                    "reviews_processed": len(results),
                    "processing_time": f"{(end_time - start_time):.2f}s",
                    "has_detailed_analysis": has_detailed_analysis,
                    "sentiment_distribution": sentiment_distribution,
                    "sample_result": results[0] if results else None
                }
                print(f"✅ Advanced sentiment analysis passed - {len(results)} reviews processed")
            else:
                self.test_results["advanced_sentiment_analysis"] = {
                    "status": "FAILED",
                    "error": "No results returned"
                }
                print("❌ Advanced sentiment analysis failed - no results")
        
        except Exception as e:
            self.test_results["advanced_sentiment_analysis"] = {
                "status": "FAILED",
                "error": str(e)
            }
            print(f"❌ Advanced sentiment analysis failed: {e}")
    
    async def test_advanced_text_classification(self):
        """Test enhanced text classification"""
        print("\n📋 Testing advanced text classification...")
        
        test_content = """
        iPhone 14 Pro Max - 256GB Space Black
        $1,099.99 $1,199.99 (Save $100)
        Add to Cart
        Free shipping on orders over $35
        4.5 stars (2,847 reviews)
        Product Description: The iPhone 14 Pro Max features the A16 Bionic chip...
        """
        
        try:
            start_time = time.time()
            result = await self.model_manager.classify_text_advanced(
                test_content, 
                context="product_analysis"
            )
            end_time = time.time()
            
            if result and 'primary_category' in result:
                expected_keys = ['confidence', 'category_scores', 'reasoning', 'key_indicators']
                has_all_keys = all(key in result for key in expected_keys)
                
                self.test_results["advanced_text_classification"] = {
                    "status": "PASSED",
                    "processing_time": f"{(end_time - start_time):.2f}s",
                    "primary_category": result.get('primary_category'),
                    "confidence": result.get('confidence'),
                    "has_all_expected_keys": has_all_keys,
                    "certainty_level": result.get('certainty_level')
                }
                print(f"✅ Text classification passed - Category: {result.get('primary_category')} (confidence: {result.get('confidence', 0):.2f})")
            else:
                self.test_results["advanced_text_classification"] = {
                    "status": "FAILED",
                    "error": "Invalid result format"
                }
                print("❌ Text classification failed - invalid result")
        
        except Exception as e:
            self.test_results["advanced_text_classification"] = {
                "status": "FAILED",
                "error": str(e)
            }
            print(f"❌ Text classification failed: {e}")
    
    async def test_image_analysis(self):
        """Test image analysis capabilities"""
        print("\n🖼️ Testing image analysis...")
        
        # Test with a sample base64 image (placeholder)
        sample_image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        
        try:
            start_time = time.time()
            result = await self.model_manager.analyze_image_advanced(
                sample_image,
                analysis_type="product_detection"
            )
            end_time = time.time()
            
            if result and 'is_product_image' in result:
                expected_keys = ['confidence', 'detected_items', 'quality_assessment', 'analysis_type']
                has_all_keys = all(key in result for key in expected_keys)
                
                self.test_results["image_analysis"] = {
                    "status": "PASSED",
                    "processing_time": f"{(end_time - start_time):.2f}s",
                    "is_product_image": result.get('is_product_image'),
                    "confidence": result.get('confidence'),
                    "has_all_expected_keys": has_all_keys,
                    "analysis_type": result.get('analysis_type')
                }
                print(f"✅ Image analysis passed - Product detected: {result.get('is_product_image')} (confidence: {result.get('confidence', 0):.2f})")
            else:
                self.test_results["image_analysis"] = {
                    "status": "FAILED", 
                    "error": "Invalid result format"
                }
                print("❌ Image analysis failed - invalid result")
        
        except Exception as e:
            self.test_results["image_analysis"] = {
                "status": "FAILED",
                "error": str(e)
            }
            print(f"❌ Image analysis failed: {e}")
    
    async def test_deal_quality_analysis(self):
        """Test deal quality and authenticity analysis"""
        print("\n💰 Testing deal quality analysis...")
        
        test_deal = {
            "product_name": "iPhone 14 Pro Max",
            "original_price": "$1,199.99",
            "sale_price": "$1,099.99",
            "discount_percentage": "8%",
            "store_name": "TechStore",
            "description": "Limited time offer - Save $100 on iPhone 14 Pro Max!"
        }
        
        try:
            start_time = time.time()
            result = await self.model_manager.analyze_deal_quality(test_deal)
            end_time = time.time()
            
            if result and 'overall_score' in result:
                expected_keys = ['authenticity', 'value_assessment', 'trust_indicators', 'recommendation']
                has_all_keys = all(key in result for key in expected_keys)
                
                self.test_results["deal_quality_analysis"] = {
                    "status": "PASSED",
                    "processing_time": f"{(end_time - start_time):.2f}s",
                    "overall_score": result.get('overall_score'),
                    "recommendation": result.get('recommendation'),
                    "has_all_expected_keys": has_all_keys,
                    "authenticity_confidence": result.get('authenticity', {}).get('confidence')
                }
                print(f"✅ Deal quality analysis passed - Score: {result.get('overall_score', 0):.2f}, Recommendation: {result.get('recommendation')}")
            else:
                self.test_results["deal_quality_analysis"] = {
                    "status": "FAILED",
                    "error": "Invalid result format"
                }
                print("❌ Deal quality analysis failed - invalid result")
        
        except Exception as e:
            self.test_results["deal_quality_analysis"] = {
                "status": "FAILED",
                "error": str(e)
            }
            print(f"❌ Deal quality analysis failed: {e}")
    
    async def test_product_analysis_enhancement(self):
        """Test comprehensive product analysis enhancement"""
        print("\n🔍 Testing product analysis enhancement...")
        
        rust_analysis = {
            "url": "https://example.com/product/iphone-14-pro",
            "page_title": "iPhone 14 Pro Max - Apple Store",
            "confidence": 0.7,
            "product": {
                "name": "iPhone 14 Pro Max",
                "price": 1199.99,
                "brand": "Apple"
            },
            "structured_data": {"@type": "Product", "name": "iPhone 14 Pro Max"}
        }
        
        text_content = "iPhone 14 Pro Max with 256GB storage. Features A16 Bionic chip, Pro camera system, and all-day battery life. Add to cart for $1,199.99 with free shipping."
        
        try:
            start_time = time.time()
            result = await self.analysis_service.enhance_analysis(
                rust_analysis=rust_analysis,
                text_content=text_content,
                images=[]
            )
            end_time = time.time()
            
            if result and 'ai_enhancement_summary' in result:
                enhancement_summary = result['ai_enhancement_summary']
                expected_components = ['ai_text_analysis', 'ai_product_confidence', 'ai_sentiment_analysis']
                has_components = any(comp in result for comp in expected_components)
                
                self.test_results["product_analysis_enhancement"] = {
                    "status": "PASSED",
                    "processing_time": f"{(end_time - start_time):.2f}s",
                    "final_confidence": enhancement_summary.get('final_confidence'),
                    "confidence_level": enhancement_summary.get('confidence_level'),
                    "has_ai_components": has_components,
                    "enhancement_version": enhancement_summary.get('enhancement_version')
                }
                print(f"✅ Product analysis enhancement passed - Final confidence: {enhancement_summary.get('final_confidence', 0):.2f}")
            else:
                self.test_results["product_analysis_enhancement"] = {
                    "status": "FAILED",
                    "error": "Missing enhancement summary"
                }
                print("❌ Product analysis enhancement failed - missing summary")
        
        except Exception as e:
            self.test_results["product_analysis_enhancement"] = {
                "status": "FAILED",
                "error": str(e)
            }
            print(f"❌ Product analysis enhancement failed: {e}")
    
    async def test_api_endpoints(self):
        """Test AI service API endpoints"""
        print("\n🌐 Testing API endpoints...")
        
        test_endpoints = [
            ("POST", "http://localhost:8001/health", {}),
            ("GET", "http://localhost:8001/status", {}),
        ]
        
        endpoint_results = {}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            for method, url, data in test_endpoints:
                try:
                    start_time = time.time()
                    
                    if method == "POST":
                        response = await client.post(url, json=data)
                    else:
                        response = await client.get(url)
                    
                    end_time = time.time()
                    
                    endpoint_name = url.split("/")[-1]
                    endpoint_results[endpoint_name] = {
                        "status": "PASSED" if response.status_code == 200 else "FAILED",
                        "status_code": response.status_code,
                        "response_time": f"{(end_time - start_time):.2f}s"
                    }
                    
                    if response.status_code == 200:
                        print(f"✅ {endpoint_name} endpoint passed ({response.status_code})")
                    else:
                        print(f"❌ {endpoint_name} endpoint failed ({response.status_code})")
                
                except Exception as e:
                    endpoint_name = url.split("/")[-1]
                    endpoint_results[endpoint_name] = {
                        "status": "FAILED",
                        "error": str(e)
                    }
                    print(f"❌ {endpoint_name} endpoint failed: {e}")
        
        self.test_results["api_endpoints"] = endpoint_results
    
    async def test_performance_benchmarks(self):
        """Test performance benchmarks"""
        print("\n⚡ Testing performance benchmarks...")
        
        # Test multiple concurrent requests
        test_tasks = []
        for i in range(5):
            task = self.model_manager.call_gemini([
                {"role": "user", "content": f"Respond with JSON: {{\"test_id\": {i}, \"status\": \"ok\"}}"}
            ], response_format="json")
            test_tasks.append(task)
        
        try:
            start_time = time.time()
            results = await asyncio.gather(*test_tasks, return_exceptions=True)
            end_time = time.time()
            
            successful_requests = sum(1 for r in results if isinstance(r, dict) and r.get("success"))
            avg_time_per_request = (end_time - start_time) / len(test_tasks)
            
            self.test_results["performance_benchmarks"] = {
                "total_requests": len(test_tasks),
                "successful_requests": successful_requests,
                "total_time": f"{(end_time - start_time):.2f}s",
                "avg_time_per_request": f"{avg_time_per_request:.2f}s",
                "requests_per_second": f"{len(test_tasks) / (end_time - start_time):.2f}",
                "success_rate": f"{(successful_requests / len(test_tasks) * 100):.1f}%"
            }
            
            print(f"✅ Performance benchmark completed - {successful_requests}/{len(test_tasks)} successful")
            print(f"   Average time per request: {avg_time_per_request:.2f}s")
            print(f"   Requests per second: {len(test_tasks) / (end_time - start_time):.2f}")
        
        except Exception as e:
            self.test_results["performance_benchmarks"] = {
                "status": "FAILED",
                "error": str(e)
            }
            print(f"❌ Performance benchmark failed: {e}")
    
    def generate_test_report(self):
        """Generate comprehensive test report"""
        print("\n" + "="*60)
        print("📊 DEALPAL AI ENHANCEMENT TEST REPORT")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() 
                          if isinstance(result, dict) and result.get("status") == "PASSED")
        
        print(f"\nOverall Results: {passed_tests}/{total_tests} tests passed")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        print("\nDetailed Results:")
        for test_name, result in self.test_results.items():
            status = result.get("status", "UNKNOWN") if isinstance(result, dict) else "UNKNOWN"
            emoji = "✅" if status == "PASSED" else "❌"
            print(f"{emoji} {test_name.replace('_', ' ').title()}: {status}")
            
            if status == "FAILED" and "error" in result:
                print(f"    Error: {result['error']}")
        
        print("\n" + "="*60)
        
        # Save detailed report
        with open("test_report.json", "w") as f:
            json.dump({
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "summary": {
                    "total_tests": total_tests,
                    "passed_tests": passed_tests,
                    "success_rate": f"{(passed_tests/total_tests*100):.1f}%"
                },
                "detailed_results": self.test_results
            }, f, indent=2)
        
        print("📄 Detailed report saved to test_report.json")

async def main():
    """Run the complete test suite"""
    test_suite = DealPalAITestSuite()
    
    if await test_suite.setup():
        await test_suite.run_all_tests()
    else:
        print("❌ Test suite setup failed. Please check your configuration.")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
