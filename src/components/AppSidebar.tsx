import { Link } from 'react-router-dom';
import { type UserRole } from '@/types';
import { NavLink } from '@/components/NavLink';
import { RoleBadge } from '@/components/Badges';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { apiRepository } from '@/repositories/apiRepository';
import {
  LayoutDashboard,
  Kanban,
  FileText,
  User,
  Shield,
  Settings,
  LogOut,
  MessageCircle,
  Megaphone,
  FileUser,
  Users,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const navItems: { path: string; label: string; icon: any; allowedRoles?: UserRole[] }[] = [
  { path: '/dashboard', label: 'Feed', icon: LayoutDashboard },
  { path: '/projects/1', label: 'Project Board', icon: Kanban },
  { path: '/groups', label: 'Groups', icon: Users, allowedRoles: ['TEACHER'] },
  { path: '/student-cv', label: 'Student CV', icon: FileUser, allowedRoles: ['STUDENT'] },
  { path: '/applications', label: 'Applications', icon: FileText, allowedRoles: ['TEACHER', 'ADMIN', 'PARTNER'] },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/admin', label: 'Admin', icon: Shield, allowedRoles: ['ADMIN'] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, signOut, hasRole } = useAuth();
  const [hasLeadershipGroups, setHasLeadershipGroups] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user || user.role !== 'TEACHER') {
        setHasLeadershipGroups(false);
        return;
      }
      try {
        const groups = await apiRepository.getGroups();
        setHasLeadershipGroups(groups.some(g => g.leader_user_id === user.id));
      } catch {
        setHasLeadershipGroups(false);
      }
    };
    load();
  }, [user?.id, user?.role]);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className="p-4 flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 shrink-0 flex items-center justify-center">
              <img src="/logo_small.svg" alt="Logo" className="h-full w-full object-contain" />
            </div>
            {!collapsed && (
              <span className="text-sm font-display font-semibold text-foreground truncate">
                ENSIA Research Hub
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                if (item.allowedRoles && !hasRole(item.allowedRoles)) return null;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        end={item.path === '/dashboard'}
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {hasLeadershipGroups && (
                <SidebarMenuItem key="/group-leadership">
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/group-leadership"
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Group Leadership</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-3 space-y-2">
        {!collapsed && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/settings" className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        {user && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
              {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.full_name}</p>
                <RoleBadge role={user.role} />
              </div>
            )}
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
