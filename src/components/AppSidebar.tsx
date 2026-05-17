import { Link } from 'react-router-dom';
import { type UserRole } from '@/types';
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
  FileUser,
  Users,
  FlaskConical,
  MoreHorizontal,
  type LucideIcon,
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
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ProfileAvatar } from '@/components/ProfileAvatar';

const navItems: { path: string; label: string; icon: LucideIcon; allowedRoles?: UserRole[] }[] = [
  { path: '/projects', label: 'Project Board', icon: Kanban },
  { path: '/my-labs', label: 'My Labs', icon: FlaskConical, allowedRoles: ['TEACHER', 'ADMIN'] },
  { path: '/groups', label: 'Groups', icon: Users, allowedRoles: ['TEACHER'] },
  { path: '/student-cv', label: 'Student CV', icon: FileUser, allowedRoles: ['STUDENT'] },
  { path: '/applications', label: 'Applications', icon: FileText, allowedRoles: ['TEACHER', 'PARTNER'] },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/admin', label: 'Admin', icon: Shield, allowedRoles: ['ADMIN'] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, signOut, hasRole } = useAuth();
  const [hasLeadershipGroups, setHasLeadershipGroups] = useState(false);
  const [isLabAdminUser, setIsLabAdminUser] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setHasLeadershipGroups(false);
        setIsLabAdminUser(false);
        return;
      }

      try {
        const [groups, labAdmins] = await Promise.all([
          apiRepository.getGroups(),
          apiRepository.getLabAdmins(),
        ]);
        setHasLeadershipGroups(user.role === 'TEACHER' ? groups.some(g => g.leader_user_id === user.id) : false);
        setIsLabAdminUser(labAdmins.some(a => a.user_id === user.id));
      } catch {
        setHasLeadershipGroups(false);
        setIsLabAdminUser(false);
      }
    };
    load();
  }, [user?.id, user?.role]);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/projects">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <img src="/logo_small.svg" alt="Logo" className="size-6 object-contain brightness-0 invert" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-foreground">ENSIA Research Hub</span>
                    <span className="truncate text-xs text-muted-foreground italic font-mono uppercase tracking-tighter">Innovate · Discover</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                if (item.allowedRoles && !hasRole(item.allowedRoles)) return null;
                if (item.path === '/my-labs' && !isLabAdminUser) return null;

                const label = (item.path === '/applications' && user?.role === 'TEACHER' && !hasLeadershipGroups)
                  ? 'Reviews'
                  : item.label;

                const isActive = window.location.pathname === item.path || (item.path !== '/projects' && window.location.pathname.startsWith(item.path));

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
                      <Link to={item.path}>
                        <item.icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {hasLeadershipGroups && (
                <SidebarMenuItem key="/group-leadership">
                  <SidebarMenuButton asChild isActive={window.location.pathname === "/group-leadership"} tooltip="Group Leadership">
                    <Link to="/group-leadership">
                      <FileText />
                      <span>Group Leadership</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <ProfileAvatar
                    userId={user?.id}
                    name={user?.full_name}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-primary/20 overflow-hidden"
                    textClassName="text-xs font-semibold text-primary"
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-foreground">{user?.full_name}</span>
                    <span className="truncate text-xs text-muted-foreground capitalize">{user?.role.toLowerCase()}</span>
                  </div>
                  <MoreHorizontal className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={collapsed ? "right" : "top"}
                align="end"
                sideOffset={4}
              >
                <div className="flex items-center gap-2 p-2">
                  <ProfileAvatar
                    userId={user?.id}
                    name={user?.full_name}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary overflow-hidden"
                    textClassName="text-xs font-semibold text-primary"
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-foreground">{user?.full_name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="w-full flex items-center gap-2 cursor-pointer">
                    <User className="size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="w-full flex items-center gap-2 cursor-pointer">
                    <Settings className="size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer flex items-center gap-2"
                >
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
