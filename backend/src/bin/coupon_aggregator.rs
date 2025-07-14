use dealpal_backend::coupon_aggregator::CouponAggregator;
use dealpal_backend::db;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::from_filename("../.env").expect(".env file not found");
    tracing_subscriber::fmt::init();
    
    let pool = db::create_pool().await?;
    let aggregator = CouponAggregator::new(pool);
    
    println!("🎯 DealPal Coupon Aggregator starting...");
    
    loop {
        println!("🔄 Starting coupon aggregation cycle...");
        
        if let Err(e) = aggregator.aggregate_from_affiliate_networks().await {
            eprintln!("❌ Error aggregating from affiliate networks: {}", e);
        }
        
        if let Err(e) = aggregator.scrape_merchant_sites().await {
            eprintln!("❌ Error scraping merchant sites: {}", e);
        }
        
        match aggregator.cleanup_expired_coupons().await {
            Ok(count) => println!("🧹 Cleaned up {} expired coupons", count),
            Err(e) => eprintln!("❌ Error cleaning up expired coupons: {}", e),
        }
        
        println!("✅ Aggregation cycle complete. Waiting 1 hour...");
        sleep(Duration::from_secs(3600)).await;
    }
}