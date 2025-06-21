
import ProductInfoCard from '@/components/dashboard/ProductInfoCard';
import PriceComparisonTable from '@/components/dashboard/PriceComparisonTable';
import OffersList from '@/components/dashboard/OffersList';
import SavingsScore from '@/components/dashboard/SavingsScore';
import PriceHistoryChart from '@/components/dashboard/PriceHistoryChart';
import MonthlySavingsChart from '@/components/dashboard/MonthlySavingsChart'; // New Chart
import { TicketPercent, CreditCard } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Hero Section with Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProductInfoCard
            title="Cool Gadget Pro X"
            currentPrice="₹999"
            originalPrice="₹1,299"
            discount="23%"
            platform="Amazon.in"
            imageUrl="https://placehold.co/600x400.png"
          />
          <ProductInfoCard
            title="Smart Headphones Ultra"
            currentPrice="₹1,499"
            originalPrice="₹2,299"
            discount="35%"
            platform="Flipkart"
            imageUrl="https://placehold.co/600x400.png"
          />
          <ProductInfoCard
            title="Wireless Speaker Pro"
            currentPrice="₹799"
            originalPrice="₹1,199"
            discount="33%"
            platform="Myntra"
            imageUrl="https://placehold.co/600x400.png"
          />
        </div>
        
        {/* Savings Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <SavingsScore score="₹300" percentageOff="23%" />
          </div>
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            <PriceHistoryChart />
            <MonthlySavingsChart />
          </div>
        </div>

        {/* Price Comparison */}
        <div className="glass-card p-6">
          <PriceComparisonTable />
        </div>

        {/* Offers Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <OffersList title="Available Coupons" icon={TicketPercent} offers={[
              { type: 'coupon', description: 'WELCOME50', value: '₹50 OFF' },
              { type: 'coupon', description: 'GADGET10', value: '10% OFF' },
            ]}
          />
          
          <OffersList title="Cashback Offers" icon={CreditCard} offers={[
              { type: 'cashback', description: 'ICICI Credit Card', value: '5% Back' },
              { type: 'cashback', description: 'Paytm Wallet', value: '₹25 CB' },
            ]}
          />
        </div>
        
        <p className="text-xs text-center text-muted-foreground/60 pt-4">
          Product data for demonstration purposes. Prices and offers may vary.
        </p>
      </div>
    </div>
  );
}
