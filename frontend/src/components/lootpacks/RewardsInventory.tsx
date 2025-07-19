"use client";

import { FC, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketPercent, Coins, Gift, Sparkles, Clock, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryItem {
  id: string;
  type: 'coupon' | 'cashback' | 'voucher' | 'points';
  title: string;
  value: string;
  description: string;
  code?: string;
  expiresAt?: Date;
  isUsed?: boolean;
  source: string;
}

// Mock inventory data
const mockInventory: InventoryItem[] = [
  {
    id: '1',
    type: 'coupon',
    title: 'Amazon 15% OFF',
    value: '15% OFF',
    description: 'Valid on Electronics & Home',
    code: 'DEAL15AZ',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    source: 'Silver Pack'
  },
  {
    id: '2',
    type: 'cashback',
    title: 'HDFC Credit Card',
    value: '10% Cashback',
    description: 'Max ₹500 on orders above ₹2000',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    source: 'Gold Pack'
  },
  {
    id: '3',
    type: 'voucher',
    title: 'Swiggy Gift Card',
    value: '₹200',
    description: 'For food orders',
    code: 'SWIG200DEAL',
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    source: 'Daily Free Pack'
  },
  {
    id: '4',
    type: 'points',
    title: 'Bonus DealCoins',
    value: '+250',
    description: 'Added to your wallet',
    isUsed: true,
    source: 'Bronze Pack'
  },
  {
    id: '5',
    type: 'coupon',
    title: 'Myntra Fashion Sale',
    value: '30% OFF',
    description: 'Min purchase ₹1500',
    code: 'FASHION30',
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    source: 'Gold Pack'
  }
];

const RewardsInventory: FC = () => {
  const [inventory] = useState(mockInventory);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const handleCopyCode = (item: InventoryItem) => {
    if (item.code) {
      navigator.clipboard.writeText(item.code);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getIcon = (type: InventoryItem['type']) => {
    switch (type) {
      case 'coupon': return TicketPercent;
      case 'cashback': return Coins;
      case 'voucher': return Gift;
      case 'points': return Sparkles;
    }
  };

  const getDaysRemaining = (expiresAt?: Date) => {
    if (!expiresAt) return null;
    const days = Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    return days;
  };

  const filterInventory = (tab: string) => {
    if (tab === 'all') return inventory;
    if (tab === 'active') return inventory.filter(item => !item.isUsed);
    if (tab === 'used') return inventory.filter(item => item.isUsed);
    return inventory.filter(item => item.type === tab);
  };

  const filteredInventory = filterInventory(activeTab);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Your Rewards Inventory</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="used">Used</TabsTrigger>
          <TabsTrigger value="coupon" className="hidden sm:block">Coupons</TabsTrigger>
          <TabsTrigger value="cashback" className="hidden sm:block">Cashback</TabsTrigger>
          <TabsTrigger value="voucher" className="hidden sm:block">Vouchers</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <div className="space-y-3">
            {filteredInventory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No rewards found in this category
              </div>
            ) : (
              filteredInventory.map((item) => {
                const Icon = getIcon(item.type);
                const daysRemaining = getDaysRemaining(item.expiresAt);
                
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "border rounded-lg p-4 transition-all",
                      item.isUsed && "opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{item.title}</h3>
                            <p className="text-lg font-bold text-primary">{item.value}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {item.source}
                            </Badge>
                            {item.isUsed && (
                              <Badge variant="secondary" className="text-xs">
                                Used
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {item.code && !item.isUsed && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyCode(item)}
                                className="gap-2"
                              >
                                {copiedId === item.id ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    {item.code}
                                  </>
                                )}
                              </Button>
                            )}
                            
                            {!item.isUsed && (
                              <Button size="sm" variant="default">
                                Use Now
                              </Button>
                            )}
                          </div>
                          
                          {daysRemaining !== null && !item.isUsed && (
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="w-3 h-3" />
                              <span className={cn(
                                daysRemaining <= 3 && "text-red-500 font-medium"
                              )}>
                                {daysRemaining === 0 ? 'Expires today' : 
                                 daysRemaining === 1 ? 'Expires tomorrow' :
                                 `${daysRemaining} days left`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold">{inventory.filter(i => !i.isUsed).length}</p>
          <p className="text-sm text-muted-foreground">Active Rewards</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">₹850</p>
          <p className="text-sm text-muted-foreground">Total Value</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{inventory.filter(i => i.isUsed).length}</p>
          <p className="text-sm text-muted-foreground">Used</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">
            {inventory.filter(i => {
              const days = getDaysRemaining(i.expiresAt);
              return days !== null && days <= 3 && !i.isUsed;
            }).length}
          </p>
          <p className="text-sm text-muted-foreground">Expiring Soon</p>
        </div>
      </div>
    </Card>
  );
};

export default RewardsInventory;
