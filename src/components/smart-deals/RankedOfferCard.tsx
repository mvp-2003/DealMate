'use client';

import type { RankedOffer } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Info, Sparkles, MessageCircleQuestion } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from 'react';
import { handleExplainDealRank } from '@/app/actions'; // We'll create this action
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RankedOfferCardProps {
  offer: RankedOffer;
}

export default function RankedOfferCard({ offer }: RankedOfferCardProps) {
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAiExplanation = async () => {
    setIsExplanationLoading(true);
    setAiExplanation(null);
    const formData = new FormData();
    formData.append('offerDetails', JSON.stringify(offer)); // Send all offer details for context

    const result = await handleExplainDealRank(formData);
    if (result.error) {
      toast({ title: "Explanation Error", description: result.error, variant: "destructive" });
    } else {
      setAiExplanation(result.data?.explanation || "No explanation available.");
    }
    setIsExplanationLoading(false);
  };


  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0 relative">
        {offer.productImageUrl && (
          <Image
            src={offer.productImageUrl}
            alt={offer.productName}
            width={375}
            height={150}
            className="w-full h-40 object-cover"
            data-ai-hint="product e-commerce"
          />
        )}
        <Badge variant="default" className="absolute top-2 right-2 bg-primary text-primary-foreground">
          Score: {offer.compositeScore.toFixed(0)}
        </Badge>
      </CardHeader>
      <CardContent className="p-4">
        <Badge variant="secondary" className="mb-2">{offer.platform}</Badge>
        <CardTitle className="text-lg font-semibold mb-1 leading-tight">{offer.productName}</CardTitle>
        
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-2xl font-bold text-primary">
            ₹{(offer.finalPrice - offer.totalCashbackValue - offer.cardBonusValue).toFixed(2)}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="inline h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Effective price after all discounts & cashback. Does not include future perk value.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </p>
          {offer.basePrice > offer.finalPrice && (
            <p className="text-sm text-muted-foreground line-through">₹{offer.basePrice.toFixed(2)}</p>
          )}
        </div>

        {offer.achievedPerkDescription && (
          <Badge variant="accent" className="mb-2 text-sm py-1 px-2">
            <Sparkles className="h-4 w-4 mr-1" /> {offer.achievedPerkDescription}
          </Badge>
        )}

        <Accordion type="single" collapsible className="w-full text-sm mt-2">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-xs hover:no-underline py-2">
              Show value breakdown
            </AccordionTrigger>
            <AccordionContent className="space-y-1 text-muted-foreground pt-2">
              {offer.totalDiscountValue > 0 && <p>Coupon/Direct Discount: - ₹{offer.totalDiscountValue.toFixed(2)}</p>}
              {offer.totalCashbackValue > 0 && <p>Cashback: - ₹{offer.totalCashbackValue.toFixed(2)}</p>}
              {offer.cardBonusValue > 0 && <p>Card Bonus: - ₹{offer.cardBonusValue.toFixed(2)}</p>}
              {offer.potentialPerkValue > 0 && <p>Potential Future Perk Value: + ₹{offer.potentialPerkValue.toFixed(2)} (in ranking score)</p>}
              <p className="font-semibold text-foreground">Base Price: ₹{offer.basePrice.toFixed(2)}</p>
              <p className="font-semibold text-foreground">Price after Coupon: ₹{offer.finalPrice.toFixed(2)}</p>
               <hr className="my-1"/>
              <p className="text-xs italic">Ranking Explanation:</p>
              <ul className="list-disc list-inside pl-2 text-xs">
                {offer.rankingExplanation.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center border-t">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" onClick={fetchAiExplanation} disabled={isExplanationLoading}>
              <MessageCircleQuestion className="mr-2 h-4 w-4" />
              {isExplanationLoading ? "Thinking..." : "Why this rank?"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>AI Deal Rank Explanation</DialogTitle>
              <DialogDescription>
                Here's why ShopSavvy ranked this deal for you:
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[300px] overflow-y-auto">
              {isExplanationLoading && <p className="text-muted-foreground">Generating explanation...</p>}
              {aiExplanation && <p className="text-sm whitespace-pre-wrap">{aiExplanation}</p>}
            </div>
          </DialogContent>
        </Dialog>
        <Button asChild size="sm">
          <a href={offer.productUrl} target="_blank" rel="noopener noreferrer">
            View Deal <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
