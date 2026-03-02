import { motion } from 'framer-motion';
import { currentUser, getTeacherByUserId, getStudentByUserId, tasks, projects, projectParticipants, getUserById } from '@/data/mockData';
import { RoleBadge, StatusBadge, PriorityBadge } from '@/components/Badges';
import { Link } from 'react-router-dom';
import { Mail, BookOpen, FlaskConical, Clock, Calendar } from 'lucide-react';

const Profile = () => {
  const teacher = getTeacherByUserId(currentUser.id);
  const student = getStudentByUserId(currentUser.id);

  const myParticipations = projectParticipants.filter(p => p.user_id === currentUser.id);
  const myProjects = myParticipations.map(p => ({ ...projects.find(proj => proj.id === p.project_id)!, role: p.participant_role })).filter(p => p.id);

  const myTasks = tasks.filter(t => t.assignee_user_id === currentUser.id || t.created_by === currentUser.id);
  const recentTasks = [...myTasks].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 8);

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile card */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-border bg-card p-6 sticky top-24">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="h-20 w-20 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
                  <span className="text-2xl font-serif font-bold text-primary">
                    {currentUser.full_name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h1 className="text-2xl font-serif font-bold text-foreground">{currentUser.full_name}</h1>
                <RoleBadge role={currentUser.role} />
                <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {currentUser.email}
                </div>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                {teacher && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Department</span>
                      <span className="text-foreground font-mono text-xs">{teacher.department}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Grade</span>
                      <span className="text-foreground font-mono text-xs">{teacher.grade}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Experience</span>
                      <span className="text-foreground font-mono text-xs">{teacher.experience_years} years</span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-2">Research Interests</span>
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.research_interests.split(', ').map(interest => (
                          <span key={interest} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-mono">
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
                      <span className="text-foreground font-mono text-xs">{student.university}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Level</span>
                      <span className="text-foreground font-mono text-xs">{student.level}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Major</span>
                      <span className="text-foreground font-mono text-xs">{student.major}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="text-foreground font-mono text-xs">{currentUser.created_at}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Projects & Tasks */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-xl font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" /> Active Projects
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {myProjects.map(p => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
                  >
                    <h3 className="font-medium text-foreground mb-1">{p.title}</h3>
                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <span className="text-primary">{p.role}</span>
                      <span>·</span>
                      <span>{p.visibility}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Task History
              </h2>
              <div className="space-y-2">
                {recentTasks.map(task => {
                  const proj = projects.find(p => p.id === task.project_id);
                  return (
                    <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground block truncate">{task.title}</span>
                        <span className="text-xs font-mono text-muted-foreground">{proj?.title}</span>
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
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
