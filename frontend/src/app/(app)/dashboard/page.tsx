
import ProductInfoCard from '@/components/dashboard/ProductInfoCard';
import PriceComparisonTable from '@/components/dashboard/PriceComparisonTable';
import OffersList from '@/components/dashboard/OffersList';
import SavingsScore from '@/components/dashboard/SavingsScore';
import PriceHistoryChart from '@/components/dashboard/PriceHistoryChart';
import MonthlySavingsChart from '@/components/dashboard/MonthlySavingsChart'; // New Chart
import { TicketPercent, CreditCard } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6"> {/* Increased spacing */}
      <ProductInfoCard
        title="Cool Gadget Pro X"
        currentPrice="₹999"
        originalPrice="₹1,299"
        discount="23%"
        platform="Amazon.in"
        imageUrl="https://placehold.co/600x400.png"
      />
      
      <SavingsScore score="₹300" percentageOff="23%" />

      <div className="grid md:grid-cols-2 gap-6"> {/* Grid for charts */}
        <PriceHistoryChart />
        <MonthlySavingsChart />
      </div>
      

      <PriceComparisonTable />

      <div className="grid md:grid-cols-2 gap-6"> {/* Grid for offer lists */}
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
      
      <p className="text-xs text-center text-muted-foreground pt-4">
        Product data for demonstration purposes. Prices and offers may vary.
      </p>
    </div>
  );
}
