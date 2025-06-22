"""
Configuration management for DealPal AI Service
"""

import os
from typing import List, Optional
try:
    from pydantic_settings import BaseSettings
    from pydantic import Field
except ImportError:
    from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Service Configuration
    api_host: str = Field(default="0.0.0.0", env="API_HOST")
    api_port: int = Field(default=8001, env="API_PORT")
    debug: bool = Field(default=False, env="DEBUG")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Google Gemini Configuration
    google_api_key: Optional[str] = Field(default=None, env="GOOGLE_API_KEY")
    gemini_model: str = Field(default="gemini-1.5-flash", env="GEMINI_MODEL")
    gemini_max_tokens: int = Field(default=1000, env="GEMINI_MAX_TOKENS")
    
    # Database Configuration
    postgres_url: Optional[str] = Field(default=None, env="POSTGRES_URL")
    database_url: Optional[str] = Field(default=None, env="DATABASE_URL")
    
    # Redis Configuration
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    redis_ttl: int = Field(default=3600, env="REDIS_TTL")
    
    # AI Model Configuration
    huggingface_cache_dir: str = Field(default="/tmp/huggingface_cache", env="HUGGINGFACE_CACHE_DIR")
    torch_cache_dir: str = Field(default="/tmp/torch_cache", env="TORCH_CACHE_DIR")
    
    # Rate Limiting
    rate_limit_requests_per_minute: int = Field(default=100, env="RATE_LIMIT_REQUESTS_PER_MINUTE")
    rate_limit_burst: int = Field(default=20, env="RATE_LIMIT_BURST")
    
    # Security
    api_key_header: str = Field(default="X-API-Key", env="API_KEY_HEADER")
    allowed_origins: str = Field(
        default="http://localhost:3000,http://localhost:8000,chrome-extension://*",
        env="ALLOWED_ORIGINS"
    )
    
    # Performance
    max_workers: int = Field(default=4, env="MAX_WORKERS")
    max_concurrent_requests: int = Field(default=10, env="MAX_CONCURRENT_REQUESTS")
    request_timeout: int = Field(default=30, env="REQUEST_TIMEOUT")
    
    # Feature Flags
    enable_image_analysis: bool = Field(default=True, env="ENABLE_IMAGE_ANALYSIS")
    enable_gemini_enhancement: bool = Field(default=True, env="ENABLE_GEMINI_ENHANCEMENT")
    enable_sentiment_analysis: bool = Field(default=True, env="ENABLE_SENTIMENT_ANALYSIS")
    enable_price_prediction: bool = Field(default=True, env="ENABLE_PRICE_PREDICTION")
    
    # Monitoring
    enable_metrics: bool = Field(default=True, env="ENABLE_METRICS")
    metrics_port: int = Field(default=8002, env="METRICS_PORT")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # No need for heavy cache directories with Gemini-only approach
    
    @property
    def db_url(self) -> Optional[str]:
        """Get database URL (prefer DATABASE_URL over POSTGRES_URL)"""
        return self.database_url or self.postgres_url
    
    @property
    def has_gemini_key(self) -> bool:
        """Check if Google Gemini API key is configured"""
        return self.google_api_key is not None and len(self.google_api_key.strip()) > 0
    
    @property
    def gemini_api_key(self) -> Optional[str]:
        """Get Gemini API key"""
        return self.google_api_key
    
    @property
    def cors_origins(self) -> List[str]:
        """Get CORS origins as list"""
        if isinstance(self.allowed_origins, str):
            return [origin.strip() for origin in self.allowed_origins.split(",")]
        return self.allowed_origins


# Global settings instance
settings = Settings()


# Model configuration
class ModelConfig:
    """Configuration for AI models"""
    
    # Sentiment Analysis
    SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"
    
    # Text Classification
    TEXT_CLASSIFIER_MODEL = "facebook/bart-large-mnli"
    
    # Embeddings
    EMBEDDINGS_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
    
    # Computer Vision (future)
    IMAGE_CLASSIFIER_MODEL = "microsoft/resnet-50"
    
    # OCR (future)
    OCR_MODEL = "microsoft/trocr-base-printed"
    
    # Product categories for classification
    PRODUCT_CATEGORIES = [
        "electronics", "computers", "phones", "tablets",
        "fashion", "clothing", "shoes", "accessories",
        "home", "furniture", "kitchen", "appliances",
        "books", "media", "entertainment",
        "sports", "outdoors", "fitness",
        "beauty", "health", "personal care",
        "automotive", "tools", "industrial",
        "toys", "games", "hobbies",
        "food", "grocery", "beverages"
    ]
    
    # E-commerce indicators
    ECOMMERCE_LABELS = [
        "product page", "shopping page", "e-commerce", 
        "catalog page", "product listing", "item details",
        "buy page", "purchase page", "checkout page"
    ]
    
    # Non-product page labels
    NON_PRODUCT_LABELS = [
        "news article", "blog post", "about page",
        "contact page", "help page", "category page",
        "search results", "home page"
    ]


# Export configuration
__all__ = ["settings", "ModelConfig"]
