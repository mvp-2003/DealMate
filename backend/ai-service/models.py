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
    
    async def analyze_sentiment(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Analyze sentiment using Gemini"""
        if not self.is_model_available("gemini"):
            raise ValueError("Gemini not available")
        
        results = []
        model = self.get_model("gemini-text")
        
        for text in texts[:10]:  # Limit to prevent overload
            if len(text.strip()) < 10:  # Skip very short texts
                continue
            
            try:
                prompt = f"""Analyze the sentiment of this text and respond with only a JSON object:
                Text: "{text[:500]}"
                
                Respond with:
                {{"label": "POSITIVE|NEGATIVE|NEUTRAL", "score": 0.0-1.0}}"""
                
                response = await model.generate_content_async(prompt)
                
                # Parse JSON response
                try:
                    result = json.loads(response.text)
                    results.append(result)
                except json.JSONDecodeError:
                    # Fallback
                    if "positive" in response.text.lower():
                        results.append({"label": "POSITIVE", "score": 0.8})
                    elif "negative" in response.text.lower():
                        results.append({"label": "NEGATIVE", "score": 0.8})
                    else:
                        results.append({"label": "NEUTRAL", "score": 0.5})
                        
            except Exception as e:
                logger.error(f"❌ Gemini sentiment analysis failed: {e}")
                results.append({"label": "NEUTRAL", "score": 0.5})
        
        return results
    
    async def classify_text(self, text: str, labels: List[str]) -> Dict[str, Any]:
        """Classify text using Gemini"""
        if not self.is_model_available("gemini"):
            raise ValueError("Gemini not available")
        
        model = self.get_model("gemini-text")
        
        try:
            labels_str = ", ".join(labels)
            prompt = f"""Classify this text into one of these categories: {labels_str}
            
            Text: "{text[:1000]}"
            
            Respond with only a JSON object:
            {{"labels": ["{labels_str}"], "scores": [0.0-1.0 for each label]}}"""
            
            response = await model.generate_content_async(prompt)
            
            try:
                result = json.loads(response.text)
                return result
            except json.JSONDecodeError:
                # Fallback with equal probability
                equal_score = 1.0 / len(labels)
                return {"labels": labels, "scores": [equal_score] * len(labels)}
                
        except Exception as e:
            logger.error(f"❌ Gemini text classification failed: {e}")
            equal_score = 1.0 / len(labels)
            return {"labels": labels, "scores": [equal_score] * len(labels)}
    
    async def call_gemini(self, messages: List[Dict[str, str]], **kwargs) -> Optional[str]:
        """Call Gemini API with fallback handling"""
        if not self.is_model_available("gemini"):
            logger.warning("❌ Gemini not available")
            return None
        
        try:
            model = self.get_model("gemini-text")
            if not model:
                logger.error("❌ Gemini model not found")
                return None
            
            # Convert messages to Gemini format
            prompt = self._convert_messages_to_prompt(messages)
            
            # Configure generation parameters
            generation_config = genai.types.GenerationConfig(
                max_output_tokens=kwargs.get("max_tokens", settings.gemini_max_tokens),
                temperature=kwargs.get("temperature", 0.1),
            )
            
            # Generate response
            response = await model.generate_content_async(
                prompt,
                generation_config=generation_config
            )
            
            return response.text
            
        except Exception as e:
            logger.error(f"❌ Gemini API call failed: {e}")
            return None
    
    def _convert_messages_to_prompt(self, messages: List[Dict[str, str]]) -> str:
        """Convert OpenAI-style messages to Gemini prompt format"""
        prompt_parts = []
        
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            
            if role == "system":
                prompt_parts.append(f"Instructions: {content}")
            elif role == "user":
                prompt_parts.append(f"User: {content}")
            elif role == "assistant":
                prompt_parts.append(f"Assistant: {content}")
        
        return "\n\n".join(prompt_parts)
    
    async def analyze_image(self, image_data: bytes, prompt: str) -> Optional[str]:
        """Analyze image using Gemini Vision"""
        if not self.is_model_available("gemini"):
            logger.warning("❌ Gemini not available")
            return None
        
        try:
            from PIL import Image
            import io
            
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_data))
            
            model = self.get_model("gemini-vision")
            
            response = await model.generate_content_async([prompt, image])
            return response.text
            
        except Exception as e:
            logger.error(f"❌ Gemini image analysis failed: {e}")
            return None


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
