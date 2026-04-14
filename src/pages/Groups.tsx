import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Users, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import type { GroupInvitation, GroupMember, ResearchGroup, User } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Groups = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [actingId, setActingId] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<number[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [allGroups, allUsers, allMembers, mine] = await Promise.all([
          apiRepository.getGroups(),
          apiRepository.getUsers({ limit: 1000 }),
          apiRepository.getGroupMembers(),
          user?.role === 'TEACHER' ? apiRepository.getMyGroupInvitations() : Promise.resolve([]),
        ]);
        setGroups(allGroups);
        setUsers(allUsers);
        setMembers(allMembers);
        setInvitations(mine);
      } catch (e) {
        console.error('Groups page load failed', e);
        toast({ title: 'Failed to load groups', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast, user?.role]);

  const userById = useMemo(() => Object.fromEntries(users.map(u => [u.id, u])), [users]);
  const memberCountByGroup = useMemo(() => {
    const map: Record<number, number> = {};
    members.forEach(m => {
      if (m.is_active) map[m.group_id] = (map[m.group_id] || 0) + 1;
    });
    return map;
  }, [members]);

  const membersByGroup = useMemo(() => {
    const map: Record<number, GroupMember[]> = {};
    members.forEach(m => {
      if (!m.is_active) return;
      if (!map[m.group_id]) map[m.group_id] = [];
      map[m.group_id].push(m);
    });
    return map;
  }, [members]);

  const myGroups = useMemo(() => {
    if (!user) return [];
    const myGroupIds = new Set(
      members
        .filter(m => m.user_id === user.id && m.is_active)
        .map(m => m.group_id)
    );
    groups
      .filter(g => g.leader_user_id === user.id)
      .forEach(g => myGroupIds.add(g.id));
    return groups.filter(g => myGroupIds.has(g.id));
  }, [groups, members, user]);

  const respond = async (invitation: GroupInvitation, status: 'ACCEPTED' | 'REJECTED') => {
    setActingId(invitation.id);
    try {
      await apiRepository.respondToGroupInvitation(invitation.id, status);
      setInvitations(prev => prev.filter(i => i.id !== invitation.id));
      if (status === 'ACCEPTED' && user) {
        setMembers(prev => {
          const exists = prev.some(m => m.group_id === invitation.group_id && m.user_id === user.id);
          if (exists) {
            return prev.map(m =>
              m.group_id === invitation.group_id && m.user_id === user.id
                ? { ...m, is_active: true }
                : m
            );
          }
          return [
            ...prev,
            {
              group_id: invitation.group_id,
              user_id: user.id,
              is_active: true,
              joined_at: new Date().toISOString(),
            },
          ];
        });
      }
      toast({ title: status === 'ACCEPTED' ? 'Invitation accepted' : 'Invitation declined' });
    } catch (e: any) {
      toast({ title: 'Failed to respond', description: e?.message, variant: 'destructive' });
    } finally {
      setActingId(null);
    }
  };

  const toggleExpandGroup = (groupId: number) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  if (loading) {
    return <div className="container py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (user?.role !== 'TEACHER') {
    return <div className="container py-10 text-sm text-muted-foreground">Groups invitations are available for teachers.</div>;
  }

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-2">Groups</h1>
        <p className="text-sm text-muted-foreground mb-6">Manage your group invitations and view your joined groups.</p>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">My Groups</h2>
          <div className="space-y-4">
            {myGroups.map(group => {
              const leader = userById[group.leader_user_id];
              const isExpanded = expandedGroups.includes(group.id);
              const groupMembers = membersByGroup[group.id] || [];
              return (
                <div key={group.id} className="p-4 rounded-xl border bg-card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{group.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Leader: {leader?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{memberCountByGroup[group.id] || 0} members</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleExpandGroup(group.id)}>
                        {isExpanded ? 'Hide members' : 'Show members'}
                        <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </Button>
                      <Link to={`/my-labs/groups/${group.id}`} className="text-xs text-primary hover:underline">Open</Link>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t space-y-2 max-h-44 overflow-y-auto">
                      {groupMembers.map(m => {
                        const memberUser = userById[m.user_id];
                        return (
                          <div key={`${m.group_id}-${m.user_id}`} className="text-sm text-muted-foreground flex items-center justify-between">
                            <span>{memberUser?.full_name || `User ${m.user_id}`}</span>
                            {m.user_id === group.leader_user_id && <span className="text-xs text-primary">Leader</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {myGroups.length === 0 && (
              <div className="p-6 rounded-xl border bg-card text-sm text-muted-foreground">You have not joined any group yet.</div>
            )}
          </div>
        </div>

        {invitations.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-3">Pending Invitations</h2>

            <div className="space-y-4">
              {invitations.map(inv => {
                const group = groups.find(g => g.id === inv.group_id);
                if (!group) return null;
                const leader = userById[group.leader_user_id];
                return (
                  <div key={inv.id} className="p-4 rounded-xl border bg-card">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{group.name}</h3>
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-3">
                          <span>Leader: {leader?.full_name || 'Unknown'}</span>
                          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{memberCountByGroup[group.id] || 0} members</span>
                        </div>
                      </div>
                      <Link to={`/my-labs/groups/${group.id}`} className="text-xs text-primary hover:underline">View group</Link>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Button size="sm" onClick={() => respond(inv, 'ACCEPTED')} disabled={actingId === inv.id}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => respond(inv, 'REJECTED')} disabled={actingId === inv.id}>
                        <XCircle className="h-4 w-4 mr-1" />Decline
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Groups;
