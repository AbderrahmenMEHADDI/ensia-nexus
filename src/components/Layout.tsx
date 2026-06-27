import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { NotificationBell } from '@/components/NotificationBell';
import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import React from 'react';
import { api } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const getBreadcrumbLabel = (path: string) => {
    if (typeof window !== 'undefined' && window.__dynamicBreadcrumbs && window.__dynamicBreadcrumbs[path]) {
      return window.__dynamicBreadcrumbs[path];
    }
    const labels: Record<string, string> = {
      'dashboard': 'Projects',
      'projects': 'Projects',
      'my-labs': 'My Labs',
      'groups': 'Groups',
      'student-cv': 'Student CV',
      'applications': 'Applications',
      'chat': 'Chat',
      'profile': 'Profile',
      'settings': 'Settings',
      'admin': 'Admin',
      'group-leadership': 'Group Leadership',
    };
    return labels[path] || path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
  };

  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener('breadcrumb-update', handler);
    return () => window.removeEventListener('breadcrumb-update', handler);
  }, []);

  React.useEffect(() => {
    // Keep user dashboard strictly in light mode
    document.documentElement.classList.remove('dark');
  }, []);

  const publicPaths = ['/', '/signin', '/signup', '/forgot-password', '/reset-password', '/discovery', '/group'];
  const isPublicPath = publicPaths.some(path => 
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'))
  );

  if (!isAuthenticated || isPublicPath) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full overflow-hidden bg-[#F8FAFC]">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
          {user && user.is_email_verified === false && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 text-sm text-yellow-800 flex justify-between items-center z-50 shrink-0">
              <p>Your email address is not verified. Please check your inbox or spam folder.</p>
              <button 
                className="text-yellow-900 font-medium hover:underline text-xs px-3 py-1 bg-yellow-100 rounded-md transition-colors"
                onClick={async () => {
                  try {
                    await api.post('/auth/resend-verification', { email: user.email });
                    toast({ title: 'Email sent', description: 'Verification email has been resent.' });
                  } catch (e) {
                    toast({ title: 'Error', description: 'Failed to resend verification email.', variant: 'destructive' });
                  }
                }}
              >
                Resend Email
              </button>
            </div>
          )}
          <header className="h-14 shrink-0 flex items-center justify-between border-b border-slate-200/60 bg-white sticky top-0 z-40 px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="h-4 w-[1px] bg-border mx-1" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/projects">Home</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const label = getBreadcrumbLabel(value);



                    return (
                      <React.Fragment key={to}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          {last ? (
                            <BreadcrumbPage>{label}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink asChild>
                              <Link to={to}>{label}</Link>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            {/* Notification bell — right side of header is disabled */}
            {/* <NotificationBell /> */}
          </header>
          <main className="flex-1 relative z-0 flex flex-col overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};
