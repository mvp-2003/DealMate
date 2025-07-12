import os
from pydantic_settings import BaseSettings
from pydantic import Field, model_validator
from dotenv import load_dotenv
import logging
import sys
from typing import ClassVar, List
from pathlib import Path

# Load environment variables from .env file in project root
project_root = Path(__file__).parent.parent.parent
env_path = project_root / ".env"
load_dotenv(env_path)

# Configure logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout,
)

class ModelConfig:
    """
    A simple configuration class for models.
    """
    pass

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """

    # Core settings
    log_level: str = Field(LOG_LEVEL, description="Logging level")
    rust_backend_url: str = Field(
        "http://localhost:8000", description="URL of the Rust backend"
    )
    debug: bool = Field(False, description="Enable debug mode")
    cors_origins: List[str] = Field(["*"], description="List of allowed CORS origins")
    api_host: str = Field("0.0.0.0", description="Host for the AI service")


    # AI Provider settings
    gemini_model: str = Field(
        "gemini-1.5-flash", description="Which Gemini model to use"
    )
    google_api_key: str = Field(..., description="API key for Google AI services")

    # Caching settings
    redis_url: str = Field("redis://localhost:6379", description="URL for Redis cache")

    # Feature flags
    enable_stacksmart: bool = Field(
        True, description="Enable or disable the StackSmart feature"
    )
    enable_price_comparison: bool = Field(
        True, description="Enable or disable price comparison"
    )

    model_config: ClassVar = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "allow",
    }

    @model_validator(mode='before')
    def load_env_vars(cls, values):
        """
        Load environment variables from .env file.
        """
        project_root = Path(__file__).parent.parent.parent
        env_path = project_root / ".env"
        load_dotenv(env_path)
        return values

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.log_settings()

    def log_settings(self):
        """
        Logs the current settings, masking sensitive information.
        """
        logger = logging.getLogger(__name__)
        logger.info("Application settings loaded:")
        for key, value in self.dict().items():
            if "key" in key.lower() or "token" in key.lower():
                logger.info(f"  {key}: {'*' * 8}")
            else:
                logger.info(f"  {key}: {value}")


# Instantiate settings
try:
    settings = Settings()
except ValueError as e:
    logging.getLogger(__name__).error(f"Configuration error: {e}")
    sys.exit(1)
