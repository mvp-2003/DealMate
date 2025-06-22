import Header from '@/components/layout/Header';
import NavigationTabs from '@/components/layout/NavigationTabs';
import { Toaster } from '@/components/ui/toaster';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen-safe flex flex-col bg-background text-foreground">
      <Header />
      <NavigationTabs />
      <ScrollArea className="flex-grow scrollbar-thin">
        <main className="container-responsive py-3 xs:py-4 sm:py-6">
          {children}
        </main>
      </ScrollArea>
      <Toaster />
    </div>
  );
}
