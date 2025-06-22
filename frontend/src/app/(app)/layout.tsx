import Header from '@/components/layout/Header';
import NavigationTabs from '@/components/layout/NavigationTabs';
import { Toaster } from '@/components/ui/toaster';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen-safe flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-foreground">
      <Header />
      <NavigationTabs />
      <ScrollArea className="flex-1 scrollbar-thin">
        <main className="container-responsive py-3 xs:py-4 sm:py-6 h-full">
          {children}
        </main>
      </ScrollArea>
      <Toaster />
    </div>
  );
}
