import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import { ApplicationStatusBadge, PriorityBadge, ProjectStatusBadge, getPriorityBorderClass } from '@/components/Badges';
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
import { Calendar, ExternalLink, GitBranch, FileText, Database, Plus, GripVertical, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const statusColumns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'TODO', label: 'To Do', color: 'bg-status-todo' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-status-in-progress' },
  { status: 'BLOCKED', label: 'Blocked', color: 'bg-status-blocked' },
  { status: 'DONE', label: 'Done', color: 'bg-status-done' },
];

const resourceIcons: Record<string, React.ElementType> = {
  PAPER_DOC: FileText,
  GIT_REPO: GitBranch,
  DATASET: Database,
  OTHER: ExternalLink,
};

const ProjectBoard = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const canManageProjects = !!user && user.role !== 'STUDENT';
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
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>('TODO');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('MEDIUM');
  const [createLoading, setCreateLoading] = useState(false);
  const [newAssignee, setNewAssignee] = useState<string>('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editAssignee, setEditAssignee] = useState<string>('');
  const [editLoading, setEditLoading] = useState(false);
  const [newAssigneeUserId, setNewAssigneeUserId] = useState('none');
  const [editOpen, setEditOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatus>('TODO');
  const [editPriority, setEditPriority] = useState<TaskPriority>('MEDIUM');
  const [editAssigneeUserId, setEditAssigneeUserId] = useState('none');
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
  const [formCreateProjectLoading, setFormCreateProjectLoading] = useState(false);
  const [formMemberProjectId, setFormMemberProjectId] = useState('');
  const [formMemberUserId, setFormMemberUserId] = useState('');
  const [formMemberRole, setFormMemberRole] = useState<ParticipantRole>('MEMBER');
  const [formAddMemberLoading, setFormAddMemberLoading] = useState(false);
  const [projectReviewLoading, setProjectReviewLoading] = useState<'APPROVED' | 'REJECTED' | null>(null);

  const fetchAllUsers = async () => {
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
        if (p.length > 0 && !isStudent) {
          const firstId = p[0].id;
          setSelectedProjectId(firstId);
          await loadProjectData(firstId);
        }
      } catch (e) {
        console.error('ProjectBoard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isStudent]);

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

  const getUserById = (id: number) => allUsers.find(u => u.id === id);
  const getGroupById = (id: number) => groups.find(g => g.id === id);
  const getLabById = (id: number) => labs.find(l => l.id === id);

  const project = projects.find(p => Number(p.id) === Number(selectedProjectId));
  const group = project ? getGroupById(project.group_id) : null;
  const lab = group ? getLabById(group.lab_id) : null;
  const selectedMemberFormProject = projects.find(p => Number(p.id) === Number(formMemberProjectId));
  const availableMemberOptions = selectedMemberFormProject
    ? allUsers.filter(u =>
        groupMembers.some(
          gm =>
            gm.group_id === selectedMemberFormProject.group_id &&
            gm.user_id === u.id &&
            gm.is_active
        )
      )
    : [];
  const publicProjects = projects.filter(isProjectOpenForStudentApplications);
  const validatedGroups = groups.filter(g => g.is_validated);
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
    if (!application) return 'Apply';
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
      // Optimistic update
      setLocalTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      );
      try {
        await apiRepository.updateTask(taskId, { status: newStatus });
      } catch {
        toast({ title: 'Failed to update task', variant: 'destructive' });
        // Revert
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
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditAssignee(task.assignee_user_id ? String(task.assignee_user_id) : '');
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
      assignee_user_id: newAssignee ? Number(newAssignee) : null,
      ...(newAssigneeUserId !== 'none'
        ? { assignee_user_id: Number(newAssigneeUserId) }
        : {}),
      created_by: user.id,
    };
    try {
      const created = await apiRepository.createTask(data);
      setLocalTasks(prev => [...prev, created]);
      toast({ title: 'Task created' });
      setNewTitle('');
      setNewDesc('');
      setNewPriority('MEDIUM');
      setNewAssignee('');
      setCreateOpen(false);
    } catch {
      toast({ title: 'Failed to create task', variant: 'destructive' });
    }
    setNewTitle(''); setNewDesc(''); setNewPriority('MEDIUM'); setNewAssigneeUserId('none');
    setCreateOpen(false);
  };

  const openEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title || '');
    setEditDesc(task.description || '');
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditAssigneeUserId(task.assignee_user_id ? String(task.assignee_user_id) : 'none');
    setEditOpen(true);
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
    // Optimistic update
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
      setApplications(prev => [created, ...prev]);
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
    if (user.role === 'ADMIN') {
      toast({ title: 'Admins cannot create projects', variant: 'destructive' });
      return;
    }
    setFormCreateProjectLoading(true);
    try {
      const created = await apiRepository.createProject({
        group_id: Number(formGroupId),
        title: formProjectTitle.trim(),
        description: formProjectDescription.trim(),
        visibility: formVisibility,
        created_by: user.id,
      });
      const createdId = Number(created.id);
      const refreshedProjects = await apiRepository.getProjects();
      setProjects(refreshedProjects);
      setSelectedProjectId(createdId);
      await loadProjectData(createdId);
      setProjectFormOpen(false);
      setFormProjectTitle('');
      setFormProjectDescription('');
      setFormGroupId('');
      setFormVisibility('PRIVATE');
      toast({ title: 'Project created' });
    } catch {
      toast({ title: 'Failed to create project', variant: 'destructive' });
    } finally {
      setFormCreateProjectLoading(false);
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
      toast({ title: 'Member added to project' });
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
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      toast({
        title: 'Failed to review project',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setProjectReviewLoading(null);
    }
  };

  const projectFormDialog = (
    <Dialog open={projectFormOpen} onOpenChange={setProjectFormOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Project Details Form</DialogTitle>
          <DialogDescription>Fill this form to create a new project.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Project Title</Label>
            <Input value={formProjectTitle} onChange={e => setFormProjectTitle(e.target.value)} placeholder="Project title" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formProjectDescription} onChange={e => setFormProjectDescription(e.target.value)} rows={4} placeholder="Project description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Research Group</Label>
              <Select value={formGroupId} onValueChange={setFormGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {validatedGroups.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {validatedGroups.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No validated groups are available for project creation.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={formVisibility} onValueChange={v => setFormVisibility(v as Visibility)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIVATE">Private</SelectItem>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setProjectFormOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateProjectFromForm} disabled={formCreateProjectLoading || !formProjectTitle.trim() || !formGroupId}>
            {formCreateProjectLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (loading && projects.length === 0) {
    return (
      <div className="container py-10 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isStudent) {
    return (
      <div className="container py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-8">
            <span className="text-xs font-mono text-primary uppercase tracking-wider">Projects</span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-1">Public Projects</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Apply to approved public projects. Pending or accepted applications cannot be submitted again.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {publicProjects.map(pubProject => {
              const pubGroup = getGroupById(pubProject.group_id);
              const blockingApplication = getBlockingApplication(pubProject.id);

              return (
                <div key={pubProject.id} className="rounded-lg border border-border p-4 bg-card">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-sm font-medium text-foreground">{pubProject.title}</h3>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-success/15 text-success">PUBLIC</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{pubProject.description}</p>
                  <p className="text-xs text-muted-foreground mb-3">Group: {pubGroup?.name || 'N/A'}</p>
                  {blockingApplication && (
                    <div className="mb-3">
                      <ApplicationStatusBadge status={blockingApplication.status} />
                    </div>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleOpenApply(pubProject.id)}
                    disabled={Boolean(blockingApplication)}
                  >
                    {getApplyButtonLabel(pubProject.id)}
                  </Button>
                </div>
              );
            })}
            {publicProjects.length === 0 && (
              <p className="text-sm text-muted-foreground">No public projects available right now.</p>
            )}
          </div>
        </motion.div>

        <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Application for Join Project</DialogTitle>
              <DialogDescription>Provide your motivation to apply for this public project.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label>Motivation</Label>
                <Textarea
                  rows={4}
                  value={applyMotivation}
                  onChange={e => setApplyMotivation(e.target.value)}
                  placeholder="Tell why you are a good fit and what you can contribute."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
              <Button onClick={handleApplyToProject} disabled={applySubmitting || !applyMotivation.trim()}>
                {applySubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <span className="text-xs font-mono text-primary uppercase tracking-wider">Projects</span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-2">No projects yet</h1>
            <p className="text-sm text-muted-foreground mt-3">
              Create the first project for your validated group to start managing tasks and members.
            </p>
            {canCreateProjects && (
              <div className="mt-6 flex justify-center gap-2">
                <Button onClick={() => setProjectFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Project Details Form
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {projectFormDialog}
      </div>
    );
  }

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Project header */}
        <div className="mb-8">
          {canManageProjects && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {canCreateProjects && (
                <Button size="sm" onClick={() => setProjectFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Project Details Form
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setMemberFormOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Member Details Form
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
            <span>{lab?.name.split('—')[0]?.trim()}</span>
            <span>/</span>
            <span>{group?.name}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3">
            <Select value={String(selectedProjectId)} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-full sm:w-[340px] h-auto py-2">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${project.visibility === 'PUBLIC' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
              {project.visibility}
            </span>
            <ProjectStatusBadge status={getProjectStatus(project)} />
          </div>

          <p className="text-muted-foreground text-sm max-w-2xl mb-3">{project.description}</p>

          {canReviewSelectedProject && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Button
                size="sm"
                onClick={() => handleReviewSelectedProject('APPROVED')}
                disabled={projectReviewLoading !== null}
              >
                {projectReviewLoading === 'APPROVED' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Approve Project
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReviewSelectedProject('REJECTED')}
                disabled={projectReviewLoading !== null}
              >
                {projectReviewLoading === 'REJECTED' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Reject Project
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">Team:</span>
            {participants.map(p => {
              const u = getUserById(p.user_id);
              if (!u) return null;
              return (
                <div key={p.user_id} className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground" title={u.full_name}>
                  {u.full_name.split(' ').map(n => n[0]).join('')}
                </div>
              );
            })}
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid md:grid-cols-4 gap-4 mb-10">
          {statusColumns.map(col => {
            const columnTasks = localTasks.filter(
              t => t.project_id === selectedProjectId && t.status === col.status
            );
            const isOver = dragOverColumn === col.status;
            return (
              <div
                key={col.status}
                className={`rounded-xl border border-border bg-card/50 p-3 transition-colors min-h-[200px] ${isOver ? 'border-primary/40 bg-primary/5' : ''}`}
                onDragOver={e => handleDragOver(e, col.status)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, col.status)}
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                  <span className="text-sm font-medium text-foreground">{col.label}</span>
                  <span className="ml-auto text-xs font-mono text-muted-foreground">{columnTasks.length}</span>
                </div>

                <div className="space-y-2">
                  {columnTasks.map((task, i) => {
                    const assignee = task.assignee_user_id ? getUserById(task.assignee_user_id) : null;
                    const isDragging = draggedTaskId === task.id;
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        draggable
                        onDragStartCapture={(e: React.DragEvent) => handleDragStart(e, task.id)}
                        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, task.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleOpenEdit(task)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOpenEdit(task);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Task: ${task.title}. Click to edit.`}
                        className={`p-3 rounded-lg border border-border bg-card border-l-4 ${getPriorityBorderClass(task.priority)} group cursor-grab active:cursor-grabbing hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary focus:outline-none transition-all ${isDragging ? 'scale-95 shadow-lg' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-sm font-medium text-foreground leading-tight">{task.title}</span>
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 mt-0.5" />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
                        <div className="flex items-center justify-between">
                          <PriorityBadge priority={task.priority} />
                          {assignee && (
                            <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium text-secondary-foreground" title={assignee.full_name}>
                              {assignee.full_name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                        </div>
                        {task.due_date && (
                          <div className="flex items-center gap-1 mt-2 text-xs font-mono text-muted-foreground">
                            <Calendar className="h-3 w-3" /> {task.due_date}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                <button
                  onClick={() => { setCreateStatus(col.status); setCreateOpen(true); }}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border text-xs font-mono text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add task
                </button>
              </div>
            );
          })}
        </div>

        {/* Resources */}
        {resources.length > 0 && (
          <div>
            <h2 className="text-xl font-serif font-semibold text-foreground mb-4">Resources</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {resources.map(res => {
                const Icon = resourceIcons[res.resource_type] || ExternalLink;
                const creator = getUserById(res.created_by);
                return (
                  <a
                    key={res.id}
                    href={res.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground block truncate">{res.title}</span>
                      <span className="text-xs font-mono text-muted-foreground">{res.resource_type.replace('_', ' ')} · {creator?.full_name}</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* Create Task Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Add a new task to the board.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input id="task-title" placeholder="Task title..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea id="task-desc" placeholder="Describe the task..." value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={createStatus} onValueChange={v => setCreateStatus(v as TaskStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusColumns.map(s => <SelectItem key={s.status} value={s.status}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newPriority} onValueChange={v => setNewPriority(v as TaskPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={newAssignee} onValueChange={setNewAssignee}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {participants.map(p => {
                    const u = getUserById(p.user_id);
                    return u ? <SelectItem key={u.id} value={String(u.id)}>{u.full_name}</SelectItem> : null;
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={createLoading || !newTitle.trim()}>
              {createLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Modify task details and assignment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea id="edit-desc" value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={v => setEditStatus(v as TaskStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusColumns.map(s => <SelectItem key={s.status} value={s.status}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={editPriority} onValueChange={v => setEditPriority(v as TaskPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={editAssignee} onValueChange={setEditAssignee}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {participants.map(p => {
                    const u = getUserById(p.user_id);
                    return u ? <SelectItem key={u.id} value={String(u.id)}>{u.full_name}</SelectItem> : null;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={newAssigneeUserId} onValueChange={setNewAssigneeUserId}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {participants.map(p => {
                    const pu = getUserById(p.user_id);
                    if (!pu) return null;
                    return <SelectItem key={pu.id} value={String(pu.id)}>{pu.full_name}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleUpdateTask} disabled={editLoading || !editTitle.trim()}>
              {editLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-task-title">Title</Label>
              <Input id="edit-task-title" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-task-desc">Description</Label>
              <Textarea id="edit-task-desc" value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={v => setEditStatus(v as TaskStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusColumns.map(s => <SelectItem key={s.status} value={s.status}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={editPriority} onValueChange={v => setEditPriority(v as TaskPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={editAssigneeUserId} onValueChange={setEditAssigneeUserId}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {participants.map(p => {
                    const pu = getUserById(p.user_id);
                    if (!pu) return null;
                    return <SelectItem key={pu.id} value={String(pu.id)}>{pu.full_name}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateTask} disabled={!editTitle.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Application for Join Project</DialogTitle>
            <DialogDescription>Provide your motivation to apply for this public project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Motivation</Label>
              <Textarea
                rows={4}
                value={applyMotivation}
                onChange={e => setApplyMotivation(e.target.value)}
                placeholder="Tell why you are a good fit and what you can contribute."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button onClick={handleApplyToProject} disabled={applySubmitting || !applyMotivation.trim()}>
              {applySubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Admin: Project Details Form */}
      {projectFormDialog}

      {/* Group Admin: Member Details Form */}
      <Dialog open={memberFormOpen} onOpenChange={setMemberFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Member Details Form</DialogTitle>
            <DialogDescription>Add a member to a project and choose membership role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={formMemberProjectId} onValueChange={value => { setFormMemberProjectId(value); setFormMemberUserId(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Member</Label>
                <Select value={formMemberUserId} onValueChange={setFormMemberUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder={formMemberProjectId ? 'Select group member' : 'Select project first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMemberOptions.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {formMemberProjectId && availableMemberOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground">No active members found in this project's group.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formMemberRole} onValueChange={v => setFormMemberRole(v as ParticipantRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="REVIEWER">Reviewer</SelectItem>
                    <SelectItem value="OBSERVER">Observer</SelectItem>
                    <SelectItem value="LEAD">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberFormOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMemberFromForm} disabled={formAddMemberLoading || !formMemberProjectId || !formMemberUserId}>
              {formAddMemberLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectBoard;
