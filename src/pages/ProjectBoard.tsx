import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProjectById, getTasksByProject, getUserById, getParticipantsByProject, getResourcesByProject, getGroupById, getLabById } from '@/data/mockData';
import { RoleBadge, PriorityBadge, StatusBadge, getPriorityBorderClass } from '@/components/Badges';
import type { Task, TaskStatus } from '@/types';
import { Calendar, User, ExternalLink, GitBranch, FileText, Database, Plus, GripVertical } from 'lucide-react';

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
  const { projectId } = useParams();
  const project = getProjectById(Number(projectId) || 1);
  
  const [localTasks, setLocalTasks] = useState<Task[]>(() => 
    getTasksByProject(project?.id || 1)
  );

  if (!project) {
    return <div className="container py-10 text-center text-muted-foreground">Project not found.</div>;
  }

  const group = getGroupById(project.group_id);
  const lab = group ? getLabById(group.lab_id) : null;
  const participants = getParticipantsByProject(project.id);
  const resources = getResourcesByProject(project.id);

  const moveTask = (taskId: number, newStatus: TaskStatus) => {
    setLocalTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t)
    );
  };

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
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">{project.title}</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">{project.description}</p>
          
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${project.visibility === 'PUBLIC' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
              {project.visibility}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">Team:</span>
              {participants.map(p => {
                const user = getUserById(p.user_id);
                if (!user) return null;
                return (
                  <div key={p.user_id} className="flex items-center gap-1">
                    <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground">
                      {user.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid md:grid-cols-4 gap-4 mb-10">
          {statusColumns.map(col => {
            const columnTasks = localTasks.filter(t => t.status === col.status);
            return (
              <div key={col.status} className="rounded-xl border border-border bg-card/50 p-3">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                  <span className="text-sm font-medium text-foreground">{col.label}</span>
                  <span className="ml-auto text-xs font-mono text-muted-foreground">{columnTasks.length}</span>
                </div>

                <div className="space-y-2">
                  {columnTasks.map((task, i) => {
                    const assignee = task.assignee_user_id ? getUserById(task.assignee_user_id) : null;
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-3 rounded-lg border border-border bg-card border-l-4 ${getPriorityBorderClass(task.priority)} group cursor-pointer hover:border-primary/30 transition-colors`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-sm font-medium text-foreground leading-tight">{task.title}</span>
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 mt-0.5" />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
                        <div className="flex items-center justify-between">
                          <PriorityBadge priority={task.priority} />
                          {assignee && (
                            <div className="flex items-center gap-1" title={assignee.full_name}>
                              <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium text-secondary-foreground">
                                {assignee.full_name.split(' ').map(n => n[0]).join('')}
                              </div>
                            </div>
                          )}
                        </div>
                        {task.due_date && (
                          <div className="flex items-center gap-1 mt-2 text-xs font-mono text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {task.due_date}
                          </div>
                        )}
                        
                        {/* Quick status change */}
                        <div className="hidden group-hover:flex gap-1 mt-2 pt-2 border-t border-border">
                          {statusColumns.filter(s => s.status !== col.status).map(s => (
                            <button
                              key={s.status}
                              onClick={() => moveTask(task.id, s.status)}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                            >
                              → {s.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
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
    </div>
  );
};

export default ProjectBoard;
