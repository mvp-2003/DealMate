'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { CreateCardRequest } from '@/types/card-vault';
import { Save, Plus, Trash2 } from 'lucide-react';

const cardFormSchema = z.object({
  bankName: z.string().min(2, { message: "Bank name is required" }),
  cardType: z.string().min(2, { message: "Card type is required" }),
  cardNetwork: z.string().optional(),
  lastFourDigits: z.string().length(4).optional().or(z.literal('')),
  nickname: z.string().optional(),
  
  baseRewardRate: z.number().min(0).optional(),
  rewardType: z.enum(['points', 'cashback', 'miles']).optional(),
  pointValueInr: z.number().min(0).optional(),
  
  annualFee: z.number().min(0).optional(),
  feeWaiverCriteria: z.string().optional(),
  currentPoints: z.number().int().min(0).optional(),
});

interface CardVaultFormProps {
  onSubmit: (data: CreateCardRequest) => Promise<void>;
  initialData?: Partial<CreateCardRequest>;
  isLoading?: boolean;
}

export default function CardVaultForm({ onSubmit, initialData, isLoading }: CardVaultFormProps) {
  const [categoryRewards, setCategoryRewards] = useState<Record<string, number>>(
    initialData?.categoryRewards || {}
  );
  const [milestones, setMilestones] = useState(initialData?.milestoneConfig || []);
  const [features, setFeatures] = useState(initialData?.features || {});
  
  const form = useForm<z.infer<typeof cardFormSchema>>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      bankName: initialData?.bankName || "",
      cardType: initialData?.cardType || "",
      cardNetwork: initialData?.cardNetwork || "",
      lastFourDigits: initialData?.lastFourDigits || "",
      nickname: initialData?.nickname || "",
      baseRewardRate: initialData?.baseRewardRate || 0,
      rewardType: initialData?.rewardType || 'points',
      pointValueInr: initialData?.pointValueInr || 0,
      annualFee: initialData?.annualFee || 0,
      feeWaiverCriteria: initialData?.feeWaiverCriteria || "",
      currentPoints: initialData?.currentPoints || 0,
    },
  });

  const processSubmit = async (values: z.infer<typeof cardFormSchema>) => {
    const submitData: CreateCardRequest = {
      ...values,
      categoryRewards: Object.keys(categoryRewards).length > 0 ? categoryRewards : undefined,
      milestoneConfig: milestones.length > 0 ? milestones : undefined,
      features: Object.keys(features).length > 0 ? features : undefined,
    };
    await onSubmit(submitData);
  };

  const addCategoryReward = () => {
    const category = prompt('Enter category name (e.g., dining, travel, fuel):');
    if (category) {
      const rate = prompt('Enter reward rate (e.g., 5 for 5%):');
      if (rate) {
        setCategoryRewards({ ...categoryRewards, [category]: parseFloat(rate) });
      }
    }
  };

  const removeCategoryReward = (category: string) => {
    const updated = { ...categoryRewards };
    delete updated[category];
    setCategoryRewards(updated);
  };

  const addMilestone = () => {
    const threshold = prompt('Enter points threshold:');
    if (threshold) {
      const value = prompt('Enter reward value in ₹:');
      if (value) {
        setMilestones([...milestones, {
          threshold: parseInt(threshold),
          rewardValue: parseFloat(value),
        }]);
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(processSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Name*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., HDFC, ICICI" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cardType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Card Type*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Infinia, Millennia" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cardNetwork"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Card Network</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select network" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">Mastercard</SelectItem>
                    <SelectItem value="rupay">RuPay</SelectItem>
                    <SelectItem value="amex">American Express</SelectItem>
                    <SelectItem value="diners">Diners Club</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastFourDigits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last 4 Digits</FormLabel>
                <FormControl>
                  <Input type="text" maxLength={4} placeholder="1234" {...field} />
                </FormControl>
                <FormDescription>Optional, for identification</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Card Nickname</FormLabel>
              <FormControl>
                <Input placeholder="e.g., My Travel Card" {...field} />
              </FormControl>
              <FormDescription>Optional friendly name</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Reward Structure</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="rewardType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reward Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="points">Points</SelectItem>
                      <SelectItem value="cashback">Cashback</SelectItem>
                      <SelectItem value="miles">Miles</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="baseRewardRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Rate</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1" 
                      placeholder="e.g., 1.5" 
                      {...field} 
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>Per ₹ spent</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pointValueInr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Point Value (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="e.g., 0.25" 
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>1 point = ?₹</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Category Rewards */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Category Bonuses</h3>
            <Button type="button" variant="outline" size="sm" onClick={addCategoryReward}>
              <Plus className="mr-1 h-3 w-3" />
              Add Category
            </Button>
          </div>
          {Object.keys(categoryRewards).length > 0 && (
            <div className="space-y-2">
              {Object.entries(categoryRewards).map(([category, rate]) => (
                <div key={category} className="flex justify-between items-center p-2 border rounded">
                  <span className="capitalize">{category}: {rate}%</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCategoryReward(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Milestone Rewards</h3>
            <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
              <Plus className="mr-1 h-3 w-3" />
              Add Milestone
            </Button>
          </div>
          {milestones.length > 0 && (
            <div className="space-y-2">
              {milestones.map((milestone, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 border rounded">
                  <span>{milestone.threshold.toLocaleString()} pts → ₹{milestone.rewardValue}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setMilestones(milestones.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card Features */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Card Features</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'loungeAccess', label: 'Lounge Access' },
              { key: 'fuelSurchargeWaiver', label: 'Fuel Surcharge Waiver' },
              { key: 'golfAccess', label: 'Golf Access' },
              { key: 'concierge', label: 'Concierge Service' },
              { key: 'insuranceCover', label: 'Insurance Cover' },
              { key: 'noForexMarkup', label: 'No Forex Markup' },
            ].map(feature => (
              <div key={feature.key} className="flex items-center space-x-2">
                <Switch
                  checked={features[feature.key] || false}
                  onCheckedChange={(checked) => 
                    setFeatures({ ...features, [feature.key]: checked })
                  }
                />
                <Label>{feature.label}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <FormField
            control={form.control}
            name="annualFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual Fee (₹)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="e.g., 5000" 
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currentPoints"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Points</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="e.g., 10000" 
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Saving..." : "Save Card"}
        </Button>
      </form>
    </Form>
  );
}
