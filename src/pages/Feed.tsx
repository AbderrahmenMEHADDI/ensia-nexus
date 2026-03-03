import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  currentUser, projects, tasks, projectParticipants, researchGroups,
  groupMembers, getUserById, getGroupById, getLabById, taskUpdates,
  projectApplications, users
} from '@/data/mockData';
import { RoleBadge, StatusBadge, PriorityBadge } from '@/components/Badges';
import {
  ArrowRight, Users, FileText, CheckCircle2, MessageSquare,
  GitBranch, UserPlus, Clock, FlaskConical, Calendar
} from 'lucide-react';

// Build a unified activity feed from various data sources
interface FeedItem {
  id: string;
  type: 'task_update' | 'task_created' | 'member_joined' | 'project_created' | 'application';
  title: string;
  description: string;
  timestamp: string;
  userId: number;
  projectId?: number;
  meta?: Record<string, any>;
}

function buildFeed(): FeedItem[] {
  const items: FeedItem[] = [];

  // Task updates
  taskUpdates.forEach(u => {
    const task = tasks.find(t => t.id === u.task_id);
    const proj = task ? projects.find(p => p.id === task.project_id) : null;
    items.push({
      id: `tu-${u.id}`,
      type: 'task_update',
      title: `Updated "${task?.title}"`,
      description: u.note,
      timestamp: u.created_at,
      userId: u.author_user_id,
      projectId: task?.project_id,
      meta: { newStatus: u.new_status, progress: u.new_progress },
    });
  });

  // Tasks created
  tasks.forEach(t => {
    const proj = projects.find(p => p.id === t.project_id);
    items.push({
      id: `tc-${t.id}`,
      type: 'task_created',
      title: `Created task "${t.title}"`,
      description: t.description,
      timestamp: t.created_at,
      userId: t.created_by,
      projectId: t.project_id,
      meta: { priority: t.priority, status: t.status },
    });
  });

  // Members joined projects
  projectParticipants.forEach(pp => {
    const proj = projects.find(p => p.id === pp.project_id);
    items.push({
      id: `mj-${pp.project_id}-${pp.user_id}`,
      type: 'member_joined',
      title: `Joined "${proj?.title}"`,
      description: `Joined as ${pp.participant_role.toLowerCase()}`,
      timestamp: pp.joined_at,
      userId: pp.user_id,
      projectId: pp.project_id,
    });
  });

  // Projects created
  projects.forEach(p => {
    items.push({
      id: `pc-${p.id}`,
      type: 'project_created',
      title: `Created project "${p.title}"`,
      description: p.description,
      timestamp: p.created_at,
      userId: p.created_by,
      projectId: p.id,
    });
  });

  // Sort by date descending
  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return items;
}

const feedIcons: Record<FeedItem['type'], any> = {
  task_update: MessageSquare,
  task_created: FileText,
  member_joined: UserPlus,
  project_created: GitBranch,
  application: CheckCircle2,
};

const feedColors: Record<FeedItem['type'], string> = {
  task_update: 'bg-primary/10 text-primary',
  task_created: 'bg-accent/60 text-accent-foreground',
  member_joined: 'bg-primary/10 text-primary',
  project_created: 'bg-primary/15 text-primary',
  application: 'bg-muted text-muted-foreground',
};

const Feed = () => {
  const feedItems = buildFeed();

  const myParticipations = projectParticipants.filter(p => p.user_id === currentUser.id);
  const myProjects = myParticipations.map(p => projects.find(proj => proj.id === p.project_id)!).filter(Boolean);

  const myGroupIds = groupMembers.filter(m => m.user_id === currentUser.id && m.is_active).map(m => m.group_id);
  const myGroups = researchGroups.filter(g => myGroupIds.includes(g.id));

  const activeTasks = tasks.filter(
    t => (t.assignee_user_id === currentUser.id || t.created_by === currentUser.id) &&
      (t.status === 'IN_PROGRESS' || t.status === 'TODO')
  );

  const pendingApplications = projectApplications.filter(a => a.status === 'PENDING');
  const isTeacherOrAdmin = ['PROFESSOR', 'DOCTOR', 'MCA', 'ADMIN'].includes(currentUser.role);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Welcome back, {currentUser.full_name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-1">Here's the latest activity across the platform.</p>
        </div>

        {/* Alerts */}
        {isTeacherOrAdmin && pendingApplications.length > 0 && (
          <Link to="/applications" className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors mb-6">
            <span className="text-sm font-medium text-foreground">{pendingApplications.length} pending application(s) to review</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main feed */}
          <div className="lg:col-span-2 space-y-1">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Activity Feed</h2>

            <div className="space-y-3">
              {feedItems.slice(0, 20).map((item, i) => {
                const user = getUserById(item.userId);
                const Icon = feedIcons[item.type];
                const proj = item.projectId ? projects.find(p => p.id === item.projectId) : null;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                    className="flex gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors"
                  >
                    <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ${feedColors[item.type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {user?.full_name}
                            {proj && (
                              <> · <Link to={`/projects/${proj.id}`} className="text-primary hover:underline">{proj.title}</Link></>
                            )}
                          </p>
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground shrink-0 mt-0.5">{item.timestamp}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{item.description}</p>
                      {item.meta?.newStatus && (
                        <div className="mt-2">
                          <StatusBadge status={item.meta.newStatus} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick stats */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Overview</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border bg-card text-center">
                  <span className="text-2xl font-display font-semibold text-foreground">{myProjects.length}</span>
                  <p className="text-xs text-muted-foreground mt-1">Projects</p>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card text-center">
                  <span className="text-2xl font-display font-semibold text-foreground">{activeTasks.length}</span>
                  <p className="text-xs text-muted-foreground mt-1">Active Tasks</p>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card text-center">
                  <span className="text-2xl font-display font-semibold text-foreground">{myGroups.length}</span>
                  <p className="text-xs text-muted-foreground mt-1">Groups</p>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card text-center">
                  <span className="text-2xl font-display font-semibold text-foreground">{users.length}</span>
                  <p className="text-xs text-muted-foreground mt-1">Members</p>
                </div>
              </div>
            </div>

            {/* My Groups */}
            {myGroups.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">My Groups</h3>
                <div className="space-y-2">
                  {myGroups.map(group => {
                    const lab = getLabById(group.lab_id);
                    const memberCount = groupMembers.filter(m => m.group_id === group.id && m.is_active).length;
                    return (
                      <div key={group.id} className="p-3 rounded-xl border border-border bg-card">
                        <p className="text-sm font-medium text-foreground">{group.name}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{memberCount} members</span>
                          <span>·</span>
                          <FlaskConical className="h-3 w-3" />
                          <span className="truncate">{lab?.name.split('—')[0]?.trim()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active tasks */}
            {activeTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">My Tasks</h3>
                <div className="space-y-2">
                  {activeTasks.slice(0, 5).map(task => {
                    const proj = projects.find(p => p.id === task.project_id);
                    return (
                      <div key={task.id} className="p-3 rounded-xl border border-border bg-card">
                        <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <PriorityBadge priority={task.priority} />
                          <StatusBadge status={task.status} />
                        </div>
                        {task.due_date && (
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{task.due_date}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Feed;
