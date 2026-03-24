import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiRepository } from '@/repositories/apiRepository';
import { ArrowRight, FlaskConical, Users, FolderOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ResearchLab, ResearchGroup, Project, Task, User } from '@/types';

const Landing = () => {
  const [labs, setLabs] = useState<ResearchLab[]>([]);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [l, g, p, t, u] = await Promise.all([
          apiRepository.getLabs(),
          apiRepository.getGroups(),
          apiRepository.getProjects(),
          apiRepository.getTasks(),
          apiRepository.getUsers(),
        ]);
        setLabs(l);
        setGroups(g);
        setProjects(p);
        setTasks(t);
        setUsers(u);
      } catch {
        // Landing still renders without data
      }
    };
    load();
  }, []);

  const getUserById = (id: number) => users.find(u => u.id === id);
  const getGroupById = (id: number) => groups.find(g => g.id === id);

  const publicProjects = projects.filter(p => p.visibility === 'PUBLIC');
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;

  const stats = [
    { label: 'Research Labs', value: labs.length, icon: FlaskConical },
    { label: 'Research Groups', value: groups.length, icon: Users },
    { label: 'Active Projects', value: projects.length, icon: FolderOpen },
    { label: 'Tasks Completed', value: completedTasks, icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border">
        <div className="container py-24 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <span className="inline-block mb-4 px-3 py-1 rounded-full border border-border bg-muted text-muted-foreground text-xs font-medium tracking-wide">
              École Nationale Supérieure d'Intelligence Artificielle
            </span>
            <div className="mb-6">
              <img src="/logo.svg" alt="ENSIA Logo" className="h-16 w-auto" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-[1.1] mb-6">
              ENSIA Research Hub
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
              A collaborative platform for managing research labs, groups, and projects.
              Explore cutting-edge AI, cybersecurity, and data science research.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/signin">
                <Button size="lg" className="gap-2">
                  Sign In <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="outline" size="lg">Create Account</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border">
        <div className="container grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
              className="flex flex-col items-center gap-1.5 py-8 border-r border-border last:border-r-0"
            >
              <stat.icon className="h-4 w-4 text-primary mb-1" />
              <span className="text-2xl font-display font-bold text-foreground">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Projects */}
      <section className="container py-20">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-display font-semibold text-foreground">Public Projects</h2>
              <p className="text-sm text-muted-foreground mt-1">Featured research from our labs.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {publicProjects.map(project => {
              const group = getGroupById(project.group_id);
              const lab = group ? labs.find(l => l.id === group.lab_id) : null;
              const creator = getUserById(project.created_by);
              const projectTasks = tasks.filter(t => t.project_id === project.id);
              const doneTasks = projectTasks.filter(t => t.status === 'DONE').length;

              return (
                <div key={project.id} className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <span>{lab?.name.split('—')[0]?.trim()}</span>
                    <span>·</span>
                    <span>{group?.name}</span>
                  </div>
                  <h3 className="text-base font-display font-semibold text-foreground mb-1">{project.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>by {creator?.full_name}</span>
                    <span className="text-primary">{doneTasks}/{projectTasks.length} done</span>
                  </div>
                </div>
              );
            })}
            {publicProjects.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-2 text-center py-8">No public projects yet.</p>
            )}
          </div>
        </motion.div>
      </section>

      {/* Labs */}
      <section className="border-t border-border bg-muted/30">
        <div className="container py-20">
          <h2 className="text-2xl font-display font-semibold text-foreground mb-8">Research Labs</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {labs.map(lab => {
              const head = getUserById(lab.head_teacher_id);
              const labGroups = groups.filter(g => g.lab_id === lab.id);
              return (
                <div key={lab.id} className="p-5 rounded-xl border border-border bg-card">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <FlaskConical className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-1 text-sm">{lab.name.split('—')[0]?.trim()}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{lab.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Head: {head?.full_name}</span>
                    <span>{labGroups.length} groups</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 flex items-center justify-center">
              <img src="/logo_small.svg" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <span className="text-sm text-muted-foreground">ENSIA Research Hub © 2026</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built for advancing AI, cybersecurity &amp; data science research.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
