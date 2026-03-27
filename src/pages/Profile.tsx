import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import { RoleBadge, StatusBadge, PriorityBadge } from '@/components/Badges';
import { Link } from 'react-router-dom';
import { Mail, Calendar, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Student, Teacher, Project, Task, ProjectParticipant, User } from '@/types';

const Profile = () => {
  const { user, isTeacher } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [participants, setParticipants] = useState<ProjectParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [p, t, part] = await Promise.all([
          apiRepository.getProjects(),
          apiRepository.getTasks(),
          apiRepository.getProjectParticipants(),
        ]);
        setProjects(p);
        setTasks(t);
        setParticipants(part);
        // Fetch role-specific profile
        if (isTeacher) {
          try {
            setTeacher(await apiRepository.getTeacherProfile(user.id));
          } catch { /* not a teacher */ }
        } else if (user.role === 'STUDENT') {
          try {
            setStudent(await apiRepository.getStudentProfile(user.id));
          } catch { /* not a student */ }
        }
      } catch (e) {
        console.error('Profile load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user) return null;

  const myParticipations = participants.filter(p => p.user_id === user.id);
  const myProjects = myParticipations
    .map(p => ({ ...projects.find(proj => proj.id === p.project_id)!, role: p.participant_role }))
    .filter(p => p.id);

  const myTasks = tasks.filter(t => t.assignee_user_id === user.id || t.created_by === user.id);
  const recentTasks = [...myTasks]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 6);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="flex gap-4 items-center"><div className="h-16 w-16 bg-muted rounded-2xl" /><div className="space-y-2"><div className="h-5 bg-muted rounded w-40" /><div className="h-4 bg-muted rounded w-24" /></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-display font-bold text-primary">
                {user.full_name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-display font-semibold text-foreground">{user.full_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <RoleBadge role={user.role} />
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {user.email}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.role === 'STUDENT' && (
              <Link to="/student-cv">
                <Button variant="default" size="sm" className="gap-1.5">
                  Create CV
                </Button>
              </Link>
            )}
            <Link to="/settings">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Settings className="h-3.5 w-3.5" /> Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Info */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Details</h2>
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            {teacher && (
              <>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Department</span><span className="text-foreground">{teacher.department}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Grade</span><span className="text-foreground">{teacher.grade}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Experience</span><span className="text-foreground">{teacher.experience_years} years</span></div>
                <div className="pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground block mb-2">Research Interests</span>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.research_interests.split(', ').map(interest => (
                      <span key={interest} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{interest}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
            {student && (
              <>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">University</span><span className="text-foreground">{student.university}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Level</span><span className="text-foreground">{student.level}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Major</span><span className="text-foreground">{student.major}</span></div>
                {student.cv_url && (
                  <div className="flex justify-between text-sm gap-3">
                    <span className="text-muted-foreground">CV</span>
                    <a className="text-primary hover:underline truncate" href={student.cv_url} target="_blank" rel="noreferrer">{student.cv_url}</a>
                  </div>
                )}
                {student.research_interests && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Research Interests</span>
                    <p className="text-sm text-foreground/90">{student.research_interests}</p>
                  </div>
                )}
                {student.experience && (
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Experience</span>
                    <p className="text-sm text-foreground/90">{student.experience}</p>
                  </div>
                )}
                {student.skills && (
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Skills</span>
                    <p className="text-sm text-foreground/90">{student.skills}</p>
                  </div>
                )}
                {student.bio && (
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Description</span>
                    <p className="text-sm text-foreground/90">{student.bio}</p>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Joined</span><span className="text-foreground">{user.created_at}</span></div>
          </div>
        </section>

        {/* Projects */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Projects</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {myProjects.map(p => (
              <Link key={p.id} to={`/projects/${p.id}`} className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                <h3 className="text-sm font-medium text-foreground mb-1">{p.title}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-primary">{p.role}</span>
                  <span>·</span>
                  <span>{p.visibility}</span>
                </div>
              </Link>
            ))}
            {myProjects.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
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
            {recentTasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks found.</p>}
          </div>
        </section>
      </motion.div>
    </div>
  );
};

export default Profile;
