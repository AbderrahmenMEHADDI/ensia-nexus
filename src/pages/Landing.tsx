import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Transition, useInView } from 'framer-motion';
import {
  projects,
  getUserById,
  getGroupById,
  researchLabs,
  researchGroups,
  tasks,
} from '@/data/mockData';
import {
  ArrowRight,
  FlaskConical,
  Users,
  FolderOpen,
  CheckCircle2,
  Sun,
  Moon,
  BookOpen,
  Cpu,
  Shield,
  GitFork,
  Layers,
  SlidersHorizontal,
  FileText,
  UserCheck,
  BarChart2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const EASE: Transition = { duration: 0.55, ease: 'easeOut' };
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { ...EASE, delay } satisfies Transition,
});

const domainIcon = (name = '') => {
  if (/cyber|security/i.test(name)) return Shield;
  if (/data|science|ml|ai/i.test(name)) return Cpu;
  return BookOpen;
};

const PROBLEMS = [
  {
    problem: 'Fragmented toolchain',
    detail: 'Work scattered across email, shared drives, chat, and Git — context switching kills momentum.',
    solution: 'Unified workspace',
    fix: 'All tasks, documents, discussions, and code live in one place. No more switching tabs to find a decision.',
    icon: Layers,
    index: '01',
  },
  {
    problem: 'Unclear ownership',
    detail: 'Tasks lack explicit owners and acceptance criteria, leading to stalled progress and finger-pointing.',
    solution: 'Structured task assignment',
    fix: 'AI-assisted allocation assigns tasks with clear owners, reviewers, deadlines, and completion criteria.',
    icon: UserCheck,
    index: '02',
  },
  {
    problem: 'Weak dependency tracking',
    detail: 'Teams discover blockers late — missing datasets, pending approvals — delaying entire milestones.',
    solution: 'Dependency-aware planning',
    fix: 'The platform maps task dependencies upfront and surfaces blockers before they delay the team.',
    icon: GitFork,
    index: '03',
  },
  {
    problem: 'Inconsistent writing',
    detail: 'Multiple contributors produce divergent styles and citation formats, multiplying editing effort.',
    solution: 'Guided paper workflow',
    fix: 'Shared templates, citation standards, and merge control keep every contribution consistent.',
    icon: FileText,
    index: '04',
  },
  {
    problem: 'Duplicated efforts',
    detail: 'Similar literature reviews and experiments are repeated across groups due to poor discoverability.',
    solution: 'Cross-group visibility',
    fix: 'Teachers and leaders can browse what other groups are working on, preventing redundant work.',
    icon: SlidersHorizontal,
    index: '05',
  },
  {
    problem: 'Uneven progress reporting',
    detail: 'Updates are irregular and non-standardized, making it hard to assess real project health.',
    solution: 'Predictive analytics',
    fix: 'Live dashboards and workload analytics give leaders an honest picture of team progress at a glance.',
    icon: BarChart2,
    index: '06',
  },
];

/* ── Animated filmstrip card ──────────────────────────── */
const FilmCard = ({ item, i }: { item: typeof PROBLEMS[0]; i: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px -15% 0px 0px' });
  const Icon = item.icon;

  return (
    <motion.div
      ref={ref}
      className="filmstrip-unit"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
    >
      {/* Index marker */}
      <div className="film-index">
        <span className="font-mono-dm">{item.index}</span>
        <span className="film-index-line" />
        <span className="font-mono-dm film-total">/ {String(PROBLEMS.length).padStart(2, '0')}</span>
      </div>

      <div className="card-pair">
        {/* ── Problem card ── */}
        <div className="film-card film-card-problem grain-card">
          <div className="film-card-inner">
            <div className="film-card-header">
              <span className="film-label film-label-problem">The friction</span>
              <div className="film-icon-wrap film-icon-problem">
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <h3 className="film-card-title font-lora">{item.problem}</h3>
            <p className="film-card-body font-lora">{item.detail}</p>
          </div>
        </div>

        {/* ── Divider arrow ── */}
        <div className="film-divider">
          <div className="film-divider-line film-divider-line-top" />
          <div className="film-divider-circle">
            <ArrowRight className="h-3 w-3" />
          </div>
          <div className="film-divider-line film-divider-line-bottom" />
        </div>

        {/* ── Solution card ── */}
        <div className="film-card film-card-solution grain-card">
          <div className="film-card-inner">
            <div className="film-card-header">
              <span className="film-label film-label-solution">The ENSIA way</span>
              <div className="film-icon-wrap film-icon-solution">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <h3 className="film-card-title font-lora">{item.solution}</h3>
            <p className="film-card-body font-lora">{item.fix}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════
   LANDING
═══════════════════════════════════════════════════════════ */
const Landing = () => {
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [activeIdx, setActiveIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  /* ── Scroll tracking ─────────────────────────────────── */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const units = track.querySelectorAll('.filmstrip-unit');
      let closest = 0;
      let minDist = Infinity;
      units.forEach((u, i) => {
        const el = u as HTMLElement;
        const dist = Math.abs(el.offsetLeft - track.scrollLeft - track.offsetWidth / 2 + el.offsetWidth / 2);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      setActiveIdx(closest);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, []);

  const scrollNext = () => {
    const track = trackRef.current;
    if (!track) return;
    const units = track.querySelectorAll('.filmstrip-unit');
    const next = units.length <= 1 ? 0 : activeIdx >= units.length - 1 ? 0 : activeIdx + 1;
    (units[next] as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const scrollTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const units = track.querySelectorAll('.filmstrip-unit');
    (units[i] as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const stats = [
    { label: 'Research Labs',   value: researchLabs.length,   icon: FlaskConical },
    { label: 'Research Groups', value: researchGroups.length, icon: Users },
    { label: 'Active Projects', value: projects.length,       icon: FolderOpen },
    { label: 'Tasks Completed', value: completedTasks,        icon: CheckCircle2 },
  ];

  return (
    <div className="landing-root min-h-screen bg-background text-foreground">
      <style>{`
        .font-lora    { font-family: inherit; }
        .font-mono-dm { font-family: inherit; }
        .landing-root { font-family: inherit; }

        /* ── Grain ───────────────────────────────────────── */
        .grain::after {
          content: '';
          position: absolute; inset: 0;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 180px; opacity: 0.45; z-index: 0; border-radius: inherit;
        }
        .grain-card {
          position: relative; overflow: hidden;
        }
        .grain-card::after {
          content: '';
          position: absolute; inset: 0;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E");
          background-size: 160px; z-index: 0; border-radius: inherit;
        }

        /* ── Misc shared ─────────────────────────────────── */
        .ruled {
          background-image: repeating-linear-gradient(
            to bottom, transparent, transparent 27px,
            hsl(var(--border) / 0.35) 27px, hsl(var(--border) / 0.35) 28px
          );
        }
        .stat-item + .stat-item { border-left: 1px solid hsl(var(--border)); }
        .card-lift { transition: transform 0.22s ease, box-shadow 0.22s ease; }
        .card-lift:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px -8px hsl(var(--primary) / 0.14);
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee 28s linear infinite;
          display: flex; width: max-content;
        }
        .marquee-track:hover { animation-play-state: paused; }
        .theme-btn {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid #2b1b06; background: #ffffff;
          cursor: pointer; color: #2b1b06;
          transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 1px 0 #2b1b06;
        }
        .theme-btn:hover { background: #ffffff; color: #2b1b06; }

        /* Nav forced light theme */
        .nav-always-light {
          background: #f7f2e9 !important;
          color: #2b1b06 !important;
          border-bottom: 1px solid hsl(var(--border));
          box-shadow: 0 1px 0 hsl(var(--border) / 0.6);
        }
        .dark .nav-always-light {
          background: #f7f2e9 !important;
          color: #2b1b06 !important;
        }
        .nav-always-light a,
        .nav-always-light span,
        .nav-always-light svg {
          color: #2b1b06 !important;
        }

        /* Navbar color accents */
        .nav-always-light .nav-link-brown { color: #3a2408 !important; position: relative; text-decoration: none; }
        .nav-always-light .nav-link-brown::after {
          content: '';
          position: absolute;
          left: 0; bottom: -6px;
          width: 100%; height: 1px;
          background: transparent;
          transition: background 0.2s ease;
        }
        .nav-always-light .nav-link-brown:hover::after { background: hsl(var(--border)); }
        .nav-always-light .brand-blue { color: #041432 !important; }
        .nav-always-light .nav-btn-brown { color: #3a2408 !important; }
        .nav-always-light .nav-btn-brown:hover { color: #3a2408 !important; }
        .nav-always-light .nav-arrow-brown { color: #3a2408 !important; }

        .nav-flat-btn {
          border: 1px solid #2b1b06;
          border-radius: 6px;
          background: #ffffff;
          padding: 8px 12px;
          color: #2b1b06 !important;
        }
        .nav-flat-btn:hover { background: #ffffff; border-color: #2b1b06; }
        .nav-join-btn {
          border-radius: 6px;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border: 1px solid #2b1b06;
        }
        .nav-join-btn:hover { background: hsl(var(--primary)); border-color: #2b1b06; }

        /* Hero button borders */
        .hero-border-solid { border-color: #2b1b06 !important; }
        .dark .hero-border-solid { border-color: #ffffff !important; }
        .hero-border-outline { border-color: #2b1b06 !important; color: #2b1b06 !important; }
        .dark .hero-border-outline { border-color: #ffffff !important; color: #ffffff !important; }

        /* ── Full Width Breakout ── */
        .full-width-section {
          width: 100vw;
          position: relative;
          left: 50%; right: 50%;
          margin-left: -50vw; margin-right: -50vw;
        }

        /* ── Filmstrip ───────────────────────────────────── */
        .filmstrip-track {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          gap: 0;
          padding: 0;
        }
        .filmstrip-track::-webkit-scrollbar { display: none; }

        .filmstrip-unit {
          scroll-snap-align: center;
          flex-shrink: 0;
          width: 95vw;
          border-right: 0.5px solid hsl(var(--border) / 0.5);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        @media (min-width: 1024px) {
          .filmstrip-unit { width: 88vw; }
        }

        /* Index row */
        .film-index {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 2px;
        }
        .film-index .font-mono-dm {
          font-size: 11px;
          letter-spacing: 0.12em;
          color: hsl(var(--muted-foreground) / 0.5);
        }
        .film-index-line {
          flex: 1;
          height: 0.5px;
          background: hsl(var(--border) / 0.6);
        }
        .film-total { opacity: 0.4; }

        /* Card pair row */
        .card-pair {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: stretch;
          border-top: 0.5px solid hsl(var(--border));
          border-bottom: 0.5px solid hsl(var(--border));
        }

        /* Individual card */
        .film-card {
          position: relative;
          border: none;
          border-radius: 0;
          background: hsl(var(--card));
          transition: border-color 0.2s ease;
          min-height: 380px;
        }
        .film-card:hover { border-color: hsl(var(--border) / 0.9); }
        .film-card-inner {
          padding: 28px 26px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          z-index: 1;
          height: 100%;
          box-sizing: border-box;
        }
        .film-card-problem { background: hsl(var(--card)); }
        .film-card-solution { background: hsl(var(--card)); }
        .problem-side { border-right: 0.5px solid hsl(var(--border) / 0.5); }

        /* Card header row */
        .film-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* Labels */
        .film-label {
          font-family: 'DM Mono', monospace;
          font-size: 9.5px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .film-label-problem { color: hsl(0 40% 30% / 0.55); }
        .dark .film-label-problem { color: hsl(0 50% 75% / 0.45); }
        .film-label-solution { color: hsl(210 50% 35% / 0.6); }
        .dark .film-label-solution { color: hsl(210 60% 72% / 0.45); }

        /* Icon wraps */
        .film-icon-wrap {
          width: 30px; height: 30px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .film-icon-problem {
          background: hsl(0 50% 50% / 0.07);
          border: 0.5px solid hsl(0 50% 50% / 0.15);
          color: hsl(0 50% 40% / 0.7);
        }
        .dark .film-icon-problem {
          background: hsl(0 50% 60% / 0.1);
          border-color: hsl(0 50% 60% / 0.2);
          color: hsl(0 50% 70% / 0.6);
        }
        .film-icon-solution {
          background: hsl(210 60% 50% / 0.08);
          border: 0.5px solid hsl(210 60% 50% / 0.18);
          color: hsl(210 60% 40% / 0.75);
        }
        .dark .film-icon-solution {
          background: hsl(210 60% 65% / 0.1);
          border-color: hsl(210 60% 65% / 0.2);
          color: hsl(210 60% 70% / 0.65);
        }

        /* Title & body */
        .film-card-title {
          font-size: 20px;
          font-weight: 600;
          line-height: 1.25;
          color: hsl(var(--foreground));
          margin: 0;
        }
        .film-card-body {
          font-size: 13.5px;
          line-height: 1.7;
          color: hsl(var(--muted-foreground));
          margin: 0;
          flex: 1;
        }


        /* Divider */
        .film-divider {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          pointer-events: none;
        }
        .film-divider-line {
          flex: 1;
          width: 0.5px;
          background: hsl(var(--border) / 0.5);
        }
        .film-divider-circle {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 0.5px solid hsl(var(--border));
          background: hsl(var(--background));
          display: flex; align-items: center; justify-content: center;
          color: hsl(var(--muted-foreground) / 0.6);
          flex-shrink: 0;
          transition: border-color 0.25s ease, color 0.25s ease, transform 0.25s ease;
          z-index: 1;
        }
        .card-pair:hover .film-divider-circle {
          border-color: hsl(var(--primary) / 0.45);
          color: hsl(var(--primary));
          transform: scale(1.1);
        }

        /* Nav row */
        .filmstrip-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 5vw;
          margin-top: 4px;
        }

        /* Dot pagination */
        .film-dots {
          display: flex; gap: 7px; align-items: center;
        }
        .film-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: hsl(var(--border));
          border: none; padding: 0; cursor: pointer;
          transition: all 0.2s ease;
          appearance: none;
        }
        .film-dot.active {
          width: 18px; border-radius: 3px;
          background: hsl(var(--foreground));
        }

        /* Next button */
        .film-next-btn {
          width: 64px; height: 64px;
          border-radius: 50%;
          border: 0.5px solid hsl(var(--border));
          background: hsl(var(--foreground));
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: hsl(var(--background));
          transition: all 0.3s ease;
          flex-shrink: 0;
        }
        .film-next-btn:hover:not(:disabled) {
          border-color: hsl(var(--primary));
          color: hsl(var(--primary));
          transform: scale(1.05);
        }
        .film-next-btn:disabled { opacity: 0.25; cursor: default; transform: none; }
        .film-next-btn svg { width: 18px; height: 18px; stroke-width: 1.25; }
      `}</style>

      {/* ══════════════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 nav-always-light">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <img
              src="/logo.svg"
              alt="ENSIA Research Hub logo"
              className="h-7 w-13 rounded-md object-contain"
            />
            <span className="font-lora font-semibold text-base tracking-tight brand-blue">Research Hub</span>
          </div>
             <nav className="hidden md:flex items-center gap-8 text-lg font-semibold text-muted-foreground">
            <a href="#problems" className="nav-link-brown transition-colors">Features</a>
            <a href="#labs"     className="nav-link-brown transition-colors">Labs</a>
            <a href="#about"    className="nav-link-brown transition-colors">About</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <button className="theme-btn" onClick={() => setDark(d => !d)} aria-label="Toggle theme">
              {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            <Link to="/signin"><Button variant="ghost" size="sm" className="text-base nav-btn-brown nav-flat-btn">Sign in</Button></Link>
            <Link to="/signup">
              <Button size="sm" className="text-base gap-1.5 nav-join-btn">Join <ArrowRight className="h-3.5 w-3.5 nav-arrow-brown" /></Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="relative grain overflow-hidden border-b border-border">
        <div className="absolute inset-0 ruled opacity-60 pointer-events-none" aria-hidden />
        <div className="container relative z-10 py-24 md:py-32">
          <div className="grid items-center gap-12 md:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <motion.p {...fadeUp(0)} className="font-mono-dm text-xs tracking-[0.18em] uppercase text-muted-foreground mb-5">
                École Nationale Supérieure d'Intelligence Artificielle — Algiers
              </motion.p>
              <motion.h1 {...fadeUp(0.08)} className="font-lora text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.04] mb-6 tracking-tight">
                Where ENSIA<br />
                <em className="font-normal not-italic text-muted-foreground">research</em>{' '}takes shape.
              </motion.h1>
              <motion.p {...fadeUp(0.16)} className="text-base text-muted-foreground max-w-lg mb-8 leading-relaxed">
                A single workspace for lab directors, researchers, and students —
                task coordination, paper writing workflows, and cross-group visibility, all in one place.
              </motion.p>
              <motion.div {...fadeUp(0.22)} className="flex flex-wrap gap-3">
                <Link to="/signin">
                  <Button size="lg" className="gap-2 rounded-full px-6 border hero-border-solid">Sign in <ArrowRight className="h-4 w-4" /></Button>
                </Link>
                <Link to="/signup">
                  <Button variant="outline" size="lg" className="rounded-full px-6 border hero-border-outline">Create account</Button>
                </Link>
              </motion.div>
            </div>
            <motion.div {...fadeUp(0.28)} className="hidden md:block w-64 border border-border rounded-xl p-6 bg-card/60 backdrop-blur-sm md:-translate-x-4">
              <p className="font-lora text-sm text-muted-foreground leading-relaxed mb-3 italic">
                "Research is formalized curiosity. It is poking and prying with a purpose."
              </p>
              <p className="font-mono-dm text-xs text-muted-foreground/70 tracking-wide mb-4">— Zora Neale Hurston</p>
              <div className="pt-4 border-t border-border flex flex-col gap-1.5">
                <p className="font-mono-dm text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Framework</p>
                {['AI-assisted management', 'Research visibility', 'Encourages beginners'].map(item => (
                  <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
        <div className="border-t border-border overflow-hidden py-3 bg-muted/40">
          <div className="marquee-track">
            {[
              'Artificial Intelligence','Cybersecurity','Data Science','Natural Language Processing',
              'Machine Learning','Computer Vision','Knowledge Graphs','Federated Learning','Explainable AI',
              'Artificial Intelligence','Cybersecurity','Data Science','Natural Language Processing',
              'Machine Learning','Computer Vision','Knowledge Graphs','Federated Learning','Explainable AI',
            ].map((kw, i) => (
              <span key={i} className="font-mono-dm mx-6 text-xs tracking-widest uppercase text-muted-foreground/50 whitespace-nowrap">{kw}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════ */}
      <section className="border-b border-border">
        <div className="container grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} {...fadeUp(0.1 + i * 0.07)} className="stat-item flex flex-col items-center gap-1 py-9">
              <stat.icon className="h-4 w-4 text-primary mb-1 opacity-80" />
              <span className="font-lora text-3xl font-semibold text-foreground">{stat.value}</span>
              <span className="font-mono-dm text-[11px] tracking-widest uppercase text-muted-foreground">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>


     <section id="problems" className="py-24 overflow-hidden border-t border-border">
  {/* Header with Arrow on the Right */}
  <div className="container mb-12">
    <div className="flex items-end justify-between gap-8">
      <motion.div {...fadeUp(0.04)} className="max-w-xl">
        <p className="font-mono-dm text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
          Diagnosis // Collaborative Flow
        </p>
        <h2 className="font-lora text-4xl font-medium tracking-tight mb-4">
          Core Research Friction
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Identifying the friction points that stall academic progress, replaced by a streamlined environment built for deep focus.        </p>
      </motion.div>

      {/* The Right-Side Navigator */}
      <button
        className="film-next-btn hidden md:flex"
        onClick={scrollNext}
        disabled={PROBLEMS.length <= 1}
        aria-label="Next problem and solution"
        title="Next problem and solution"
      >
        <ArrowRight className="h-5 w-5 stroke-[1.2px] " />
      </button>
    </div>
  </div>

  {/* Full Width Filmstrip Track */}
  <div className="full-width-section">
    <div ref={trackRef} className="filmstrip-track hide-scrollbar">
      {PROBLEMS.map((item, i) => (
        <div key={item.problem} className="filmstrip-unit group">
          {/* Technical Header */}
          <div className="flex items-center gap-4 px-6 py-3 border-t border-border/40">
            <span className="font-mono-dm text-[10px] text-muted-foreground/60">
              {item.index} — 06
            </span>
            <div className="h-[0.5px] flex-1 bg-border/30" />
          </div>

          <div className="card-pair">
            {/* Problem Side */}
            <div className="film-card problem-side grain-card p-8 lg:p-12">
              <span className="font-mono-dm text-[9px] uppercase tracking-widest text-destructive/50 mb-6 block">
                [ Friction_Point ]
              </span>
              <h3 className="font-lora text-[26px] md:text-[28px] mb-4 text-foreground/90">{item.problem}</h3>
              <p className="font-lora italic text-muted-foreground text-sm leading-relaxed">
                {item.detail}
              </p>
            </div>

            {/* Solution Side */}
            <div className="film-card grain-card p-8 lg:p-12 bg-primary/[0.01]">
              <span className="font-mono-dm text-[9px] uppercase tracking-widest text-primary/60 mb-6 block">
                [ ENSIA_Resolution ]
              </span>
              <h3 className="font-lora text-[26px] md:text-[28px] mb-4 text-primary/80">{item.solution}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.fix}
              </p>
            </div>
          </div>
        </div>
      ))}

    </div>
  </div>

</section>
{/* ══════════════════════════════════════════════════════
    LABS — Portfolio Grid
══════════════════════════════════════════════════════ */}
<section id="labs" className="py-24 border-t border-border/50">
  <div className="container">
    <motion.div {...fadeUp(0.05)} className="mb-16">
      <p className="font-mono-dm text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
        Infrastructure // Research Units
      </p>
      <h2 className="font-lora text-4xl font-medium tracking-tight">Academic Labs</h2>
    </motion.div>

    <div className="grid md:grid-cols-3 gap-px bg-border/40 border border-border/40 overflow-hidden">
      {researchLabs.map((lab, i) => {
        const head = getUserById(lab.head_teacher_id);
        const groups = researchGroups.filter(g => g.lab_id === lab.id);
        const labProjects = projects.filter(p => { 
          const g = getGroupById(p.group_id); 
          return g?.lab_id === lab.id; 
        });
        
        return (
          <motion.div 
            key={lab.id} 
            {...fadeUp(0.08 + i * 0.05)} 
            className="group bg-background p-8 flex flex-col min-h-[320px] hover:bg-muted/30 transition-colors"
          >
            <div className="flex justify-between items-start mb-10">
              <span className="font-mono-dm text-[9px] text-muted-foreground/60 tracking-widest uppercase">
                {groups.length} Groups // {labProjects.length} Active
              </span>
              <div className="h-2 w-2 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
            </div>

            <div className="flex-1">
              <h3 className="font-lora text-xl font-medium mb-4 group-hover:text-primary transition-colors leading-tight">
                {lab.name.split('—')[0]?.trim()}
              </h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-4 font-light">
                {lab.description}
              </p>
            </div>

            <div className="mt-12 pt-6 border-t border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-none bg-muted flex items-center justify-center text-[9px] font-mono-dm border border-border/60 uppercase">
                  {head?.full_name?.[0] ?? '?'}
                </div>
                <span className="font-mono-dm text-[10px] uppercase tracking-tight text-muted-foreground/80">
                  Dir. {head?.full_name?.split(' ').pop()}
                </span>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/0 -translate-x-2 group-hover:text-muted-foreground/100 group-hover:translate-x-0 transition-all" />
            </div>
          </motion.div>
        );
      })}
    </div>
  </div>
</section>

      {/* ══════════════════════════════════════════════════════
          ABOUT
      ══════════════════════════════════════════════════════ */}
      <section id="about" className="border-b border-border bg-muted/30">
        <div className="container py-16 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-start">
          <motion.div {...fadeUp(0.05)} className="space-y-4">
            <p className="font-mono-dm text-[11px] tracking-[0.25em] uppercase text-muted-foreground">About Ensia Nexus</p>
            <h2 className="font-lora text-4xl font-semibold leading-tight">A calmer workspace for research teams.</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              ENSIA Nexus unifies planning, writing, reviews, and visibility so labs, groups, and students stay aligned from proposal to publication.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[{
  title: 'Open project access',
  body: 'Students can discover public research projects and apply directly through the platform.'
}, {
  title: 'Structured admission workflow',
  body: 'Applications include motivation statements and are reviewed, accepted, or rejected with clear decisions.'
}, {
  title: 'Unified workspace',
  body: 'All tasks, code, datasets, and drafts are centralized, eliminating fragmented tools.'
}, {
  title: 'Balanced workload',
  body: 'AI-assisted task assignment ensures fair distribution based on skills and availability.'
}].map((item) => (
                <div key={item.title} className="p-4 rounded-none border border-border bg-background/80 shadow-sm">
                  <h3 className="font-lora text-lg font-semibold text-foreground mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="grid gap-3">
            {[{
              label: 'Labs on platform',
              value: researchLabs.length + 8
            }, {
              label: 'Groups collaborating',
              value: researchGroups.length + 15
            }, {
              label: 'Projects tracked',
              value: projects.length + 20
            }, {
              label: 'Research Applications',
              value: completedTasks + 160
            }].map((item, idx) => (
              <div key={item.label} className="p-5 rounded-none border border-border bg-background/85 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-mono-dm text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                  <p className="font-lora text-2xl font-semibold text-foreground">{item.value}</p>
                </div>
                <span className="text-xs text-muted-foreground/70">{idx % 2 ? 'Live sync' : 'Snapshot'}</span>
              </div>
            ))}
            <div className="p-4 rounded-none border border-border bg-background/80">
              <p className="font-mono-dm text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Cadence</p>
              <p className="font-lora text-base text-foreground leading-snug">Weekly standups, monthly checkpoints, and structured handoffs tuned for academic pace.</p>
            </div>
          </motion.div>
        </div>
      </section>
{/* ══════════════════════════════════════════════════════
    CTA — The Open Call
══════════════════════════════════════════════════════ */}
<section className="border-t border-border bg-muted/40">
  <div className="container py-16 flex flex-col lg:flex-row items-center justify-between gap-8">
    <div className="space-y-3 max-w-2xl">
      <p className="font-mono-dm text-[11px] tracking-[0.22em] uppercase text-muted-foreground">Open invitation</p>
      <h2 className="font-lora text-3xl lg:text-4xl font-semibold leading-tight text-foreground">Ready to contribute?</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Whether you are setting up a lab, joining a group, or mentoring a cohort, ENSIA Nexus keeps briefs, drafts, and dependencies aligned with the way your teams already work.
      </p>
      <div className="flex flex-wrap gap-2">
        {['Lab directories','Paper workflow','AI assistance','Dependency tracking'].map(item => (
          <span key={item} className="text-[11px] px-2.5 py-1 rounded-full border border-border text-muted-foreground bg-background/80">{item}</span>
        ))}
      </div>
    </div>

    <div className="flex gap-3 shrink-0">
      <Link to="/signup">
        <Button
          variant="default"
          size="lg"
          className="rounded-full px-6 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 border hero-border-solid"
        >
          Create account <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
      <Link to="/signin">
        <Button variant="outline" size="lg" className="rounded-full px-6 border hero-border-outline">
          Sign in
        </Button>
      </Link>
    </div>
  </div>
</section>

{/* ══════════════════════════════════════════════════════
    FOOTER — Institutional Registry
══════════════════════════════════════════════════════ */}
<footer className="py-12 border-t border-border/50 bg-muted/40 text-secondary-foreground">
  <div className="container">
    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="ENSIA Research Hub logo" className="h-7 w-13 rounded object-contain" />
          <span className="font-lora text-base font-medium tracking-tight">Research Hub</span>
        </div>
        <p className="font-mono-dm text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">
          Advanced AI // Cybersecurity // Data Science
        </p>
      </div>

      <div className="flex flex-col items-center md:items-end gap-2">
        <div className="flex gap-8 font-mono-dm text-[10px] uppercase tracking-widest">
          <Link to="/signin" className="hover:text-primary transition-colors">Auth</Link>
          <Link to="/signup" className="hover:text-primary transition-colors">Register</Link>
          <span className="text-muted-foreground/30 italic">Algiers, DZ</span>
        </div>
        <span className="font-mono-dm text-[9px] text-muted-foreground/40 italic">
          © 2026 Institutional Repository. All Rights Reserved.
        </span>
      </div>
    </div>
  </div>
</footer>
    </div>
  );
};

export default Landing;