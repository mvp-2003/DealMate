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
        Comprehensive product page analysis using multiple AI techniques
        """
        logger.info(f"🔍 Enhancing analysis for product page")
        
        analysis_results = rust_analysis
        
        # Step 1: Image analysis (if enabled and images provided)
        if images and len(images) > 0:
            image_analysis = await self._analyze_product_images(images[:3])
            analysis_results["image_analysis"] = image_analysis
        
        # Step 2: LLM enhancement (if available)
        if self.model_manager.is_model_available("gemini"):
            llm_analysis = await self._enhance_with_llm(
                rust_analysis.get("url"),
                rust_analysis.get("page_title"),
                text_content,
                rust_analysis.get("structured_data")
            )
            analysis_results["llm_analysis"] = llm_analysis
        
        # Step 3: Combine all analyses
        final_result = await self._combine_analyses(analysis_results)
        
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

# Export the service
__all__ = ["ProductAnalysisService"]
