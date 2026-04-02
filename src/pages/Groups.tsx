import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Users, CheckCircle2, XCircle } from 'lucide-react';
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

  const respond = async (invitationId: number, status: 'ACCEPTED' | 'REJECTED') => {
    setActingId(invitationId);
    try {
      await apiRepository.respondToGroupInvitation(invitationId, status);
      setInvitations(prev => prev.filter(i => i.id !== invitationId));
      toast({ title: status === 'ACCEPTED' ? 'Invitation accepted' : 'Invitation declined' });
    } catch (e: any) {
      toast({ title: 'Failed to respond', description: e?.message, variant: 'destructive' });
    } finally {
      setActingId(null);
    }
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
        <h1 className="text-2xl font-bold mb-2">Group Invitations</h1>
        <p className="text-sm text-muted-foreground mb-6">Accept an invitation to join a research group.</p>

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
                  <Link to={`/groups/${group.id}`} className="text-xs text-primary hover:underline">View group</Link>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button size="sm" onClick={() => respond(inv.id, 'ACCEPTED')} disabled={actingId === inv.id}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => respond(inv.id, 'REJECTED')} disabled={actingId === inv.id}>
                    <XCircle className="h-4 w-4 mr-1" />Decline
                  </Button>
                </div>
              </div>
            );
          })}
          {invitations.length === 0 && (
            <div className="p-6 rounded-xl border bg-card text-sm text-muted-foreground">No pending group invitations.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Groups;
