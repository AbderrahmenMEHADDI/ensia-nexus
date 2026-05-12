import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
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

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const getBreadcrumbLabel = (path: string) => {
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

  const publicPaths = ['/', '/signin', '/signup', '/forgot-password', '/reset-password', '/discovery', '/group'];
  const isPublicPath = publicPaths.some(path => 
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
  );

  if (!isAuthenticated || isPublicPath) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-background sticky top-0 z-50 px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="h-4 w-[1px] bg-border mx-1" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/dashboard">Home</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const label = getBreadcrumbLabel(value);

                    if (value === 'dashboard') return null;

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
            <ThemeToggle />
          </header>
          <main className="flex-1 relative z-0 flex flex-col overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};
