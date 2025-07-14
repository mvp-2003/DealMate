from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ProductURL(BaseModel):
    url: str

class PricePredictionRequest(BaseModel):
    product_id: str
    historical_data: List[Dict[Any, Any]]

class DealStackRequest(BaseModel):
    product_price: float
    available_coupons: List[Dict[Any, Any]]
    user_preferences: Optional[Dict[Any, Any]] = None

class ValidationRequest(BaseModel):
    deal_stack: List[Dict[Any, Any]]
    product_url: str

class ProductAnalysisRequest(BaseModel):
    product_url: str

def get_model_manager():
    pass
