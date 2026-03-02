import { motion } from 'framer-motion';
import { currentUser, getTeacherByUserId, getStudentByUserId, tasks, projects, projectParticipants } from '@/data/mockData';
import { RoleBadge, StatusBadge, PriorityBadge } from '@/components/Badges';
import { Link } from 'react-router-dom';
import { Mail, Calendar, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Profile = () => {
  const teacher = getTeacherByUserId(currentUser.id);
  const student = getStudentByUserId(currentUser.id);

  const myParticipations = projectParticipants.filter(p => p.user_id === currentUser.id);
  const myProjects = myParticipations.map(p => ({ ...projects.find(proj => proj.id === p.project_id)!, role: p.participant_role })).filter(p => p.id);

  const myTasks = tasks.filter(t => t.assignee_user_id === currentUser.id || t.created_by === currentUser.id);
  const recentTasks = [...myTasks].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 6);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-display font-bold text-primary">
                {currentUser.full_name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-display font-semibold text-foreground">{currentUser.full_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <RoleBadge role={currentUser.role} />
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {currentUser.email}
                </span>
              </div>
            </div>
          </div>
          <Link to="/settings">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings className="h-3.5 w-3.5" /> Settings
            </Button>
          </Link>
        </div>

        {/* Info */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Details</h2>
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            {teacher && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Department</span>
                  <span className="text-foreground">{teacher.department}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Grade</span>
                  <span className="text-foreground">{teacher.grade}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Experience</span>
                  <span className="text-foreground">{teacher.experience_years} years</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground block mb-2">Research Interests</span>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.research_interests.split(', ').map(interest => (
                      <span key={interest} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
            {student && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">University</span>
                  <span className="text-foreground">{student.university}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Level</span>
                  <span className="text-foreground">{student.level}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Major</span>
                  <span className="text-foreground">{student.major}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Joined</span>
              <span className="text-foreground">{currentUser.created_at}</span>
            </div>
          </div>
        </section>

        {/* Projects */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Projects</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {myProjects.map(p => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <h3 className="text-sm font-medium text-foreground mb-1">{p.title}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-primary">{p.role}</span>
                  <span>·</span>
                  <span>{p.visibility}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Tasks */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Recent Tasks</h2>
          <div className="space-y-2">
            {recentTasks.map(task => {
              const proj = projects.find(p => p.id === task.project_id);
              return (
                <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl border border-border bg-card">
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
          </div>
        </section>
      </motion.div>
    </div>
  );
};

export default Profile;
