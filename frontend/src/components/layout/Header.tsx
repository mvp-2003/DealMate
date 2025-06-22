import { ShoppingBag } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center justify-between px-3 xs:px-4 sm:px-6 py-3 xs:py-4 border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-50 safe-area-inset-top">
      <div className="flex items-center gap-2 xs:gap-3">
        <ShoppingBag className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
        <h1 className="text-lg xs:text-xl sm:text-2xl font-headline font-semibold text-primary truncate">
          DealPal
        </h1>
      </div>
      
      {/* Status indicator for mobile */}
      <div className="flex items-center gap-2">
        <div className="hidden xs:flex items-center gap-1 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="hidden sm:inline">Online</span>
        </div>
        {/* Future: User Avatar/Auth Button */}
        {/* <div className="w-8 h-8 bg-muted rounded-full touch-target"></div> */}
      </div>
    </header>
  );
}
