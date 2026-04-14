import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import { RoleBadge } from '@/components/Badges';
import type { GroupMember, ResearchLab, ResearchGroup, ResearchLabAdmin, User, Teacher, UserRole } from '@/types';
import { Shield, Users, CheckCircle2, XCircle, Clock, Search, Plus, Building2, UserCog, UserPlus, FlaskConical, Loader2, Info, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge'; // this is for displaying lab admins in the lab cards
import { Checkbox } from '@/components/ui/checkbox';

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [labs, setLabs] = useState<ResearchLab[]>([]);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [labAdmins, setLabAdmins] = useState<ResearchLabAdmin[]>([]); // state to hold lab admins for easy access
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const userPageSize = 25;
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [usersLoading, setUsersLoading] = useState(false);
  const [userLookup, setUserLookup] = useState<Record<number, User>>({});

  // Dialog states
  const [addLabOpen, setAddLabOpen] = useState(false);
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [assignLeaderOpen, setAssignLeaderOpen] = useState(false);
  const [manageAdminsOpen, setManageAdminsOpen] = useState(false);  // this is a new dialog for managing lab admins, it will open when clicking the "Admins" button on a lab card
  const [editLabOpen, setEditLabOpen] = useState(false); // this is a new dialog for editing lab details, it will open when clicking the "Edit" button on a lab card
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [assignMembersOpen, setAssignMembersOpen] = useState(false);
  const [selectedGroupForLeader, setSelectedGroupForLeader] = useState<ResearchGroup | null>(null);
  const [selectedLabForAdmins, setSelectedLabForAdmins] = useState<ResearchLab | null>(null); // this state will hold the lab for which we are currently managing admins
  const [selectedLabForEdit, setSelectedLabForEdit] = useState<ResearchLab | null>(null); // this state will hold the lab for which we are currently editing details

  // Form states
  const [newLabName, setNewLabName] = useState('');
  const [newLabDesc, setNewLabDesc] = useState('');
  const [newLabHead, setNewLabHead] = useState('');
  const [isCreatingLab, setIsCreatingLab] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupLab, setNewGroupLab] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState('');
  const [newAdminUser, setNewAdminUser] = useState(''); // this state will hold the user ID of the new admin we want to add to a lab
  const [editLabName, setEditLabName] = useState(''); // this state will hold the edited lab name when we are in the edit lab dialog
  const [editLabDesc, setEditLabDesc] = useState(''); // this state will hold the edited lab description when we are in the edit lab dialog
  const [editLabHead, setEditLabHead] = useState(''); // this state will hold the edited lab head teacher ID when we are in the edit lab dialog
  const [newAdminFullName, setNewAdminFullName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('admin');
  const [validatingGroupIds, setValidatingGroupIds] = useState<number[]>([]);
  const [deletingGroupIds, setDeletingGroupIds] = useState<number[]>([]);
  const [isAssigningMembers, setIsAssigningMembers] = useState(false);
  const [isAssigningLeader, setIsAssigningLeader] = useState(false);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [removingAdminKeys, setRemovingAdminKeys] = useState<string[]>([]);
  const [isSavingLab, setIsSavingLab] = useState(false);
  const [isDeletingLab, setIsDeletingLab] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [selectedAssignmentGroups, setSelectedAssignmentGroups] = useState<number[]>([]);
  const [selectedAssignmentTeachers, setSelectedAssignmentTeachers] = useState<number[]>([]);
  const [assignGroupSearch, setAssignGroupSearch] = useState('');
  const [assignTeacherSearch, setAssignTeacherSearch] = useState('');

  const isPlatformAdmin = isAdmin;
  const adminRemovalKey = (labId: number, userId: number) => `${labId}-${userId}`;
  const sortLabsByNewest = (items: ResearchLab[]) => (
    [...items].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      if (bTime !== aTime) return bTime - aTime;
      return b.id - a.id;
    })
  );
  const canManageLab = (labId: number) => isPlatformAdmin || labAdmins.some(a => a.lab_id === labId && a.user_id === user?.id);
  const manageableLabs = isPlatformAdmin ? labs : labs.filter(l => canManageLab(l.id));
  const mergeUsersIntoLookup = (list: User[]) => setUserLookup(prev => {
    const next = { ...prev };
    list.forEach(u => { next[u.id] = u; });
    return next;
  });

  const fetchAllTeachers = async () => {
    const pageSize = 200;
    let all: Teacher[] = [];
    let skip = 0;
    while (true) {
      const batch = await apiRepository.getTeachers({ skip, limit: pageSize });
      all = all.concat(batch);
      if (batch.length < pageSize) break;
      skip += pageSize;
    }
    return all;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [l, g, la, t, allUsers, gm] = await Promise.all([
          apiRepository.getLabs(),
          apiRepository.getGroups(),
          apiRepository.getLabAdmins(), // added this to load lab admins on initial load when displaying labs and managing admins
          fetchAllTeachers(),
          apiRepository.getUsers({ limit: 1000 }),
          apiRepository.getGroupMembers(),
        ]);
        setLabs(sortLabsByNewest(l));
        setGroups(g);
        setLabAdmins(la); // i added this so we can use it to display admins in the lab cards and manage them in the manage admins dialog
        setTeachers(t);
        setGroupMembers(gm);
        mergeUsersIntoLookup(allUsers);
      } catch (e) {
        console.error('AdminPanel load error:', e);
        toast({ title: 'Error loading data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fetchUsers = async (pageOverride?: number) => {
    const page = pageOverride ?? userPage;
    setUsersLoading(true);
    try {
      const skip = (page - 1) * userPageSize;
      const res = await apiRepository.getUsersPaged({
        skip,
        limit: userPageSize,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        search: userSearch.trim() || undefined,
      });
      setUsers(res.items);
      setUserTotal(res.total);
      mergeUsersIntoLookup(res.items);
    } catch (e) {
      console.error('Failed to load users', e);
      toast({ title: 'Failed to load users', variant: 'destructive' });
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [userPage, roleFilter, userSearch]);

  const getUserById = (id: number) => userLookup[id];
  const pendingGroups = groups.filter(g => !g.is_validated);
  const validatedGroups = groups.filter(g => g.is_validated);
  const eligibleTeachers = teachers.filter(t => t.grade === 'MCA' || t.grade === 'PROFESSOR');
  const headTeacherUsers = eligibleTeachers
    .map(t => ({ teacher: t, user: userLookup[t.user_id] }))
    .filter(({ user }) => user && user.role === 'TEACHER');
  const totalUserPages = Math.max(1, Math.ceil(userTotal / userPageSize));
  const teacherUsers = teachers
    .map(t => userLookup[t.user_id])
    .filter((u): u is User => !!u && u.role === 'TEACHER');
  const manageableGroups = groups.filter(g => canManageLab(g.lab_id));
  const filteredAssignmentGroups = manageableGroups.filter(g =>
    g.name.toLowerCase().includes(assignGroupSearch.trim().toLowerCase())
  );
  const selectedGroupsForAssignment = manageableGroups.filter(g => selectedAssignmentGroups.includes(g.id));
  const canTeacherBeAssignedToSelectedGroups = (teacherId: number) => {
    if (selectedGroupsForAssignment.length === 0) return true;
    return selectedGroupsForAssignment.some(group => {
      if (group.leader_user_id === teacherId) return false;
      const isActiveMember = groupMembers.some(
        m => m.group_id === group.id && m.user_id === teacherId && m.is_active
      );
      return !isActiveMember;
    });
  };
  const filteredAssignmentTeachers = teacherUsers.filter(t =>
    (t.full_name.toLowerCase().includes(assignTeacherSearch.trim().toLowerCase()) ||
      t.email.toLowerCase().includes(assignTeacherSearch.trim().toLowerCase())) &&
    canTeacherBeAssignedToSelectedGroups(t.id)
  );
  const toggleAssignmentGroup = (groupId: number) => {
    setSelectedAssignmentGroups(prev => prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]);
  };
  const toggleAssignmentTeacher = (teacherId: number) => {
    setSelectedAssignmentTeachers(prev => prev.includes(teacherId) ? prev.filter(id => id !== teacherId) : [...prev, teacherId]);
  };
  const selectAllFilteredGroups = () => {
    setSelectedAssignmentGroups(prev => Array.from(new Set([...prev, ...filteredAssignmentGroups.map(g => g.id)])));
  };
  const clearFilteredGroups = () => {
    const filteredIds = new Set(filteredAssignmentGroups.map(g => g.id));
    setSelectedAssignmentGroups(prev => prev.filter(id => !filteredIds.has(id)));
  };
  const selectAllFilteredTeachers = () => {
    setSelectedAssignmentTeachers(prev => Array.from(new Set([...prev, ...filteredAssignmentTeachers.map(t => t.id)])));
  };
  const clearFilteredTeachers = () => {
    const filteredIds = new Set(filteredAssignmentTeachers.map(t => t.id));
    setSelectedAssignmentTeachers(prev => prev.filter(id => !filteredIds.has(id)));
  };

  const handleBulkAssignMembers = async () => {
    if (isAssigningMembers) return;
    if (selectedAssignmentGroups.length === 0 || selectedAssignmentTeachers.length === 0) {
      toast({ title: 'Select groups and teachers', variant: 'destructive' });
      return;
    }
    const validTeacherIds = selectedAssignmentTeachers.filter(canTeacherBeAssignedToSelectedGroups);
    if (validTeacherIds.length === 0) {
      toast({ title: 'Selected teachers are already leaders in these groups', variant: 'destructive' });
      return;
    }
    setIsAssigningMembers(true);
    try {
      const assigned = await apiRepository.bulkAssignGroupMembers({
        group_ids: selectedAssignmentGroups,
        teacher_user_ids: validTeacherIds,
      });
      setGroupMembers(prev => {
        const index = new Map(prev.map(m => [`${m.group_id}-${m.user_id}`, m]));
        assigned.forEach(m => index.set(`${m.group_id}-${m.user_id}`, m));
        return Array.from(index.values());
      });
      toast({ title: 'Teachers assigned to groups' });
      setAssignMembersOpen(false);
      setSelectedAssignmentGroups([]);
      setSelectedAssignmentTeachers([]);
    } catch (e) {
      console.error('Bulk assign failed', e);
      toast({ title: 'Failed to assign teachers', variant: 'destructive' });
    } finally {
      setIsAssigningMembers(false);
    }
  };
    const labAdminsFor = (labId: number) => labAdmins.filter(a => a.lab_id === labId); // this is a helper function to get admins for a specific lab, it will be used in the lab cards and the manage admins dialog
  const handleValidate = async (groupId: number) => {
    const target = groups.find(g => g.id === groupId);
    if (!target || !canManageLab(target.lab_id)) {
      toast({ title: 'Not authorized', variant: 'destructive' });
      return;
    }
    if (validatingGroupIds.includes(groupId) || deletingGroupIds.includes(groupId)) return;
    setValidatingGroupIds(prev => [...prev, groupId]);
    try {
      const updated = await apiRepository.validateGroup(groupId);
      setGroups(prev => prev.map(g => g.id === groupId ? updated : g));
      toast({ title: 'Group validated' });
    } catch {
      toast({ title: 'Validation failed', variant: 'destructive' });
    } finally {
      setValidatingGroupIds(prev => prev.filter(id => id !== groupId));
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    const target = groups.find(g => g.id === groupId);
    if (!target || !canManageLab(target.lab_id)) {
      toast({ title: 'Not authorized', variant: 'destructive' });
      return;
    }
    if (deletingGroupIds.includes(groupId) || validatingGroupIds.includes(groupId)) return;
    setDeletingGroupIds(prev => [...prev, groupId]);
    try {
      await apiRepository.deleteGroup(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      toast({ title: 'Group deleted' });
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    } finally {
      setDeletingGroupIds(prev => prev.filter(id => id !== groupId));
    }
  };

  const handleAddLab = async () => {
    if (!isPlatformAdmin) {
      toast({ title: 'Not authorized', variant: 'destructive' });
      return;
    }
    if (!newLabName.trim() || !newLabHead || isCreatingLab) return;
    setIsCreatingLab(true);
    try {
      const created = await apiRepository.createLab({
        name: newLabName,
        description: newLabDesc,
        head_teacher_id: parseInt(newLabHead),
      });
      setLabs(prev => sortLabsByNewest([created, ...prev.filter(l => l.id !== created.id)]));
      toast({ title: 'Lab created' });
    } catch {
      toast({ title: 'Failed to create lab', variant: 'destructive' });
    } finally {
      setIsCreatingLab(false);
    }
    setNewLabName(''); setNewLabDesc(''); setNewLabHead('');
    setAddLabOpen(false);
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim() || !newGroupLab || isCreatingGroup) return;
    const labId = parseInt(newGroupLab);
    if (!canManageLab(labId)) {
      toast({ title: 'Not authorized to create group for this lab', variant: 'destructive' });
      return;
    }
    setIsCreatingGroup(true);
    const isCreatorLabAdmin = canManageLab(labId);
    try {
      const created = await apiRepository.createGroup({
        name: newGroupName,
        description: newGroupDesc,
        lab_id: labId,
        is_validated: isCreatorLabAdmin,
        validated_by_admin_id: isCreatorLabAdmin ? user?.id : undefined,
        validated_at: isCreatorLabAdmin ? new Date().toISOString() : undefined,
      });
      setGroups(prev => [...prev, created]);
      toast({ title: 'Group created' });
    } catch {
      toast({ title: 'Failed to create group', variant: 'destructive' });
    } finally {
      setIsCreatingGroup(false);
    }
    setNewGroupName(''); setNewGroupDesc(''); setNewGroupLab('');
    setAddGroupOpen(false);
  };

  const handleAssignLeader = async () => {
    if (!selectedGroupForLeader || !selectedLeader) return;
    if (isAssigningLeader) return;
    if (!canManageLab(selectedGroupForLeader.lab_id)) {
      toast({ title: 'Not authorized', variant: 'destructive' });
      return;
    }
    setIsAssigningLeader(true);
    try {
      const updated = await apiRepository.updateGroup(selectedGroupForLeader.id, {
        leader_user_id: parseInt(selectedLeader),
      });
      setGroups(prev => prev.map(g => g.id === selectedGroupForLeader.id ? updated : g));
      toast({ title: 'Leader assigned' });
    } catch {
      toast({ title: 'Assignment failed', variant: 'destructive' });
    } finally {
      setIsAssigningLeader(false);
    }
    setSelectedLeader('');
    setAssignLeaderOpen(false);
  };
  // we need to add functions to handle adding and removing lab admins, as well as opening the manage admins dialog with the correct lab information. we also need to add functions to handle opening the edit lab dialog and saving the edited lab details.
  
  const handleOpenManageAdmins = (lab: ResearchLab) => { // to handle opening the manage admins dialog, we set the selected lab for admins to the lab we want to manage, this will allow us to display the correct admins in the dialog and perform add/remove actions on the correct lab
    if (!canManageLab(lab.id)) {
      toast({ title: 'Not authorized', variant: 'destructive' });
      return;
    }
    setSelectedLabForAdmins(lab);
    setNewAdminUser('');
    setManageAdminsOpen(true);
  };

  const handleAddAdmin = async () => { // to handle adding a new admin to the lab, we check if the selected lab and new admin user ID are valid, then we call the API to add the admin, and if successful we update our local state to reflect the change and show a success toast. if there's an error we show an error toast.
    if (!selectedLabForAdmins || !newAdminUser) return;
    if (isAddingAdmin) return;
    if (!canManageLab(selectedLabForAdmins.id)) {
      toast({ title: 'Not authorized', variant: 'destructive' });
      return;
    }
    const userId = parseInt(newAdminUser);
    if (labAdmins.some(a => a.lab_id === selectedLabForAdmins.id && a.user_id === userId)) {
      toast({ title: 'Already an admin', variant: 'destructive' });
      return;
    }
    setIsAddingAdmin(true);
    try {
      const created = await apiRepository.addLabAdmin(selectedLabForAdmins.id, userId);
      setLabAdmins(prev => [...prev, created]);
      toast({ title: 'Admin added' });
      setNewAdminUser('');
    } catch {
      toast({ title: 'Failed to add admin', variant: 'destructive' });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (labId: number, userId: number) => { 
    const key = adminRemovalKey(labId, userId);
    if (removingAdminKeys.includes(key)) return;
    if (!canManageLab(labId)) {
      toast({ title: 'Not authorized', variant: 'destructive' });
      return;
    }
    const admins = labAdminsFor(labId);
    if (admins.length <= 1) { // Prevents orphaned labs by ensuring at least one admin remains before calling the removal API.
      toast({ title: 'Cannot remove last admin', variant: 'destructive' });
      return;
    }
    setRemovingAdminKeys(prev => [...prev, key]);
    try {
      await apiRepository.removeLabAdmin(labId, userId);
      setLabAdmins(prev => prev.filter(a => !(a.lab_id === labId && a.user_id === userId)));
      toast({ title: 'Admin removed' });
    } catch {
      toast({ title: 'Failed to remove admin', variant: 'destructive' });
    } finally {
      setRemovingAdminKeys(prev => prev.filter(k => k !== key));
    }
  };

  // Platform admin toggle removed per request

  const handleOpenEditLab = (lab: ResearchLab) => { // Syncs form state with the selected lab to ensure the user sees accurate data upon opening the editor.
    if (!isPlatformAdmin) {
      toast({ title: 'Only platform admins can edit labs', variant: 'destructive' });
      return;
    }
    setDeleteConfirmOpen(false);
    setSelectedLabForEdit(lab);
    setEditLabName(lab.name);
    setEditLabDesc(lab.description ?? '');
    setEditLabHead(lab.head_teacher_id ? String(lab.head_teacher_id) : '');
    setEditLabOpen(true);
  };

  const handleSaveLab = async () => {
    if (!selectedLabForEdit) return;
    if (isSavingLab) return;
    if (!isPlatformAdmin) {
      toast({ title: 'Only platform admins can edit labs', variant: 'destructive' });
      return;
    }
    setIsSavingLab(true);
    try {
      const updated = await apiRepository.updateLab(selectedLabForEdit.id, {
        name: editLabName,
        description: editLabDesc,
        head_teacher_id: editLabHead ? Number(editLabHead) : undefined,
      });
      setLabs(prev => prev.map(l => l.id === selectedLabForEdit.id ? updated : l));
      toast({ title: 'Lab updated' });
    } catch {
      toast({ title: 'Failed to update lab', variant: 'destructive' });
    } finally {
      setIsSavingLab(false);
    }
    setEditLabOpen(false);
  };

  const handleDeleteLab = async () => {
    if (!selectedLabForEdit) return;
    if (isDeletingLab) return;
    if (!isPlatformAdmin) {
      toast({ title: 'Only platform admins can delete labs', variant: 'destructive' });
      return;
    }
    setIsDeletingLab(true);
    try {
      await apiRepository.deleteLab(selectedLabForEdit.id);
      setLabs(prev => prev.filter(l => l.id !== selectedLabForEdit.id));
      setDeleteConfirmOpen(false);
      setEditLabOpen(false);
      toast({ title: 'Lab deleted' });
    } catch {
      toast({ title: 'Failed to delete lab', variant: 'destructive' });
    } finally {
      setIsDeletingLab(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (isCreatingAdmin) return;
    if (!isPlatformAdmin) {
      toast({ title: 'Not authorized', variant: 'destructive' });
      return;
    }
    if (!newAdminFullName.trim() || !newAdminEmail.trim()) return;
    setIsCreatingAdmin(true);
    try {
      const created = await apiRepository.createUser({
        full_name: newAdminFullName.trim(),
        email: newAdminEmail.trim(),
        role: 'ADMIN',
        password: newAdminPassword || 'admin',
      });
      setUsers(prev => [created, ...prev]);
      mergeUsersIntoLookup([created]);
      toast({ title: 'Admin created' });
      setCreateAdminOpen(false);
      setNewAdminFullName('');
      setNewAdminEmail('');
      setNewAdminPassword('admin');
    } catch (e) {
      console.error('Failed to create admin', e);
      toast({ title: 'Failed to create admin', variant: 'destructive' });
    } finally {
      setIsCreatingAdmin(false);
    }
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
              {isPlatformAdmin && (
                <Button onClick={() => setAddLabOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" />Add Lab</Button>
              )}
            </div>
            <div className="space-y-3">
              {labs.map(lab => {
                const head = getUserById(lab.head_teacher_id);
                const labGroups = groups.filter(g => g.lab_id === lab.id);
                const admins = labAdminsFor(lab.id);
                return (
                  <div key={lab.id} className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-foreground">{lab.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{lab.description}</p>
                      </div>
                      {(canManageLab(lab.id) || isPlatformAdmin) && (
                        <div className="flex items-center gap-2">
                          {isPlatformAdmin && <Button variant="outline" size="sm" onClick={() => handleOpenEditLab(lab)}>Edit</Button>}
                          <Button variant="secondary" size="sm" onClick={() => handleOpenManageAdmins(lab)}>Admins</Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground mt-3">
                      <span className="flex items-center gap-1"><UserCog className="h-3.5 w-3.5" />Head: {head?.full_name ?? 'Unassigned'}</span>
                      <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{labGroups.length} groups</span>
                      <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" />{admins.length} admins</span>
                    </div>
                    {admins.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {admins.map(admin => {
                          const adminUser = getUserById(admin.user_id);
                          if (!adminUser) return null;
                          return (
                            <Badge key={admin.user_id} variant="secondary" className="flex items-center gap-1">
                              {adminUser.full_name}
                              <RoleBadge role={adminUser.role} />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* GROUPS TAB */}
          <TabsContent value="groups" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Research Groups ({groups.length})</h2>
              <div className="flex items-center gap-2">
                {manageableGroups.length > 0 && (
                  <Button variant="secondary" onClick={() => setAssignMembersOpen(true)} size="sm">
                    <Users className="h-4 w-4 mr-1" />Assign Members
                  </Button>
                )}
                {manageableLabs.length > 0 && (
                  <Button onClick={() => setAddGroupOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" />Add Group</Button>
                )}
              </div>
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
                    const requesterId = group.requested_by_user_id ;
                    const requester = requesterId ? getUserById(requesterId) : undefined;
                    return (
                      <div key={group.id} className="p-4 rounded-xl border border-primary/20 bg-card">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-foreground">{group.name}</h3>
                            <span className="text-xs font-mono text-muted-foreground">{lab?.name.split('—')[0]?.trim()}</span>
                          </div>
                          {canManageLab(group.lab_id) && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setSelectedGroupForLeader(group); setAssignLeaderOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
                                <UserCog className="h-3.5 w-3.5" /> Assign Leader
                              </button>
                              <button
                                onClick={() => handleValidate(group.id)}
                                disabled={validatingGroupIds.includes(group.id) || deletingGroupIds.includes(group.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-medium hover:bg-primary/25 transition-colors disabled:opacity-60"
                              >
                                {validatingGroupIds.includes(group.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} {validatingGroupIds.includes(group.id) ? 'Validating...' : 'Validate'}
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(group.id)}
                                disabled={deletingGroupIds.includes(group.id) || validatingGroupIds.includes(group.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/15 transition-colors disabled:opacity-60"
                              >
                                {deletingGroupIds.includes(group.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} {deletingGroupIds.includes(group.id) ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                        {requester && (
                          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-1">
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Requested by {requester.full_name}</span>
                            <RoleBadge role={requester.role} />
                          </div>
                        )}
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
                            <span>·</span>
                            <span>{groupMembers.filter(m => m.group_id === group.id && m.is_active).length} members</span>
                          </div>
                        </div>
                      </div>
                      {canManageLab(group.lab_id) && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setSelectedGroupForLeader(group); setAssignLeaderOpen(true); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                            <UserCog className="h-3.5 w-3.5" /> Change Leader
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(group.id)}
                            disabled={deletingGroupIds.includes(group.id) || validatingGroupIds.includes(group.id)}
                            className="text-xs text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1 disabled:opacity-60"
                          >
                            {deletingGroupIds.includes(group.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} {deletingGroupIds.includes(group.id) ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      )}
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
            <h2 className="text-xl font-semibold text-foreground">Users ({userTotal})</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={userSearch} onChange={e => { setUserPage(1); setUserSearch(e.target.value); }} placeholder="Search users..." className="pl-9" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v as UserRole | 'ALL'); setUserPage(1); }}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All roles</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="PARTNER">Partner</SelectItem>
                </SelectContent>
              </Select>
              {isPlatformAdmin && (
                <Button size="sm" onClick={() => setCreateAdminOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />Create Admin
                </Button>
              )}
              {usersLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <div className="space-y-2">
              {users.map(u => (
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
                  <div className="flex items-center gap-3">
                    <RoleBadge role={u.role} />
                  </div>
                </div>
              ))}
              {users.length === 0 && !usersLoading && (
                <div className="text-sm text-muted-foreground">No users found for this filter.</div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Page {userPage} of {totalUserPages}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1 || usersLoading}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))} disabled={userPage >= totalUserPages || usersLoading}>Next</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* ADD LAB DIALOG */}
        <Dialog open={addLabOpen} onOpenChange={(open) => { if (!isCreatingLab) setAddLabOpen(open); }}>
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
                    {headTeacherUsers.map(({ teacher, user }) => (
                      <SelectItem key={teacher.user_id} value={String(teacher.user_id)}>
                        {user?.full_name ?? `User ${teacher.user_id}`} ({teacher.grade})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" disabled={isCreatingLab}>Cancel</Button></DialogClose>
              <Button onClick={handleAddLab} disabled={!newLabName.trim() || !newLabHead || isCreatingLab}>
                {isCreatingLab ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Lab'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ASSIGN GROUP MEMBERS DIALOG */}
        <Dialog open={assignMembersOpen} onOpenChange={(open) => { if (!isAssigningMembers) setAssignMembersOpen(open); }}>
          <DialogContent className="sm:max-w-[860px]">
            <DialogHeader>
              <DialogTitle>Assign Teachers to Groups</DialogTitle>
              <DialogDescription>
                Select one or more groups and teachers. Existing assignments are kept, and repeated assignments are allowed.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{selectedAssignmentGroups.length} group(s) selected</span>
              <span>{selectedAssignmentTeachers.length} teacher(s) selected</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4 py-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Groups</label>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAllFilteredGroups}>Select all</Button>
                    <Button variant="ghost" size="sm" onClick={clearFilteredGroups}>Clear</Button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={assignGroupSearch}
                    onChange={e => setAssignGroupSearch(e.target.value)}
                    placeholder="Search groups..."
                    className="pl-9"
                  />
                </div>
                <div className="h-[240px] overflow-auto rounded-lg border p-3 space-y-2">
                  {filteredAssignmentGroups.map(group => (
                    <label key={group.id} className="flex items-center justify-between gap-2 text-sm rounded-md border border-border/50 px-2 py-1.5 hover:bg-muted/30">
                      <span className="truncate">{group.name}</span>
                      <Checkbox
                        checked={selectedAssignmentGroups.includes(group.id)}
                        onCheckedChange={() => toggleAssignmentGroup(group.id)}
                      />
                    </label>
                  ))}
                  {filteredAssignmentGroups.length === 0 && (
                    <p className="text-xs text-muted-foreground">No groups match this search.</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Teachers</label>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAllFilteredTeachers}>Select all</Button>
                    <Button variant="ghost" size="sm" onClick={clearFilteredTeachers}>Clear</Button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={assignTeacherSearch}
                    onChange={e => setAssignTeacherSearch(e.target.value)}
                    placeholder="Search teachers by name or email..."
                    className="pl-9"
                  />
                </div>
                <div className="h-[240px] overflow-auto rounded-lg border p-3 space-y-2">
                  {filteredAssignmentTeachers.map(t => (
                    <label key={t.id} className="flex items-center justify-between gap-2 text-sm rounded-md border border-border/50 px-2 py-1.5 hover:bg-muted/30">
                      <div className="min-w-0">
                        <p className="truncate">{t.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                      </div>
                      <Checkbox
                        checked={selectedAssignmentTeachers.includes(t.id)}
                        onCheckedChange={() => toggleAssignmentTeacher(t.id)}
                      />
                    </label>
                  ))}
                  {filteredAssignmentTeachers.length === 0 && (
                    <p className="text-xs text-muted-foreground">No teachers match this search.</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" disabled={isAssigningMembers}>Cancel</Button></DialogClose>
              <Button
                onClick={handleBulkAssignMembers}
                disabled={!selectedAssignmentGroups.length || !selectedAssignmentTeachers.length || isAssigningMembers}
              >
                {isAssigningMembers ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign Selected'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ADD GROUP DIALOG */}
        <Dialog open={addGroupOpen} onOpenChange={(open) => { if (!isCreatingGroup) setAddGroupOpen(open); }}>
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
                    {manageableLabs.map(l => (
                      <SelectItem key={l.id} value={String(l.id)}>{l.name.split('—')[0]?.trim()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" disabled={isCreatingGroup}>Cancel</Button></DialogClose>
              <Button onClick={handleAddGroup} disabled={!newGroupName.trim() || !newGroupLab || isCreatingGroup}>
                {isCreatingGroup ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Group'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ASSIGN LEADER DIALOG */}
        <Dialog open={assignLeaderOpen} onOpenChange={(open) => { if (!isAssigningLeader) setAssignLeaderOpen(open); }}>
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
                    {headTeacherUsers.map(({ teacher, user }) => (
                      <SelectItem key={teacher.user_id} value={String(teacher.user_id)}>
                        {user?.full_name ?? `User ${teacher.user_id}`} ({teacher.grade})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" disabled={isAssigningLeader}>Cancel</Button></DialogClose>
              <Button onClick={handleAssignLeader} disabled={!selectedLeader || isAssigningLeader}>
                {isAssigningLeader ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign Leader'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MANAGE LAB ADMINS DIALOG */}
        <Dialog open={manageAdminsOpen} onOpenChange={setManageAdminsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lab Admins</DialogTitle>
              <DialogDescription>
                Manage administrators for <span className="font-medium text-foreground">{selectedLabForAdmins?.name}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Current Admins</label>
                <div className="flex flex-wrap gap-2">
                  {selectedLabForAdmins && labAdminsFor(selectedLabForAdmins.id).map(admin => {
                    const adminUser = getUserById(admin.user_id);
                    if (!adminUser) return null;
                    const isOnly = labAdminsFor(selectedLabForAdmins.id).length <= 1;
                    return (
                      <Badge key={admin.user_id} variant="secondary" className="flex items-center gap-2">
                        <span>{adminUser.full_name}</span>
                        <RoleBadge role={adminUser.role} />
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={isOnly || removingAdminKeys.includes(adminRemovalKey(selectedLabForAdmins.id, admin.user_id))}
                          onClick={() => handleRemoveAdmin(selectedLabForAdmins.id, admin.user_id)}
                          className="h-6 w-6"
                        >
                          {removingAdminKeys.includes(adminRemovalKey(selectedLabForAdmins.id, admin.user_id)) ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </Badge>
                    );
                  })}
                  {selectedLabForAdmins && labAdminsFor(selectedLabForAdmins.id).length === 0 && (
                    <span className="text-sm text-muted-foreground">No admins assigned.</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Add Admin</label>
                <div className="flex items-center gap-2">
                  <Select value={newAdminUser} onValueChange={setNewAdminUser}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select user" /></SelectTrigger>
                    <SelectContent>
                      {Object.values(userLookup)
                        .filter(u => u.role === 'TEACHER')
                        .map(u => (
                          <SelectItem key={u.id} value={String(u.id)}>{u.full_name} ({u.role})</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddAdmin} disabled={!newAdminUser || !selectedLabForAdmins || isAddingAdmin}>
                    {isAddingAdmin ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* EDIT LAB DIALOG */}
        <Dialog open={editLabOpen} onOpenChange={(open) => { setEditLabOpen(open); if (!open) setDeleteConfirmOpen(false); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Lab</DialogTitle>
              <DialogDescription>Update details for <span className="font-medium text-foreground">{selectedLabForEdit?.name}</span>.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Lab Name</label>
                <Input value={editLabName} onChange={e => setEditLabName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Input value={editLabDesc} onChange={e => setEditLabDesc(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Head Teacher</label>
                <Select value={editLabHead} onValueChange={setEditLabHead}>
                  <SelectTrigger><SelectValue placeholder="Select head" /></SelectTrigger>
                  <SelectContent>
                    {headTeacherUsers.map(({ teacher, user }) => (
                      <SelectItem key={teacher.user_id} value={String(teacher.user_id)}>
                        {user?.full_name ?? `User ${teacher.user_id}`} ({teacher.grade})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                
                <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Delete lab</p>
                    <p className="text-xs text-muted-foreground">This removes the lab and its groups.</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteConfirmOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-1" />Delete lab
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" disabled={isSavingLab || isDeletingLab}>Cancel</Button></DialogClose>
              <Button onClick={handleSaveLab} disabled={!editLabName.trim() || isSavingLab || isDeletingLab}>
                {isSavingLab ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CREATE ADMIN DIALOG */}
        <Dialog open={createAdminOpen} onOpenChange={(open) => { if (!isCreatingAdmin) setCreateAdminOpen(open); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Admin</DialogTitle>
              <DialogDescription>Create a new admin account.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full name</label>
                <Input value={newAdminFullName} onChange={e => setNewAdminFullName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="admin@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Input
                  type="password"
                  value={newAdminPassword}
                  onChange={e => setNewAdminPassword(e.target.value)}
                  placeholder="admin"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" disabled={isCreatingAdmin}>Cancel</Button></DialogClose>
              <Button onClick={handleCreateAdmin} disabled={!newAdminFullName.trim() || !newAdminEmail.trim() || isCreatingAdmin}>
                {isCreatingAdmin ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Delete lab?</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <span className="font-medium text-foreground">{selectedLabForEdit?.name}</span>? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeletingLab}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteLab} disabled={isDeletingLab}>
                {isDeletingLab ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete lab'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
};

export default AdminPanel;
