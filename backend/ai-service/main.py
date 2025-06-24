"""
DealPal Python AI Service

A FastAPI-based microservice for advanced AI-powered product detection, analysis, and enhancement.
This service provides more sophisticated AI capabilities than the browser extension's local AI.

Features:
- Advanced product detection using LLMs
- Image-based product analysis
- Sentiment analysis of reviews
- Review summarization
- Deal quality scoring
"""

# Standard library imports
import logging
import asyncio
from datetime import datetime
from typing import List, Optional, Dict, Any
import json
import re
import httpx
import os

# FastAPI and Pydantic imports (with fallback)
try:
    from fastapi import FastAPI, HTTPException, BackgroundTasks
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, Field
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False
    print("❌ FastAPI not available - please install requirements.txt")
    exit(1)

# Local imports
try:
    from config import settings
    from models import get_model_manager, initialize_models
    from services import ProductAnalysisService
except ImportError as e:
    print(f"❌ Failed to import local modules: {e}")
    print("Make sure config.py, models.py, and services.py are available")
    exit(1)

# Setup logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="DealPal AI Service",
    description="Advanced AI capabilities for product detection and analysis",
    version="1.0.0",
    debug=settings.debug
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global services
model_manager = get_model_manager()
product_service = ProductAnalysisService()
RUST_BACKEND_URL = os.getenv("RUST_BACKEND_URL", "http://localhost:8000")


# Pydantic models for API
class ProductDetectionRequest(BaseModel):
    url: str
    html_content: Optional[str] = None
    page_title: str
    meta_description: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = None
    text_content: str
    images: Optional[List[str]] = None  # Base64 encoded images
    local_ai_result: Optional[Dict[str, Any]] = None

class ProductDetectionResponse(BaseModel):
    is_product_page: bool
    confidence: float
    source: str = "python-ai"
    product: Optional[Dict[str, Any]] = None
    deals: Optional[Dict[str, Any]] = None
    analysis: Optional[Dict[str, Any]] = None
    processing_time: float

class SentimentAnalysisRequest(BaseModel):
    reviews: List[str]
    product_name: str

class SentimentAnalysisResponse(BaseModel):
    overall_sentiment: str
    sentiment_score: float
    review_summary: str
    positive_aspects: List[str]
    negative_aspects: List[str]

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize AI models on startup"""
    logger.info("🚀 Starting DealPal AI Service...")
    
    try:
        await initialize_models()
        logger.info("✅ DealPal AI Service ready!")
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("🛑 Shutting down DealPal AI Service...")

# API Endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "DealPal AI Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    model_status = model_manager.get_model_status()
    
    return {
        "status": "healthy",
        "service": "dealpal-ai-service",
        "version": "1.0.0",
        "models_loaded": model_status,
        "features": {
            "product_detection": True,
            "sentiment_analysis": model_status.get("gemini", False),
            "text_classification": model_status.get("gemini", False),
            "llm_enhancement": model_status.get("gemini", False),
            "image_analysis": model_status.get("gemini", False)
        },
        "timestamp": datetime.now().isoformat()
    }

@app.post("/detect-product", response_model=ProductDetectionResponse)
async def detect_product(request: ProductDetectionRequest):
    """
    Advanced product detection using multiple AI techniques
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"🔍 Analyzing product page: {request.url}")
        
        # Call the Rust service for initial analysis
        async with httpx.AsyncClient() as client:
            rust_service_url = f"{RUST_BACKEND_URL}/api/analyze-product"
            response = await client.post(rust_service_url, json=request.dict())
            response.raise_for_status()
            rust_analysis = response.json()

        # Use the product analysis service for AI enhancements
        result = await product_service.enhance_analysis(
            rust_analysis,
            request.text_content,
            request.images
        )
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return ProductDetectionResponse(
            is_product_page=result["is_product_page"],
            confidence=result["confidence"],
            source=result["source"],
            product=result.get("product"),
            analysis=result,
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"❌ Product detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-sentiment", response_model=SentimentAnalysisResponse)
async def analyze_sentiment(request: SentimentAnalysisRequest):
    """
    Analyze sentiment of product reviews
    """
    try:
        if not model_manager.is_model_available("gemini"):
            raise HTTPException(status_code=503, detail="Sentiment analyzer not available")
        
        logger.info(f"📊 Analyzing sentiment for {len(request.reviews)} reviews")
        
        # Analyze each review using the model manager
        sentiments = await model_manager.analyze_sentiment_advanced(request.reviews)
        
        # Calculate overall sentiment
        if not sentiments:
            raise HTTPException(status_code=400, detail="No valid reviews to analyze")
        
        positive_count = sum(1 for s in sentiments if s.get('label') in ['POSITIVE', 'POS'])
        negative_count = sum(1 for s in sentiments if s.get('label') in ['NEGATIVE', 'NEG'])
        neutral_count = len(sentiments) - positive_count - negative_count
        
        # Determine overall sentiment
        if positive_count > negative_count and positive_count > neutral_count:
            overall_sentiment = "positive"
        elif negative_count > positive_count and negative_count > neutral_count:
            overall_sentiment = "negative"
        else:
            overall_sentiment = "neutral"
        
        # Calculate sentiment score
        total_reviews = len(sentiments)
        sentiment_score = (positive_count - negative_count) / total_reviews if total_reviews > 0 else 0
        
        # Generate summary using LLM if available
        review_summary = f"Analyzed {total_reviews} reviews"
        positive_aspects = ["Quality mentioned positively"] if positive_count > 0 else []
        negative_aspects = ["Some concerns raised"] if negative_count > 0 else []
        
        if model_manager.is_model_available("gemini") and request.reviews:
            try:
                summary_result = await _summarize_reviews_with_llm(request.reviews, request.product_name)
                if summary_result:
                    review_summary = summary_result.get("summary", review_summary)
                    positive_aspects = summary_result.get("positive_aspects", positive_aspects)
                    negative_aspects = summary_result.get("negative_aspects", negative_aspects)
            except Exception as e:
                logger.warning(f"⚠️ LLM summarization failed: {e}")
        
        return SentimentAnalysisResponse(
            overall_sentiment=overall_sentiment,
            sentiment_score=sentiment_score,
            review_summary=review_summary,
            positive_aspects=positive_aspects,
            negative_aspects=negative_aspects
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Sentiment analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions
async def _summarize_reviews_with_llm(reviews: List[str], product_name: str) -> Optional[Dict[str, Any]]:
    """Use LLM to summarize reviews and extract insights"""
    
    if not model_manager.is_model_available("gemini"):
        return None
    
    # Combine reviews (limit length)
    combined_reviews = "\n\n".join(reviews[:10])[:2000]
    
    messages = [
        {
            "role": "system", 
            "content": "You are an expert at analyzing customer reviews. Respond only with valid JSON."
        },
        {
            "role": "user", 
            "content": f"""
            Analyze these customer reviews for {product_name} and provide:
            1. A brief summary (2-3 sentences)
            2. Top 3 positive aspects mentioned
            3. Top 3 negative aspects mentioned
            
            Reviews:
            {combined_reviews}
            
            Format as JSON:
            {{
                "summary": "...",
                "positive_aspects": ["...", "...", "..."],
                "negative_aspects": ["...", "...", "..."]
            }}
            """
        }
    ]
    
    try:
        response = await model_manager.call_gemini(messages, max_tokens=300, temperature=0.1)
        
        if response:
            return json.loads(response)
            
    except Exception as e:
        logger.error(f"❌ Review summarization failed: {e}")
    
    return None

@app.post("/analyze/enhance")
async def enhance_analysis_advanced(request: Dict[str, Any], background_tasks: BackgroundTasks):
    """
    Advanced analysis enhancement using Gemini AI with multi-modal capabilities
    """
    try:
        logger.info("🔍 Starting advanced analysis enhancement")
        
        # Initialize model manager
        await initialize_models()
        model_manager = get_model_manager()
        
        if not model_manager.is_model_available("gemini"):
            raise HTTPException(status_code=503, detail="Gemini AI model not available")
        
        # Extract request data
        url = request.get("url", "")
        title = request.get("title", "")
        text_content = request.get("text_content", "")[:3000]  # Limit for API efficiency
        structured_data = request.get("structured_data", {})
        local_analysis = request.get("local_analysis", {})
        images = request.get("images", [])[:3]  # Limit to 3 images
        enhancement_type = request.get("enhancement_type", "full_analysis")
        
        # Initialize services
        analysis_service = ProductAnalysisService()
        
        # Prepare product info for analysis
        product_info = {
            "url": url,
            "title": title,
            "name": local_analysis.get("product", {}).get("name", title),
            "price": local_analysis.get("product", {}).get("price"),
            "brand": local_analysis.get("product", {}).get("brand"),
            "category": local_analysis.get("product", {}).get("category")
        }
        
        # Comprehensive enhancement
        enhanced_result = await analysis_service.enhance_analysis(
            rust_analysis=local_analysis,
            text_content=text_content,
            images=images
        )
        
        # Add processing metadata
        enhanced_result["processing_info"] = {
            "enhancement_type": enhancement_type,
            "gemini_model_used": True,
            "processing_timestamp": datetime.now().isoformat(),
            "api_version": "2.0_enhanced"
        }
        
        logger.info("✅ Advanced analysis enhancement completed")
        
        return enhanced_result
        
    except Exception as e:
        logger.error(f"❌ Advanced analysis enhancement failed: {e}")
        raise HTTPException(status_code=500, detail=f"Enhancement failed: {str(e)}")

@app.post("/analyze/stacksmart")
async def optimize_offers_stacksmart(request: Dict[str, Any]):
    """
    StackSmart offer optimization using Gemini AI
    """
    try:
        logger.info("📊 Starting StackSmart offer optimization")
        
        await initialize_models()
        model_manager = get_model_manager()
        
        if not model_manager.is_model_available("gemini"):
            raise HTTPException(status_code=503, detail="Gemini AI model not available")
        
        product_info = request.get("product_info", {})
        available_offers = request.get("offers", [])
        constraints = request.get("constraints", {})
        user_preferences = request.get("user_preferences", {})
        
        # Create optimization prompt for Gemini
        optimization_prompt = f"""Analyze these offers for optimal stacking and application:

Product: {product_info.get('name', 'Unknown')}
Price: ${product_info.get('price', 0)}

Available Offers:
{json.dumps(available_offers, indent=2)}

Constraints: {json.dumps(constraints, indent=2)}

Provide a JSON response with optimal offer combination:
{{
  "optimal_combination": [
    {{
      "offer_id": "string",
      "application_order": 1,
      "estimated_savings": 0.00,
      "compatibility_score": 0.95
    }}
  ],
  "total_savings": 0.00,
  "final_price": 0.00,
  "confidence_score": 0.85,
  "application_sequence": [
    {{
      "step": 1,
      "action": "Apply coupon code XYZ",
      "expected_result": "10% discount applied",
      "verification": "Check cart total"
    }}
  ],
  "alternative_combinations": [],
  "risk_factors": [],
  "user_experience_rating": "EASY|MEDIUM|COMPLEX"
}}"""

        messages = [
            {"role": "system", "content": "You are an expert at optimizing e-commerce offers and coupon stacking for maximum savings."},
            {"role": "user", "content": optimization_prompt}
        ]
        
        response = await model_manager.call_gemini(messages, response_format="json", temperature=0.1)
        
        if response["success"]:
            optimization_result = response["response"]
            
            # Add metadata
            optimization_result["processing_info"] = {
                "method": "gemini_stacksmart",
                "offers_analyzed": len(available_offers),
                "processing_timestamp": datetime.now().isoformat()
            }
            
            logger.info("✅ StackSmart optimization completed")
            return optimization_result
        else:
            raise Exception(response.get("error", "Optimization failed"))
            
    except Exception as e:
        logger.error(f"❌ StackSmart optimization failed: {e}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@app.post("/analyze/price-intelligence")
async def analyze_price_intelligence(request: Dict[str, Any]):
    """
    Price intelligence and prediction using Gemini AI
    """
    try:
        logger.info("💰 Starting price intelligence analysis")
        
        await initialize_models()
        model_manager = get_model_manager()
        
        if not model_manager.is_model_available("gemini"):
            raise HTTPException(status_code=503, detail="Gemini AI model not available")
        
        product_info = request.get("product_info", {})
        current_price = request.get("current_price", 0)
        price_history = request.get("price_history", [])
        market_context = request.get("market_context", {})
        
        # Create price analysis prompt for Gemini
        price_analysis_prompt = f"""Analyze this product's pricing for intelligence and predictions:

Product Information:
- Name: {product_info.get('name', 'Unknown')}
- Current Price: ${current_price}
- Category: {product_info.get('category', 'General')}
- Brand: {product_info.get('brand', 'Unknown')}

Price History: {json.dumps(price_history[-10:], indent=2) if price_history else 'No historical data'}

Market Context: {json.dumps(market_context, indent=2)}

Current Date: {datetime.now().strftime('%Y-%m-%d')}

Provide comprehensive price intelligence analysis in JSON:
{{
  "current_price_assessment": {{
    "position": "LOW|MEDIUM|HIGH",
    "percentile": 0.75,
    "value_rating": "EXCELLENT|GOOD|FAIR|POOR"
  }},
  "price_predictions": {{
    "7_days": {{"expected_price": 0.00, "confidence": 0.80, "change_probability": "INCREASE|DECREASE|STABLE"}},
    "30_days": {{"expected_price": 0.00, "confidence": 0.70, "change_probability": "INCREASE|DECREASE|STABLE"}},
    "90_days": {{"expected_price": 0.00, "confidence": 0.60, "change_probability": "INCREASE|DECREASE|STABLE"}}
  }},
  "seasonal_analysis": {{
    "current_season_factor": 1.0,
    "next_major_sale": {{"event": "Black Friday", "days_away": 45, "expected_discount": "20-40%"}},
    "best_buying_months": ["November", "December", "January"]
  }},
  "market_intelligence": {{
    "competitive_positioning": "PREMIUM|MARKET|BUDGET",
    "brand_pricing_pattern": "STABLE|AGGRESSIVE|PREMIUM",
    "category_trends": "INCREASING|DECREASING|STABLE"
  }},
  "purchase_recommendation": {{
    "action": "BUY_NOW|WAIT|MONITOR",
    "confidence": 0.85,
    "reasoning": "Detailed explanation of recommendation",
    "optimal_timing": "Now|Wait 2 weeks|Wait for sale event"
  }},
  "risk_factors": [],
  "confidence_score": 0.80
}}"""

        messages = [
            {"role": "system", "content": "You are an expert price analyst with deep knowledge of e-commerce pricing patterns, seasonal trends, and market dynamics."},
            {"role": "user", "content": price_analysis_prompt}
        ]
        
        response = await model_manager.call_gemini(messages, response_format="json", temperature=0.2)
        
        if response["success"]:
            price_analysis = response["response"]
            
            # Add processing metadata
            price_analysis["processing_info"] = {
                "method": "gemini_price_intelligence",
                "historical_data_points": len(price_history),
                "analysis_timestamp": datetime.now().isoformat(),
                "model_confidence": response.get("tokens_used", 0)
            }
            
            logger.info("✅ Price intelligence analysis completed")
            return price_analysis
        else:
            raise Exception(response.get("error", "Price analysis failed"))
            
    except Exception as e:
        logger.error(f"❌ Price intelligence analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Price analysis failed: {str(e)}")

@app.post("/analyze/deal-quality")
async def analyze_deal_quality_advanced(request: Dict[str, Any]):
    """
    Advanced deal quality and authenticity analysis using Gemini AI
    """
    try:
        logger.info("🎯 Starting advanced deal quality analysis")
        
        await initialize_models()
        model_manager = get_model_manager()
        
        if not model_manager.is_model_available("gemini"):
            raise HTTPException(status_code=503, detail="Gemini AI model not available")
        
        deal_info = request.get("deal_info", {})
        product_info = request.get("product_info", {})
        store_context = request.get("store_context", {})
        
        # Use the enhanced deal quality analysis
        quality_analysis = await model_manager.analyze_deal_quality(deal_info)
        
        # Add additional context analysis
        context_prompt = f"""Analyze this deal in broader market context:

Deal: {deal_info.get('description', 'Unknown deal')}
Product: {product_info.get('name', 'Unknown')}
Store: {store_context.get('name', 'Unknown')}
Original Price: ${deal_info.get('original_price', 0)}
Sale Price: ${deal_info.get('sale_price', 0)}

Provide contextual analysis:
{{
  "market_comparison": "BETTER_THAN_MARKET|MARKET_AVERAGE|BELOW_MARKET",
  "deal_type_analysis": "GENUINE_DISCOUNT|INFLATED_ORIGINAL|SEASONAL_NORMAL|CLEARANCE",
  "urgency_assessment": "REAL_SCARCITY|ARTIFICIAL_URGENCY|NO_URGENCY",
  "store_reputation_factor": 0.85,
  "historical_price_context": "BEST_EVER|GOOD_DEAL|AVERAGE|POOR",
  "recommendation_score": 0.80
}}"""

        messages = [
            {"role": "system", "content": "You are an expert at analyzing deal quality and detecting deceptive pricing practices."},
            {"role": "user", "content": context_prompt}
        ]
        
        context_response = await model_manager.call_gemini(messages, response_format="json", temperature=0.1)
        
        if context_response["success"]:
            # Combine quality analysis with context
            combined_analysis = {
                **quality_analysis,
                "contextual_analysis": context_response["response"],
                "processing_info": {
                    "method": "gemini_deal_quality_advanced",
                    "analysis_timestamp": datetime.now().isoformat()
                }
            }
            
            logger.info("✅ Advanced deal quality analysis completed")
            return combined_analysis
        else:
            # Return just the basic quality analysis if context fails
            return quality_analysis
            
    except Exception as e:
        logger.error(f"❌ Advanced deal quality analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Deal analysis failed: {str(e)}")

# Run the application
if __name__ == "__main__":
    try:
        import uvicorn
        uvicorn.run(
            "main:app", 
            host=settings.api_host, 
            port=settings.api_port, 
            reload=settings.debug,
            log_level=settings.log_level.lower()
        )
    except ImportError:
        logger.error("❌ uvicorn not available - please install requirements.txt")
    except Exception as e:
        logger.error(f"❌ Failed to start server: {e}")
