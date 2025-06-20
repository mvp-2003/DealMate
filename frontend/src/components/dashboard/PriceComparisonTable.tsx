import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PriceComparison {
  platform: string;
  price: string;
  link: string;
}

const mockComparisons: PriceComparison[] = [
  { platform: 'Amazon.in', price: '₹1,050', link: '#' },
  { platform: 'Flipkart', price: '₹1,020', link: '#' },
  { platform: 'Myntra', price: '₹1,100', link: '#' },
];

export default function PriceComparisonTable({ comparisons = mockComparisons }: { comparisons?: PriceComparison[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md">Price Comparison</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparisons.map((item) => (
              <TableRow key={item.platform}>
                <TableCell className="font-medium">{item.platform}</TableCell>
                <TableCell>{item.price}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" asChild>
                    <a href={item.link} target="_blank" rel="noopener noreferrer" aria-label={`View on ${item.platform}`}>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
