import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  imageUrl = "https://placehold.co/300x300.png",
  title,
  currentPrice,
  originalPrice,
  discount,
  platform
}: ProductInfoCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <Image
          src={imageUrl}
          alt={title}
          width={300}
          height={200}
          className="w-full h-40 object-cover"
          data-ai-hint="product image"
        />
      </CardHeader>
      <CardContent className="p-4">
        <Badge variant="secondary" className="mb-2">{platform}</Badge>
        <CardTitle className="text-lg font-semibold mb-1 leading-tight">{title}</CardTitle>
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-2xl font-bold text-primary">{currentPrice}</p>
          {originalPrice && <p className="text-sm text-muted-foreground line-through">{originalPrice}</p>}
        </div>
        {discount && <Badge variant="destructive">{discount} OFF</Badge>}
      </CardContent>
    </Card>
  );
}
