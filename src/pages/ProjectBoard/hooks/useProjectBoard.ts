import { useState, useEffect } from 'react';
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
  const [formGroupId, setFormGroupId] = useState('');
  const [formVisibility, setFormVisibility] = useState<Visibility>('PRIVATE');
  const [formAcceptingCollaborators, setFormAcceptingCollaborators] = useState(false);
  const [formDeadline, setFormDeadline] = useState('');
  const [formCreateProjectLoading, setFormCreateProjectLoading] = useState(false);

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editProjectTitle, setEditProjectTitle] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [editProjectVisibility, setEditProjectVisibility] = useState<Visibility>('PRIVATE');
  const [editProjectAcceptingCollaborators, setEditProjectAcceptingCollaborators] = useState(false);
  const [editProjectDeadline, setEditProjectDeadline] = useState('');
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
  const [newResourceType, setNewResourceType] = useState('PAPER_DOC');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [createResourceLoading, setCreateResourceLoading] = useState(false);

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
    const [t, part, res] = await Promise.all([
      apiRepository.getTasks(projectId),
      apiRepository.getProjectParticipants(projectId),
      apiRepository.getProjectResources(projectId),
    ]);
    setLocalTasks(t);
    setParticipants(part);
    setResources(res);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [p, g, gm, l, u, a] = await Promise.all([
          apiRepository.getProjects(),
          apiRepository.getGroups(),
          apiRepository.getGroupMembers(),
          apiRepository.getLabs(),
          fetchAllUsers(),
          isStudent ? apiRepository.getMyApplications() : apiRepository.getApplications(),
        ]);
        setProjects(p);
        setGroups(g);
        setGroupMembers(gm);
        setLabs(l);
        setAllUsers(u);
        setApplications(a);
        
        let initialProjectId: number | null = null;
        if (p.length > 0) {
          if (!isStudent) {
            initialProjectId = p[0].id;
          } else {
            const acceptedApp = a.find(app => app.status === 'ACCEPTED');
            if (acceptedApp) initialProjectId = acceptedApp.project_id;
          }
        }

        if (initialProjectId) {
          setSelectedProjectId(initialProjectId);
          await loadProjectData(initialProjectId);
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
    setLoading(true);
    try {
      await loadProjectData(id);
    } finally {
      setLoading(false);
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

  const selectedMemberFormProject = projects.find(p => Number(p.id) === Number(formMemberProjectId));
  const availableMemberOptions = selectedMemberFormProject
    ? groupMembers
        .filter(gm => gm.group_id === selectedMemberFormProject.group_id && gm.is_active)
        .map(gm => ({
          id: gm.user_id,
          full_name: gm.user_name || `User ${gm.user_id}`,
          email: gm.user_email || '',
        } as User))
    : [];

  const acceptedProjectIds = applications
    .filter(a => a.status === 'ACCEPTED')
    .map(a => a.project_id);
  const hasAccepted = acceptedProjectIds.length > 0;

  const publicProjects = projects.filter(p => 
    isProjectOpenForStudentApplications(p) && !acceptedProjectIds.includes(Number(p.id))
  );
  const validatedGroups = groups.filter(g => 
    g.is_validated && (
      g.leader_user_id === user?.id ||
      groupMembers.some(gm => gm.group_id === g.id && gm.user_id === user?.id && gm.is_active)
    )
  );
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
      });
      const refreshedProjects = await apiRepository.getProjects();
      setProjects(refreshedProjects);
      setSelectedProjectId(Number(created.id));
      await loadProjectData(Number(created.id));
      setProjectFormOpen(false);
      setFormProjectTitle('');
      setFormProjectDescription('');
      setFormGroupId('');
      setFormVisibility('PRIVATE');
      setFormAcceptingCollaborators(false);
      setFormDeadline('');
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
    setEditProjectVisibility(project.visibility);
    setEditProjectAcceptingCollaborators(project.accepting_collaborators);
    setEditProjectDeadline(project.deadline || '');
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
          initialProjectId = refreshedProjects[0].id;
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
      setNewResourceType('PAPER_DOC');
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

  const displayProjects = isStudent && hasAccepted
    ? projects.filter(p => acceptedProjectIds.includes(Number(p.id)))
    : projects;

  return {
    user,
    isStudent,
    canManageProjects,
    canCreateProjects,
    projects: displayProjects,
    applications,
    localTasks,
    participants,
    resources,
    groups,
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
    editProjectLoading,
    deleteProjectConfirmOpen,
    setDeleteProjectConfirmOpen,
    deleteProjectLoading,
    handleOpenEditProject,
    handleUpdateProject,
    handleDeleteProject,
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
  };
};
