import { ShoppingBag } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <ShoppingBag className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-headline font-semibold text-primary">DealPal</h1>
      </div>
      {/* Placeholder for User Avatar/Auth Button */}
      {/* <div className="w-8 h-8 bg-muted rounded-full"></div> */}
    </header>
  );
}
