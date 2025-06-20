import Header from '@/components/layout/Header';
import NavigationTabs from '@/components/layout/NavigationTabs';
import { Toaster } from '@/components/ui/toaster';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <NavigationTabs />
      <ScrollArea className="flex-grow">
        <main className="p-4">
          {children}
        </main>
      </ScrollArea>
      <Toaster />
    </div>
  );
}
