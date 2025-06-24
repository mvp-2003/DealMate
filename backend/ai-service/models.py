"""
AI Models Management for DealPal AI Service - Gemini Only
"""

import logging
from typing import Optional, Dict, Any, List
import asyncio
from functools import lru_cache

# AI imports - Gemini only
try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

from config import settings

logger = logging.getLogger(__name__)


"""
AI Models Management for DealPal AI Service - Gemini Only
"""

import logging
from typing import Optional, Dict, Any, List
import asyncio
from functools import lru_cache
import json

# AI imports - Gemini only
try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

from config import settings

logger = logging.getLogger(__name__)


class GeminiAIManager:
    """Manages Google Gemini AI models"""
    
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.model_status: Dict[str, bool] = {}
        self.initialization_lock = asyncio.Lock()
        self.is_initialized = False
    
    async def initialize(self):
        """Initialize Gemini AI models"""
        async with self.initialization_lock:
            if self.is_initialized:
                return
            
            logger.info("🤖 Initializing Gemini AI models...")
            
            # Setup Gemini
            await self._setup_gemini()
            
            self.is_initialized = True
            logger.info("✅ Gemini AI model initialization complete")
    
    async def _setup_gemini(self):
        """Setup Gemini client"""
        if not HAS_GEMINI:
            logger.warning("❌ Gemini library not available")
            self.model_status["gemini"] = False
            return
        
        if not settings.has_gemini_key:
            logger.warning("❌ Gemini API key not configured")
            self.model_status["gemini"] = False
            return
        
        try:
            genai.configure(api_key=settings.gemini_api_key)
            
            # Initialize Gemini models with correct names
            self.models["gemini-text"] = genai.GenerativeModel(settings.gemini_model)
            # Use gemini-1.5-flash for vision tasks too (it supports multimodal)
            self.models["gemini-vision"] = genai.GenerativeModel('gemini-1.5-flash')
            
            self.model_status["gemini"] = True
            logger.info("✅ Gemini client configured")
        except Exception as e:
            logger.error(f"❌ Failed to setup Gemini: {e}")
            self.model_status["gemini"] = False
    
    def get_model(self, name: str) -> Optional[Any]:
        """Get a loaded model by name"""
        return self.models.get(name)
    
    def is_model_available(self, name: str) -> bool:
        """Check if a model is available and loaded"""
        return self.model_status.get(name, False)
    
    def get_model_status(self) -> Dict[str, bool]:
        """Get status of all models"""
        return self.model_status.copy()
    
    async def analyze_sentiment_advanced(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Advanced sentiment analysis using Gemini with detailed insights"""
        if not self.is_model_available("gemini"):
            raise ValueError("Gemini not available")
        
        results = []
        
        # Process in batches to avoid token limits
        for i in range(0, len(texts), 5):
            batch = texts[i:i+5]
            
            # Create comprehensive prompt for sentiment analysis
            prompt = """Analyze the sentiment of these product reviews with detailed insights.
            For each review, provide sentiment (POSITIVE/NEGATIVE/NEUTRAL), confidence score (0-1), 
            emotional indicators, and key phrases that influenced the sentiment.

            Reviews to analyze:
            """
            
            for idx, text in enumerate(batch):
                if len(text.strip()) >= 10:  # Only process meaningful text
                    prompt += f"\nReview {idx + 1}: {text[:300]}"
            
            prompt += """

            Respond with JSON array:
            [
              {
                "review_index": 1,
                "sentiment": "POSITIVE|NEGATIVE|NEUTRAL",
                "confidence": 0.85,
                "emotional_indicators": ["excited", "satisfied"],
                "key_phrases": ["great quality", "fast delivery"],
                "reasoning": "Brief explanation of sentiment"
              }
            ]"""
            
            messages = [
                {"role": "system", "content": "You are an expert sentiment analyst specializing in product reviews."},
                {"role": "user", "content": prompt}
            ]
            
            try:
                response = await self.call_gemini(messages, response_format="json", temperature=0.1)
                if response["success"] and isinstance(response["response"], list):
                    results.extend(response["response"])
                else:
                    # Fallback for batch
                    for _ in batch:
                        results.append({
                            "sentiment": "NEUTRAL",
                            "confidence": 0.5,
                            "emotional_indicators": [],
                            "key_phrases": [],
                            "reasoning": "Analysis failed"
                        })
            except Exception as e:
                logger.error(f"❌ Advanced sentiment analysis failed: {e}")
                for _ in batch:
                    results.append({
                        "sentiment": "NEUTRAL", 
                        "confidence": 0.5,
                        "emotional_indicators": [],
                        "key_phrases": [],
                        "reasoning": "Error in analysis"
                    })
        
        return results
    
    async def classify_text_advanced(self, text: str, context: str = "product_analysis") -> Dict[str, Any]:
        """Advanced text classification using Gemini with context awareness"""
        if not self.is_model_available("gemini"):
            raise ValueError("Gemini not available")
        
        # Define classification categories based on context
        classification_prompts = {
            "product_analysis": {
                "categories": ["product_page", "category_page", "search_results", "cart_page", "checkout_page", "other"],
                "prompt": """Classify this webpage content to determine what type of e-commerce page it is.
                
                Categories:
                - product_page: Individual product detail page
                - category_page: Product category or collection page
                - search_results: Search results page
                - cart_page: Shopping cart page
                - checkout_page: Checkout or payment page
                - other: Non-shopping page
                
                Page content: {text}
                
                Provide detailed analysis with confidence scores and reasoning."""
            },
            "deal_classification": {
                "categories": ["discount", "coupon", "cashback", "free_shipping", "bundle_deal", "clearance", "seasonal_sale"],
                "prompt": """Classify this deal or offer content.
                
                Deal content: {text}
                
                Determine the type of deal and provide confidence scores."""
            },
            "content_quality": {
                "categories": ["high_quality", "medium_quality", "low_quality", "spam", "fake"],
                "prompt": """Assess the quality and trustworthiness of this content.
                
                Content: {text}
                
                Evaluate authenticity, helpfulness, and quality."""
            }
        }
        
        config = classification_prompts.get(context, classification_prompts["product_analysis"])
        
        full_prompt = config["prompt"].format(text=text[:2000]) + f"""
        
        Respond with JSON:
        {{
          "primary_category": "most_likely_category",
          "confidence": 0.85,
          "category_scores": {{
            "category1": 0.85,
            "category2": 0.10,
            "category3": 0.05
          }},
          "reasoning": "Why this classification was chosen",
          "key_indicators": ["specific", "text", "patterns"],
          "certainty_level": "HIGH|MEDIUM|LOW"
        }}"""
        
        messages = [
            {"role": "system", "content": f"You are an expert at classifying {context} content with high accuracy."},
            {"role": "user", "content": full_prompt}
        ]
        
        try:
            response = await self.call_gemini(messages, response_format="json", temperature=0.1)
            if response["success"]:
                return response["response"]
            else:
                raise Exception(response.get("error", "Unknown error"))
                
        except Exception as e:
            logger.error(f"❌ Advanced text classification failed: {e}")
            categories = config["categories"]
            equal_score = 1.0 / len(categories)
            return {
                "primary_category": categories[0],
                "confidence": 0.3,
                "category_scores": {cat: equal_score for cat in categories},
                "reasoning": "Classification failed, using fallback",
                "key_indicators": [],
                "certainty_level": "LOW"
            }
    
    async def call_gemini(
        self, 
        messages: List[Dict[str, str]], 
        max_tokens: int = 1000,
        temperature: float = 0.3,
        response_format: str = "json"
    ) -> Dict[str, Any]:
        """Call Gemini with message history and enhanced features"""
        if not self.is_model_available("gemini"):
            raise ValueError("Gemini model not available")
        
        try:
            model = self.get_model("gemini-text")
            
            # Convert messages to Gemini format with enhanced prompt engineering
            conversation_text = self._format_messages_for_gemini(messages, response_format)
            
            response = await model.generate_content_async(
                conversation_text,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_tokens,
                    temperature=temperature,
                )
            )
            
            # Parse JSON response if requested
            response_text = response.text
            if response_format == "json":
                try:
                    # Clean and parse JSON response
                    cleaned_response = self._clean_json_response(response_text)
                    parsed_response = json.loads(cleaned_response)
                    return {
                        "success": True,
                        "response": parsed_response,
                        "raw_response": response_text,
                        "model": "gemini",
                        "tokens_used": len(response_text.split()) * 1.3
                    }
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse JSON response: {e}")
                    return {
                        "success": True,
                        "response": response_text,
                        "raw_response": response_text,
                        "model": "gemini",
                        "tokens_used": len(response_text.split()) * 1.3,
                        "json_parse_error": str(e)
                    }
            
            return {
                "success": True,
                "response": response_text,
                "model": "gemini",
                "tokens_used": len(response_text.split()) * 1.3
            }
        except Exception as e:
            logger.error(f"❌ Gemini API call failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "model": "gemini"
            }

    async def call_gemini_vision(
        self,
        prompt: str,
        images: List[str],
        max_tokens: int = 1000,
        temperature: float = 0.3
    ) -> Dict[str, Any]:
        """Call Gemini with vision capabilities for image analysis"""
        if not self.is_model_available("gemini"):
            raise ValueError("Gemini model not available")
        
        try:
            model = self.get_model("gemini-vision")
            
            # Prepare content for multimodal input
            content_parts = [prompt]
            
            # Add images (assuming base64 encoded or URLs)
            for image in images[:3]:  # Limit to 3 images
                if image.startswith('http'):
                    # For URLs, we'd need to download and convert
                    logger.warning("URL images not yet supported, skipping")
                    continue
                elif image.startswith('data:image'):
                    # Base64 encoded image
                    import base64
                    from PIL import Image
                    import io
                    
                    # Extract base64 data
                    image_data = image.split(',')[1]
                    image_bytes = base64.b64decode(image_data)
                    pil_image = Image.open(io.BytesIO(image_bytes))
                    content_parts.append(pil_image)
            
            response = await model.generate_content_async(
                content_parts,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_tokens,
                    temperature=temperature,
                )
            )
            
            return {
                "success": True,
                "response": response.text,
                "model": "gemini-vision",
                "tokens_used": len(response.text.split()) * 1.3,
                "images_processed": len([img for img in images if img.startswith('data:image')])
            }
        except Exception as e:
            logger.error(f"❌ Gemini Vision API call failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "model": "gemini-vision"
            }

    def _clean_json_response(self, response: str) -> str:
        """Clean Gemini response to extract valid JSON"""
        # Remove markdown code blocks if present
        response = response.strip()
        if response.startswith('```json'):
            response = response[7:]
        if response.startswith('```'):
            response = response[3:]
        if response.endswith('```'):
            response = response[:-3]
        
        # Find the first { and last } to extract JSON object
        start = response.find('{')
        end = response.rfind('}')
        if start != -1 and end != -1 and end > start:
            response = response[start:end+1]
        
        return response.strip()

    def _format_messages_for_gemini(self, messages: List[Dict[str, str]], response_format: str = "text") -> str:
        """Enhanced message formatting for Gemini with better prompt engineering"""
        prompt_parts = []
        
        # Add response format instruction if JSON is requested
        if response_format == "json":
            prompt_parts.append("IMPORTANT: Respond ONLY with valid JSON. No explanatory text before or after.")
        
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            
            if role == "system":
                prompt_parts.append(f"System Instructions: {content}")
            elif role == "user":
                prompt_parts.append(f"User Request: {content}")
            elif role == "assistant":
                prompt_parts.append(f"Assistant Response: {content}")
        
        if response_format == "json":
            prompt_parts.append("\nRemember: Respond with ONLY valid JSON.")
        
        return "\n\n".join(prompt_parts)
    
    async def analyze_image_advanced(self, image_data: str, analysis_type: str = "product_detection") -> Dict[str, Any]:
        """Advanced image analysis using Gemini Vision with specific analysis types"""
        if not self.is_model_available("gemini"):
            raise ValueError("Gemini not available")
        
        analysis_prompts = {
            "product_detection": """Analyze this image for product information. Identify:
            1. Is this a product image?
            2. What type of product is shown?
            3. Brand name (if visible)
            4. Product features and attributes
            5. Quality of the image
            6. Any text or pricing information visible
            
            Provide detailed JSON response with confidence scores.""",
            
            "deal_analysis": """Analyze this image for deal/promotional content:
            1. Are there any discount percentages or sale prices?
            2. Promotional badges or labels?
            3. Original vs sale price comparisons?
            4. Urgency indicators (limited time, countdown)?
            5. Deal authenticity assessment
            
            Extract all pricing and promotional information.""",
            
            "brand_detection": """Focus on brand identification in this image:
            1. Brand logos and names
            2. Product packaging design
            3. Brand authenticity indicators
            4. Trademark or copyright symbols
            5. Official vs counterfeit likelihood
            
            Provide brand analysis with confidence scores."""
        }
        
        prompt = analysis_prompts.get(analysis_type, analysis_prompts["product_detection"])
        prompt += """
        
        Respond with JSON:
        {
          "is_product_image": true,
          "confidence": 0.92,
          "detected_items": ["item1", "item2"],
          "brands_detected": ["brand1"],
          "text_content": ["visible", "text"],
          "pricing_info": {
            "prices_found": ["$19.99"],
            "discount_indicators": ["50% OFF"]
          },
          "quality_assessment": {
            "image_quality": "HIGH|MEDIUM|LOW",
            "clarity": 0.85,
            "professional_photo": true
          },
          "analysis_type": "product_detection",
          "key_features": ["feature1", "feature2"]
        }"""
        
        try:
            response = await self.call_gemini_vision(prompt, [image_data], temperature=0.2)
            if response["success"]:
                try:
                    # Try to parse as JSON
                    cleaned_response = self._clean_json_response(response["response"])
                    parsed_response = json.loads(cleaned_response)
                    return parsed_response
                except json.JSONDecodeError:
                    # Return structured fallback
                    return {
                        "is_product_image": True,
                        "confidence": 0.5,
                        "detected_items": ["unknown_product"],
                        "brands_detected": [],
                        "text_content": [],
                        "pricing_info": {"prices_found": [], "discount_indicators": []},
                        "quality_assessment": {"image_quality": "MEDIUM", "clarity": 0.5, "professional_photo": False},
                        "analysis_type": analysis_type,
                        "key_features": [],
                        "raw_response": response["response"]
                    }
            else:
                raise Exception(response.get("error", "Vision analysis failed"))
                
        except Exception as e:
            logger.error(f"❌ Advanced image analysis failed: {e}")
            return {
                "is_product_image": False,
                "confidence": 0.0,
                "detected_items": [],
                "brands_detected": [],
                "text_content": [],
                "pricing_info": {"prices_found": [], "discount_indicators": []},
                "quality_assessment": {"image_quality": "LOW", "clarity": 0.0, "professional_photo": False},
                "analysis_type": analysis_type,
                "key_features": [],
                "error": str(e)
            }

    async def analyze_deal_quality(self, deal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze deal quality and authenticity using Gemini"""
        if not self.is_model_available("gemini"):
            raise ValueError("Gemini not available")
        
        prompt = f"""Analyze this deal for quality, authenticity, and value:
        
        Deal Information:
        - Product: {deal_data.get('product_name', 'Unknown')}
        - Original Price: {deal_data.get('original_price', 'N/A')}
        - Sale Price: {deal_data.get('sale_price', 'N/A')}
        - Discount: {deal_data.get('discount_percentage', 'N/A')}
        - Store: {deal_data.get('store_name', 'Unknown')}
        - Description: {deal_data.get('description', 'N/A')[:500]}
        
        Analyze for:
        1. Deal authenticity (real vs fake discount)
        2. Value assessment (good deal vs inflated original price)
        3. Urgency legitimacy (real vs artificial scarcity)
        4. Store credibility
        5. Overall deal quality score
        
        Respond with JSON:
        {{
          "overall_score": 0.75,
          "authenticity": {{
            "is_genuine": true,
            "confidence": 0.85,
            "red_flags": ["flag1", "flag2"]
          }},
          "value_assessment": {{
            "is_good_deal": true,
            "value_score": 0.8,
            "market_comparison": "BELOW_MARKET|AT_MARKET|ABOVE_MARKET"
          }},
          "trust_indicators": {{
            "store_reputation": 0.7,
            "deal_legitimacy": 0.8
          }},
          "recommendation": "BUY|WAIT|AVOID",
          "reasoning": "Detailed explanation"
        }}"""
        
        messages = [
            {"role": "system", "content": "You are an expert deal analyst who helps consumers identify genuine bargains and avoid scams."},
            {"role": "user", "content": prompt}
        ]
        
        try:
            response = await self.call_gemini(messages, response_format="json", temperature=0.1)
            if response["success"]:
                return response["response"]
            else:
                raise Exception(response.get("error", "Deal analysis failed"))
                
        except Exception as e:
            logger.error(f"❌ Deal quality analysis failed: {e}")
            return {
                "overall_score": 0.5,
                "authenticity": {"is_genuine": True, "confidence": 0.5, "red_flags": []},
                "value_assessment": {"is_good_deal": True, "value_score": 0.5, "market_comparison": "AT_MARKET"},
                "trust_indicators": {"store_reputation": 0.5, "deal_legitimacy": 0.5},
                "recommendation": "WAIT",
                "reasoning": "Unable to analyze deal quality",
                "error": str(e)
            }


# Global model manager instance
model_manager = GeminiAIManager()


@lru_cache(maxsize=1)
def get_model_manager() -> GeminiAIManager:
    """Get the global model manager instance"""
    return model_manager


# Helper functions for backward compatibility
async def initialize_models():
    """Initialize all AI models"""
    await model_manager.initialize()


def is_gemini_available() -> bool:
    """Check if Gemini is available"""
    return model_manager.is_model_available("gemini")


# Export public interface
__all__ = [
    "GeminiAIManager",
    "model_manager", 
    "get_model_manager",
    "initialize_models",
    "is_gemini_available"
]
