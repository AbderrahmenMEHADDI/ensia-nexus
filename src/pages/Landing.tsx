import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckSquare,
  Users,
  MessageCircle,
  FolderOpen,
  FlaskConical,
  FileText,
  Zap,
  Shield,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: CheckSquare,
    title: 'Task Tracking',
    description: 'Kanban boards with drag-and-drop, priorities, and real-time progress for every project.',
  },
  {
    icon: Users,
    title: 'Research Groups',
    description: 'Organize teams under labs, assign leaders, and manage membership with admin validation.',
  },
  {
    icon: MessageCircle,
    title: 'Real-time Chat',
    description: 'Team and project-scoped chat rooms to keep conversations contextual and focused.',
  },
  {
    icon: FolderOpen,
    title: 'Project Management',
    description: 'Create public or private projects, track milestones, and collaborate across groups.',
  },
  {
    icon: FlaskConical,
    title: 'Lab Explorer',
    description: 'Browse research labs, discover ongoing work, and apply to join projects that interest you.',
  },
  {
    icon: FileText,
    title: 'Activity Feed',
    description: 'Stay updated with a social feed — post updates, comment, and bookmark research milestones.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Create or join a lab',
    description: 'Admins set up research labs and assign head teachers to oversee the research direction.',
  },
  {
    number: '02',
    title: 'Form research groups',
    description: 'Group leaders organize their team, accept members, and define research objectives.',
  },
  {
    number: '03',
    title: 'Launch projects',
    description: 'Start public or private projects with task boards, resources, and dedicated chat rooms.',
  },
  {
    number: '04',
    title: 'Track & collaborate',
    description: 'Manage tasks on kanban boards, discuss in real-time, and share progress through the feed.',
  },
];

const highlights = [
  { icon: Zap, title: 'Fast onboarding', description: 'Sign in with Google and start collaborating in seconds — no setup required.' },
  { icon: Shield, title: 'Role-based access', description: 'Students, teachers, and admins each see exactly what they need. Secure by design.' },
  { icon: BarChart3, title: 'Progress insights', description: 'Track completed tasks, active projects, and team contributions at a glance.' },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <img src="/logo_small.svg" alt="Logo" className="h-7 w-7" />
            <span className="font-display font-semibold text-foreground text-base">ENSIA Research Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/signin">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto"
        >
          <span className="inline-block mb-5 px-3 py-1 rounded-full border border-border bg-muted text-muted-foreground text-xs font-medium tracking-wide">
            École Nationale Supérieure d'Intelligence Artificielle
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-[1.1] tracking-tight">
            Research together,
            <br />
            build faster
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            A collaborative platform for managing research labs, groups, and projects at ENSIA.
          </p>
        </motion.div>

        {/* Auth card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="mt-10 w-full max-w-sm"
        >
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <Link to="/signup" className="block">
              <Button className="w-full gap-2" size="lg">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
            </Link>
            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to our Terms of Service.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/30">
        <div className="container py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-14"
          >
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-foreground">
              Everything your research team needs
            </h2>
            <p className="mt-2 text-muted-foreground text-sm max-w-md mx-auto">
              From task tracking to real-time collaboration — built for academic research workflows.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border">
        <div className="container py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-14"
          >
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-foreground">
              How it works
            </h2>
            <p className="mt-2 text-muted-foreground text-sm max-w-md mx-auto">
              From setup to collaboration in four simple steps.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                className="relative"
              >
                <span className="text-4xl font-display font-bold text-primary/15">{step.number}</span>
                <h3 className="font-display font-semibold text-foreground text-sm mt-2 mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-5 -right-3 w-6">
                    <ArrowRight className="h-4 w-4 text-border" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="border-t border-border bg-muted/30">
        <div className="container py-20 md:py-28">
          <div className="grid md:grid-cols-3 gap-8">
            {highlights.map((h, i) => (
              <motion.div
                key={h.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                className="text-center"
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <h.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-1">{h.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{h.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="container py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center max-w-lg mx-auto"
          >
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-foreground">
              Ready to get started?
            </h2>
            <p className="mt-3 text-muted-foreground text-sm">
              Join ENSIA researchers already collaborating on the platform.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="gap-2">
                  Create Account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/signin">
                <Button variant="outline" size="lg">Sign In</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo_small.svg" alt="Logo" className="h-6 w-6" />
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