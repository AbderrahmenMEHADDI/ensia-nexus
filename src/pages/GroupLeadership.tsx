import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Loader2,
  Clock,
  XCircle,
  ChevronDown,
  Search,
  ShieldCheck,
  LayoutGrid,
  Mail,
  UserCheck,
  History
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import type { GroupInvitation, GroupMember, ResearchGroup, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';

const GroupLeadership = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [invitations, setInvitations] = useState<Record<number, GroupInvitation[]>>({});
  const [selectedTeachers, setSelectedTeachers] = useState<Record<number, number[]>>({});
  const [sendingGroupId, setSendingGroupId] = useState<number | null>(null);
  const [cancellingInvitationId, setCancellingInvitationId] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState<Record<number, boolean>>({});
  const [teacherSearch, setTeacherSearch] = useState<Record<number, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [allGroups, allUsers, allMembers] = await Promise.all([
          apiRepository.getGroups(),
          apiRepository.getUsers({ limit: 1000 }),
          apiRepository.getGroupMembers(),
        ]);
        const led = allGroups.filter(g => g.leader_user_id === user?.id);
        setGroups(led);
        setUsers(allUsers.filter(u => u.role === 'TEACHER'));
        setMembers(allMembers);

        const invEntries = await Promise.all(
          led.map(async g => [g.id, await apiRepository.getGroupInvitations(g.id)] as const)
        );
        setInvitations(Object.fromEntries(invEntries));
      } catch (e) {
        console.error('Group leadership load failed', e);
        toast({ title: 'Failed to load leadership data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast, user?.id]);

  const activeMembersByGroup = useMemo(() => {
    const map: Record<number, number> = {};
    members.forEach(m => {
      if (m.is_active) map[m.group_id] = (map[m.group_id] || 0) + 1;
    });
    return map;
  }, [members]);

  const teacherLookup = useMemo(() => Object.fromEntries(users.map(u => [u.id, u])), [users]);

  const pendingTeacherIdsByGroup = useMemo(() => {
    const map: Record<number, Set<number>> = {};
    Object.entries(invitations).forEach(([groupId, list]) => {
      map[Number(groupId)] = new Set(
        list.filter(i => i.status === 'PENDING').map(i => i.teacher_user_id)
      );
    });
    return map;
  }, [invitations]);

  const toggleTeacherSelection = (groupId: number, teacherId: number, checked: boolean) => {
    setSelectedTeachers(prev => {
      const current = prev[groupId] || [];
      const next = checked ? [...current, teacherId] : current.filter(id => id !== teacherId);
      return { ...prev, [groupId]: next };
    });
  };

  const invite = async (groupId: number) => {
    const teacherIds = selectedTeachers[groupId] || [];
    if (!teacherIds.length) return;
    setSendingGroupId(groupId);
    try {
      const created = await apiRepository.inviteTeachersToGroupBulk(groupId, teacherIds);
      setInvitations(prev => ({ ...prev, [groupId]: [...created, ...(prev[groupId] || [])] }));
      setSelectedTeachers(prev => ({ ...prev, [groupId]: [] }));
      toast({ title: `${created.length} invitation(s) sent` });
    } catch (e: any) {
      toast({ title: 'Failed to invite teacher', description: e?.message, variant: 'destructive' });
    } finally {
      setSendingGroupId(null);
    }
  };

  const cancelInvitation = async (groupId: number, invitationId: number) => {
    setCancellingInvitationId(invitationId);
    try {
      await apiRepository.cancelGroupInvitation(invitationId);
      setInvitations(prev => ({
        ...prev,
        [groupId]: (prev[groupId] || []).filter(i => i.id !== invitationId),
      }));
      toast({ title: 'Invitation cancelled' });
    } catch (e: any) {
      toast({ title: 'Failed to cancel invitation', description: e?.message, variant: 'destructive' });
    } finally {
      setCancellingInvitationId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Accessing leadership dashboard...</p>
      </div>
    );
  }

  if (!groups.length) {
    return (
      <div className="container py-12 max-w-4xl mx-auto px-6">
        <div className="p-12 rounded-3xl border border-border bg-card/50 backdrop-blur-sm flex flex-col items-center text-center">
          <ShieldCheck className="h-16 w-16 text-primary/20 mb-6" />
          <h2 className="text-2xl font-bold mb-2">No Leadership Roles</h2>
          <p className="text-muted-foreground max-w-md">
            You are not currently designated as a leader for any research group. Once you create a group or are appointed, management tools will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="relative mb-12">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-2">
              Group <span className="text-primary italic">Leadership</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-full bg-secondary/80 border border-border flex items-center gap-2 text-sm font-medium">
              <UserCheck className="h-4 w-4 text-primary" />
              <span>{groups.length} Groups Led</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {groups.map((group, index) => {
          const groupInvitations = (invitations[group.id] || []).filter(i => i.status === 'PENDING');
          const blockedPendingTeacherIds = pendingTeacherIdsByGroup[group.id] || new Set<number>();
          const searchValue = (teacherSearch[group.id] || '').trim().toLowerCase();
          const selectableTeachers = users.filter(t => {
            if (t.id === user?.id) return false;
            if (blockedPendingTeacherIds.has(t.id)) return false;
            if (!searchValue) return true;
            return t.full_name.toLowerCase().includes(searchValue) || t.email.toLowerCase().includes(searchValue);
          });
          const selected = selectedTeachers[group.id] || [];
          const isPickerOpen = pickerOpen[group.id] ?? false;

          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden border-border bg-card hover:shadow-xl transition-all duration-300">
                <div className="h-1.5 w-full bg-gradient-to-r from-primary/40 via-primary to-blue-600/40" />

                <CardHeader className="p-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="rounded-md bg-primary/10 text-primary border-none text-[10px] uppercase font-bold tracking-widest">
                          Research Group Leader
                        </Badge>
                      </div>
                      <CardTitle className="text-3xl font-bold text-foreground">
                        {group.name}
                      </CardTitle>
                      <CardDescription className="text-base leading-relaxed max-w-3xl">
                        {group.description || "Leading this research group towards academic excellence and innovative breakthroughs."}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-6 p-4 rounded-2xl bg-secondary/30 border border-border/50">
                      <div className="text-center px-4 border-r border-border/50">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Active Members</p>
                        <p className="text-xl font-display font-bold text-foreground">{activeMembersByGroup[group.id] || 0}</p>
                      </div>
                      <div className="text-center px-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Pending Invites</p>
                        <p className="text-xl font-display font-bold text-foreground">{groupInvitations.length}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-8 pb-8 space-y-8">
                  {/* Invitation Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <UserPlus className="h-3.5 w-3.5 text-primary" />
                        Expand Team
                      </h4>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "rounded-full text-xs font-semibold gap-1.5 h-8",
                            isPickerOpen && "bg-secondary"
                          )}
                          onClick={() => setPickerOpen(prev => ({ ...prev, [group.id]: !isPickerOpen }))}
                        >
                          <Users className="h-3.5 w-3.5" />
                          {isPickerOpen ? "Close Picker" : "Pick Teachers"}
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-full h-8 px-4 font-bold"
                          onClick={() => invite(group.id)}
                          disabled={!selected.length || sendingGroupId === group.id}
                        >
                          {sendingGroupId === group.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                          ) : (
                            <UserPlus className="h-3.5 w-3.5 mr-2" />
                          )}
                          Invite Selected ({selected.length})
                        </Button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isPickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden space-y-4"
                        >
                          <div className="relative pt-2">
                            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                              placeholder="Search colleagues by name or email..."
                              className="pl-9 rounded-2xl bg-secondary/20 border-border/50 h-11"
                              value={teacherSearch[group.id] || ''}
                              onChange={(e) => setTeacherSearch(prev => ({ ...prev, [group.id]: e.target.value }))}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar pb-2">
                            {selectableTeachers.map(t => {
                              const checked = selected.includes(t.id);
                              return (
                                <label
                                  key={t.id}
                                  className={cn(
                                    "flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer group",
                                    checked
                                      ? "bg-primary/5 border-primary/40 shadow-sm ring-1 ring-primary/20"
                                      : "bg-secondary/10 border-border/50 hover:bg-secondary/30"
                                  )}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <ProfileAvatar
                                      userId={t.id}
                                      name={t.full_name}
                                      className="h-9 w-9 rounded-full shadow-sm"
                                      textClassName="text-[10px] font-bold"
                                    />
                                    <div className="min-w-0 flex flex-col">
                                      <p className="text-xs font-bold text-foreground truncate">{t.full_name}</p>
                                      <p className="text-[10px] text-muted-foreground truncate">{t.email}</p>
                                    </div>
                                  </div>
                                  <Checkbox
                                    checked={checked}
                                    className="rounded-full h-5 w-5"
                                    onCheckedChange={(value) => toggleTeacherSelection(group.id, t.id, !!value)}
                                  />
                                </label>
                              );
                            })}
                            {selectableTeachers.length === 0 && (
                              <div className="col-span-full py-8 text-center bg-secondary/10 rounded-2xl border border-dashed border-border">
                                <p className="text-sm text-muted-foreground italic">No eligible teachers found.</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Pending Invitations Section */}
                  <div className="pt-8 border-t border-border/50 space-y-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <History className="h-3.5 w-3.5 text-primary" />
                      Pending Requests
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {groupInvitations.map(inv => {
                        const invitedTeacher = teacherLookup[inv.teacher_user_id];
                        return (
                          <div
                            key={inv.id}
                            className="flex items-center justify-between p-4 rounded-2xl bg-secondary/10 border border-border/50 hover:bg-secondary/20 transition-colors group/inv"
                          >
                            <div className="flex items-center gap-3">
                              <ProfileAvatar
                                userId={invitedTeacher?.id}
                                name={invitedTeacher?.full_name}
                                className="h-10 w-10 rounded-full"
                                textClassName="text-[10px] font-bold"
                              />
                              <div className="flex flex-col">
                                <span className="text-xs font-bold">{invitedTeacher?.full_name || `Teacher ${inv.teacher_user_id}`}</span>
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>Sent {new Date(inv.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive opacity-0 group-hover/inv:opacity-100 transition-opacity"
                              disabled={cancellingInvitationId === inv.id}
                              onClick={() => cancelInvitation(group.id, inv.id)}
                            >
                              {cancellingInvitationId === inv.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        );
                      })}
                      {groupInvitations.length === 0 && (
                        <div className="col-span-full py-4 text-center bg-secondary/5 rounded-xl border border-dashed border-border/50">
                          <p className="text-xs text-muted-foreground italic">No outgoing invitations at this time.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupLeadership;
