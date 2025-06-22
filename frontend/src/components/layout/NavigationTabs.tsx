'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Heart, BotMessageSquare, Settings, Sparkles, Wallet } from 'lucide-react'; // Added Sparkles and Wallet
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const tabs = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Smart Deals', href: '/smart-deals', icon: Sparkles },
  { name: 'Wishlist', href: '/wishlist', icon: Heart },
  { name: 'DealBot', href: '/ask-dealbot', icon: BotMessageSquare },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function NavigationTabs() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-40 safe-area-inset-bottom">
      <TooltipProvider delayDuration={300}>
        <div className="flex justify-around overflow-x-auto scrollbar-hide px-1 xs:px-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (pathname.startsWith(tab.href) && tab.href !== '/' && tab.href.length > 1 && pathname.includes(tab.href));
            return (
              <Tooltip key={tab.name}>
                <TooltipTrigger asChild>
                  <Link
                    href={tab.href}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 px-1 xs:px-2 sm:px-3 py-2 xs:py-3 text-sm font-medium transition-all duration-200 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background min-w-0 flex-shrink-0 touch-target rounded-lg',
                      isActive 
                        ? 'text-primary border-b-2 border-primary bg-primary/10 shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <tab.icon className={cn(
                      'h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 transition-transform duration-200',
                      isActive ? 'text-primary scale-110' : 'group-hover:scale-105'
                    )} />
                    <span className="text-xs xs:text-sm whitespace-nowrap hidden sm:block font-medium">
                      {tab.name}
                    </span>
                    <span className="text-xs whitespace-nowrap sm:hidden font-medium">
                      {tab.name === 'Smart Deals' ? 'Deals' : 
                       tab.name === 'DealBot' ? 'Bot' : 
                       tab.name === 'Dashboard' ? 'Home' :
                       tab.name}
                    </span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="hidden lg:block">
                  <p>{tab.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </nav>
  );
}
