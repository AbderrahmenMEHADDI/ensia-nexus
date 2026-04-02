import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Loader2, Clock, XCircle, ChevronDown, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import type { GroupInvitation, GroupMember, ResearchGroup, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

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
    return <div className="container py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!groups.length) {
    return (
      <div className="container py-10">
        <div className="p-6 rounded-xl border bg-card text-sm text-muted-foreground">
          You are not assigned as leader of any group.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-6">Group Leadership</h1>
        <div className="space-y-6">
          {groups.map(group => {
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
              <div key={group.id} className="p-5 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm shadow-sm space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{group.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{group.description || 'No description provided'}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {activeMembersByGroup[group.id] || 0} members
                    </span>
                    <Users className="h-4 w-4" />
                    Leader: you
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">Invite teachers</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPickerOpen(prev => ({ ...prev, [group.id]: !isPickerOpen }))}
                      >
                        Choose teachers
                        <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isPickerOpen ? 'rotate-180' : ''}`} />
                      </Button>
                      <Button onClick={() => invite(group.id)} disabled={!selected.length || sendingGroupId === group.id}>
                        <UserPlus className="h-4 w-4 mr-1" />
                        {sendingGroupId === group.id ? 'Sending...' : `Send (${selected.length})`}
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">Selected teachers: {selected.length}</p>

                  {isPickerOpen && (
                    <>
                      <div className="relative">
                        <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          placeholder="Search teacher by name or email"
                          className="pl-9"
                          value={teacherSearch[group.id] || ''}
                          onChange={(e) => setTeacherSearch(prev => ({ ...prev, [group.id]: e.target.value }))}
                        />
                      </div>
                      <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
                        {selectableTeachers.map(t => {
                          const checked = selected.includes(t.id);
                          return (
                            <label key={t.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border/50 hover:bg-muted/40 cursor-pointer">
                              <div className="min-w-0">
                                <p className="text-sm text-foreground truncate">{t.full_name}</p>
                                <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                              </div>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) => toggleTeacherSelection(group.id, t.id, !!value)}
                              />
                            </label>
                          );
                        })}
                        {selectableTeachers.length === 0 && (
                          <p className="text-xs text-muted-foreground">No teachers found for this filter.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Pending invitations</h4>
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {groupInvitations.map(inv => (
                      <div key={inv.id} className="text-xs text-muted-foreground flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{teacherLookup[inv.teacher_user_id]?.full_name || `Teacher ${inv.teacher_user_id}`}</span>
                          <span className="uppercase tracking-wide">PENDING</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-destructive"
                          disabled={cancellingInvitationId === inv.id}
                          onClick={() => cancelInvitation(group.id, inv.id)}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />Cancel
                        </Button>
                      </div>
                    ))}
                    {groupInvitations.length === 0 && (
                      <p className="text-xs text-muted-foreground">No pending invitations.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default GroupLeadership;
