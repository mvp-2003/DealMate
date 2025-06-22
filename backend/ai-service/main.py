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
