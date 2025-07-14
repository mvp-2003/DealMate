#!/bin/bash

echo "🚀 Setting up Apache Kafka for DealPal..."

# Create Kafka topics for DealPal
echo "📋 Creating Kafka topics..."

# Wait for Kafka to be ready
echo "⏳ Waiting for Kafka to be ready..."
until docker exec dealpal-kafka-1 kafka-topics --bootstrap-server localhost:9092 --list > /dev/null 2>&1; do
    echo "   Kafka not ready, waiting..."
    sleep 5
done

echo "✅ Kafka is ready! Creating topics..."

# Create main topics
docker exec dealpal-kafka-1 kafka-topics --create \
    --bootstrap-server localhost:9092 \
    --topic dealpal.deals \
    --partitions 6 \
    --replication-factor 1 \
    --config retention.ms=604800000 \
    --config compression.type=lz4

docker exec dealpal-kafka-1 kafka-topics --create \
    --bootstrap-server localhost:9092 \
    --topic dealpal.prices \
    --partitions 6 \
    --replication-factor 1 \
    --config retention.ms=2592000000 \
    --config compression.type=lz4

docker exec dealpal-kafka-1 kafka-topics --create \
    --bootstrap-server localhost:9092 \
    --topic dealpal.user.events \
    --partitions 8 \
    --replication-factor 1 \
    --config retention.ms=1209600000 \
    --config compression.type=lz4

docker exec dealpal-kafka-1 kafka-topics --create \
    --bootstrap-server localhost:9092 \
    --topic dealpal.notifications \
    --partitions 4 \
    --replication-factor 1 \
    --config retention.ms=259200000 \
    --config compression.type=lz4

docker exec dealpal-kafka-1 kafka-topics --create \
    --bootstrap-server localhost:9092 \
    --topic dealpal.inventory \
    --partitions 4 \
    --replication-factor 1 \
    --config retention.ms=604800000 \
    --config compression.type=lz4

docker exec dealpal-kafka-1 kafka-topics --create \
    --bootstrap-server localhost:9092 \
    --topic dealpal.analytics \
    --partitions 3 \
    --replication-factor 1 \
    --config retention.ms=2592000000 \
    --config compression.type=lz4

# Create enriched topics for processed data
docker exec dealpal-kafka-1 kafka-topics --create \
    --bootstrap-server localhost:9092 \
    --topic dealpal.enriched.deals \
    --partitions 6 \
    --replication-factor 1 \
    --config retention.ms=604800000 \
    --config compression.type=lz4

docker exec dealpal-kafka-1 kafka-topics --create \
    --bootstrap-server localhost:9092 \
    --topic dealpal.price.trends \
    --partitions 4 \
    --replication-factor 1 \
    --config retention.ms=2592000000 \
    --config compression.type=lz4

# Create dead letter topics for error handling
docker exec dealpal-kafka-1 kafka-topics --create \
    --bootstrap-server localhost:9092 \
    --topic dealpal.deals.dlq \
    --partitions 2 \
    --replication-factor 1 \
    --config retention.ms=604800000

docker exec dealpal-kafka-1 kafka-topics --create \
    --bootstrap-server localhost:9092 \
    --topic dealpal.prices.dlq \
    --partitions 2 \
    --replication-factor 1 \
    --config retention.ms=604800000

echo ""
echo "📊 Created topics:"
docker exec dealpal-kafka-1 kafka-topics --bootstrap-server localhost:9092 --list | grep dealpal

echo ""
echo "✅ Kafka setup completed!"
echo "🌐 Kafka UI: http://localhost:8080"
echo "🔧 Schema Registry: http://localhost:8081"
echo "🔌 Kafka Connect: http://localhost:8083"
echo ""
echo "📋 Topic retention policies:"
echo "   • dealpal.deals: 7 days"
echo "   • dealpal.prices: 30 days"
echo "   • dealpal.user.events: 14 days"
echo "   • dealpal.notifications: 3 days"
echo "   • dealpal.inventory: 7 days"
echo "   • dealpal.analytics: 30 days"
