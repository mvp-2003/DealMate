import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import asyncio

# Local module imports
try:
    from config import settings, ModelConfig
    from models import ProductURL, PricePredictionRequest, DealStackRequest, ValidationRequest, ProductAnalysisRequest
    from services import (
        get_product_details,
        predict_price_service,
        stack_deals_service,
        validate_stack_service,
        analyze_product_service,
        get_real_time_deals,
        detect_product_details,
        optimize_deals_service,
        startup_event,
        shutdown_event,
    )
except ImportError as e:
    print(f"❌ Failed to import local modules: {e}")
    print("Make sure config.py, models.py, and services.py are available")
    exit(1)

# Configure logging
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown events for the application.
    """
    logger.info("🚀 AI Service starting up...")
    await startup_event()
    yield
    logger.info("🛑 AI Service shutting down...")
    await shutdown_event()

# Initialize FastAPI app
app = FastAPI(
    title="DealPal AI Service",
    description="Provides AI-powered features for the DealPal ecosystem.",
    version="0.1.0",
    lifespan=lifespan,
)

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Endpoints ---

@app.post("/extract-product-details")
async def extract_product_details(request: ProductURL):
    """
    Extracts product details from a given URL.
    """
    try:
        details = await get_product_details(request.url)
        return details
    except Exception as e:
        logger.error(f"Error extracting product details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-price")
async def predict_price(request: PricePredictionRequest):
    """
    Predicts the future price of a product.
    """
    try:
        prediction = await predict_price_service(request)
        return prediction
    except Exception as e:
        logger.error(f"Error predicting price: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stack-deals")
async def stack_deals(request: DealStackRequest):
    """
    Finds the optimal combination of deals and coupons.
    """
    try:
        best_stack = await stack_deals_service(request)
        return best_stack
    except Exception as e:
        logger.error(f"Error stacking deals: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/validate-stack")
async def validate_stack(request: ValidationRequest):
    """
    Validates if a deal stack is applicable.
    """
    try:
        validation_result = await validate_stack_service(request)
        return validation_result
    except Exception as e:
        logger.error(f"Error validating stack: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-product")
async def analyze_product(request: ProductAnalysisRequest):
    """
    Provides a comprehensive analysis of a product.
    """
    try:
        analysis = await analyze_product_service(request)
        return analysis
    except Exception as e:
        logger.error(f"Error analyzing product: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-real-time-deals")
async def get_deals():
    """
    Fetches real-time deals.
    """
    try:
        deals = await get_real_time_deals()
        return deals
    except Exception as e:
        logger.error(f"Error fetching real-time deals: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect-product-details")
async def detect_product_details_endpoint(request: ProductURL):
    """
    Detects product details from a given URL.
    """
    try:
        details = await detect_product_details(request.url)
        return details
    except Exception as e:
        logger.error(f"Error detecting product details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/optimize-deals")
async def optimize_deals(request: DealStackRequest):
    """
    Optimizes deals to find the best stack.
    """
    try:
        optimized_deals = await optimize_deals_service(request)
        return optimized_deals
    except Exception as e:
        logger.error(f"Error optimizing deals: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    """
    Health check endpoint.
    """
    return {"status": "ok"}

if __name__ == "__main__":
    # Run the FastAPI server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level=settings.log_level.lower(),
    )
