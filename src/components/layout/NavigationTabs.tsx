'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Heart, BotMessageSquare, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const tabs = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Wishlist', href: '/wishlist', icon: Heart },
  { name: 'DealBot', href: '/ask-dealbot', icon: BotMessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function NavigationTabs() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-card">
      <TooltipProvider delayDuration={300}>
        <div className="flex justify-around">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (pathname.startsWith(tab.href) && tab.href !== '/');
            return (
              <Tooltip key={tab.name}>
                <TooltipTrigger asChild>
                  <Link
                    href={tab.href}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 px-3 py-2 text-sm font-medium transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      isActive ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <tab.icon className={cn('h-5 w-5', isActive ? 'text-primary' : '')} />
                    <span className="text-xs">{tab.name}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">
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
