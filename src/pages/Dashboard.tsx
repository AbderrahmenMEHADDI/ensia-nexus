import { motion } from 'framer-motion';
import { currentUser, projects, tasks, projectApplications, researchGroups, researchLabs, getUserById, getGroupById, getLabById, groupMembers, projectParticipants } from '@/data/mockData';
import { RoleBadge, StatusBadge, PriorityBadge } from '@/components/Badges';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Users } from 'lucide-react';

const Dashboard = () => {
  const myParticipations = projectParticipants.filter(p => p.user_id === currentUser.id);
  const myProjects = myParticipations.map(p => projects.find(proj => proj.id === p.project_id)!).filter(Boolean);
  
  const myTasks = tasks.filter(t => t.assignee_user_id === currentUser.id || t.created_by === currentUser.id);
  const activeTasks = myTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'TODO');

  const pendingApplications = projectApplications.filter(a => a.status === 'PENDING');
  const pendingGroups = researchGroups.filter(g => !g.is_validated);
  const isTeacherOrAdmin = ['PROFESSOR', 'DOCTOR', 'MCA', 'ADMIN'].includes(currentUser.role);

  // Groups the user belongs to
  const myGroupIds = groupMembers.filter(m => m.user_id === currentUser.id && m.is_active).map(m => m.group_id);
  const myGroups = researchGroups.filter(g => myGroupIds.includes(g.id));

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Greeting */}
        <div className="mb-10">
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Good morning, {currentUser.full_name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your research.</p>
        </div>

        {/* Pending reviews for teachers */}
        {isTeacherOrAdmin && (pendingApplications.length > 0 || (currentUser.role === 'ADMIN' && pendingGroups.length > 0)) && (
          <div className="mb-8 space-y-2">
            {pendingApplications.length > 0 && (
              <Link to="/applications" className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                <span className="text-sm font-medium text-foreground">{pendingApplications.length} pending application(s) to review</span>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
            )}
            {currentUser.role === 'ADMIN' && pendingGroups.length > 0 && (
              <Link to="/admin" className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                <span className="text-sm font-medium text-foreground">{pendingGroups.length} group(s) awaiting validation</span>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
            )}
          </div>
        )}

        {/* My Groups */}
        {myGroups.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">My Groups</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {myGroups.map(group => {
                const lab = getLabById(group.lab_id);
                const leader = getUserById(group.leader_user_id);
                const memberCount = groupMembers.filter(m => m.group_id === group.id && m.is_active).length;
                const groupProjects = projects.filter(p => p.group_id === group.id);

                return (
                  <div key={group.id} className="p-4 rounded-xl border border-border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">{lab?.name.split('—')[0]?.trim()}</div>
                    <h3 className="text-sm font-medium text-foreground mb-1">{group.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{group.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {memberCount} members</span>
                      <span>{groupProjects.length} project(s)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* My Projects */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">My Projects</h2>
            <Link to="/labs" className="text-xs text-primary hover:underline">Browse all</Link>
          </div>
          <div className="space-y-2">
            {myProjects.map(project => {
              const group = getGroupById(project.group_id);
              const projectTasks = tasks.filter(t => t.project_id === project.id);
              const done = projectTasks.filter(t => t.status === 'DONE').length;
              const progress = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;

              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground">{project.title}</h3>
                    <span className="text-xs text-muted-foreground">{group?.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-8 text-right">{progress}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Active Tasks */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Active Tasks</h2>
          <div className="space-y-2">
            {activeTasks.slice(0, 8).map(task => {
              const proj = projects.find(p => p.id === task.project_id);
              return (
                <div key={task.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground block truncate">{task.title}</span>
                    <span className="text-xs text-muted-foreground">{proj?.title}</span>
                  </div>
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                  {task.due_date && (
                    <span className="text-xs font-mono text-muted-foreground hidden sm:flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {task.due_date}
                    </span>
                  )}
                </div>
              );
            })}
            {activeTasks.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">No active tasks. You're all caught up!</p>
            )}
          </div>
        </section>
      </motion.div>
    </div>
  );
};

export default Dashboard;
