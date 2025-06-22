"""
DealPal Python AI Service

A FastAPI-based microservice for advanced AI-powered product detection, analysis, and enhancement.
This service provides more sophisticated AI capabilities than the browser extension's local AI.

Features:
- Advanced product detection using LLMs
- Image-based product analysis
- Sentiment analysis of reviews
- Price prediction and trend analysis
- Competitive product analysis
- Personalized recommendations
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
from stacksmart import StackSmartEngine, StackedDealResult
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
stacksmart_engine = StackSmartEngine()

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

class PricePredictionRequest(BaseModel):
    product_name: str
    current_price: float
    category: str
    historical_prices: Optional[List[Dict[str, Any]]] = None

class PricePredictionResponse(BaseModel):
    predicted_price_trend: str
    confidence: float
    price_forecast: Dict[str, float]
    recommendation: str

class StackDealsRequest(BaseModel):
    deals: List[Dict[str, Any]]
    base_price: float
    user_context: Optional[Dict[str, Any]] = None

class StackDealsResponse(BaseModel):
    optimized_deals: List[Dict[str, Any]]
    total_savings: float
    final_price: float
    original_price: float
    confidence: float
    application_order: List[str]
    warnings: List[str]
    processing_time: float

class ValidateStackRequest(BaseModel):
    deals: List[Dict[str, Any]]
    base_price: float

class ValidateStackResponse(BaseModel):
    valid: bool
    total_savings: Optional[float] = None
    final_price: Optional[float] = None
    confidence: Optional[float] = None
    warnings: List[str] = []
    error: Optional[str] = None

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
        
        # Use the product analysis service
        result = await product_service.analyze_product_page(
            url=request.url,
            page_title=request.page_title,
            text_content=request.text_content,
            structured_data=request.structured_data,
            images=request.images,
            local_ai_result=request.local_ai_result
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
        sentiments = await model_manager.analyze_sentiment(request.reviews)
        
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

@app.post("/predict-price", response_model=PricePredictionResponse)
async def predict_price(request: PricePredictionRequest):
    """
    Predict price trends and provide recommendations
    """
    try:
        logger.info(f"📈 Predicting price trend for {request.product_name}")
        
        # Simple heuristic-based prediction (can be enhanced with ML models)
        category_trends = {
            "electronics": {"volatility": 0.3, "seasonal": True},
            "fashion": {"volatility": 0.5, "seasonal": True},
            "books": {"volatility": 0.1, "seasonal": False},
            "home": {"volatility": 0.2, "seasonal": False}
        }
        
        category_info = category_trends.get(request.category.lower(), {"volatility": 0.25, "seasonal": False})
        
        # Analyze historical data if provided
        trend_direction = "stable"
        if request.historical_prices and len(request.historical_prices) > 1:
            prices = [p["price"] for p in request.historical_prices if "price" in p]
            if len(prices) > 1:
                if prices[-1] > prices[0] * 1.1:
                    trend_direction = "increasing"
                elif prices[-1] < prices[0] * 0.9:
                    trend_direction = "decreasing"
        
        # Generate forecasts based on trend and volatility
        base_price = request.current_price
        volatility = category_info["volatility"]
        
        if trend_direction == "increasing":
            multipliers = [1.02, 1.05, 1.1]
        elif trend_direction == "decreasing":
            multipliers = [0.98, 0.95, 0.9]
        else:
            multipliers = [1.0, 1.0, 1.0]
        
        price_forecast = {
            "1_week": round(base_price * multipliers[0], 2),
            "1_month": round(base_price * multipliers[1], 2),
            "3_months": round(base_price * multipliers[2], 2)
        }
        
        # Generate recommendation
        if trend_direction == "decreasing":
            recommendation = "Wait for better deals - price likely to drop"
        elif trend_direction == "increasing":
            recommendation = "Good time to buy - price may increase"
        else:
            recommendation = "Stable pricing - buy when needed"
        
        confidence = 0.7 + (0.2 if request.historical_prices else 0)
        
        return PricePredictionResponse(
            predicted_price_trend=trend_direction,
            confidence=min(confidence, 1.0),
            price_forecast=price_forecast,
            recommendation=recommendation
        )
        
    except Exception as e:
        logger.error(f"❌ Price prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stack-deals", response_model=StackDealsResponse)
async def stack_deals(request: StackDealsRequest):
    """
    Optimize deal stacking using StackSmart engine
    """
    try:
        logger.info(f"🔗 StackSmart: Optimizing {len(request.deals)} deals for base price ₹{request.base_price}")
        
        # Use StackSmart engine to optimize deals
        result = await stacksmart_engine.optimize_deals(
            available_deals=request.deals,
            base_price=request.base_price,
            user_context=request.user_context
        )
        
        # Convert Deal objects to dictionaries
        optimized_deals = []
        for deal in result.deals:
            optimized_deals.append({
                "id": deal.id,
                "title": deal.title,
                "description": deal.description,
                "deal_type": deal.deal_type.value,
                "value": deal.value,
                "value_type": deal.value_type,
                "code": deal.code,
                "platform": deal.platform,
                "confidence": deal.confidence
            })
        
        return StackDealsResponse(
            optimized_deals=optimized_deals,
            total_savings=result.total_savings,
            final_price=result.final_price,
            original_price=result.original_price,
            confidence=result.confidence,
            application_order=result.application_order,
            warnings=result.warnings,
            processing_time=result.processing_time
        )
        
    except Exception as e:
        logger.error(f"❌ Deal stacking failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/validate-stack", response_model=ValidateStackResponse)
async def validate_stack(request: ValidateStackRequest):
    """
    Validate if a specific deal stack is valid
    """
    try:
        logger.info(f"✅ Validating stack of {len(request.deals)} deals")
        
        result = await stacksmart_engine.validate_deal_stack(
            deals=request.deals,
            base_price=request.base_price
        )
        
        return ValidateStackResponse(
            valid=result["valid"],
            total_savings=result.get("total_savings"),
            final_price=result.get("final_price"),
            confidence=result.get("confidence"),
            warnings=result.get("warnings", []),
            error=result.get("error")
        )
        
    except Exception as e:
        logger.error(f"❌ Stack validation failed: {e}")
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
