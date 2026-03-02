import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  // No layout wrapper for unauthenticated pages (signin/signup/landing)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
            <SidebarTrigger className="ml-3" />
          </header>
          <main className="flex-1 relative z-0 grain">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};
