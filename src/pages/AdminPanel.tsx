import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import { RoleBadge } from '@/components/Badges';
import type { ResearchLab, ResearchGroup, User } from '@/types';
import { Shield, Users, CheckCircle2, XCircle, Clock, Search, Plus, Building2, UserCog, ChevronRight, UserPlus, FlaskConical, Loader2, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [labs, setLabs] = useState<ResearchLab[]>([]);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  // Dialog states
  const [addLabOpen, setAddLabOpen] = useState(false);
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [assignLeaderOpen, setAssignLeaderOpen] = useState(false);
  const [selectedGroupForLeader, setSelectedGroupForLeader] = useState<ResearchGroup | null>(null);

  // Form states
  const [newLabName, setNewLabName] = useState('');
  const [newLabDesc, setNewLabDesc] = useState('');
  const [newLabHead, setNewLabHead] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupLab, setNewGroupLab] = useState('');
  const [selectedLeader, setSelectedLeader] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [l, g, u] = await Promise.all([
          apiRepository.getLabs(),
          apiRepository.getGroups(),
          apiRepository.getUsers(),
        ]);
        setLabs(l);
        setGroups(g);
        setUsers(u);
      } catch (e) {
        console.error('AdminPanel load error:', e);
        toast({ title: 'Error loading data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getUserById = (id: number) => users.find(u => u.id === id);
  const pendingGroups = groups.filter(g => !g.is_validated);
  const validatedGroups = groups.filter(g => g.is_validated);
  const teacherUsers = users.filter(u => u.role === 'TEACHER');
  const filteredUsers = userSearch
    ? users.filter(u => u.full_name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
    : users;

  const handleValidate = async (groupId: number) => {
    try {
      const updated = await apiRepository.updateGroup(groupId, {
        is_validated: true,
        validated_by_admin_id: user?.id,
        validated_at: new Date().toISOString(),
      });
      setGroups(prev => prev.map(g => g.id === groupId ? updated : g));
      toast({ title: 'Group validated' });
    } catch {
      toast({ title: 'Validation failed', variant: 'destructive' });
    }
  };

  const handleAddLab = async () => {
    if (!newLabName.trim() || !newLabHead) return;
    try {
      const created = await apiRepository.createLab({
        name: newLabName,
        description: newLabDesc,
        head_teacher_id: parseInt(newLabHead),
      });
      setLabs(prev => [...prev, created]);
      toast({ title: 'Lab created' });
    } catch {
      toast({ title: 'Failed to create lab', variant: 'destructive' });
    }
    setNewLabName(''); setNewLabDesc(''); setNewLabHead('');
    setAddLabOpen(false);
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim() || !newGroupLab) return;
    try {
      const created = await apiRepository.createGroup({
        name: newGroupName,
        description: newGroupDesc,
        lab_id: parseInt(newGroupLab),
        is_validated: false,
      });
      setGroups(prev => [...prev, created]);
      toast({ title: 'Group created' });
    } catch {
      toast({ title: 'Failed to create group', variant: 'destructive' });
    }
    setNewGroupName(''); setNewGroupDesc(''); setNewGroupLab('');
    setAddGroupOpen(false);
  };

  const handleAssignLeader = async () => {
    if (!selectedGroupForLeader || !selectedLeader) return;
    try {
      const updated = await apiRepository.updateGroup(selectedGroupForLeader.id, {
        leader_user_id: parseInt(selectedLeader),
      });
      setGroups(prev => prev.map(g => g.id === selectedGroupForLeader.id ? updated : g));
      toast({ title: 'Leader assigned' });
    } catch {
      toast({ title: 'Assignment failed', variant: 'destructive' });
    }
    setSelectedLeader('');
    setAssignLeaderOpen(false);
  };

  if (loading) {
    return (
      <div className="container py-10 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <span className="text-xs font-mono text-primary uppercase tracking-wider">Administration</span>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Admin Panel</h1>
          </div>
        </div>

        <Tabs defaultValue="groups" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-xl">
            <TabsTrigger value="labs"><FlaskConical className="h-4 w-4 mr-1.5" />Labs</TabsTrigger>
            <TabsTrigger value="groups"><Building2 className="h-4 w-4 mr-1.5" />Groups</TabsTrigger>
            <TabsTrigger value="requests"><UserPlus className="h-4 w-4 mr-1.5" />Requests</TabsTrigger>
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-1.5" />Users</TabsTrigger>
          </TabsList>

          {/* LABS TAB */}
          <TabsContent value="labs" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Research Labs ({labs.length})</h2>
              <Button onClick={() => setAddLabOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" />Add Lab</Button>
            </div>
            <div className="space-y-3">
              {labs.map(lab => {
                const head = getUserById(lab.head_teacher_id);
                const labGroups = groups.filter(g => g.lab_id === lab.id);
                return (
                  <div key={lab.id} className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-foreground">{lab.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{lab.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground mt-3">
                      <span className="flex items-center gap-1"><UserCog className="h-3.5 w-3.5" />Head: {head?.full_name ?? 'Unassigned'}</span>
                      <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{labGroups.length} groups</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* GROUPS TAB */}
          <TabsContent value="groups" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Research Groups ({groups.length})</h2>
              <Button onClick={() => setAddGroupOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" />Add Group</Button>
            </div>

            {pendingGroups.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />Pending Validation ({pendingGroups.length})
                </h3>
                <div className="space-y-3">
                  {pendingGroups.map(group => {
                    const leader = getUserById(group.leader_user_id);
                    const lab = labs.find(l => l.id === group.lab_id);
                    return (
                      <div key={group.id} className="p-4 rounded-xl border border-primary/20 bg-card">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-foreground">{group.name}</h3>
                            <span className="text-xs font-mono text-muted-foreground">{lab?.name.split('—')[0]?.trim()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setSelectedGroupForLeader(group); setAssignLeaderOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
                              <UserCog className="h-3.5 w-3.5" /> Assign Leader
                            </button>
                            <button onClick={() => handleValidate(group.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-medium hover:bg-primary/25 transition-colors">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Validate
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                          {leader && leader.id !== 0 ? (
                            <><span>Led by {leader.full_name}</span><RoleBadge role={leader.role} /></>
                          ) : (
                            <span className="text-destructive">No leader assigned</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />Validated ({validatedGroups.length})
              </h3>
              <div className="space-y-2">
                {validatedGroups.map(group => {
                  const leader = getUserById(group.leader_user_id);
                  const lab = labs.find(l => l.id === group.lab_id);
                  return (
                    <div key={group.id} className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-foreground">{group.name}</span>
                          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                            <span>{lab?.name.split('—')[0]?.trim()}</span>
                            <span>·</span>
                            <span>Led by {leader?.full_name}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedGroupForLeader(group); setAssignLeaderOpen(true); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                        <UserCog className="h-3.5 w-3.5" /> Change Leader
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* REQUESTS TAB */}
          <TabsContent value="requests" className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Member Join Requests</h2>
            <div className="p-6 rounded-xl border border-border bg-card flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Group join requests management is not yet available via the API. This feature is coming soon.
              </p>
            </div>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users" className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Users ({users.length})</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users..." className="pl-9" />
            </div>
            <div className="space-y-2">
              {filteredUsers.map(u => (
                <div key={u.id} className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground">
                      {u.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground block">{u.full_name}</span>
                      <span className="text-xs font-mono text-muted-foreground">{u.email}</span>
                    </div>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* ADD LAB DIALOG */}
        <Dialog open={addLabOpen} onOpenChange={setAddLabOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Research Lab</DialogTitle>
              <DialogDescription>Create a new research lab and assign a head teacher.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Lab Name</label>
                <Input value={newLabName} onChange={e => setNewLabName(e.target.value)} placeholder="e.g. LRIA — Laboratoire de..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Input value={newLabDesc} onChange={e => setNewLabDesc(e.target.value)} placeholder="Brief description..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Head Teacher</label>
                <Select value={newLabHead} onValueChange={setNewLabHead}>
                  <SelectTrigger><SelectValue placeholder="Select head teacher" /></SelectTrigger>
                  <SelectContent>
                    {teacherUsers.map(t => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.full_name} ({t.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleAddLab} disabled={!newLabName.trim() || !newLabHead}>Create Lab</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ADD GROUP DIALOG */}
        <Dialog open={addGroupOpen} onOpenChange={setAddGroupOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Research Group</DialogTitle>
              <DialogDescription>Create a new group under a lab. You can assign a leader after.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Group Name</label>
                <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g. NLP & Language Understanding" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Input value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} placeholder="Brief description..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Parent Lab</label>
                <Select value={newGroupLab} onValueChange={setNewGroupLab}>
                  <SelectTrigger><SelectValue placeholder="Select lab" /></SelectTrigger>
                  <SelectContent>
                    {labs.map(l => (
                      <SelectItem key={l.id} value={String(l.id)}>{l.name.split('—')[0]?.trim()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleAddGroup} disabled={!newGroupName.trim() || !newGroupLab}>Create Group</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ASSIGN LEADER DIALOG */}
        <Dialog open={assignLeaderOpen} onOpenChange={setAssignLeaderOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Group Leader</DialogTitle>
              <DialogDescription>
                Assign a teacher as leader of <span className="font-medium text-foreground">{selectedGroupForLeader?.name}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Select Teacher</label>
                <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                  <SelectTrigger><SelectValue placeholder="Choose a teacher" /></SelectTrigger>
                  <SelectContent>
                    {teacherUsers.map(t => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.full_name} ({t.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleAssignLeader} disabled={!selectedLeader}>Assign Leader</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
};

export default AdminPanel;
