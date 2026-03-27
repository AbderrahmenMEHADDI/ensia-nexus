import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import { PriorityBadge, getPriorityBorderClass } from '@/components/Badges';
import type { Task, TaskStatus, TaskPriority, Project, ProjectParticipant, ProjectResource, ResearchGroup, ResearchLab, User } from '@/types';
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
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [participants, setParticipants] = useState<ProjectParticipant[]>([]);
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
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

  useEffect(() => {
    const load = async () => {
      try {
        const [p, g, l, u] = await Promise.all([
          apiRepository.getProjects(),
          apiRepository.getGroups(),
          apiRepository.getLabs(),
          apiRepository.getUsers(),
        ]);
        setProjects(p);
        setGroups(g);
        setLabs(l);
        setAllUsers(u);
        if (p.length > 0) {
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
  }, []);

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

  const project = projects.find(p => p.id === selectedProjectId);
  const group = project ? getGroupById(project.group_id) : null;
  const lab = group ? getLabById(group.lab_id) : null;

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

  const handleCreateTask = async () => {
    if (!newTitle.trim() || !selectedProjectId || !user) return;
    const data = {
      project_id: selectedProjectId,
      title: newTitle.trim(),
      description: newDesc.trim(),
      status: createStatus,
      priority: newPriority,
      created_by: user.id,
    };
    try {
      const created = await apiRepository.createTask(data);
      setLocalTasks(prev => [...prev, created]);
      toast({ title: 'Task created' });
    } catch {
      toast({ title: 'Failed to create task', variant: 'destructive' });
    }
    setNewTitle(''); setNewDesc(''); setNewPriority('MEDIUM');
    setCreateOpen(false);
  };

  if (loading && projects.length === 0) {
    return (
      <div className="container py-10 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return <div className="container py-10 text-center text-muted-foreground">No projects found.</div>;
  }

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Project header */}
        <div className="mb-8">
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
          </div>

          <p className="text-muted-foreground text-sm max-w-2xl mb-3">{project.description}</p>

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
            const columnTasks = localTasks.filter(t => t.status === col.status);
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
                        onDragStart={(e: any) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        className={`p-3 rounded-lg border border-border bg-card border-l-4 ${getPriorityBorderClass(task.priority)} group cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all ${isDragging ? 'scale-95 shadow-lg' : ''}`}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={!newTitle.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectBoard;
