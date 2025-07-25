#!/bin/bash

echo "📊 DealMate Kafka Monitoring Dashboard"
echo "======================================"

# Function to get topic info
get_topic_info() {
    local topic=$1
    echo "📋 Topic: $topic"
    
    # Get partition count
    partitions=$(docker exec dealpal-kafka-1 kafka-topics --bootstrap-server localhost:9092 --describe --topic $topic 2>/dev/null | grep "PartitionCount" | awk '{print $4}')
    
    # Get message count (approximate)
    total_messages=0
    if [ ! -z "$partitions" ]; then
        for ((i=0; i<$partitions; i++)); do
            offset=$(docker exec dealpal-kafka-1 kafka-run-class kafka.tools.GetOffsetShell --broker-list localhost:9092 --topic $topic --partition $i --time -1 2>/dev/null | cut -d: -f3)
            if [ ! -z "$offset" ] && [ "$offset" != "" ]; then
                total_messages=$((total_messages + offset))
            fi
        done
    fi
    
    echo "   Partitions: ${partitions:-0}"
    echo "   Messages: ${total_messages:-0}"
    echo ""
}

# Function to check consumer lag
check_consumer_lag() {
    echo "🔍 Consumer Group Lag Analysis"
    echo "------------------------------"
    
    # Check if consumer groups exist
    groups=$(docker exec dealpal-kafka-1 kafka-consumer-groups --bootstrap-server localhost:9092 --list 2>/dev/null | grep dealpal)
    
    if [ -z "$groups" ]; then
        echo "   No active consumer groups found"
    else
        for group in $groups; do
            echo "👥 Consumer Group: $group"
            docker exec dealpal-kafka-1 kafka-consumer-groups --bootstrap-server localhost:9092 --describe --group $group 2>/dev/null || echo "   No lag information available"
            echo ""
        done
    fi
}

# Function to show broker info
show_broker_info() {
    echo "🖥️  Kafka Broker Information"
    echo "----------------------------"
    
    # Check if Kafka is running
    if docker exec dealpal-kafka-1 kafka-broker-api-versions --bootstrap-server localhost:9092 &>/dev/null; then
        echo "✅ Kafka broker is healthy"
        
        # Get broker metadata
        metadata=$(docker exec dealpal-kafka-1 kafka-metadata-shell --snapshot /var/lib/kafka/data/__cluster_metadata-0/00000000000000000000.log --print-brokers 2>/dev/null || echo "Metadata not available")
        echo "   Metadata: Ready"
    else
        echo "❌ Kafka broker is not responding"
    fi
    echo ""
}

# Function to show recent messages
show_recent_messages() {
    local topic=$1
    local count=${2:-5}
    
    echo "📬 Recent messages from $topic (last $count):"
    echo "--------------------------------------------"
    
    timeout 3s docker exec dealpal-kafka-1 kafka-console-consumer \
        --bootstrap-server localhost:9092 \
        --topic $topic \
        --from-beginning \
        --max-messages $count 2>/dev/null || echo "   No messages or topic not found"
    echo ""
}

# Main monitoring loop
if [ "$1" = "--watch" ]; then
    while true; do
        clear
        echo "🔄 Auto-refreshing every 10 seconds... (Ctrl+C to stop)"
        echo ""
        
        show_broker_info
        
        echo "📊 Topic Statistics"
        echo "==================="
        get_topic_info "dealpal.deals"
        get_topic_info "dealpal.prices" 
        get_topic_info "dealpal.user.events"
        get_topic_info "dealpal.notifications"
        
        check_consumer_lag
        
        echo "⏰ Last updated: $(date)"
        sleep 10
    done
else
    # Single run
    show_broker_info
    
    echo "📊 Topic Statistics"
    echo "==================="
    get_topic_info "dealpal.deals"
    get_topic_info "dealpal.prices"
    get_topic_info "dealpal.user.events" 
    get_topic_info "dealpal.notifications"
    get_topic_info "dealpal.inventory"
    get_topic_info "dealpal.analytics"
    
    check_consumer_lag
    
    # Show sample messages if requested
    if [ "$1" = "--samples" ]; then
        echo "📬 Sample Messages"
        echo "=================="
        show_recent_messages "dealpal.deals" 3
        show_recent_messages "dealpal.prices" 3
        show_recent_messages "dealpal.user.events" 3
    fi
    
    echo "💡 Tips:"
    echo "   • Use --watch for continuous monitoring"
    echo "   • Use --samples to see recent messages"
    echo "   • Visit http://localhost:8080 for Kafka UI"
    echo "   • Check logs: docker-compose logs kafka"
fi
