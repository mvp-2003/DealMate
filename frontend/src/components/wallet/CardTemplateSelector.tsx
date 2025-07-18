'use client';

import { CardTemplate } from '@/types/card-vault';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Star, TrendingUp } from 'lucide-react';

interface CardTemplateSelectorProps {
  templates: CardTemplate[];
  onSelectTemplate: (template: CardTemplate) => void;
}

export default function CardTemplateSelector({ templates, onSelectTemplate }: CardTemplateSelectorProps) {
  const popularCards = [
    {
      bank: 'HDFC',
      card: 'Infinia',
      highlights: ['3.3% base rewards', '16.5% on SmartBuy', 'Unlimited lounge access'],
      recommended: true,
    },
    {
      bank: 'Axis',
      card: 'Magnus',
      highlights: ['4.8% base rewards', '25% milestone bonus', 'Golf & concierge'],
      recommended: true,
    },
    {
      bank: 'SBI',
      card: 'Cashback',
      highlights: ['5% online cashback', 'No reward caps', 'Low annual fee'],
      recommended: false,
    },
    {
      bank: 'ICICI',
      card: 'Amazon Pay',
      highlights: ['5% Amazon cashback', '2% on bills', '1% others'],
      recommended: false,
    },
    {
      bank: 'Amex',
      card: 'Membership Rewards',
      highlights: ['Flexible points', 'Transfer partners', 'Premium benefits'],
      recommended: false,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">Popular Credit Cards</h3>
        <p className="text-sm text-muted-foreground">
          Select from popular cards to quickly add with pre-configured reward structures
        </p>
      </div>

      <div className="grid gap-4">
        {templates.map((template, idx) => {
          const info = popularCards.find(
            p => p.bank === template.bankName && p.card === template.cardType
          );
          
          return (
            <Card key={idx} className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {template.bankName} {template.cardType}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {template.cardNetwork} • ₹{template.annualFee} annual fee
                    </CardDescription>
                  </div>
                  {info?.recommended && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Popular
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Reward Structure */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Base Reward:</span>
                  <span className="font-medium">
                    {template.rewardType === 'cashback' 
                      ? `${template.baseRewardRate}% cashback`
                      : `${template.baseRewardRate} pts/₹`
                    }
                  </span>
                </div>

                {/* Category Rewards */}
                {Object.keys(template.categoryRewards).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Category Bonuses:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(template.categoryRewards).map(([cat, rate]) => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {cat}: {rate}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Highlights */}
                {info?.highlights && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Key Benefits:</p>
                    <ul className="text-sm space-y-1">
                      {info.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <TrendingUp className="h-3 w-3 mt-0.5 text-green-600" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Features */}
                <div className="flex flex-wrap gap-1">
                  {Object.entries(template.features)
                    .filter(([_, enabled]) => enabled)
                    .slice(0, 3)
                    .map(([feature]) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature.replace(/([A-Z])/g, ' $1').trim()}
                      </Badge>
                    ))}
                  {Object.keys(template.features).filter(k => template.features[k]).length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{Object.keys(template.features).filter(k => template.features[k]).length - 3} more
                    </Badge>
                  )}
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => onSelectTemplate(template)}
                >
                  Add This Card
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No card templates available</p>
        </div>
      )}
    </div>
  );
}
