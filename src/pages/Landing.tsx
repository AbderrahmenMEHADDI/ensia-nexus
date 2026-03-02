import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { projects, getUserById, getGroupById, getLabById, researchLabs, researchGroups, tasks } from '@/data/mockData';
import { ArrowRight, FlaskConical, Users, FolderOpen, CheckCircle2 } from 'lucide-react';

const Landing = () => {
  const publicProjects = projects.filter(p => p.visibility === 'PUBLIC');
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;

  const stats = [
    { label: 'Research Labs', value: researchLabs.length, icon: FlaskConical },
    { label: 'Research Groups', value: researchGroups.length, icon: Users },
    { label: 'Active Projects', value: projects.length, icon: FolderOpen },
    { label: 'Tasks Completed', value: completedTasks, icon: CheckCircle2 },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="container relative py-24 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <span className="inline-block mb-4 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono font-medium tracking-wider uppercase">
              École Nationale Supérieure d'Intelligence Artificielle
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-foreground leading-[1.1] mb-6">
              ENSIA<br />
              <span className="text-gradient-amber">Research Hub</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed">
              A collaborative platform for managing research labs, groups, and projects. 
              Explore cutting-edge AI, cybersecurity, and data science research.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/labs"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                Explore Labs <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-secondary transition-colors"
              >
                Go to Dashboard
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              className="flex flex-col items-center gap-2 py-8 border-r border-border last:border-r-0"
            >
              <stat.icon className="h-5 w-5 text-primary mb-1" />
              <span className="text-3xl font-serif font-bold text-foreground">{stat.value}</span>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Projects */}
      <section className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs font-mono text-primary uppercase tracking-wider">Featured Work</span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-2">Public Projects</h2>
            </div>
            <Link to="/labs" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {publicProjects.map((project, i) => {
              const group = getGroupById(project.group_id);
              const lab = group ? getLabById(group.lab_id) : null;
              const creator = getUserById(project.created_by);
              const projectTasks = tasks.filter(t => t.project_id === project.id);
              const doneTasks = projectTasks.filter(t => t.status === 'DONE').length;

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                >
                  <Link
                    to={`/projects/${project.id}`}
                    className="block p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-mono text-muted-foreground">{lab?.name.split('—')[0]?.trim()}</span>
                      <span className="text-muted-foreground/30">·</span>
                      <span className="text-xs font-mono text-muted-foreground">{group?.name}</span>
                    </div>
                    <h3 className="text-xl font-serif font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted-foreground">by {creator?.full_name}</span>
                      <span className="text-xs font-mono text-primary">
                        {doneTasks}/{projectTasks.length} tasks done
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Labs */}
      <section className="border-t border-border bg-secondary/30">
        <div className="container py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-xs font-mono text-primary uppercase tracking-wider">Infrastructure</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-2 mb-10">Research Labs</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {researchLabs.map((lab, i) => {
              const head = getUserById(lab.head_teacher_id);
              const groups = researchGroups.filter(g => g.lab_id === lab.id);
              return (
                <motion.div
                  key={lab.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <Link
                    to="/labs"
                    className="block p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-all h-full"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <FlaskConical className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-serif font-semibold text-foreground mb-2">{lab.name.split('—')[0]?.trim()}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{lab.description}</p>
                    <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                      <span>Head: {head?.full_name}</span>
                      <span>{groups.length} groups</span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <FlaskConical className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-mono text-muted-foreground">ENSIA Research Hub © 2026</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built for advancing AI, cybersecurity & data science research.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
