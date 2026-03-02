import { motion } from 'framer-motion';
import { currentUser, projects, tasks, projectApplications, researchGroups, getUserById, getGroupById, projectParticipants } from '@/data/mockData';
import { RoleBadge, StatusBadge, PriorityBadge } from '@/components/Badges';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, AlertTriangle, FileText, TrendingUp, Kanban } from 'lucide-react';

const Dashboard = () => {
  // User's projects
  const myParticipations = projectParticipants.filter(p => p.user_id === currentUser.id);
  const myProjects = myParticipations.map(p => projects.find(proj => proj.id === p.project_id)!).filter(Boolean);
  
  // User's tasks
  const myTasks = tasks.filter(t => t.assignee_user_id === currentUser.id || t.created_by === currentUser.id);
  const inProgressTasks = myTasks.filter(t => t.status === 'IN_PROGRESS');
  const todoTasks = myTasks.filter(t => t.status === 'TODO');
  const blockedTasks = myTasks.filter(t => t.status === 'BLOCKED');
  const doneTasks = myTasks.filter(t => t.status === 'DONE');

  // Pending applications (for teacher/admin review)
  const pendingApplications = projectApplications.filter(a => a.status === 'PENDING');
  
  // Pending group validations (admin)
  const pendingGroups = researchGroups.filter(g => !g.is_validated);

  const isTeacherOrAdmin = ['PROFESSOR', 'DOCTOR', 'MCA', 'ADMIN'].includes(currentUser.role);

  const statCards = [
    { label: 'In Progress', value: inProgressTasks.length, icon: Clock, color: 'text-info' },
    { label: 'Completed', value: doneTasks.length, icon: CheckCircle2, color: 'text-success' },
    { label: 'Blocked', value: blockedTasks.length, icon: AlertTriangle, color: 'text-destructive' },
    { label: 'To Do', value: todoTasks.length, icon: FileText, color: 'text-muted-foreground' },
  ];

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-mono text-primary uppercase tracking-wider">Dashboard</span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-1">
              Welcome, {currentUser.full_name.split(' ')[0]}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <RoleBadge role={currentUser.role} />
              <span className="text-sm text-muted-foreground">{currentUser.email}</span>
            </div>
          </div>
          <Link
            to="/projects/1"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Kanban className="h-4 w-4" /> Open Project Board
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
              className="p-5 rounded-xl border border-border bg-card"
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-2xl font-serif font-bold text-foreground">{stat.value}</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* My Projects */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> My Projects
            </h2>
            <div className="space-y-3">
              {myProjects.map(project => {
                const group = getGroupById(project.group_id);
                const projectTasks = tasks.filter(t => t.project_id === project.id);
                const done = projectTasks.filter(t => t.status === 'DONE').length;
                const progress = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;

                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="block p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-foreground">{project.title}</h3>
                        <span className="text-xs font-mono text-muted-foreground">{group?.name}</span>
                      </div>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${project.visibility === 'PUBLIC' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {project.visibility}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
                        <span>{done}/{projectTasks.length} tasks</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Recent Tasks */}
            <div>
              <h2 className="text-xl font-serif font-semibold text-foreground mb-4">Active Tasks</h2>
              <div className="space-y-2">
                {inProgressTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="p-3 rounded-lg border border-border bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm text-foreground font-medium">{task.title}</span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge status={task.status} />
                      {task.due_date && (
                        <span className="text-xs font-mono text-muted-foreground">Due {task.due_date}</span>
                      )}
                    </div>
                  </div>
                ))}
                {inProgressTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground">No active tasks.</p>
                )}
              </div>
            </div>

            {/* Teacher/Admin: Pending Items */}
            {isTeacherOrAdmin && (
              <div>
                <h2 className="text-xl font-serif font-semibold text-foreground mb-4">Pending Reviews</h2>
                <div className="space-y-3">
                  {pendingApplications.length > 0 && (
                    <Link to="/applications" className="block p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{pendingApplications.length} application(s)</span>
                        <span className="text-xs font-mono text-primary">Review →</span>
                      </div>
                    </Link>
                  )}
                  {currentUser.role === 'ADMIN' && pendingGroups.length > 0 && (
                    <Link to="/admin" className="block p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{pendingGroups.length} group(s) to validate</span>
                        <span className="text-xs font-mono text-primary">Admin →</span>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
