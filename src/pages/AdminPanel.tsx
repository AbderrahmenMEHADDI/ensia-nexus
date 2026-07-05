import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import { BASE_URL } from '@/lib/apiClient';
import { RoleBadge } from '@/components/Badges';
import { cn } from '@/lib/utils';
import type { GroupMember, ResearchLab, ResearchGroup, ResearchLabAdmin, User, Teacher, UserRole, Project, CollaborationCall, ProjectApplication } from '@/types';
import {
  Shield, Users, CheckCircle2, XCircle, Clock, Search, Plus,
  Building2, UserCog, UserPlus, FlaskConical, Loader2, Info,
  Trash2, ArrowRight, UserCheck, Mail, FolderGit2, Archive, FileText, Eye, EyeOff
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

type AdminPanelProps = {
  myLabsOnly?: boolean;
};

const AdminPanel = ({ myLabsOnly = false }: AdminPanelProps) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [labs, setLabs] = useState<ResearchLab[]>([]);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [labAdmins, setLabAdmins] = useState<ResearchLabAdmin[]>([]);
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
  const [manageAdminsOpen, setManageAdminsOpen] = useState(false);
  const [editLabOpen, setEditLabOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [assignMembersOpen, setAssignMembersOpen] = useState(false);
  const [selectedGroupForLeader, setSelectedGroupForLeader] = useState<ResearchGroup | null>(null);
  const [selectedLabForAdmins, setSelectedLabForAdmins] = useState<ResearchLab | null>(null);
  const [selectedLabForEdit, setSelectedLabForEdit] = useState<ResearchLab | null>(null);

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
  const [newAdminUser, setNewAdminUser] = useState('');
  const [editLabName, setEditLabName] = useState('');
  const [editLabDesc, setEditLabDesc] = useState('');
  const [editLabHead, setEditLabHead] = useState('');
  const [newAdminFullName, setNewAdminFullName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
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

  // Edit Group states
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<ResearchGroup | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [editGroupLeaderId, setEditGroupLeaderId] = useState('');
  const [editGroupShowOnLanding, setEditGroupShowOnLanding] = useState(true);
  const [editGroupPictureUrl, setEditGroupPictureUrl] = useState('');
  const [editGroupPictureFile, setEditGroupPictureFile] = useState<File | null>(null);
  const [editGroupPicturePreview, setEditGroupPicturePreview] = useState('');
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  // Projects tab states
  const [projects, setProjects] = useState<any[]>([]);
  const [colabCalls, setColabCalls] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [archivedAppIds, setArchivedAppIds] = useState<number[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Edit Project states
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState<any | null>(null);
  const [editProjectTitle, setEditProjectTitle] = useState('');
  const [editProjectDesc, setEditProjectDesc] = useState('');
  const [editProjectStatus, setEditProjectStatus] = useState<any>('PENDING');
  const [editProjectVisibility, setEditProjectVisibility] = useState<any>('PUBLIC');
  const [editProjectAccepting, setEditProjectAccepting] = useState(true);
  const [editProjectDeadline, setEditProjectDeadline] = useState('');
  const [isSavingProject, setIsSavingProject] = useState(false);

  // Delete Project states
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [selectedProjectForDelete, setSelectedProjectForDelete] = useState<any | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

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
          apiRepository.getLabAdmins(),
          fetchAllTeachers(),
          apiRepository.getUsers({ limit: 1000 }),
          apiRepository.getGroupMembers(),
        ]);
        setLabs(sortLabsByNewest(l));
        setGroups(g);
        setLabAdmins(la);
        setTeachers(t);
        setGroupMembers(gm);
        mergeUsersIntoLookup(allUsers);

        // Load archived application IDs from localStorage
        const archivedString = localStorage.getItem('ensia_nexus_archived_applications');
        if (archivedString) {
          try {
            setArchivedAppIds(JSON.parse(archivedString));
          } catch (e) {
            console.error('Failed to parse archived applications from localStorage:', e);
          }
        }

        // Fetch Projects, Colab Calls, Applications
        let pList: any[] = [];
        let ccList: any[] = [];
        let appList: any[] = [];
        try {
          pList = await apiRepository.getProjects();
        } catch (err) {
          console.error('Failed to fetch projects:', err);
        }
        try {
          ccList = await apiRepository.getEligibleCollaborationCalls();
        } catch (err) {
          console.error('Failed to fetch colab calls:', err);
        }
        try {
          appList = await apiRepository.getApplications();
        } catch (err) {
          console.error('Failed to fetch applications:', err);
        }
        setProjects(pList);
        setColabCalls(ccList);
        setApplications(appList);

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
  const eligibleTeachers = teachers.filter(t => t.grade === 'MCA' || t.grade === 'PROFESSOR');
  const headTeacherUsers = eligibleTeachers
    .map(t => ({ teacher: t, user: userLookup[t.user_id] }))
    .filter(({ user }) => user && user.role === 'TEACHER');
  const totalUserPages = Math.max(1, Math.ceil(userTotal / userPageSize));
  const teacherUsers = teachers
    .map(t => userLookup[t.user_id])
    .filter((u): u is User => !!u && u.role === 'TEACHER');
  const manageableGroups = groups.filter(g => canManageLab(g.lab_id));
  const visibleLabs = myLabsOnly ? manageableLabs : labs;
  const visibleGroups = myLabsOnly ? manageableGroups : groups;
  const pendingGroups = visibleGroups.filter(g => !g.is_validated);
  const validatedGroups = visibleGroups.filter(g => g.is_validated);
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
  const labAdminsFor = (labId: number) => labAdmins.filter(a => a.lab_id === labId);
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

  const handleOpenManageAdmins = (lab: ResearchLab) => {
    if (!canManageLab(lab.id)) {
      toast({ title: 'Not authorized', variant: 'destructive' });
      return;
    }
    setSelectedLabForAdmins(lab);
    setNewAdminUser('');
    setManageAdminsOpen(true);
  };

  const handleAddAdmin = async () => {
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
    if (admins.length <= 1) {
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

  const handleOpenEditLab = (lab: ResearchLab) => {
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

  // Group Edit Handlers
  const handleOpenEditGroup = (group: ResearchGroup) => {
    setSelectedGroupForEdit(group);
    setEditGroupName(group.name);
    setEditGroupDesc(group.description ?? '');
    setEditGroupLeaderId(group.leader_user_id ? String(group.leader_user_id) : '');
    setEditGroupShowOnLanding(group.show_on_landing_page ?? group.show_on_landing_page ?? true);
    setEditGroupPictureUrl(group.picture_url ?? '');
    setEditGroupPictureFile(null);
    setEditGroupPicturePreview(group.picture_url ?? '');
    setEditGroupOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!selectedGroupForEdit || isSavingGroup) return;
    if (!editGroupName.trim()) {
      toast({ title: 'Group name is required', variant: 'destructive' });
      return;
    }
    setIsSavingGroup(true);
    try {
      let updated = await apiRepository.updateGroup(selectedGroupForEdit.id, {
        name: editGroupName.trim(),
        description: editGroupDesc.trim(),
        leader_user_id: editGroupLeaderId ? Number(editGroupLeaderId) : undefined,
        show_on_landing_page: editGroupShowOnLanding,
      });

      if (editGroupPictureFile) {
        const formData = new FormData();
        formData.append('file', editGroupPictureFile);
        updated = await apiRepository.updateGroupPicture(selectedGroupForEdit.id, formData);
      } else if (editGroupPictureUrl !== (selectedGroupForEdit.picture_url || '')) {
        const formData = new FormData();
        if (editGroupPictureUrl.trim()) {
          formData.append('url', editGroupPictureUrl.trim());
        }
        updated = await apiRepository.updateGroupPicture(selectedGroupForEdit.id, formData);
      }

      setGroups(prev => prev.map(g => g.id === selectedGroupForEdit.id ? updated : g));
      toast({ title: 'Group updated successfully' });
      setEditGroupOpen(false);
    } catch (err) {
      console.error('Failed to update group:', err);
      toast({ title: 'Failed to update group', variant: 'destructive' });
    } finally {
      setIsSavingGroup(false);
    }
  };

  // Project Edit/Delete Handlers
  const handleOpenEditProject = (project: any) => {
    setSelectedProjectForEdit(project);
    setEditProjectTitle(project.title);
    setEditProjectDesc(project.description ?? '');
    setEditProjectStatus(project.status || 'PENDING');
    setEditProjectVisibility(project.visibility || 'PUBLIC');
    setEditProjectAccepting(project.accepting_collaborators ?? true);
    setEditProjectDeadline(project.deadline ? project.deadline.split('T')[0] : '');
    setEditProjectOpen(true);
  };

  const handleSaveProject = async () => {
    if (!selectedProjectForEdit || isSavingProject) return;
    if (!editProjectTitle.trim()) {
      toast({ title: 'Project title is required', variant: 'destructive' });
      return;
    }
    setIsSavingProject(true);
    try {
      const updated = await apiRepository.updateProject(selectedProjectForEdit.id, {
        title: editProjectTitle.trim(),
        description: editProjectDesc.trim(),
        status: editProjectStatus,
        visibility: editProjectVisibility,
        accepting_collaborators: editProjectAccepting,
        deadline: editProjectDeadline ? new Date(editProjectDeadline).toISOString() : undefined,
      });
      setProjects(prev => prev.map(p => p.id === selectedProjectForEdit.id ? updated : p));
      toast({ title: 'Project updated successfully' });
      setEditProjectOpen(false);
    } catch (err) {
      console.error('Failed to update project:', err);
      toast({ title: 'Failed to update project', variant: 'destructive' });
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleOpenDeleteProject = (project: any) => {
    setSelectedProjectForDelete(project);
    setDeleteProjectOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!selectedProjectForDelete || isDeletingProject) return;
    setIsDeletingProject(true);
    try {
      await apiRepository.deleteProject(selectedProjectForDelete.id);
      setProjects(prev => prev.filter(p => p.id !== selectedProjectForDelete.id));
      toast({ title: 'Project deleted successfully' });
      setDeleteProjectOpen(false);
    } catch (err) {
      console.error('Failed to delete project:', err);
      toast({ title: 'Failed to delete project', variant: 'destructive' });
    } finally {
      setIsDeletingProject(false);
    }
  };

  // Collaboration Call Handlers
  const handleArchiveColabCall = async (callId: number) => {
    try {
      await apiRepository.updateCollaborationCall(callId, {
        status: 'CLOSED'
      });
      setColabCalls(prev => prev.map(c => c.id === callId ? { ...c, status: 'CLOSED' } : c));
      toast({ title: 'Collaboration call closed/archived successfully' });
    } catch (err) {
      console.error('Failed to archive colab call:', err);
      toast({ title: 'Failed to archive collaboration call', variant: 'destructive' });
    }
  };

  const handleDeleteColabCall = async (callId: number) => {
    try {
      await apiRepository.deleteCollaborationCall(callId);
      setColabCalls(prev => prev.filter(c => c.id !== callId));
      toast({ title: 'Collaboration call deleted successfully' });
    } catch (err) {
      console.error('Failed to delete colab call:', err);
      toast({ title: 'Failed to delete collaboration call', variant: 'destructive' });
    }
  };

  // Project Application Handlers
  const handleArchiveApplication = (appId: number) => {
    setArchivedAppIds(prev => {
      const next = prev.includes(appId) ? prev : [...prev, appId];
      localStorage.setItem('ensia_nexus_archived_applications', JSON.stringify(next));
      return next;
    });
    toast({ title: 'Application archived' });
  };

  const handleReviewApplication = async (appId: number, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await apiRepository.reviewApplication(appId, {
        status
      });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
      toast({ title: `Application status updated to ${status}` });
    } catch (err) {
      console.error('Failed to review application:', err);
      toast({ title: 'Failed to review application', variant: 'destructive' });
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
    <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="relative mb-12">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-destructive/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl mb-1">
                Admin <span className="text-primary italic">Panel</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-full bg-secondary/80 border border-border flex items-center gap-2 text-sm font-medium shadow-sm">
              <Building2 className="h-4 w-4 text-primary" />
              <span>{labs.length} Labs</span>
            </div>
            <div className="px-4 py-2 rounded-full bg-secondary/80 border border-border flex items-center gap-2 text-sm font-medium shadow-sm">
              <Users className="h-4 w-4 text-primary" />
              <span>{userTotal} Users</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue={myLabsOnly ? 'labs' : 'groups'} className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/50 pb-4">
          <TabsList className="bg-secondary/40 p-1 rounded-xl border border-border/50">
            <TabsTrigger value="labs" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">
              <FlaskConical className="h-4 w-4 mr-2" />Labs
            </TabsTrigger>
            <TabsTrigger value="groups" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">
              <Building2 className="h-4 w-4 mr-2" />Groups
            </TabsTrigger>
            {!myLabsOnly && (
              <TabsTrigger value="requests" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">
                <UserPlus className="h-4 w-4 mr-2" />Requests
              </TabsTrigger>
            )}
            {!myLabsOnly && (
              <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">
                <Users className="h-4 w-4 mr-2" />Users
              </TabsTrigger>
            )}
            {!myLabsOnly && (
              <TabsTrigger value="projects" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">
                <FolderGit2 className="h-4 w-4 mr-2" />Projects
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex items-center gap-3">
            {isPlatformAdmin && (
              <Button onClick={() => setAddLabOpen(true)} size="sm" className="rounded-lg h-9 font-semibold" style={{ background: '#F47A1E', color: '#fff' }}>
                <Plus className="h-4 w-4 mr-1.5" />New Lab
              </Button>
            )}
            {manageableLabs.length > 0 && (
              <Button onClick={() => setAddGroupOpen(true)} size="sm" variant="outline" className="rounded-lg h-9 font-semibold text-[#173C7E] border-[#173C7E]/20 hover:bg-[#173C7E] hover:text-white">
                <Plus className="h-4 w-4 mr-1.5" />New Group
              </Button>
            )}
          </div>
        </div>

        {/* LABS TAB */}
        <TabsContent value="labs" className="space-y-6 focus-visible:outline-none outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleLabs.map((lab, index) => {
              const head = getUserById(lab.head_teacher_id);
              const labGroups = groups.filter(g => g.lab_id === lab.id);
              const admins = labAdminsFor(lab.id);
              return (
                <motion.div
                  key={lab.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="h-full"
                >
                  <Card className="group h-full flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] hover:shadow-xl transition-all duration-300">
                    <CardHeader className="p-6 flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{lab.name}</CardTitle>
                          <CardDescription className="line-clamp-2 text-xs leading-relaxed min-h-[2.5rem]">
                            {lab.description || "No description provided for this research laboratory."}
                          </CardDescription>
                        </div>
                        {(canManageLab(lab.id) || isPlatformAdmin) && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5"
                              onClick={() => handleOpenManageAdmins(lab)}
                              title="Manage Admins"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                            {isPlatformAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                                onClick={() => handleOpenEditLab(lab)}
                                title="Edit Lab"
                              >
                                <UserCog className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 space-y-4">
                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/50">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Groups</p>
                          <p className="text-sm font-bold">{labGroups.length}</p>
                        </div>
                        <div className="text-center border-x border-border/50">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Admins</p>
                          <p className="text-sm font-bold">{admins.length}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Role</p>
                          <p className="text-xs font-medium text-primary">{isPlatformAdmin ? 'Platform' : 'Lab Admin'}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <ProfileAvatar
                            userId={head?.id}
                            name={head?.full_name}
                            className="h-8 w-8 rounded-full border border-background shadow-sm"
                            textClassName="text-[10px] font-bold"
                          />
                          <div className="flex flex-col min-w-0">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Lab Head</p>
                            <p className="text-xs font-semibold truncate">{head?.full_name ?? 'Unassigned'}</p>
                          </div>
                        </div>

                        <div className="flex -space-x-2 overflow-hidden py-1">
                          {admins.slice(0, 4).map(admin => {
                            const au = getUserById(admin.user_id);
                            return (
                              <ProfileAvatar
                                key={admin.user_id}
                                userId={au?.id}
                                name={au?.full_name}
                                className="h-7 w-7 rounded-full border-2 border-card shadow-sm"
                                textClassName="text-[8px] font-bold"
                                title={au?.full_name}
                              />
                            );
                          })}
                          {admins.length > 4 && (
                            <div className="h-7 w-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                              +{admins.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            {visibleLabs.length === 0 && (
              <div className="col-span-full rounded-2xl border border-slate-100 bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] p-16 text-center">
                <FlaskConical className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-1 text-[#173C7E]">No labs found</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">You don't have administrative access to any labs at the moment.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* GROUPS TAB */}
        <TabsContent value="groups" className="space-y-10 focus-visible:outline-none outline-none">
          {pendingGroups.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-lg font-bold">Groups Awaiting Validation</h3>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 rounded-full">{pendingGroups.length}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingGroups.map((group, index) => {
                  const leader = getUserById(group.leader_user_id);
                  const lab = labs.find(l => l.id === group.lab_id);
                  const requester = group.requested_by_user_id ? getUserById(group.requested_by_user_id) : undefined;
                  const canManage = canManageLab(group.lab_id) || isPlatformAdmin;

                  return (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/[0.08] transition-colors relative group shadow-sm">
                        {canManage && (
                          <div className="absolute top-4 right-4 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-full border-amber-500/20 hover:bg-amber-500/20 text-amber-700"
                              onClick={() => handleValidate(group.id)}
                              disabled={validatingGroupIds.includes(group.id)}
                            >
                              {validatingGroupIds.includes(group.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                              Validate
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteGroup(group.id)}
                              disabled={deletingGroupIds.includes(group.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        <CardHeader className="pb-4">
                          <div className={cn("space-y-1", canManage ? "pr-20" : "")}>
                            <CardTitle className="text-lg font-bold">{group.name}</CardTitle>
                            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{lab?.name}</p>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground line-clamp-2 italic">
                            "{group.description || "Request to create a new specialized research group."}"
                          </p>

                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-amber-500/10">
                            <div className="flex items-center gap-2">
                              <ProfileAvatar userId={requester?.id} name={requester?.full_name} className="h-8 w-8" textClassName="text-[10px]" />
                              <div className="min-w-0">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Requested By</p>
                                <p className="text-xs font-semibold truncate">{requester?.full_name ?? 'System'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <ProfileAvatar userId={leader?.id} name={leader?.full_name} className="h-8 w-8" textClassName="text-[10px]" />
                              <div className="min-w-0">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Proposed Leader</p>
                                <p className={cn("text-xs font-semibold truncate", !leader && "text-destructive")}>{leader?.full_name ?? 'Not Assigned'}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        {canManage && (
                          <CardFooter className="pb-4 pt-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[10px] font-bold uppercase tracking-widest gap-1.5 h-7 px-2 hover:bg-amber-500/10"
                              onClick={() => { setSelectedGroupForLeader(group); setAssignLeaderOpen(true); }}
                            >
                              <UserCog className="h-3 w-3" /> Change Leader
                            </Button>
                          </CardFooter>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Active Research Groups</h3>
                <Badge variant="secondary" className="rounded-full bg-secondary/50">{validatedGroups.length}</Badge>
              </div>
              {manageableGroups.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full h-8 font-semibold text-xs border-border/50 hover:bg-secondary"
                  onClick={() => setAssignMembersOpen(true)}
                >
                  <Users className="h-3.5 w-3.5 mr-1.5" /> Bulk Member Assignment
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {validatedGroups.map(group => {
                const leader = getUserById(group.leader_user_id);
                const lab = labs.find(l => l.id === group.lab_id);
                const activeCount = groupMembers.filter(m => m.group_id === group.id && m.is_active).length;
                const canManage = canManageLab(group.lab_id) || isPlatformAdmin;
                return (
                  <motion.div
                    key={group.id}
                    layout
                    className="p-4 rounded-2xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 group/item hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-foreground truncate">{group.name}</span>
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-bold border-border/50 uppercase tracking-tighter shrink-0">{lab?.name.split('—')[0]?.trim()}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" />{leader?.full_name ?? 'No Leader'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{activeCount} active members</span>
                        </div>
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-2 sm:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditGroup(group)}
                          className="h-8 text-xs font-bold gap-1.5 px-3 rounded-lg hover:bg-primary/5 hover:text-primary"
                        >
                          <UserCog className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedGroupForLeader(group); setAssignLeaderOpen(true); }}
                          className="h-8 text-xs font-bold gap-1.5 px-3 rounded-lg hover:bg-primary/5 hover:text-primary"
                        >
                          <UserCog className="h-3.5 w-3.5" /> Leader
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteGroup(group.id)}
                          disabled={deletingGroupIds.includes(group.id)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* REQUESTS TAB */}
        {!myLabsOnly && (
          <TabsContent value="requests" className="focus-visible:outline-none outline-none">
            <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
              <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto shadow-inner">
                <Clock className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Join Requests Module</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The automated processing system for group join requests is currently under maintenance. Administrators can still manually assign members through the <b>Groups</b> tab.
                </p>
              </div>
              <Button variant="outline" className="rounded-full px-8 font-bold border-border/50" disabled>
                System Maintenance
              </Button>
            </div>
          </TabsContent>
        )}

        {/* USERS TAB */}
        {!myLabsOnly && (
          <TabsContent value="users" className="space-y-8 focus-visible:outline-none outline-none">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={e => { setUserPage(1); setUserSearch(e.target.value); }}
                  placeholder="Search by name, email, or role..."
                  className="pl-11 h-12 rounded-2xl bg-secondary/20 border-border/50 focus:bg-background transition-all"
                />
              </div>

              <div className="flex items-center gap-3">
                <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v as UserRole | 'ALL'); setUserPage(1); }}>
                  <SelectTrigger className="w-[160px] h-10 rounded-xl bg-secondary/30 border-border/50">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="STUDENT">Students</SelectItem>
                    <SelectItem value="TEACHER">Teachers</SelectItem>
                    <SelectItem value="ADMIN">Admins</SelectItem>
                    <SelectItem value="PARTNER">Partners</SelectItem>
                  </SelectContent>
                </Select>

                {isPlatformAdmin && (
                  <Button size="sm" onClick={() => setCreateAdminOpen(true)} className="rounded-full h-10 px-5 shadow-lg shadow-primary/10">
                    <UserPlus className="h-4 w-4 mr-2" />Add Admin
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((u, index) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (index % 12) * 0.03 }}
                  className="p-4 rounded-2xl border border-border bg-card hover:bg-secondary/10 transition-colors flex items-center justify-between group/user"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ProfileAvatar
                      userId={u.id}
                      name={u.full_name}
                      className="h-10 w-10 rounded-xl bg-primary/10 shadow-sm ring-1 ring-border"
                      textClassName="text-xs font-bold text-primary"
                    />
                    <div className="min-w-0 flex flex-col">
                      <span className="text-sm font-bold truncate group-hover/user:text-primary transition-colors">{u.full_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground truncate">{u.email}</span>
                        <RoleBadge role={u.role} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover/user:opacity-100 transition-opacity">
                      <Mail className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover/user:opacity-100 transition-opacity">
                      <UserCog className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {totalUserPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserPage(p => Math.max(1, p - 1))}
                  disabled={userPage === 1}
                  className="rounded-xl border-border/50"
                >
                  Previous
                </Button>
                <div className="px-4 py-1.5 rounded-full bg-secondary/50 text-xs font-bold font-mono">
                  Page {userPage} of {totalUserPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                  disabled={userPage === totalUserPages}
                  className="rounded-xl border-border/50"
                >
                  Next
                </Button>
              </div>
            )}
          </TabsContent>
        )}

        {/* PROJECTS TAB */}
        {!myLabsOnly && (
          <TabsContent value="projects" className="space-y-10 focus-visible:outline-none outline-none">
            {/* Top filters / searches */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/50 pb-6">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={projectSearch}
                  onChange={e => setProjectSearch(e.target.value)}
                  placeholder="Search projects, calls or applications..."
                  className="pl-11 h-12 rounded-2xl bg-secondary/20 border-border/50 focus:bg-background transition-all"
                />
              </div>

              <div className="flex items-center gap-3">
                <Select value={projectStatusFilter} onValueChange={(v: any) => setProjectStatusFilter(v)}>
                  <SelectTrigger className="w-[160px] h-10 rounded-xl bg-secondary/30 border-border/50">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    <SelectItem value="ALL">All Projects</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Layout for 3 sections: Projects, Colab Calls, and Applications */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* SECTION 1: PROJECTS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold">Projects List</h3>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-secondary/50">
                    {projects.filter(p => 
                      (projectStatusFilter === 'ALL' || p.status === projectStatusFilter) &&
                      p.title.toLowerCase().includes(projectSearch.toLowerCase())
                    ).length}
                  </Badge>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {projects
                    .filter(p => 
                      (projectStatusFilter === 'ALL' || p.status === projectStatusFilter) &&
                      (p.title.toLowerCase().includes(projectSearch.toLowerCase()) || 
                       (p.description && p.description.toLowerCase().includes(projectSearch.toLowerCase())))
                    )
                    .map(project => {
                      const group = groups.find(g => g.id === project.group_id);
                      return (
                        <Card key={project.id} className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-300 shadow-sm flex flex-col justify-between h-[190px]">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-bold text-sm text-foreground truncate block flex-1" title={project.title}>
                                {project.title}
                              </span>
                              <Badge className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                                project.status === 'APPROVED' && "bg-green-500/10 text-green-600 border-green-500/20",
                                project.status === 'PENDING' && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                                project.status === 'REJECTED' && "bg-red-500/10 text-red-600 border-red-500/20"
                              )}>
                                {project.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-3">
                              {project.description || "No description provided."}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px]">
                            <span className="text-muted-foreground font-medium truncate max-w-[120px]">
                              Group: {group?.name || `Group ${project.group_id}`}
                            </span>
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs font-semibold px-2 rounded-md hover:bg-primary/5 hover:text-primary animate-fade-in"
                                onClick={() => handleOpenEditProject(project)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs font-semibold px-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                onClick={() => handleOpenDeleteProject(project)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}

                  {projects.filter(p => 
                    (projectStatusFilter === 'ALL' || p.status === projectStatusFilter) &&
                    p.title.toLowerCase().includes(projectSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                      No projects found.
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: COLLABORATION REQUESTS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold">Colab Requests</h3>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-secondary/50">
                    {colabCalls.filter(c => 
                      c.title.toLowerCase().includes(projectSearch.toLowerCase())
                    ).length}
                  </Badge>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {colabCalls
                    .filter(c => 
                      c.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
                      (c.description && c.description.toLowerCase().includes(projectSearch.toLowerCase()))
                    )
                    .map(call => (
                      <Card key={call.id} className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-300 shadow-sm flex flex-col justify-between h-[190px]">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-sm text-foreground truncate block flex-1" title={call.title}>
                              {call.title}
                            </span>
                            <Badge className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                              call.status === 'OPEN' && "bg-green-500/10 text-green-600 border-green-500/20",
                              call.status === 'CLOSED' && "bg-gray-500/10 text-gray-600 border-gray-500/20",
                              call.status === 'ARCHIVED' && "bg-gray-500/10 text-gray-600 border-gray-500/20"
                            )}>
                              {call.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {call.description || "No details provided."}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px]">
                          <span className="text-muted-foreground">
                            Project ID: {call.project_id}
                          </span>
                          <div className="flex gap-1.5">
                            {call.status !== 'CLOSED' && call.status !== 'ARCHIVED' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs font-semibold px-2 rounded-md hover:bg-amber-500/10 text-amber-600"
                                onClick={() => handleArchiveColabCall(call.id)}
                              >
                                Archive
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs font-semibold px-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteColabCall(call.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}

                  {colabCalls.filter(c => 
                    c.title.toLowerCase().includes(projectSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                      No collaboration requests found.
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: PROJECT APPLICATIONS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Archive className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold">Applications</h3>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-secondary/50">
                    {applications.filter(a => 
                      !archivedAppIds.includes(a.id) &&
                      (a.motivation_letter || "").toLowerCase().includes(projectSearch.toLowerCase())
                    ).length}
                  </Badge>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {/* Active Applications */}
                  {applications
                    .filter(a => !archivedAppIds.includes(a.id))
                    .filter(a => 
                      (a.motivation_letter || "").toLowerCase().includes(projectSearch.toLowerCase()) ||
                      String(a.student_user_id).includes(projectSearch)
                    )
                    .map(app => {
                      const studentUser = getUserById(app.student_user_id);
                      return (
                        <Card key={app.id} className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-300 shadow-sm flex flex-col justify-between h-[190px]">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-bold text-sm text-foreground truncate block flex-1">
                                {studentUser?.full_name || `Student ${app.student_user_id}`}
                              </span>
                              <Badge className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                                app.status === 'ACCEPTED' && "bg-green-500/10 text-green-600 border-green-500/20",
                                app.status === 'PENDING' && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                                app.status === 'REJECTED' && "bg-red-500/10 text-red-600 border-red-500/20"
                              )}>
                                {app.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-3 italic">
                              "{app.motivation_letter || "No motivation letter provided."}"
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px]">
                            <span className="text-muted-foreground">
                              Project ID: {app.project_id}
                            </span>
                            <div className="flex gap-1.5">
                              {app.status === 'PENDING' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs font-semibold px-2 rounded-md hover:bg-green-500/10 text-green-600"
                                    onClick={() => handleReviewApplication(app.id, 'ACCEPTED')}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs font-semibold px-2 rounded-md hover:bg-red-500/10 text-red-600"
                                    onClick={() => handleReviewApplication(app.id, 'REJECTED')}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs font-semibold px-2 rounded-md hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600"
                                onClick={() => handleArchiveApplication(app.id)}
                              >
                                Archive
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}

                  {/* Archived section header if any archived exist */}
                  {applications.some(a => archivedAppIds.includes(a.id)) && (
                    <div className="pt-4 border-t border-border/50">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold mb-2">
                        <Archive className="h-3.5 w-3.5" />
                        <span>Archived Applications</span>
                      </div>
                      <div className="space-y-3 opacity-60">
                        {applications
                          .filter(a => archivedAppIds.includes(a.id))
                          .map(app => {
                            const studentUser = getUserById(app.student_user_id);
                            return (
                              <div key={app.id} className="p-3 rounded-lg border border-border bg-muted flex items-center justify-between text-xs animate-fade-in">
                                <span className="font-semibold">{studentUser?.full_name || `Student ${app.student_user_id}`}</span>
                                <Badge className="text-[8px]">{app.status}</Badge>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {applications.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                      No applications found.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Dialogs */}
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
            <Button variant="outline" onClick={() => setAddLabOpen(false)}>Cancel</Button>
            <Button onClick={handleAddLab} disabled={!newLabName.trim() || !newLabHead || isCreatingLab}>
              {isCreatingLab ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Lab'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addGroupOpen} onOpenChange={setAddGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Group</DialogTitle>
            <DialogDescription>Create a new research group.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Group Name</label>
              <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Group name..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Input value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} placeholder="Description..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Lab</label>
              <Select value={newGroupLab} onValueChange={setNewGroupLab}>
                <SelectTrigger><SelectValue placeholder="Select lab" /></SelectTrigger>
                <SelectContent>
                  {manageableLabs.map(l => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddGroupOpen(false)}>Cancel</Button>
            <Button onClick={handleAddGroup} disabled={!newGroupName.trim() || !newGroupLab || isCreatingGroup}>
              {isCreatingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignLeaderOpen} onOpenChange={setAssignLeaderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Leader</DialogTitle>
            <DialogDescription>Assign a leader to {selectedGroupForLeader?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={selectedLeader} onValueChange={setSelectedLeader}>
              <SelectTrigger><SelectValue placeholder="Select leader" /></SelectTrigger>
              <SelectContent>
                {headTeacherUsers.map(({ teacher, user }) => (
                  <SelectItem key={teacher.user_id} value={String(teacher.user_id)}>{user?.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignLeaderOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignLeader} disabled={!selectedLeader || isAssigningLeader}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manageAdminsOpen} onOpenChange={setManageAdminsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lab Admins</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-wrap gap-2">
              {selectedLabForAdmins && labAdminsFor(selectedLabForAdmins.id).map(a => {
                const au = getUserById(a.user_id);
                return (
                  <Badge key={a.user_id} variant="secondary" className="gap-2">
                    {au?.full_name}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-4 w-4"
                      onClick={() => handleRemoveAdmin(selectedLabForAdmins.id, a.user_id)}
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Select value={newAdminUser} onValueChange={setNewAdminUser}>
                <SelectTrigger><SelectValue placeholder="Add admin..." /></SelectTrigger>
                <SelectContent>
                  {teacherUsers.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={handleAddAdmin} disabled={!newAdminUser}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editLabOpen} onOpenChange={setEditLabOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Lab</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Input value={editLabName} onChange={e => setEditLabName(e.target.value)} placeholder="Lab name" />
            <Input value={editLabDesc} onChange={e => setEditLabDesc(e.target.value)} placeholder="Description" />
            <Select value={editLabHead} onValueChange={setEditLabHead}>
              <SelectTrigger><SelectValue placeholder="Head teacher" /></SelectTrigger>
              <SelectContent>
                {headTeacherUsers.map(({ teacher, user }) => (
                  <SelectItem key={teacher.user_id} value={String(teacher.user_id)}>{user?.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="destructive" className="w-full" onClick={() => setDeleteConfirmOpen(true)}>Delete Lab</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLabOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLab}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createAdminOpen} onOpenChange={setCreateAdminOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Admin</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Input value={newAdminFullName} onChange={e => setNewAdminFullName(e.target.value)} placeholder="Full name" />
            <Input value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="Email" />
            <div className="relative">
              <Input 
                type={showAdminPassword ? "text" : "password"} 
                value={newAdminPassword} 
                onChange={e => setNewAdminPassword(e.target.value)} 
                placeholder="Password" 
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateAdminOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAdmin}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Are you absolutely sure?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete the lab and all associated groups.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteLab}>Confirm Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignMembersOpen} onOpenChange={setAssignMembersOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader><DialogTitle>Bulk Member Assignment</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">Groups ({selectedAssignmentGroups.length})</label>
              <div className="h-60 overflow-y-auto border rounded-md p-2 space-y-1">
                {manageableGroups.map(g => (
                  <div key={g.id} className="flex items-center gap-2">
                    <Checkbox checked={selectedAssignmentGroups.includes(g.id)} onCheckedChange={() => toggleAssignmentGroup(g.id)} />
                    <span className="text-xs truncate">{g.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">Teachers ({selectedAssignmentTeachers.length})</label>
              <div className="h-60 overflow-y-auto border rounded-md p-2 space-y-1">
                {teacherUsers.map(t => (
                  <div key={t.id} className="flex items-center gap-2">
                    <Checkbox checked={selectedAssignmentTeachers.includes(t.id)} onCheckedChange={() => toggleAssignmentTeacher(t.id)} />
                    <span className="text-xs truncate">{t.full_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignMembersOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkAssignMembers}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={editGroupOpen} onOpenChange={setEditGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>Modify research group details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Picture Upload/Preview Section */}
            <div className="flex flex-col items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800">
              <div className="relative group h-24 w-40 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 flex items-center justify-center">
                {editGroupPicturePreview ? (
                  <img
                    src={editGroupPicturePreview.startsWith('/') && !editGroupPicturePreview.startsWith('data:')
                      ? `${BASE_URL}${editGroupPicturePreview}`
                      : editGroupPicturePreview}
                    alt="Group Cover Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <FlaskConical className="h-8 w-8" />
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">No Cover</span>
                  </div>
                )}
                {editGroupPicturePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditGroupPictureFile(null);
                      setEditGroupPictureUrl('');
                      setEditGroupPicturePreview('');
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                    title="Remove Image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="w-full space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upload Group Picture</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditGroupPictureFile(file);
                        setEditGroupPictureUrl('');
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditGroupPicturePreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-xs cursor-pointer"
                  />
                </div>
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink mx-2 text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Or</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Image URL</label>
                  <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={editGroupPictureUrl}
                    onChange={(e) => {
                      setEditGroupPictureUrl(e.target.value);
                      setEditGroupPictureFile(null);
                      setEditGroupPicturePreview(e.target.value);
                    }}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Group Name</label>
              <Input value={editGroupName} onChange={e => setEditGroupName(e.target.value)} placeholder="Group name..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Input value={editGroupDesc} onChange={e => setEditGroupDesc(e.target.value)} placeholder="Description..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Leader</label>
              <Select value={editGroupLeaderId} onValueChange={setEditGroupLeaderId}>
                <SelectTrigger><SelectValue placeholder="Select leader" /></SelectTrigger>
                <SelectContent>
                  {headTeacherUsers.map(({ teacher, user }) => (
                    <SelectItem key={teacher.user_id} value={String(teacher.user_id)}>{user?.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="editGroupShowOnLanding" checked={editGroupShowOnLanding} onCheckedChange={(checked: any) => setEditGroupShowOnLanding(!!checked)} />
              <label htmlFor="editGroupShowOnLanding" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Show on Landing Page
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGroupOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveGroup} disabled={isSavingGroup}>
              {isSavingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={editProjectOpen} onOpenChange={setEditProjectOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details and settings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Project Title</label>
              <Input value={editProjectTitle} onChange={e => setEditProjectTitle(e.target.value)} placeholder="Project title..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Input value={editProjectDesc} onChange={e => setEditProjectDesc(e.target.value)} placeholder="Description..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select value={editProjectStatus} onValueChange={(v: any) => setEditProjectStatus(v)}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Visibility</label>
                <Select 
                  value={editProjectVisibility} 
                  onValueChange={(v: any) => {
                    setEditProjectVisibility(v);
                    if (v === 'PRIVATE') {
                      setEditProjectAccepting(false);
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Visibility" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Deadline</label>
              <Input type="date" value={editProjectDeadline} onChange={e => setEditProjectDeadline(e.target.value)} />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="editProjectAccepting" 
                checked={editProjectAccepting} 
                onCheckedChange={(checked: any) => setEditProjectAccepting(!!checked)} 
                disabled={editProjectVisibility === 'PRIVATE'}
              />
              <label htmlFor="editProjectAccepting" className="text-sm font-medium leading-none">
                Accepting Collaborators
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProjectOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProject} disabled={isSavingProject}>
              {isSavingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation Dialog */}
      <Dialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the project <span className="font-bold text-foreground">"{selectedProjectForDelete?.title}"</span>? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProjectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProject} disabled={isDeletingProject}>
              {isDeletingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
