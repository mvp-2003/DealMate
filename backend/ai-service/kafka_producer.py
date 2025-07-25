"""
Kafka event producer for DealMate AI Service
Handles publishing AI-related events to Kafka topics
"""

import json
import logging
import os
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict, field

from confluent_kafka import Producer
from confluent_kafka.cimpl import Message

logger = logging.getLogger(__name__)


class AIEventType(Enum):
    """AI-specific event types"""
    PRODUCT_DETECTED = "PRODUCT_DETECTED"
    SENTIMENT_ANALYZED = "SENTIMENT_ANALYZED"
    PRICE_PREDICTED = "PRICE_PREDICTED"
    RECOMMENDATION_GENERATED = "RECOMMENDATION_GENERATED"
    ML_MODEL_UPDATED = "ML_MODEL_UPDATED"


class AnalysisResult(Enum):
    """Analysis result status"""
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    PARTIAL = "PARTIAL"


@dataclass
class AIEvent:
    """Base AI event structure"""
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: int = field(default_factory=lambda: int(datetime.now(timezone.utc).timestamp() * 1000))
    event_type: AIEventType = AIEventType.PRODUCT_DETECTED
    source: str = "dealmate-ai-service"
    metadata: Dict[str, Any] = field(default_factory=lambda: {})


@dataclass
class ProductDetectionEvent(AIEvent):
    """Event for product detection results"""
    product_id: str = ""
    url: str = ""
    title: str = ""
    description: str = ""
    price: float = 0.0
    currency: str = "USD"
    retailer: str = ""
    category: str = ""
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    image_urls: List[str] = field(default_factory=lambda: [])
    confidence_score: float = 0.0
    analysis_result: AnalysisResult = AnalysisResult.SUCCESS
    processing_time_ms: int = 0


@dataclass
class SentimentAnalysisEvent(AIEvent):
    """Event for sentiment analysis results"""
    product_id: str = ""
    review_count: int = 0
    average_sentiment: float = 0.0  # -1 to 1
    positive_reviews: int = 0
    negative_reviews: int = 0
    neutral_reviews: int = 0
    key_aspects: List[str] = field(default_factory=lambda: [])
    sentiment_summary: str = ""
    confidence_score: float = 0.0
    analysis_result: AnalysisResult = AnalysisResult.SUCCESS
    processing_time_ms: int = 0


@dataclass
class PricePredictionEvent(AIEvent):
    """Event for price prediction results"""
    product_id: str = ""
    current_price: float = 0.0
    predicted_prices: Dict[str, float] = field(default_factory=lambda: {})  # timeframe -> price
    price_trend: str = "STABLE"  # INCREASING, DECREASING, STABLE
    best_time_to_buy: str = ""  # e.g., "next_week", "wait_for_sale"
    confidence_score: float = 0.0
    model_version: str = "v1.0"
    analysis_result: AnalysisResult = AnalysisResult.SUCCESS
    processing_time_ms: int = 0


@dataclass
class RecommendationEvent(AIEvent):
    """Event for recommendation generation"""
    user_id: Optional[str] = None
    session_id: str = ""
    recommendations: List[Dict[str, Any]] = field(default_factory=lambda: [])
    recommendation_type: str = "DEAL_RECOMMENDATION"
    algorithm_used: str = "collaborative_filtering"
    confidence_score: float = 0.0
    personalization_factors: List[str] = field(default_factory=lambda: [])


class KafkaAIProducer:
    """Kafka producer for AI service events"""
    
    def __init__(self):
        self.brokers = os.getenv("KAFKA_BROKERS", "localhost:9092")
        self.schema_registry_url = os.getenv("KAFKA_SCHEMA_REGISTRY", "http://localhost:8081")
        
        # Kafka producer configuration
        producer_config: Dict[str, Any] = {
            'bootstrap.servers': self.brokers,
            'client.id': 'dealmate-ai-service',
            'acks': '1',
            'retries': 3,
            'retry.backoff.ms': 100,
            'compression.type': 'lz4',
            'batch.size': 16384,
            'linger.ms': 5,
            'message.timeout.ms': 5000,
        }
        
        self.producer: Producer = Producer(producer_config)
        
        # Topic names
        self.topics = {
            'ai_events': os.getenv("KAFKA_TOPIC_AI_EVENTS", "dealmate.ai.events"),
            'product_detection': os.getenv("KAFKA_TOPIC_PRODUCT_DETECTION", "dealmate.ai.product.detection"),
            'sentiment_analysis': os.getenv("KAFKA_TOPIC_SENTIMENT", "dealmate.ai.sentiment"),
            'price_prediction': os.getenv("KAFKA_TOPIC_PRICE_PREDICTION", "dealmate.ai.price.prediction"),
            'recommendations': os.getenv("KAFKA_TOPIC_RECOMMENDATIONS", "dealmate.ai.recommendations"),
        }
        
        logger.info(f"Kafka AI Producer initialized with brokers: {self.brokers}")
    
    def _delivery_callback(self, err: Optional[Exception], msg: Optional[Message]):
        """Callback for message delivery reports"""
        if err is not None:
            logger.error(f"Message delivery failed: {err}")
        elif msg is not None:
            logger.info(f"Message delivered to topic {msg.topic()} partition {msg.partition()} offset {msg.offset()}")
    
    async def publish_product_detection_event(self, event: ProductDetectionEvent) -> bool:
        """Publish product detection event"""
        try:
            event.event_type = AIEventType.PRODUCT_DETECTED
            message_data = json.dumps(asdict(event), default=str)
            
            self.producer.produce(  # type: ignore
                topic=self.topics['product_detection'],
                key=event.product_id,
                value=message_data,
                on_delivery=self._delivery_callback
            )
            
            self.producer.poll(0)  # Trigger delivery callback
            logger.info(f"Product detection event published for product: {event.product_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to publish product detection event: {e}")
            return False
    
    async def publish_sentiment_analysis_event(self, event: SentimentAnalysisEvent) -> bool:
        """Publish sentiment analysis event"""
        try:
            event.event_type = AIEventType.SENTIMENT_ANALYZED
            message_data = json.dumps(asdict(event), default=str)
            
            self.producer.produce(  # type: ignore
                topic=self.topics['sentiment_analysis'],
                key=event.product_id,
                value=message_data,
                on_delivery=self._delivery_callback
            )
            
            self.producer.poll(0)
            logger.info(f"Sentiment analysis event published for product: {event.product_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to publish sentiment analysis event: {e}")
            return False
    
    async def publish_price_prediction_event(self, event: PricePredictionEvent) -> bool:
        """Publish price prediction event"""
        try:
            event.event_type = AIEventType.PRICE_PREDICTED
            message_data = json.dumps(asdict(event), default=str)
            
            self.producer.produce(  # type: ignore
                topic=self.topics['price_prediction'],
                key=event.product_id,
                value=message_data,
                on_delivery=self._delivery_callback
            )
            
            self.producer.poll(0)
            logger.info(f"Price prediction event published for product: {event.product_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to publish price prediction event: {e}")
            return False
    
    async def publish_recommendation_event(self, event: RecommendationEvent) -> bool:
        """Publish recommendation event"""
        try:
            event.event_type = AIEventType.RECOMMENDATION_GENERATED
            message_data = json.dumps(asdict(event), default=str)
            
            key = event.user_id or event.session_id
            self.producer.produce(  # type: ignore
                topic=self.topics['recommendations'],
                key=key,
                value=message_data,
                on_delivery=self._delivery_callback
            )
            
            self.producer.poll(0)
            logger.info(f"Recommendation event published for user/session: {key}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to publish recommendation event: {e}")
            return False
    
    def flush(self, timeout: float = 10.0) -> bool:
        """Flush all pending messages"""
        try:
            remaining = self.producer.flush(timeout)
            if remaining > 0:
                logger.warning(f"{remaining} messages still in queue after flush")
                return False
            return True
        except Exception as e:
            logger.error(f"Error flushing producer: {e}")
            return False
    
    def close(self):
        """Close the producer"""
        try:
            self.producer.flush(10.0)
            logger.info("Kafka AI Producer closed successfully")
        except Exception as e:
            logger.error(f"Error closing producer: {e}")
    
    def health_check(self) -> bool:
        """Health check for Kafka connectivity"""
        try:
            # Get cluster metadata as a health check
            self.producer.list_topics(timeout=5)
            logger.info("Kafka AI Producer health check: OK")
            return True
        except Exception as e:
            logger.warning(f"Kafka AI Producer health check failed: {e}")
            return False


# Global producer instance
_kafka_producer: Optional[KafkaAIProducer] = None

def get_kafka_producer() -> KafkaAIProducer:
    """Get the global Kafka producer instance"""
    global _kafka_producer
    if _kafka_producer is None:
        _kafka_producer = KafkaAIProducer()
    return _kafka_producer

def close_kafka_producer():
    """Close the global Kafka producer"""
    global _kafka_producer
    if _kafka_producer is not None:
        _kafka_producer.close()
        _kafka_producer = None
