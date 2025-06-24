from pydantic import BaseModel, Field
from typing import List, Optional

class ProductURL(BaseModel):
    url: str

class PricePredictionRequest(BaseModel):
    product_id: str
    historical_data: List[dict]

class DealStackRequest(BaseModel):
    product_price: float
    available_coupons: List[dict]
    user_preferences: Optional[dict] = None

class ValidationRequest(BaseModel):
    deal_stack: List[dict]
    product_url: str

class ProductAnalysisRequest(BaseModel):
    product_url: str

def get_model_manager():
    pass
