'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingDown } from 'lucide-react';

const mockChartData = [
  { date: 'Jan 1', price: 1200 },
  { date: 'Jan 8', price: 1150 },
  { date: 'Jan 15', price: 1180 },
  { date: 'Jan 22', price: 1100 },
  { date: 'Jan 29', price: 1050 },
  { date: 'Feb 5', price: 1080 },
];

const chartConfig = {
  price: {
    label: "Price (₹)",
    color: "hsl(var(--primary))",
  },
};

export default function PriceHistoryChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          Price History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[150px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockChartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={10} tickFormatter={(value) => `₹${value}`} />
              <RechartsTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" labelKey="price" hideLabel />}
              />
              <Line dataKey="price" type="monotone" stroke="var(--color-price)" strokeWidth={2} dot={true} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
