
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProductInfoCardProps {
  imageUrl?: string;
  title: string;
  currentPrice: string;
  originalPrice?: string;
  discount?: string;
  platform: string;
}

export default function ProductInfoCard({
  imageUrl = "https://placehold.co/300x200.png", // Default placeholder
  title,
  currentPrice,
  originalPrice,
  discount,
  platform
}: ProductInfoCardProps) {
  return (
    <Card className="overflow-hidden shadow-xl ring-1 ring-border/30 neumorphic-card">
      <CardHeader className="p-0">
        <Image
          src={imageUrl}
          alt={title}
          width={375}
          height={200}
          className="w-full h-48 object-cover" // Adjusted size
          data-ai-hint="product e-commerce"
          priority
        />
      </CardHeader>
      <CardContent className="p-4">
        <Badge variant="secondary" className="mb-2">{platform}</Badge>
        <CardTitle className="text-xl font-semibold mb-1 leading-tight text-foreground">{title}</CardTitle>
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-2xl font-bold text-primary">{currentPrice}</p>
          {originalPrice && <p className="text-sm text-muted-foreground line-through">{originalPrice}</p>}
        </div>
        {discount && <Badge variant="destructive" className="shadow-md">{discount} OFF</Badge>}
      </CardContent>
    </Card>
  );
}
