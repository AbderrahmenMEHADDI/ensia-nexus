import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import { useToast } from '@/hooks/use-toast';
import {
  canUserReviewProject,
  getProjectStatus,
  isProjectOpenForStudentApplications,
} from '@/lib/projectAccess';
import type {
  Task,
  TaskStatus,
  TaskPriority,
  Project,
  ProjectParticipant,
  ProjectResource,
  ResearchGroup,
  GroupMember,
  ResearchLab,
  User,
  ProjectApplication,
  ParticipantRole,
  Visibility,
  Publication,
} from '@/types';

export const useProjectBoard = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const canManageProjects = !!user && user.role !== 'STUDENT' && user.role !== 'ADMIN';
  const canCreateProjects = !!user && user.role !== 'ADMIN';
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [participants, setParticipants] = useState<ProjectParticipant[]>([]);
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [labs, setLabs] = useState<ResearchLab[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Kanban state
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>('TODO');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('MEDIUM');
  const [createLoading, setCreateLoading] = useState(false);
  const [newAssigneeUserId, setNewAssigneeUserId] = useState('none');

  const [editOpen, setEditOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatus>('TODO');
  const [editPriority, setEditPriority] = useState<TaskPriority>('MEDIUM');
  const [editAssigneeUserId, setEditAssigneeUserId] = useState('none');
  const [editLoading, setEditLoading] = useState(false);

  const [applyOpen, setApplyOpen] = useState(false);
  const [applyProjectId, setApplyProjectId] = useState<number | null>(null);
  const [applyMotivation, setApplyMotivation] = useState('');
  const [applySubmitting, setApplySubmitting] = useState(false);

  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [formProjectTitle, setFormProjectTitle] = useState('');
  const [formProjectDescription, setFormProjectDescription] = useState('');
  const [formFocusAreas, setFormFocusAreas] = useState('');
  const [formGroupId, setFormGroupId] = useState('');
  const [formVisibility, setFormVisibility] = useState<Visibility>('PRIVATE');
  const [formAcceptingCollaborators, setFormAcceptingCollaborators] = useState(false);
  const [formDeadline, setFormDeadline] = useState('');
  const [formProjectIsActive, setFormProjectIsActive] = useState(true);
  const [formProjectLandingOrder, setFormProjectLandingOrder] = useState(0);
  const [formCreateProjectLoading, setFormCreateProjectLoading] = useState(false);

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editProjectTitle, setEditProjectTitle] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [editProjectFocusAreas, setEditProjectFocusAreas] = useState('');
  const [editProjectVisibility, setEditProjectVisibility] = useState<Visibility>('PRIVATE');
  const [editProjectAcceptingCollaborators, setEditProjectAcceptingCollaborators] = useState(false);
  const [editProjectDeadline, setEditProjectDeadline] = useState('');
  const [editProjectGroupId, setEditProjectGroupId] = useState<string>('none');
  const [editProjectIsActive, setEditProjectIsActive] = useState(true);
  const [editProjectLandingOrder, setEditProjectLandingOrder] = useState(0);
  const [editProjectLoading, setEditProjectLoading] = useState(false);

  const [deleteProjectConfirmOpen, setDeleteProjectConfirmOpen] = useState(false);
  const [deleteProjectLoading, setDeleteProjectLoading] = useState(false);

  const [formMemberProjectId, setFormMemberProjectId] = useState('');
  const [formMemberUserId, setFormMemberUserId] = useState('');
  const [formMemberRole, setFormMemberRole] = useState<ParticipantRole>('MEMBER');
  const [formAddMemberLoading, setFormAddMemberLoading] = useState(false);

  const [projectReviewLoading, setProjectReviewLoading] = useState<'APPROVED' | 'REJECTED' | null>(null);

  const [resourceFormOpen, setResourceFormOpen] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceType, setNewResourceType] = useState('INTERNAL_DOC');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [createResourceLoading, setCreateResourceLoading] = useState(false);

  // Publications states
  const [publications, setPublications] = useState<Publication[]>([]);
  const [standalonePublications, setStandalonePublications] = useState<Publication[]>([]);
  const [selectedItem, setSelectedItem] = useState<{ type: 'PROJECT' | 'PUBLICATION'; id: number } | null>(null);
  const [publicationFormOpen, setPublicationFormOpen] = useState(false);
  const [formPubProjectId, setFormPubProjectId] = useState<string>('none');
  const [newPubTitle, setNewPubTitle] = useState('');
  const [newPubAbstract, setNewPubAbstract] = useState('');
  const [newPubDate, setNewPubDate] = useState('');
  const [newPubVenue, setNewPubVenue] = useState('');
  const [newPubDoi, setNewPubDoi] = useState('');
  const [newPubUrl, setNewPubUrl] = useState('');
  const [newPubAuthors, setNewPubAuthors] = useState<number[]>([]);
  const [createPubLoading, setCreatePubLoading] = useState(false);
  const [editingPublicationId, setEditingPublicationId] = useState<number | null>(null);

  const fetchAllUsers = async () => {
    if (user?.role !== 'ADMIN') return [];
    const pageSize = 500;
    let all: User[] = [];
    let skip = 0;
    while (true) {
      const res = await apiRepository.getUsersPaged({ skip, limit: pageSize });
      all = all.concat(res.items);
      if (all.length >= res.total || res.items.length < pageSize) break;
      skip += pageSize;
    }
    return all;
  };

  const loadProjectData = async (projectId: number) => {
    const [t, part, res, pubs] = await Promise.all([
      apiRepository.getTasks(projectId),
      apiRepository.getProjectParticipants(projectId),
      apiRepository.getProjectResources(projectId),
      apiRepository.getPublications({ project_id: projectId, include_independent: true }),
    ]);
    setLocalTasks(t);
    setParticipants(part);
    setResources(res);
    setPublications(pubs);
  };

  const filterProjectsForTeacher = (allProjs: Project[], groupsList = groups, membersList = groupMembers) => {
    if (user?.role === 'ADMIN') return allProjs;
    return allProjs.filter(p => {
      const isCreator = p.created_by === user?.id;
      const isGroupLeader = groupsList.some(g => g.leader_user_id === user?.id && g.id === p.group_id);
      const isGroupMember = membersList.some(gm => gm.group_id === p.group_id && gm.user_id === user?.id && gm.is_active);
      const isParticipant = p.participants?.some(part => part.user_id === user?.id) || false;
      return isCreator || isGroupLeader || isGroupMember || isParticipant;
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [p, g, gm, l, u, a, standalonePubs] = await Promise.all([
          apiRepository.getProjects(),
          apiRepository.getGroups(),
          apiRepository.getGroupMembers(),
          apiRepository.getLabs(),
          fetchAllUsers(),
          isStudent ? apiRepository.getMyApplications() : apiRepository.getApplications(),
          apiRepository.getPublications({ include_independent: true }),
        ]);
        setProjects(p);
        setGroups(g);
        setGroupMembers(gm);
        setLabs(l);
        setAllUsers(u);
        setApplications(a);
        setStandalonePublications(standalonePubs);
        
        let initialProjectId: number | null = null;
        if (p.length > 0) {
          if (!isStudent) {
            const visibleToTeacher = filterProjectsForTeacher(p, g, gm);
            if (visibleToTeacher.length > 0) {
              initialProjectId = visibleToTeacher[0].id;
            }
          } else {
            const joinedProj = p.find(proj => proj.participants?.some(part => part.user_id === user?.id));
            if (joinedProj) initialProjectId = joinedProj.id;
          }
        }

        if (initialProjectId) {
          setSelectedProjectId(initialProjectId);
          setSelectedItem({ type: 'PROJECT', id: initialProjectId });
          await loadProjectData(initialProjectId);
        } else if (standalonePubs.length > 0) {
          setSelectedItem({ type: 'PUBLICATION', id: standalonePubs[0].id });
        }
      } catch (e) {
        console.error('ProjectBoard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isStudent]);

  const handleProjectChange = async (val: string) => {
    const id = Number(val);
    setSelectedProjectId(id);
    setSelectedItem({ type: 'PROJECT', id });
    setLoading(true);
    try {
      await loadProjectData(id);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = async (item: { type: 'PROJECT' | 'PUBLICATION'; id: number }) => {
    setSelectedItem(item);
    if (item.type === 'PROJECT') {
      setSelectedProjectId(item.id);
      setLoading(true);
      try {
        await loadProjectData(item.id);
      } finally {
        setLoading(false);
      }
    }
  };

  const getUserById = (id: number) => {
    const fromAll = allUsers.find(u => u.id === id);
    if (fromAll) return fromAll;
    const fromGroup = groupMembers.find(gm => gm.user_id === id);
    if (fromGroup) {
      return {
        id: fromGroup.user_id,
        full_name: fromGroup.user_name || `User ${id}`,
        email: fromGroup.user_email || '',
      } as User;
    }
    return undefined;
  };
  const getGroupById = (id?: number | null) => id ? groups.find(g => g.id === id) : undefined;
  const getLabById = (id?: number | null) => id ? labs.find(l => l.id === id) : undefined;

  const project = projects.find(p => Number(p.id) === Number(selectedProjectId));
  const group = project && project.group_id ? getGroupById(project.group_id) : null;
  const lab = group ? getLabById(group.lab_id) : null;

  const availableMemberOptions = useMemo(() => {
    const userMap = new Map<number, User>();
    groupMembers.forEach(gm => {
      if (gm.is_active && !userMap.has(gm.user_id)) {
        userMap.set(gm.user_id, {
          id: gm.user_id,
          full_name: gm.user_name || `User ${gm.user_id}`,
          email: gm.user_email || '',
          role: (gm.user_role as any) || 'TEACHER',
        } as User);
      }
    });
    allUsers.forEach(u => {
      if (!userMap.has(u.id)) {
        userMap.set(u.id, u);
      }
    });
    return Array.from(userMap.values());
  }, [groupMembers, allUsers]);

  const joinedProjectIds = projects
    .filter(p => p.participants?.some(part => part.user_id === user?.id))
    .map(p => p.id);
  const hasJoined = joinedProjectIds.length > 0;

  const publicProjects = projects.filter(p => 
    isProjectOpenForStudentApplications(p) && !joinedProjectIds.includes(Number(p.id))
  );
  const validatedGroups = groups.filter(g => 
    g.is_validated && (
      g.leader_user_id === user?.id ||
      groupMembers.some(gm => gm.group_id === g.id && gm.user_id === user?.id && gm.is_active)
    )
  );
  const leaderGroups = groups.filter(g => g.is_validated && g.leader_user_id === user?.id);
  const canReviewSelectedProject = Boolean(
    project &&
    getProjectStatus(project) === 'PENDING' &&
    canUserReviewProject(user?.id, project, groups)
  );

  const getBlockingApplication = (projectId: number) =>
    applications.find(
      a =>
        a.project_id === projectId &&
        a.student_user_id === user?.id &&
        (a.status === 'PENDING' || a.status === 'ACCEPTED')
    );

  const getApplyButtonLabel = (projectId: number) => {
    const application = getBlockingApplication(projectId);
    if (!application) return 'Request to Join';
    if (application.status === 'PENDING') return 'Pending Review';
    return 'Already Accepted';
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(taskId));
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => setDragOverColumn(null);

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = Number(e.dataTransfer.getData('text/plain'));
    if (taskId) {
      setLocalTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      );
      try {
        await apiRepository.updateTask(taskId, { status: newStatus });
      } catch {
        toast({ title: 'Failed to update task', variant: 'destructive' });
        await loadProjectData(selectedProjectId!);
      }
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditAssigneeUserId(task.assignee_user_id ? String(task.assignee_user_id) : 'none');
    setEditOpen(true);
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim() || !selectedProjectId || !user) return;
    setCreateLoading(true);
    const data = {
      project_id: selectedProjectId,
      title: newTitle.trim(),
      description: newDesc.trim(),
      status: createStatus,
      priority: newPriority,
      assignee_user_id: newAssigneeUserId !== 'none' ? Number(newAssigneeUserId) : null,
      created_by: user.id,
    };
    try {
      const created = await apiRepository.createTask(data);
      setLocalTasks(prev => [...prev, created]);
      toast({ title: 'Task created' });
      setNewTitle('');
      setNewDesc('');
      setNewPriority('MEDIUM');
      setNewAssigneeUserId('none');
      setCreateOpen(false);
    } catch {
      toast({ title: 'Failed to create task', variant: 'destructive' });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTaskId || !editTitle.trim()) return;
    const payload = {
      title: editTitle.trim(),
      description: editDesc.trim(),
      status: editStatus,
      priority: editPriority,
      assignee_user_id: editAssigneeUserId !== 'none' ? Number(editAssigneeUserId) : null,
    };
    setLocalTasks(prev => prev.map(t => (t.id === editingTaskId ? { ...t, ...payload } : t)));
    try {
      await apiRepository.updateTask(editingTaskId, payload);
      toast({ title: 'Task updated' });
      setEditOpen(false);
      setEditingTaskId(null);
    } catch {
      toast({ title: 'Failed to update task', variant: 'destructive' });
      await loadProjectData(selectedProjectId!);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await apiRepository.deleteTask(taskId);
      setLocalTasks(prev => prev.filter(t => t.id !== taskId));
      toast({ title: 'Task deleted' });
      setEditOpen(false);
      setEditingTaskId(null);
    } catch {
      toast({ title: 'Failed to delete task', variant: 'destructive' });
    }
  };

  const handleOpenApply = (projectId: number) => {
    setApplyProjectId(projectId);
    setApplyMotivation('');
    setApplyOpen(true);
  };

  const handleApplyToProject = async () => {
    if (!user || !applyProjectId || !applyMotivation.trim()) return;
    setApplySubmitting(true);
    try {
      const created = await apiRepository.createApplication({
        project_id: applyProjectId,
        student_user_id: user.id,
        motivation: applyMotivation.trim(),
        status: 'PENDING',
      });
      const refreshedApplications = await apiRepository.getMyApplications();
      setApplications(refreshedApplications.length > 0 ? refreshedApplications : [created]);
      setApplyOpen(false);
      toast({ title: 'Application submitted' });
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      toast({
        title: 'Failed to submit application',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleCreateProjectFromForm = async () => {
    if (!user || !formProjectTitle.trim() || !formGroupId) return;
    setFormCreateProjectLoading(true);
    try {
      const created = await apiRepository.createProject({
        group_id: formGroupId === 'none' ? undefined : Number(formGroupId),
        title: formProjectTitle.trim(),
        description: formProjectDescription.trim(),
        visibility: formVisibility,
        accepting_collaborators: formAcceptingCollaborators,
        deadline: formDeadline || undefined,
        created_by: user.id,
        is_active: formProjectIsActive,
        landing_page_order: formProjectLandingOrder,
        focus_areas: formFocusAreas.trim() || undefined,
      });
      const refreshedProjects = await apiRepository.getProjects();
      setProjects(refreshedProjects);
      setSelectedProjectId(Number(created.id));
      await loadProjectData(Number(created.id));
      setProjectFormOpen(false);
      setFormProjectTitle('');
      setFormProjectDescription('');
      setFormFocusAreas('');
      setFormGroupId('');
      setFormVisibility('PRIVATE');
      setFormAcceptingCollaborators(false);
      setFormDeadline('');
      setFormProjectIsActive(true);
      setFormProjectLandingOrder(0);
      toast({ title: 'Project created' });
    } catch {
      toast({ title: 'Failed to create project', variant: 'destructive' });
    } finally {
      setFormCreateProjectLoading(false);
    }
  };

  const handleOpenEditProject = () => {
    if (!project) return;
    setEditProjectTitle(project.title);
    setEditProjectDescription(project.description || '');
    setEditProjectFocusAreas(project.focus_areas || '');
    setEditProjectVisibility(project.visibility);
    setEditProjectAcceptingCollaborators(project.accepting_collaborators);
    setEditProjectDeadline(project.deadline || '');
    setEditProjectGroupId(project.group_id ? String(project.group_id) : 'none');
    setEditProjectIsActive(project.is_active);
    setEditProjectLandingOrder(project.landing_page_order || 0);
    setEditProjectOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!project || !editProjectTitle.trim()) return;
    setEditProjectLoading(true);
    const data = {
      title: editProjectTitle.trim(),
      description: editProjectDescription.trim(),
      visibility: editProjectVisibility,
      accepting_collaborators: editProjectAcceptingCollaborators,
      deadline: editProjectDeadline || null,
      group_id: editProjectGroupId === 'none' ? null : parseInt(editProjectGroupId),
      is_active: editProjectIsActive,
      landing_page_order: editProjectLandingOrder,
      focus_areas: editProjectFocusAreas.trim() || null,
    };
    try {
      const updated = await apiRepository.updateProject(project.id, data);
      setProjects(prev => prev.map(p => p.id === project.id ? updated : p));
      toast({ title: 'Project updated successfully' });
      setEditProjectOpen(false);
    } catch {
      toast({ title: 'Failed to update project', variant: 'destructive' });
    } finally {
      setEditProjectLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    setDeleteProjectLoading(true);
    try {
      await apiRepository.deleteProject(project.id);
      toast({ title: 'Project deleted successfully' });
      setDeleteProjectConfirmOpen(false);
      
      const refreshedProjects = await apiRepository.getProjects();
      setProjects(refreshedProjects);
      
      if (refreshedProjects.length > 0) {
        let initialProjectId: number | null = null;
        if (!isStudent) {
          const visibleToTeacher = filterProjectsForTeacher(refreshedProjects);
          if (visibleToTeacher.length > 0) {
            initialProjectId = visibleToTeacher[0].id;
          }
        } else {
          const acceptedApp = applications.find(app => app.status === 'ACCEPTED');
          if (acceptedApp) initialProjectId = acceptedApp.project_id;
        }
        if (initialProjectId) {
          setSelectedProjectId(initialProjectId);
          await loadProjectData(initialProjectId);
        } else {
          setSelectedProjectId(null);
          setLocalTasks([]);
          setParticipants([]);
          setResources([]);
        }
      } else {
        setSelectedProjectId(null);
        setLocalTasks([]);
        setParticipants([]);
        setResources([]);
      }
    } catch {
      toast({ title: 'Failed to delete project', variant: 'destructive' });
    } finally {
      setDeleteProjectLoading(false);
    }
  };

  const handleAddMemberFromForm = async () => {
    if (!formMemberProjectId || !formMemberUserId) return;
    setFormAddMemberLoading(true);
    try {
      await apiRepository.createProjectParticipant({
        project_id: Number(formMemberProjectId),
        user_id: Number(formMemberUserId),
        participant_role: formMemberRole,
      });
      if (Number(formMemberProjectId) === selectedProjectId) {
        await loadProjectData(Number(formMemberProjectId));
      }
      setMemberFormOpen(false);
      setFormMemberProjectId('');
      setFormMemberUserId('');
      setFormMemberRole('MEMBER');
      toast({ title: 'Member added' });
    } catch {
      toast({ title: 'Failed to add member', variant: 'destructive' });
    } finally {
      setFormAddMemberLoading(false);
    }
  };

  const handleReviewSelectedProject = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedProjectId) return;
    setProjectReviewLoading(status);
    try {
      const updated = await apiRepository.reviewProject(selectedProjectId, { status });
      setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      toast({ title: `Project ${status.toLowerCase()}` });
    } catch {
      toast({ title: 'Failed to review project', variant: 'destructive' });
    } finally {
      setProjectReviewLoading(null);
    }
  };

  const handleCreateResource = async () => {
    if (!user || !selectedProjectId || !newResourceTitle.trim() || !newResourceType) return;
    setCreateResourceLoading(true);
    try {
      const created = await apiRepository.createProjectResource({
        project_id: selectedProjectId,
        title: newResourceTitle.trim(),
        resource_type: newResourceType as any,
        url: newResourceUrl.trim() || undefined,
        created_by: user.id
      });
      setResources(prev => [...prev, created]);
      setResourceFormOpen(false);
      setNewResourceTitle('');
      setNewResourceType('INTERNAL_DOC');
      setNewResourceUrl('');
      toast({ title: 'Resource added' });
    } catch {
      toast({ title: 'Failed to add resource', variant: 'destructive' });
    } finally {
      setCreateResourceLoading(false);
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    try {
      await apiRepository.deleteProjectResource(resourceId);
      setResources(prev => prev.filter(r => r.id !== resourceId));
      toast({ title: 'Resource deleted' });
    } catch {
      toast({ title: 'Failed to delete resource', variant: 'destructive' });
    }
  };

  const handleOpenCreatePublication = () => {
    setEditingPublicationId(null);
    setFormPubProjectId(selectedProjectId ? String(selectedProjectId) : 'none');
    setNewPubTitle('');
    setNewPubAbstract('');
    setNewPubDate('');
    setNewPubVenue('');
    setNewPubDoi('');
    setNewPubUrl('');
    setNewPubAuthors(user ? [user.id] : []);
    setPublicationFormOpen(true);
  };

  const handleOpenCreatePublicationStandalone = () => {
    setEditingPublicationId(null);
    setFormPubProjectId('none');
    setNewPubTitle('');
    setNewPubAbstract('');
    setNewPubDate('');
    setNewPubVenue('');
    setNewPubDoi('');
    setNewPubUrl('');
    setNewPubAuthors(user ? [user.id] : []);
    setPublicationFormOpen(true);
  };

  const handleOpenEditPublication = (pub: Publication) => {
    setEditingPublicationId(pub.id);
    setFormPubProjectId(pub.project_id ? String(pub.project_id) : 'none');
    setNewPubTitle(pub.title || '');
    setNewPubAbstract(pub.abstract || '');
    setNewPubDate(pub.publication_date || '');
    setNewPubVenue(pub.venue || '');
    setNewPubDoi(pub.doi || '');
    setNewPubUrl(pub.paper_url || '');
    setNewPubAuthors(pub.authors?.map(a => a.user_id) || []);
    setPublicationFormOpen(true);
  };

  const handleCreatePublication = async () => {
    if (!newPubTitle.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    setCreatePubLoading(true);
    try {
      const mappedAuthors = newPubAuthors.map((uid, index) => ({
        user_id: uid,
        author_order: index + 1,
        is_corresponding: index === 0,
      }));

      if (mappedAuthors.length === 0 && user) {
        mappedAuthors.push({
          user_id: user.id,
          author_order: 1,
          is_corresponding: true,
        });
      }

      const projIdNum = formPubProjectId && formPubProjectId !== 'none' ? Number(formPubProjectId) : null;

      const payload = {
        project_id: projIdNum,
        title: newPubTitle.trim(),
        abstract: newPubAbstract.trim() || undefined,
        publication_date: newPubDate || undefined,
        venue: newPubVenue.trim() || undefined,
        doi: newPubDoi.trim() || undefined,
        paper_url: newPubUrl.trim() || undefined,
        authors: mappedAuthors,
      };

      if (editingPublicationId) {
        const updated = await apiRepository.updatePublication(editingPublicationId, payload);
        setPublications(prev => prev.map(p => p.id === editingPublicationId ? updated : p));
        setStandalonePublications(prev => prev.map(p => p.id === editingPublicationId ? updated : p));
        toast({ title: 'Publication updated successfully' });
      } else {
        const created = await apiRepository.createPublication(payload);
        setPublications(prev => [...prev, created]);
        setStandalonePublications(prev => [created, ...prev]);
        setSelectedItem({ type: 'PUBLICATION', id: created.id });
        toast({ title: 'Publication added successfully' });
      }

      setPublicationFormOpen(false);
      setEditingPublicationId(null);
      setNewPubTitle('');
      setNewPubAbstract('');
      setNewPubDate('');
      setNewPubVenue('');
      setNewPubDoi('');
      setNewPubUrl('');
      setNewPubAuthors(user ? [user.id] : []);
    } catch (err: any) {
      toast({ 
        title: editingPublicationId ? 'Failed to update publication' : 'Failed to add publication', 
        description: err.message, 
        variant: 'destructive' 
      });
    } finally {
      setCreatePubLoading(false);
    }
  };

  const handleDeletePublication = async (pubId: number) => {
    try {
      await apiRepository.deletePublication(pubId);
      const remainingPubs = publications.filter(p => p.id !== pubId);
      const remainingStandalone = standalonePublications.filter(p => p.id !== pubId);
      setPublications(remainingPubs);
      setStandalonePublications(remainingStandalone);
      if (selectedItem?.type === 'PUBLICATION' && selectedItem.id === pubId) {
        // Stay on publications tab: pick the next standalone publication
        if (remainingStandalone.length > 0) {
          setSelectedItem({ type: 'PUBLICATION', id: remainingStandalone[0].id });
        } else if (projects.length > 0) {
          handleItemSelect({ type: 'PROJECT', id: projects[0].id });
        } else {
          setSelectedItem(null);
        }
      }
      toast({ title: 'Publication deleted' });
    } catch (err: any) {
      toast({ title: 'Failed to delete publication', description: err.message, variant: 'destructive' });
    }
  };

  const handleReorderProjects = async (reorderedProjects: Project[]) => {
    const updated = projects.map(p => {
      const idx = reorderedProjects.findIndex(rp => rp.id === p.id);
      if (idx !== -1) {
        return { ...p, landing_page_order: idx };
      }
      return p;
    });
    setProjects(updated);

    try {
      const ids = reorderedProjects.map(p => p.id);
      const res = await apiRepository.reorderProjects(ids);
      setProjects(res);
      toast({ title: 'Projects reordered successfully' });
    } catch (err: any) {
      toast({ title: 'Failed to save project order', description: err.message, variant: 'destructive' });
      const original = await apiRepository.getProjects();
      setProjects(original);
    }
  };

  const handleReorderPublications = async (reorderedPubs: Publication[]) => {
    const updated = standalonePublications.map(p => {
      const idx = reorderedPubs.findIndex(rp => rp.id === p.id);
      if (idx !== -1) {
        return { ...p, landing_page_order: idx };
      }
      return p;
    });
    setStandalonePublications(updated);

    try {
      const ids = reorderedPubs.map(p => p.id);
      const res = await apiRepository.reorderPublications(ids);
      setStandalonePublications(res);
      toast({ title: 'Publications reordered successfully' });
    } catch (err: any) {
      toast({ title: 'Failed to save publication order', description: err.message, variant: 'destructive' });
      const original = await apiRepository.getPublications({ include_independent: true });
      setStandalonePublications(original);
    }
  };

  const sortedProjects = [...projects].sort((a, b) => {
    const orderA = a.landing_page_order ?? 0;
    const orderB = b.landing_page_order ?? 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const sortedPublications = [...standalonePublications].sort((a, b) => {
    const orderA = a.landing_page_order ?? 0;
    const orderB = b.landing_page_order ?? 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return new Date(b.publication_date || b.created_at || 0).getTime() - new Date(a.publication_date || a.created_at || 0).getTime();
  });

  const teacherProjects = filterProjectsForTeacher(sortedProjects);
  const displayProjects = isStudent && hasJoined
    ? sortedProjects.filter(p => joinedProjectIds.includes(Number(p.id)))
    : (isStudent ? sortedProjects : teacherProjects);

  return {
    user,
    isStudent,
    canManageProjects,
    canCreateProjects,
    projects: displayProjects,
    allProjects: projects,
    joinedProjectIds,
    hasJoined,
    applications,
    localTasks,
    participants,
    resources,
    groups,
    groupMembers,
    labs,
    allUsers,
    selectedProjectId,
    loading,
    draggedTaskId,
    dragOverColumn,
    createOpen,
    setCreateOpen,
    createStatus,
    setCreateStatus,
    newTitle,
    setNewTitle,
    newDesc,
    setNewDesc,
    newPriority,
    setNewPriority,
    createLoading,
    newAssigneeUserId,
    setNewAssigneeUserId,
    editOpen,
    setEditOpen,
    editingTaskId,
    editTitle,
    setEditTitle,
    editDesc,
    setEditDesc,
    editStatus,
    setEditStatus,
    editPriority,
    setEditPriority,
    editAssigneeUserId,
    setEditAssigneeUserId,
    editLoading,
    applyOpen,
    setApplyOpen,
    applyMotivation,
    setApplyMotivation,
    applySubmitting,
    projectFormOpen,
    setProjectFormOpen,
    memberFormOpen,
    setMemberFormOpen,
    formProjectTitle,
    setFormProjectTitle,
    formProjectDescription,
    setFormProjectDescription,
    formGroupId,
    setFormGroupId,
    formVisibility,
    setFormVisibility,
    formAcceptingCollaborators,
    setFormAcceptingCollaborators,
    formDeadline,
    setFormDeadline,
    formCreateProjectLoading,
    formMemberProjectId,
    setFormMemberProjectId,
    formMemberUserId,
    setFormMemberUserId,
    formMemberRole,
    setFormMemberRole,
    formAddMemberLoading,
    projectReviewLoading,
    project,
    group,
    lab,
    availableMemberOptions,
    publicProjects,
    validatedGroups,
    canReviewSelectedProject,
    loadProjectData,
    handleProjectChange,
    getUserById,
    getGroupById,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleOpenEdit,
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,
    handleOpenApply,
    handleApplyToProject,
    handleCreateProjectFromForm,
    handleAddMemberFromForm,
    handleReviewSelectedProject,
    getApplyButtonLabel,
    getBlockingApplication,
    formProjectIsActive,
    setFormProjectIsActive,
    formProjectLandingOrder,
    setFormProjectLandingOrder,
    formFocusAreas,
    setFormFocusAreas,
    editProjectIsActive,
    setEditProjectIsActive,
    editProjectLandingOrder,
    setEditProjectLandingOrder,
    editProjectFocusAreas,
    setEditProjectFocusAreas,
    editProjectOpen,
    setEditProjectOpen,
    editProjectTitle,
    setEditProjectTitle,
    editProjectDescription,
    setEditProjectDescription,
    editProjectVisibility,
    setEditProjectVisibility,
    editProjectAcceptingCollaborators,
    setEditProjectAcceptingCollaborators,
    editProjectDeadline,
    setEditProjectDeadline,
    editProjectGroupId,
    setEditProjectGroupId,
    leaderGroups,
    editProjectLoading,
    deleteProjectConfirmOpen,
    setDeleteProjectConfirmOpen,
    deleteProjectLoading,
    handleOpenEditProject,
    handleUpdateProject,
    handleDeleteProject,
    handleReorderProjects,
    handleReorderPublications,
    resourceFormOpen,
    setResourceFormOpen,
    newResourceTitle,
    setNewResourceTitle,
    newResourceType,
    setNewResourceType,
    newResourceUrl,
    setNewResourceUrl,
    createResourceLoading,
    handleCreateResource,
    handleDeleteResource,
    publications,
    setPublications,
    standalonePublications: sortedPublications,
    selectedItem,
    setSelectedItem,
    handleItemSelect,
    selectedPublication: selectedItem?.type === 'PUBLICATION'
      ? (sortedPublications.find(p => p.id === selectedItem.id) || publications.find(p => p.id === selectedItem.id) || null)
      : null,
    publicationFormOpen,
    setPublicationFormOpen,
    formPubProjectId,
    setFormPubProjectId,
    newPubTitle,
    setNewPubTitle,
    newPubAbstract,
    setNewPubAbstract,
    newPubDate,
    setNewPubDate,
    newPubVenue,
    setNewPubVenue,
    newPubDoi,
    setNewPubDoi,
    newPubUrl,
    setNewPubUrl,
    newPubAuthors,
    setNewPubAuthors,
    createPubLoading,
    handleCreatePublication,
    handleDeletePublication,
    editingPublicationId,
    setEditingPublicationId,
    handleOpenCreatePublication,
    handleOpenCreatePublicationStandalone,
    handleOpenEditPublication,
  };
};
