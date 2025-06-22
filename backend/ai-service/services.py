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
    
    async def analyze_product_page(
        self, 
        url: str,
        page_title: str,
        text_content: str,
        structured_data: Optional[Dict[str, Any]] = None,
        images: Optional[List[str]] = None,
        local_ai_result: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive product page analysis using multiple AI techniques
        """
        logger.info(f"🔍 Analyzing product page: {url}")
        
        analysis_results = {}
        
        # Step 1: Text-based classification
        text_analysis = await self._analyze_text_content(text_content, page_title)
        analysis_results["text_analysis"] = text_analysis
        
        # Step 2: Structured data analysis
        structured_analysis = self._analyze_structured_data(structured_data or {})
        analysis_results["structured_analysis"] = structured_analysis
        
        # Step 3: URL pattern analysis
        url_analysis = self._analyze_url_patterns(url)
        analysis_results["url_analysis"] = url_analysis
        
        # Step 4: Image analysis (if enabled and images provided)
        if images and len(images) > 0:
            image_analysis = await self._analyze_product_images(images[:3])
            analysis_results["image_analysis"] = image_analysis
        
        # Step 5: LLM enhancement (if available)
        if self.model_manager.is_model_available("gemini"):
            llm_analysis = await self._enhance_with_llm(
                url, page_title, text_content, structured_data
            )
            analysis_results["llm_analysis"] = llm_analysis
        
        # Step 6: Combine all analyses
        final_result = await self._combine_analyses(analysis_results, local_ai_result)
        
        return final_result
    
    async def _analyze_text_content(self, text_content: str, page_title: str) -> Dict[str, Any]:
        """Analyze text content for product indicators"""
        
        # Basic keyword analysis
        product_keywords = [
            "buy", "purchase", "add to cart", "price", "discount", "offer",
            "product", "item", "deal", "sale", "shipping", "delivery",
            "warranty", "specification", "review", "rating", "star"
        ]
        
        ecommerce_patterns = [
            r"\$\d+\.?\d*",  # Price patterns
            r"₹\d+",         # Indian rupee
            r"\d+% off",     # Discount patterns
            r"free shipping",
            r"add to cart",
            r"buy now",
            r"out of stock",
            r"in stock"
        ]
        
        text_lower = text_content.lower()
        title_lower = page_title.lower()
        
        # Count keyword occurrences
        keyword_score = sum(1 for keyword in product_keywords if keyword in text_lower)
        pattern_score = sum(1 for pattern in ecommerce_patterns if re.search(pattern, text_lower))
        
        # Use Gemini text classifier if available
        ai_confidence = 0.0
        classification_result = None
        
        if self.model_manager.is_model_available("gemini"):
            try:
                # Define relevant labels for e-commerce classification
                ecommerce_labels = ["product page", "shopping page", "e-commerce", "online store"]
                non_product_labels = ["blog", "news", "social media", "information page"]
                all_labels = ecommerce_labels + non_product_labels
                
                classification_result = await self.model_manager.classify_text(
                    text_content[:1000], 
                    all_labels
                )
                
                # Calculate confidence for product page classification
                for i, label in enumerate(classification_result.get("labels", [])):
                    if any(ecom_label in label.lower() for ecom_label in ecommerce_labels):
                        ai_confidence = max(ai_confidence, classification_result["scores"][i])
                        
            except Exception as e:
                logger.error(f"❌ Text classification failed: {e}")
        
        # Combine scores
        heuristic_confidence = min((keyword_score + pattern_score) / 15, 1.0)
        final_confidence = max(ai_confidence, heuristic_confidence)
        
        return {
            "is_product_page": final_confidence > 0.5,
            "confidence": final_confidence,
            "keyword_score": keyword_score,
            "pattern_score": pattern_score,
            "ai_confidence": ai_confidence,
            "classification_result": classification_result,
            "method": "text_analysis"
        }
    
    def _analyze_structured_data(self, structured_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze structured data for product information"""
        
        confidence = 0.0
        product_info = {}
        evidence = []
        
        # Check JSON-LD data
        if "json_ld" in structured_data:
            for item in structured_data["json_ld"]:
                if isinstance(item, dict):
                    schema_type = item.get("@type", "")
                    if isinstance(schema_type, list):
                        schema_type = " ".join(schema_type)
                    
                    if "product" in schema_type.lower():
                        confidence = 0.95
                        evidence.append("Product schema found in JSON-LD")
                        
                        # Extract product information
                        product_info.update({
                            "name": item.get("name"),
                            "description": item.get("description"),
                            "brand": self._extract_brand(item),
                            "category": item.get("category"),
                            "image": self._extract_image(item),
                            "offers": self._extract_offers(item)
                        })
                        break
        
        # Check Open Graph data
        if "open_graph" in structured_data and confidence < 0.8:
            og_data = structured_data["open_graph"]
            if og_data.get("og:type") == "product":
                confidence = max(confidence, 0.8)
                evidence.append("Product type in Open Graph")
                
                if not product_info:
                    product_info = {
                        "name": og_data.get("og:title"),
                        "description": og_data.get("og:description"),
                        "image": og_data.get("og:image")
                    }
        
        # Check microdata
        if "product_schemas" in structured_data and confidence < 0.7:
            if structured_data["product_schemas"]:
                confidence = max(confidence, 0.7)
                evidence.append("Product microdata found")
        
        return {
            "confidence": confidence,
            "product_info": product_info,
            "evidence": evidence,
            "has_structured_data": len(structured_data) > 0
        }
    
    def _analyze_url_patterns(self, url: str) -> Dict[str, Any]:
        """Analyze URL for product page patterns"""
        
        product_url_patterns = [
            r"/product/",
            r"/item/",
            r"/dp/",
            r"/gp/product/",
            r"/p/",
            r"/products/",
            r"product-detail",
            r"productdetail",
            r"/buy/",
            r"/shop/"
        ]
        
        url_lower = url.lower()
        matches = []
        
        for pattern in product_url_patterns:
            if re.search(pattern, url_lower):
                matches.append(pattern)
        
        confidence = min(len(matches) * 0.3, 1.0)
        
        return {
            "confidence": confidence,
            "matches": matches,
            "is_product_url": confidence > 0.3
        }
    
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
        local_ai_result: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Combine all analysis results into final decision"""
        
        confidences = []
        weights = []
        evidence = []
        
        # Text analysis
        if "text_analysis" in analysis_results:
            text_result = analysis_results["text_analysis"]
            confidences.append(text_result["confidence"])
            weights.append(0.3)
            if text_result["is_product_page"]:
                evidence.append("Text content indicates product page")
        
        # Structured data analysis
        if "structured_analysis" in analysis_results:
            struct_result = analysis_results["structured_analysis"]
            if struct_result["confidence"] > 0:
                confidences.append(struct_result["confidence"])
                weights.append(0.4)
                evidence.extend(struct_result["evidence"])
        
        # URL analysis
        if "url_analysis" in analysis_results:
            url_result = analysis_results["url_analysis"]
            confidences.append(url_result["confidence"])
            weights.append(0.2)
            if url_result["is_product_url"]:
                evidence.append("URL matches product page patterns")
        
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
        
        # Incorporate local AI result
        if local_ai_result:
            local_confidence = local_ai_result.get("confidence", 0.0)
            final_confidence = max(final_confidence, local_confidence)
            if local_ai_result.get("isProductPage") or local_ai_result.get("is_product_page"):
                evidence.append("Local AI detected product page")
        
        # Determine final decision
        is_product_page = final_confidence > 0.6
        
        return {
            "is_product_page": is_product_page,
            "confidence": final_confidence,
            "source": "python-ai-combined",
            "evidence": evidence,
            "analysis_details": analysis_results,
            "local_ai_result": local_ai_result,
            "product": self._extract_best_product_info(analysis_results) if is_product_page else None
        }
    
    def _extract_best_product_info(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Extract the best product information from all analyses"""
        
        product_info = {}
        
        # Prefer structured data
        if "structured_analysis" in analysis_results:
            struct_product = analysis_results["structured_analysis"].get("product_info", {})
            product_info.update({k: v for k, v in struct_product.items() if v})
        
        # Enhance with LLM data
        if "llm_analysis" in analysis_results:
            llm_product = analysis_results["llm_analysis"].get("extracted_info", {})
            for key, value in llm_product.items():
                if value and key not in product_info:
                    product_info[key] = value
        
        return product_info
    
    # Helper methods for data extraction
    def _extract_brand(self, item: Dict[str, Any]) -> Optional[str]:
        """Extract brand from structured data"""
        brand = item.get("brand")
        if isinstance(brand, dict):
            return brand.get("name")
        return brand
    
    def _extract_image(self, item: Dict[str, Any]) -> Optional[str]:
        """Extract image URL from structured data"""
        image = item.get("image")
        if isinstance(image, list) and len(image) > 0:
            return image[0] if isinstance(image[0], str) else image[0].get("url")
        elif isinstance(image, dict):
            return image.get("url")
        return image
    
    def _extract_offers(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract offers from structured data"""
        offers = item.get("offers")
        if isinstance(offers, dict):
            return {
                "price": offers.get("price"),
                "currency": offers.get("priceCurrency"),
                "availability": offers.get("availability")
            }
        elif isinstance(offers, list) and len(offers) > 0:
            offer = offers[0]
            return {
                "price": offer.get("price"),
                "currency": offer.get("priceCurrency"),
                "availability": offer.get("availability")
            }
        return None


# Export the service
__all__ = ["ProductAnalysisService"]
