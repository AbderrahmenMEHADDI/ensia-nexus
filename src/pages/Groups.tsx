import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Users,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ArrowRight,
  UserCheck,
  LayoutGrid,
  Mail,
  ShieldCheck,
  Clock,
  ExternalLink,
  UserMinus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import type { GroupInvitation, GroupMember, ResearchGroup, User } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [memberToRemove, setMemberToRemove] = useState<{ groupId: number, userId: number } | null>(null);

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

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    const { groupId, userId } = memberToRemove;
    setActingId(userId);
    try {
      await apiRepository.removeGroupMember(groupId, userId);
      setMembers(prev => prev.filter(m => !(m.group_id === groupId && m.user_id === userId)));
      toast({ title: 'Member removed successfully' });
    } catch (e: any) {
      toast({ title: 'Failed to remove member', description: e?.message, variant: 'destructive' });
    } finally {
      setActingId(null);
      setMemberToRemove(null);
    }
  };

  const toggleExpandGroup = (groupId: number) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Syncing research groups...</p>
      </div>
    );
  }

  if (user?.role !== 'TEACHER') {
    return (
      <div className="container py-10 max-w-4xl">
        <div className="p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-sm flex flex-col items-center text-center">
          <ShieldCheck className="h-12 w-12 text-primary/40 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Teacher Access Only</h2>
          <p className="text-muted-foreground max-w-md">
            Research group management and invitations are exclusive to teachers. Students can browse projects via the discovery feed.
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
              Research <span className="text-primary italic">Groups</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-full bg-secondary/80 border border-border flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-primary" />
              <span>{myGroups.length} Active Groups</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invitations Section */}
      <AnimatePresence>
        {invitations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-12 overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <h2 className="text-xl font-bold">Pending Invitations</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {invitations.map(inv => {
                const group = groups.find(g => g.id === inv.group_id);
                if (!group) return null;
                const leader = userById[group.leader_user_id];

                return (
                  <motion.div
                    key={inv.id}
                    layout
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          <Mail className="h-5 w-5 text-primary opacity-50" />
                        </div>
                        <CardDescription className="line-clamp-2">
                          {group.description || "No description provided for this research group."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="flex items-center gap-3 mb-4">
                          <ProfileAvatar
                            userId={leader?.id}
                            name={leader?.full_name}
                            className="h-8 w-8 rounded-full border border-background ring-1 ring-primary/20"
                            textClassName="text-[10px] font-bold"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">{leader?.full_name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Group Leader</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {membersByGroup[group.id]?.length || 0} members
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(inv.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 flex gap-2">
                        <Button
                          className="flex-1 rounded-xl"
                          size="sm"
                          onClick={() => respond(inv, 'ACCEPTED')}
                          disabled={actingId === inv.id}
                        >
                          {actingId === inv.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Accept
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          className="flex-1 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                          size="sm"
                          onClick={() => respond(inv, 'REJECTED')}
                          disabled={actingId === inv.id}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Groups Section */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <LayoutGrid className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">My Groups</h2>
        </div>

        {myGroups.length === 0 ? (
          <div className="p-12 rounded-3xl border-2 border-dashed border-border bg-secondary/30 flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full bg-background flex items-center justify-center mb-6 shadow-sm">
              <Users className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold mb-2">No research groups found</h3>
            <p className="text-muted-foreground max-w-sm mb-8">
              You haven't joined or created any research groups yet. Once you're invited, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {myGroups.map((group, index) => {
              const leader = userById[group.leader_user_id];
              const isExpanded = expandedGroups.includes(group.id);
              const groupMembers = membersByGroup[group.id] || [];
              const isLeader = group.leader_user_id === user?.id;

              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={cn(
                    "group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                    isLeader ? "border-primary/20" : "border-border"
                  )}>
                    <div className="h-1.5 w-full bg-gradient-to-r from-primary/50 via-primary to-blue-600/50" />

                    <CardHeader>
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">
                            {group.name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {isLeader && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-widest border border-primary/20">
                                <UserCheck className="h-3 w-3 mr-1" />
                                My Group
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              Created {new Date().getFullYear()} • Research Unit
                            </span>
                          </div>
                        </div>
                        <Link
                          to={`/my-labs/${group.id}`}
                          className="h-10 w-10 rounded-full bg-secondary hover:bg-primary hover:text-white transition-all flex items-center justify-center group/btn"
                        >
                          <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {group.description || "Advancing research and innovation through collaborative projects and academic excellence in this specialized research domain."}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="flex items-center -space-x-3">
                          {groupMembers.slice(0, 5).map(m => (
                            <ProfileAvatar
                              key={m.user_id}
                              userId={m.user_id}
                              name={userById[m.user_id]?.full_name}
                              className="h-10 w-10 rounded-full border-2 border-card ring-1 ring-border shadow-sm"
                              textClassName="text-xs font-bold"
                            />
                          ))}
                          {groupMembers.length > 5 && (
                            <div className="h-10 w-10 rounded-full bg-secondary border-2 border-card ring-1 ring-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                              +{groupMembers.length - 5}
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-xs font-semibold gap-1.5 h-8 px-4"
                          onClick={() => toggleExpandGroup(group.id)}
                        >
                          {groupMembers.length} Members
                          <ChevronDown className={cn(
                            "h-4 w-4 transition-transform duration-300",
                            isExpanded && "rotate-180"
                          )} />
                        </Button>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-4 border-t border-border/30 overflow-hidden"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                              {groupMembers.map(m => {
                                const memberUser = userById[m.user_id];
                                const isMemberLeader = m.user_id === group.leader_user_id;
                                return (
                                    <div
                                      key={`${group.id}-${m.user_id}`}
                                      className="flex items-center justify-between p-2 rounded-xl bg-secondary/40 border border-transparent hover:border-border transition-all group/member"
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <ProfileAvatar
                                          userId={m.user_id}
                                          name={memberUser?.full_name}
                                          className="h-8 w-8 rounded-full border border-background shadow-sm"
                                          textClassName="text-[10px] font-bold"
                                        />
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-xs font-semibold truncate">{memberUser?.full_name}</span>
                                          <span className="text-[10px] text-muted-foreground">
                                            {isMemberLeader ? "Group Leader" : "Member"}
                                          </span>
                                        </div>
                                      </div>
                                      {isLeader && !isMemberLeader && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive opacity-0 group-hover/member:opacity-100 transition-opacity"
                                          onClick={() => setMemberToRemove({ groupId: group.id, userId: m.user_id })}
                                          disabled={actingId === m.user_id}
                                        >
                                          {actingId === m.user_id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <UserMinus className="h-3.5 w-3.5" />
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>


                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent className="rounded-3xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Remove Member?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action will remove the member from the research group. They will no longer have access to group projects or chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-4">
            <AlertDialogCancel className="rounded-xl border-border hover:bg-muted">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveMember}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Groups;
