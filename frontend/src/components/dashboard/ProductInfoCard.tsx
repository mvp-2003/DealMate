
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
    <Card className="overflow-hidden neumorphic-card floating-card w-full">
      <CardHeader className="p-0 relative">
        <Image
          src={imageUrl}
          alt={title}
          width={300}
          height={180}
          className="w-full h-32 sm:h-36 md:h-40 object-cover" // Responsive height
          data-ai-hint="product e-commerce"
          priority
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="glass-card text-xs px-2 py-1">{platform}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        <CardTitle className="text-sm sm:text-lg font-semibold leading-tight text-foreground line-clamp-2">{title}</CardTitle>
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-lg sm:text-xl font-bold text-primary">{currentPrice}</p>
          {originalPrice && <p className="text-xs sm:text-sm text-muted-foreground line-through">{originalPrice}</p>}
        </div>
        {discount && (
          <Badge variant="destructive" className="gradient-border text-xs px-2 py-1 shadow-lg">
            {discount} OFF
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
