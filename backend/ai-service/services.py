"""
Product Analysis Service for DealPal AI Service
"""

import logging
import re
import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import asyncio

from models import get_model_manager
from config import ModelConfig

logger = logging.getLogger(__name__)


class ProductAnalysisService:
    """Service for analyzing product pages and extracting information"""
    
    def __init__(self):
        self.model_manager = get_model_manager()
    
    async def enhance_analysis(
        self, 
        rust_analysis: Dict[str, Any],
        text_content: str,
        images: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Comprehensive product page analysis using multiple AI techniques with Gemini
        """
        logger.info(f"🔍 Enhancing analysis for product page with advanced AI")
        
        analysis_results = rust_analysis.copy()
        
        # Step 1: Advanced text classification
        if text_content:
            text_analysis = await self._analyze_text_content(text_content, rust_analysis.get("url", ""))
            analysis_results["ai_text_analysis"] = text_analysis
        
        # Step 2: Image analysis (if enabled and images provided)
        if images and len(images) > 0:
            image_analysis = await self._analyze_product_images_advanced(images[:3])
            analysis_results["ai_image_analysis"] = image_analysis
        
        # Step 3: Product detection confidence enhancement
        product_confidence = await self._enhance_product_detection(
            rust_analysis.get("url", ""),
            rust_analysis.get("page_title", ""),
            text_content,
            rust_analysis.get("structured_data")
        )
        analysis_results["ai_product_confidence"] = product_confidence
        
        # Step 4: Deal and pricing analysis
        if analysis_results.get("price_info"):
            deal_analysis = await self._analyze_deal_quality(analysis_results["price_info"], text_content)
            analysis_results["ai_deal_analysis"] = deal_analysis
        
        # Step 5: Sentiment analysis of reviews/content
        if text_content and len(text_content) > 100:
            sentiment_analysis = await self._analyze_content_sentiment(text_content)
            analysis_results["ai_sentiment_analysis"] = sentiment_analysis
        
        # Step 6: Combine all analyses into final confidence score
        final_result = await self._combine_ai_analyses(analysis_results)
        
        return final_result
    
    async def _analyze_product_images(self, images: List[str]) -> Dict[str, Any]:
        """Analyze product images for visual cues"""
        
        # Placeholder for image analysis
        # In production, this would use computer vision models
        logger.info(f"🖼️ Analyzing {len(images)} product images")
        
        # Simulate image processing
        await asyncio.sleep(0.1)
        
        return {
            "images_count": len(images),
            "confidence": 0.6,  # Placeholder confidence
            "analysis": "Image analysis placeholder",
            "detected_objects": ["product", "item"],  # Would be from CV model
            "quality_score": 0.8
        }
    
    async def _enhance_with_llm(
        self, 
        url: str, 
        page_title: str, 
        text_content: str, 
        structured_data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Use LLM for advanced analysis"""
        
        prompt = self._build_analysis_prompt(url, page_title, text_content, structured_data)
        
        messages = [
            {
                "role": "system", 
                "content": "You are an expert at analyzing e-commerce web pages. Respond with valid JSON only."
            },
            {
                "role": "user", 
                "content": prompt
            }
        ]
        
        try:
            response = await self.model_manager.call_gemini(
                messages, 
                max_tokens=800,
                temperature=0.1
            )
            
            if response:
                # Try to parse JSON response
                try:
                    result = json.loads(response)
                    return {
                        "llm_response": result,
                        "confidence": result.get("confidence", 0.5),
                        "is_product_page": result.get("is_product_page", False),
                        "reasoning": result.get("reasoning", ""),
                        "extracted_info": result.get("product_info", {})
                    }
                except json.JSONDecodeError:
                    logger.error("❌ Failed to parse LLM JSON response")
                    return {"error": "Invalid JSON response from LLM"}
            
        except Exception as e:
            logger.error(f"❌ LLM analysis failed: {e}")
        
        return {"error": "LLM analysis failed"}
    
    def _build_analysis_prompt(
        self, 
        url: str, 
        page_title: str, 
        text_content: str, 
        structured_data: Optional[Dict[str, Any]]
    ) -> str:
        """Build prompt for LLM analysis"""
        
        return f"""
        Analyze this webpage and determine if it's a product page:

        URL: {url}
        Title: {page_title}
        Content (first 1500 chars): {text_content[:1500]}
        Has Structured Data: {bool(structured_data)}

        Provide analysis as JSON:
        {{
            "is_product_page": true/false,
            "confidence": 0.0-1.0,
            "reasoning": "Brief explanation",
            "product_info": {{
                "name": "Product name if found",
                "price": "Price if found", 
                "category": "Category if identifiable",
                "brand": "Brand if found"
            }}
        }}

        Consider:
        - URL structure and patterns
        - Page title and content
        - E-commerce indicators (buy buttons, prices, etc.)
        - Product-specific language and terminology
        
        Be accurate and conservative in your assessment.
        """
    
    async def _combine_analyses(
        self, 
        analysis_results: Dict[str, Any], 
    ) -> Dict[str, Any]:
        """Combine all analysis results into final decision"""
        
        confidences = [analysis_results.get("confidence", 0.0)]
        weights = [1.0]
        evidence = analysis_results.get("evidence", [])
        
        # Image analysis
        if "image_analysis" in analysis_results:
            image_result = analysis_results["image_analysis"]
            confidences.append(image_result["confidence"])
            weights.append(0.2)
            evidence.append("Image analysis performed")

        # LLM analysis
        if "llm_analysis" in analysis_results and "confidence" in analysis_results["llm_analysis"]:
            llm_result = analysis_results["llm_analysis"]
            confidences.append(llm_result["confidence"])
            weights.append(0.5)
            if llm_result.get("is_product_page"):
                evidence.append("LLM analysis confirms product page")
        
        # Calculate weighted average confidence
        if confidences and weights:
            final_confidence = sum(c * w for c, w in zip(confidences, weights)) / sum(weights)
        else:
            final_confidence = 0.0
        
        # Determine final decision
        is_product_page = final_confidence > 0.6
        
        return {
            "is_product_page": is_product_page,
            "confidence": final_confidence,
            "source": "python-ai-enhanced",
            "evidence": evidence,
            "analysis_details": analysis_results,
            "product": self._extract_best_product_info(analysis_results) if is_product_page else None
        }
    
    def _extract_best_product_info(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Extract the best product information from all analyses"""
        
        product_info = analysis_results.get("product", {})
        
        # Enhance with LLM data
        if "llm_analysis" in analysis_results:
            llm_product = analysis_results["llm_analysis"].get("extracted_info", {})
            for key, value in llm_product.items():
                if value and key not in product_info:
                    product_info[key] = value
        
        return product_info
    
    async def _analyze_text_content(self, text_content: str, url: str) -> Dict[str, Any]:
        """Advanced text content analysis using Gemini"""
        logger.info("🔍 Performing advanced text content analysis")
        
        # Classify page type
        page_classification = await self.model_manager.classify_text_advanced(
            text_content[:2000], 
            context="product_analysis"
        )
        
        # Extract key information using AI
        extraction_prompt = f"""Analyze this e-commerce page content and extract key information:
        
        URL: {url}
        Content: {text_content[:1500]}
        
        Extract and structure the following information:
        {{
          "product_indicators": {{
            "has_product_title": true,
            "has_pricing": true,
            "has_add_to_cart": true,
            "has_product_description": true,
            "confidence_score": 0.85
          }},
          "extracted_info": {{
            "likely_product_name": "extracted name",
            "price_mentions": ["$19.99", "$25.00"],
            "brand_mentions": ["Nike", "Apple"],
            "category_indicators": ["electronics", "clothing"],
            "feature_keywords": ["waterproof", "wireless", "premium"]
          }},
          "content_quality": {{
            "completeness": 0.8,
            "professional_language": true,
            "has_specifications": true,
            "trustworthiness": 0.75
          }},
          "deal_indicators": {{
            "discount_mentions": ["50% off", "sale"],
            "urgency_language": ["limited time", "while supplies last"],
            "comparison_pricing": true
          }}
        }}"""
        
        messages = [
            {"role": "system", "content": "You are an expert at extracting structured information from e-commerce content."},
            {"role": "user", "content": extraction_prompt}
        ]
        
        try:
            response = await self.model_manager.call_gemini(messages, response_format="json", temperature=0.1)
            if response["success"]:
                return {
                    "page_classification": page_classification,
                    "content_extraction": response["response"],
                    "analysis_confidence": 0.8,
                    "processing_time": response.get("tokens_used", 0)
                }
            else:
                raise Exception(response.get("error", "Text analysis failed"))
        except Exception as e:
            logger.error(f"❌ Text content analysis failed: {e}")
            return {
                "page_classification": page_classification,
                "content_extraction": {"error": str(e)},
                "analysis_confidence": 0.3,
                "processing_time": 0
            }

    async def _analyze_product_images_advanced(self, images: List[str]) -> Dict[str, Any]:
        """Advanced image analysis using Gemini Vision"""
        logger.info(f"🖼️ Performing advanced analysis on {len(images)} product images")
        
        image_results = []
        overall_confidence = 0.0
        
        for idx, image in enumerate(images):
            try:
                # Analyze each image for different aspects
                product_analysis = await self.model_manager.analyze_image_advanced(
                    image, analysis_type="product_detection"
                )
                brand_analysis = await self.model_manager.analyze_image_advanced(
                    image, analysis_type="brand_detection"
                )
                deal_analysis = await self.model_manager.analyze_image_advanced(
                    image, analysis_type="deal_analysis"
                )
                
                combined_result = {
                    "image_index": idx,
                    "product_detection": product_analysis,
                    "brand_analysis": brand_analysis,
                    "deal_analysis": deal_analysis,
                    "overall_confidence": (
                        product_analysis.get("confidence", 0) + 
                        brand_analysis.get("confidence", 0) + 
                        deal_analysis.get("confidence", 0)
                    ) / 3
                }
                
                image_results.append(combined_result)
                overall_confidence += combined_result["overall_confidence"]
                
            except Exception as e:
                logger.error(f"❌ Image {idx} analysis failed: {e}")
                image_results.append({
                    "image_index": idx,
                    "error": str(e),
                    "overall_confidence": 0.0
                })
        
        overall_confidence = overall_confidence / len(images) if images else 0.0
        
        # Aggregate findings
        all_brands = []
        all_prices = []
        all_products = []
        
        for result in image_results:
            if "brand_analysis" in result:
                all_brands.extend(result["brand_analysis"].get("brands_detected", []))
            if "deal_analysis" in result:
                all_prices.extend(result["deal_analysis"].get("pricing_info", {}).get("prices_found", []))
            if "product_detection" in result:
                all_products.extend(result["product_detection"].get("detected_items", []))
        
        return {
            "images_processed": len(images),
            "overall_confidence": overall_confidence,
            "individual_results": image_results,
            "aggregated_findings": {
                "brands_detected": list(set(all_brands)),
                "prices_found": list(set(all_prices)),
                "products_detected": list(set(all_products)),
                "has_product_images": overall_confidence > 0.6
            },
            "quality_assessment": {
                "average_image_quality": sum(
                    r.get("product_detection", {}).get("quality_assessment", {}).get("clarity", 0) 
                    for r in image_results
                ) / len(image_results) if image_results else 0
            }
        }

    async def _enhance_product_detection(self, url: str, title: str, content: str, structured_data: Optional[Dict]) -> Dict[str, Any]:
        """Enhance product detection confidence using AI"""
        logger.info("🎯 Enhancing product detection with AI confidence scoring")
        
        prompt = f"""Analyze this webpage to determine if it's a product page with high confidence:
        
        URL: {url}
        Title: {title}
        Content Sample: {content[:1000]}
        Structured Data Present: {bool(structured_data)}
        
        Provide a comprehensive analysis:
        {{
          "is_product_page": true,
          "confidence_score": 0.92,
          "confidence_level": "HIGH|MEDIUM|LOW",
          "evidence": {{
            "url_indicators": ["product in path", "item id present"],
            "content_indicators": ["add to cart button", "price display", "product specs"],
            "structural_indicators": ["product schema", "price schema"],
            "negative_indicators": ["category listing", "search results"]
          }},
          "product_details": {{
            "likely_product_name": "extracted name",
            "product_category": "estimated category",
            "brand_confidence": 0.8,
            "price_confidence": 0.9
          }},
          "page_quality": {{
            "completeness": 0.85,
            "professional_appearance": true,
            "trustworthiness": 0.8
          }},
          "recommendation": "CONFIDENT_PRODUCT|LIKELY_PRODUCT|UNCERTAIN|NOT_PRODUCT"
        }}"""
        
        messages = [
            {"role": "system", "content": "You are an expert at identifying product pages on e-commerce websites with high accuracy."},
            {"role": "user", "content": prompt}
        ]
        
        try:
            response = await self.model_manager.call_gemini(messages, response_format="json", temperature=0.1)
            if response["success"]:
                return response["response"]
            else:
                raise Exception(response.get("error", "Product detection failed"))
        except Exception as e:
            logger.error(f"❌ Product detection enhancement failed: {e}")
            return {
                "is_product_page": True,
                "confidence_score": 0.5,
                "confidence_level": "LOW",
                "evidence": {"error": str(e)},
                "product_details": {},
                "page_quality": {"completeness": 0.5, "professional_appearance": False, "trustworthiness": 0.5},
                "recommendation": "UNCERTAIN"
            }

    async def _analyze_deal_quality(self, price_info: Dict[str, Any], content: str) -> Dict[str, Any]:
        """Analyze deal quality and authenticity"""
        logger.info("💰 Analyzing deal quality and authenticity")
        
        deal_data = {
            "price_info": price_info,
            "content_sample": content[:800]
        }
        
        return await self.model_manager.analyze_deal_quality(deal_data)

    async def _analyze_content_sentiment(self, content: str) -> Dict[str, Any]:
        """Analyze content sentiment for trustworthiness"""
        logger.info("🎭 Analyzing content sentiment")
        
        # Extract review-like content
        review_patterns = [
            r'review[s]?:?\s*(.{50,200})',
            r'comment[s]?:?\s*(.{50,200})',
            r'feedback:?\s*(.{50,200})',
            r'\d+\s*star[s]?\s*(.{50,200})'
        ]
        
        potential_reviews = []
        for pattern in review_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            potential_reviews.extend(matches[:5])  # Limit to prevent overload
        
        if not potential_reviews:
            # Analyze general content sentiment
            potential_reviews = [content[:500]]
        
        try:
            sentiment_results = await self.model_manager.analyze_sentiment_advanced(potential_reviews)
            
            # Calculate overall sentiment
            positive_count = sum(1 for r in sentiment_results if r.get("sentiment") == "POSITIVE")
            negative_count = sum(1 for r in sentiment_results if r.get("sentiment") == "NEGATIVE")
            neutral_count = len(sentiment_results) - positive_count - negative_count
            
            overall_sentiment = "NEUTRAL"
            if positive_count > negative_count:
                overall_sentiment = "POSITIVE"
            elif negative_count > positive_count:
                overall_sentiment = "NEGATIVE"
            
            avg_confidence = sum(r.get("confidence", 0.5) for r in sentiment_results) / len(sentiment_results) if sentiment_results else 0.5
            
            return {
                "overall_sentiment": overall_sentiment,
                "confidence": avg_confidence,
                "sentiment_distribution": {
                    "positive": positive_count,
                    "negative": negative_count,
                    "neutral": neutral_count
                },
                "detailed_analysis": sentiment_results[:3],  # Return top 3 for review
                "trustworthiness_score": min(0.9, avg_confidence + 0.1) if overall_sentiment != "NEGATIVE" else max(0.1, avg_confidence - 0.2)
            }
        except Exception as e:
            logger.error(f"❌ Sentiment analysis failed: {e}")
            return {
                "overall_sentiment": "NEUTRAL",
                "confidence": 0.5,
                "sentiment_distribution": {"positive": 0, "negative": 0, "neutral": 1},
                "detailed_analysis": [],
                "trustworthiness_score": 0.5,
                "error": str(e)
            }

    async def _combine_ai_analyses(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Combine all AI analyses into final confidence scores"""
        logger.info("🔄 Combining AI analyses for final confidence")
        
        # Weight different analysis components
        weights = {
            "ai_text_analysis": 0.3,
            "ai_image_analysis": 0.2,
            "ai_product_confidence": 0.25,
            "ai_deal_analysis": 0.15,
            "ai_sentiment_analysis": 0.1
        }
        
        total_confidence = 0.0
        total_weight = 0.0
        
        confidence_factors = {}
        
        # Text analysis contribution
        if "ai_text_analysis" in analysis_results:
            text_conf = analysis_results["ai_text_analysis"].get("analysis_confidence", 0.5)
            total_confidence += text_conf * weights["ai_text_analysis"]
            total_weight += weights["ai_text_analysis"]
            confidence_factors["text_analysis"] = text_conf
        
        # Image analysis contribution
        if "ai_image_analysis" in analysis_results:
            image_conf = analysis_results["ai_image_analysis"].get("overall_confidence", 0.5)
            total_confidence += image_conf * weights["ai_image_analysis"]
            total_weight += weights["ai_image_analysis"]
            confidence_factors["image_analysis"] = image_conf
        
        # Product detection contribution
        if "ai_product_confidence" in analysis_results:
            product_conf = analysis_results["ai_product_confidence"].get("confidence_score", 0.5)
            total_confidence += product_conf * weights["ai_product_confidence"]
            total_weight += weights["ai_product_confidence"]
            confidence_factors["product_detection"] = product_conf
        
        # Deal analysis contribution
        if "ai_deal_analysis" in analysis_results:
            deal_conf = analysis_results["ai_deal_analysis"].get("overall_score", 0.5)
            total_confidence += deal_conf * weights["ai_deal_analysis"]
            total_weight += weights["ai_deal_analysis"]
            confidence_factors["deal_analysis"] = deal_conf
        
        # Sentiment analysis contribution
        if "ai_sentiment_analysis" in analysis_results:
            sentiment_conf = analysis_results["ai_sentiment_analysis"].get("trustworthiness_score", 0.5)
            total_confidence += sentiment_conf * weights["ai_sentiment_analysis"]
            total_weight += weights["ai_sentiment_analysis"]
            confidence_factors["sentiment_analysis"] = sentiment_conf
        
        final_confidence = total_confidence / total_weight if total_weight > 0 else 0.5
        
        # Determine confidence level
        confidence_level = "LOW"
        if final_confidence >= 0.8:
            confidence_level = "HIGH"
        elif final_confidence >= 0.6:
            confidence_level = "MEDIUM"
        
        # Add AI enhancement summary
        analysis_results["ai_enhancement_summary"] = {
            "final_confidence": final_confidence,
            "confidence_level": confidence_level,
            "confidence_factors": confidence_factors,
            "ai_processing_complete": True,
            "enhancement_version": "2.0_gemini",
            "processing_timestamp": datetime.now().isoformat()
        }
        
        return analysis_results

# Export the service
__all__ = ["ProductAnalysisService"]
