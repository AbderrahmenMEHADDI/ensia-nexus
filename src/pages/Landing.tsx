import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  FlaskConical,
  Users,
  FileText,
  Search,
  Loader2,
  ExternalLink,
  ChevronRight,
  Send,
  CheckCircle2,
  Calendar,
  Eye,
  Brain,
  Cpu,
  Network,
  Atom,
  BarChart3,
  FolderOpen,
  BookOpen,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiRepository } from '@/repositories/apiRepository';
import type { LandingPageResponse, LandingLab, TeamSummary } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { getAppliedCollaborations, markCollaborationAsApplied } from '@/lib/cookies';
import { BASE_URL } from '@/lib/apiClient';

const Landing = () => {
  const [data, setData] = useState<LandingPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [showAllTeams, setShowAllTeams] = useState(false);
  const [applyCallId, setApplyCallId] = useState<number | null>(null);
  const [appliedCallIds, setAppliedCallIds] = useState<number[]>([]);
  
  // Hero day/night mode state
  const [heroMode, setHeroMode] = useState<'light' | 'dark'>('light');

  const toggleHeroMode = () => {
    setHeroMode(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    setAppliedCallIds(getAppliedCollaborations());
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiRepository.getLandingPageData();
        setData(res);
      } catch (err) {
        console.error('Failed to fetch landing page data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeLabsCount = data?.labs?.length ?? 0;
  const researchGroupsCount = data?.featured_teams?.length ?? 0;
  const projectsCount = data?.featured_teams?.reduce((sum, t) => sum + (t.project_count || 0), 0) ?? 0;
  const publicationsCount = data?.featured_teams?.reduce((sum, t) => sum + (t.publication_count || 0), 0) ?? 0;

  return (
    <PublicLayout
      navLinks={[
        { label: 'Home', href: '#', isHash: true, isActive: true },
        { label: 'Opportunities', href: '#opportunities', isHash: true },
        { label: 'Teams', href: '#discovery', isHash: true },
        { label: 'Labs', href: '#labs', isHash: true },
        { label: 'Projects', href: '/discovery/projects', isHash: false },
      ]}
    >

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden" style={{ minHeight: 'calc(100vh - 96px)' }}>
        {/* Day/Night Blur Dissolve Background Images */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
          {/* Night Image Layer */}
          <div
            className="absolute inset-0 bg-fade-layer bg-cover bg-center"
            style={{
              backgroundImage: "url('/hero_night.png')",
              opacity: heroMode === 'dark' ? 1 : 0,
              filter: heroMode === 'dark' ? 'blur(0px)' : 'blur(12px)',
            }}
          />
          {/* Day Image Layer */}
          <div
            className="absolute inset-0 bg-fade-layer bg-cover bg-center"
            style={{
              backgroundImage: "url('/hero_day.jpg')",
              opacity: heroMode === 'light' ? 1 : 0,
              filter: heroMode === 'light' ? 'blur(0px)' : 'blur(12px)',
            }}
          />
          {/* Medium opacity blue layer on the images */}
          <div className="absolute inset-0 bg-[#173C7E]/40 mix-blend-multiply animate-fade-in" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#173C7E] via-[#173C7E]/30 to-[#173C7E]/25" />
        </div>

        {/* Orange gradient top edge */}
        <div className="absolute top-0 left-0 right-0 h-[3px] z-10" style={{ background: 'linear-gradient(90deg, #F47A1E 0%, #FF9A44 40%, transparent 80%)' }} />

        {/* Dot grid pattern */}
        <div className="absolute inset-0 z-10" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        {/* Soft glow upper-right */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full z-10" style={{
          background: 'radial-gradient(circle, rgba(244,122,30,0.08) 0%, rgba(244,122,30,0.02) 40%, transparent 70%)',
        }} />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full z-10" style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 60%)',
        }} />

        {/* Neumorphic Mode Toggle Switcher */}
        <div className="absolute top-6 right-6 md:top-8 md:right-8 z-30">
          <button
            onClick={toggleHeroMode}
            className={cn(
              "relative w-[100px] h-[48px] rounded-full p-1.5 transition-all duration-500 ease-in-out cursor-pointer select-none border border-transparent shadow-[inset_0_2px_6px_rgba(0,0,0,0.15)]",
              heroMode === 'light'
                ? "bg-[#e2e8f0] border-gray-200/20"
                : "bg-[#1e293b] border-slate-700/20"
            )}
            aria-label="Toggle hero background theme"
          >
            {/* Faint Background Icons */}
            <div className="absolute inset-0 flex items-center justify-between px-3.5 pointer-events-none">
              {/* Sun Icon on the left (faint in Dark mode, hidden under knob in Light mode) */}
              <Sun
                className={cn(
                  "h-4.5 w-4.5 transition-all duration-500",
                  heroMode === 'light'
                    ? "opacity-0 scale-50 -translate-x-2"
                    : "opacity-25 text-slate-500 scale-100 translate-x-0"
                )}
              />
              {/* Moon Icon on the right (faint in Light mode, hidden under knob in Dark mode) */}
              <Moon
                className={cn(
                  "h-4.5 w-4.5 transition-all duration-500",
                  heroMode === 'dark'
                    ? "opacity-0 scale-50 translate-x-2"
                    : "opacity-35 text-[#173C7E] scale-100 translate-x-0"
                )}
              />
            </div>

            {/* Slider Knob */}
            <div
              className={cn(
                "absolute top-[5px] left-[5px] h-[36px] w-[36px] rounded-full flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.15)] transition-transform duration-500",
                heroMode === 'light'
                  ? "translate-x-0 bg-gradient-to-br from-[#FF9F00] to-[#F47A1E] shadow-[0_3px_8px_rgba(244,122,30,0.35)]"
                  : "translate-x-[52px] bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] shadow-[0_3px_8px_rgba(59,130,246,0.35)]"
              )}
              style={{
                transitionTimingFunction: 'var(--return-easing)'
              }}
            >
              {heroMode === 'light' ? (
                <Sun className="h-4.5 w-4.5 text-white fill-white animate-fade-in" />
              ) : (
                <Moon className="h-4.5 w-4.5 text-white fill-white animate-fade-in" />
              )}
            </div>
          </button>
        </div>

        {/* Hero Content */}
        <div className="container relative z-10 px-4 sm:px-6 flex items-center" style={{ minHeight: 'calc(100vh - 96px)' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl py-20 md:py-0"
          >
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2.5 mb-8 px-4 py-2 rounded-full border" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#F47A1E' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#F47A1E' }} />
              </span>
              <span className="text-xs font-medium tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Advanced Research Collaboration
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold leading-[1.08] tracking-tight text-white mb-6">
              Applied Intelligence{' '}
              <span className="block mt-1" style={{ color: '#F47A1E' }}>for Societal Impact</span>
            </h1>

            {/* Orange separator bar */}
            <div className="w-16 h-1 rounded-full mb-6" style={{ background: '#F47A1E' }} />

            {/* Subtitle */}
            <p className="text-base sm:text-lg leading-relaxed mb-10 max-w-xl" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Putting AI to work for people and communities.
            </p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start gap-3"
            >
              <a href="#opportunities">
                <Button size="lg" className="rounded-lg px-7 py-5 text-base h-auto font-semibold gap-2 hover:-translate-y-0.5 transition-all duration-200" style={{ background: '#F47A1E', color: '#fff', boxShadow: '0 4px 20px rgba(244,122,30,0.25)' }}>
                  Collaborate With Us <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href="#discovery">
                <Button size="lg" className="rounded-lg px-7 py-5 text-base h-auto font-semibold transition-all" style={{ background: 'transparent', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.2)' }} onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'transparent'; }}>
                  Browse Teams
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 border-y border-border bg-muted/30">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem label="Active Labs" value={loading ? "..." : `${activeLabsCount}`} />
            <StatItem label="Research Groups" value={loading ? "..." : `${researchGroupsCount}`} />
            <StatItem label="Projects" value={loading ? "..." : `${projectsCount}`} />
            <StatItem label="Publications" value={loading ? "..." : `${publicationsCount}`} />
          </div>
        </div>
      </section>

      {/* Research Opportunities Section */}
      <section id="opportunities" className="py-24 md:py-32 relative" style={{ background: '#EFF2F7' }}>
        <div className="container px-4">
          {/* Section header */}
          <SectionHeader
            title="Research Opportunities"
            subtitle="Discover open calls for collaboration and apply to join cutting-edge research teams."
          />

          {/* Card grid */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7 md:gap-8">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7 md:gap-8">
              {(data?.open_collaboration_calls ?? data?.open_projects)?.slice(0, 6).map((item: any, i: number) => {
                const isCall = !!item.project;
                const project = isCall ? item.project : item;
                const callId = isCall ? item.id : null;
                const callTitle = isCall ? item.title : null;
                const deadline = isCall ? item.deadline : null;
                return (
                  <ProjectPreviewCard
                    key={isCall ? `call-${item.id}` : `proj-${item.id}`}
                    project={project}
                    callId={callId}
                    callTitle={callTitle}
                    deadline={deadline}
                    index={i}
                    featured={i % 3 === 0}
                    applied={callId ? appliedCallIds.includes(callId) : false}
                    onApply={(cId: number) => {
                      setApplyCallId(cId);
                      setApplyDialogOpen(true);
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Browse all CTA */}
          <div className="text-center mt-12">
            <Link to="/discovery/projects">
              <Button variant="outline" className="rounded-full gap-2 group px-6 border-[#173C7E]/20 text-[#173C7E] hover:bg-[#173C7E] hover:text-white transition-colors">
                Browse All Opportunities <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Apply Dialog */}
      <ApplyDialog
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        callId={applyCallId}
        onApplied={(cId) => {
          markCollaborationAsApplied(cId);
          setAppliedCallIds(getAppliedCollaborations());
        }}
      />



      {/* Featured Research Groups */}
      <section id="discovery" className="py-24 md:py-32" style={{ background: '#EFF2F7' }}>
        <div className="container px-4">
          <SectionHeader
            title="Featured Research Groups"
            subtitle="Join a team pushing the boundaries of AI research."
          />

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : (() => {
            const filteredTeams = data?.featured_teams ?? [];
            const visibleTeams = showAllTeams ? filteredTeams : filteredTeams.slice(0, 6);
            return (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
                  {visibleTeams.map((team, i) => (
                    <TeamCard key={team.id} team={team} index={i} />
                  ))}
                </div>
                {filteredTeams.length > 6 && !showAllTeams && (
                  <div className="text-center mt-10">
                    <Button
                      variant="outline"
                      className="rounded-full px-8 gap-2 border-[#173C7E]/20 text-[#173C7E] hover:bg-[#173C7E] hover:text-white transition-colors"
                      onClick={() => setShowAllTeams(true)}
                    >
                      Show More Groups <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </section>

      {/* Research Labs */}
      <section id="labs" className="py-24 md:py-32">
        <div className="container px-4">
          <SectionHeader
            title="Research Laboratories"
            subtitle="Explore specialized labs driving innovation at ENSIA."
          />

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
              {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} tall />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
              {data?.labs.map((lab, i) => (
                <LabCard key={lab.id} lab={lab} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="container px-4">
          <div className="relative rounded-[2.5rem] overflow-hidden p-12 md:p-20 group" style={{ background: '#173C7E' }}>
            {/* Subtle orange glow */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 rounded-full blur-[120px] group-hover:scale-125 transition-transform duration-700" style={{ background: 'rgba(244,122,30,0.15)' }} />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-72 h-72 rounded-full blur-[100px]" style={{ background: 'rgba(244,122,30,0.08)' }} />
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 leading-tight text-white">
                Ready to contribute to the future of AI?
              </h2>
              <div className="w-14 h-1 rounded-full mx-auto mb-6" style={{ background: '#F47A1E' }} />
              <p className="text-lg mb-12" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Join our collaborative ecosystem today and start building high-impact research projects with the brightest minds.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="rounded-full h-14 px-10 text-lg font-semibold text-white border-none hover:brightness-110 transition-all" style={{ background: '#F47A1E' }}>
                    Create Account <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/signin">
                  <Button variant="ghost" size="lg" className="rounded-full h-14 px-10 text-lg font-semibold text-white border border-white/20 hover:bg-white/10 hover:text-white transition-all">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
};

/* --- Sub-components --- */

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-display font-bold text-foreground mb-1">{value}</div>
    <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{label}</div>
  </div>
);

/* Skeleton loader for cards */
const CardSkeleton = ({ tall }: { tall?: boolean }) => (
  <div className={cn('rounded-2xl bg-white p-6 animate-pulse', tall ? 'h-72' : 'h-60')}>
    <div className="h-10 w-10 rounded-lg bg-slate-200 mb-4" />
    <div className="h-5 w-3/4 rounded bg-slate-200 mb-3" />
    <div className="h-3 w-1/2 rounded bg-slate-100 mb-5" />
    <div className="h-3 w-full rounded bg-slate-100 mb-2" />
    <div className="h-3 w-5/6 rounded bg-slate-100 mb-6" />
    <div className="border-t border-slate-100 pt-4 flex justify-between">
      <div className="h-6 w-20 rounded-full bg-slate-100" />
      <div className="h-6 w-16 rounded-full bg-slate-200" />
    </div>
  </div>
);

const LabCard = ({ lab, index }: { lab: LandingLab; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ delay: index * 0.07, duration: 0.45, ease: 'easeOut' }}
    className="group/card relative rounded-2xl bg-white flex flex-col cursor-pointer overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300"
    style={{ borderTop: '3px solid #173C7E' }}
  >
    {/* Card front */}
    <div className="p-7 flex flex-col flex-1">
      <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(23,60,126,0.08)' }}>
        <FlaskConical className="h-6 w-6" style={{ color: '#173C7E' }} />
      </div>
      <h3 className="text-xl font-display font-bold mb-2 leading-snug" style={{ color: '#0F172A' }}>{lab.name}</h3>
      <p className="text-[13px] leading-relaxed line-clamp-2 mb-5" style={{ color: '#64748B' }}>
        {lab.description || "Leading innovations and fundamental research in the heart of ENSIA's scientific ecosystem."}
      </p>

      <div className="border-t mt-auto" style={{ borderColor: '#F1F5F9' }} />
      <div className="pt-4">
        <div className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: '#94A3B8' }}>Active Groups</div>
        <div className="flex flex-wrap gap-1.5">
          {lab.teams.slice(0, 3).map(team => (
            <Link key={team.id} to={`/group/${team.id}`}>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer" style={{ background: 'rgba(23,60,126,0.06)', color: '#173C7E' }}>
                {team.name}
              </span>
            </Link>
          ))}
          {lab.teams.length > 3 && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ background: 'rgba(244,122,30,0.08)', color: '#D16A1A' }}>
              +{lab.teams.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>

    {/* Full-cover sliding navy panel */}
    <div
      className="absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center gap-4 -translate-x-full group-hover/card:translate-x-0 px-6"
      style={{
        background: '#173C7E',
        transition: 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <FlaskConical className="h-8 w-8 text-white/50 mb-1" />
      <h4 className="text-xl font-display font-bold text-white text-center leading-snug">{lab.name}</h4>
      <p className="text-sm text-center leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {lab.description || 'Leading research and innovation at ENSIA.'}
      </p>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold mt-1" style={{ color: '#F47A1E' }}>
        {lab.teams.length} Research Group{lab.teams.length !== 1 ? 's' : ''}
      </span>
    </div>
  </motion.div>
);

/* ── Card accents — navy/orange theme only ── */
const TEAM_ICONS = [Eye, Brain, Network, Cpu, Atom, BarChart3];

const getTeamDescription = (team: TeamSummary) => {
  if (team.description) return team.description;
  const name = team.name.toLowerCase();
  if (name.includes('vision') || name.includes('image')) return 'Advancing visual perception through deep learning and image understanding.';
  if (name.includes('nlp') || name.includes('language')) return 'Building models that understand and generate human language.';
  if (name.includes('quantum')) return 'Exploring quantum computing algorithms for next-generation problem solving.';
  if (name.includes('robot') || name.includes('drone') || name.includes('autonom')) return 'Designing intelligent autonomous systems and control policies.';
  if (name.includes('data') || name.includes('analytics')) return 'Extracting insights from complex datasets with statistical learning.';
  if (name.includes('security') || name.includes('cyber')) return 'Protecting digital systems through AI-driven security research.';
  return 'Pursuing cutting-edge research at the frontier of artificial intelligence.';
};

const getInitials = (index: number, teamName: string) => {
  const letters = teamName.replace(/[^A-Za-z]/g, '').toUpperCase();
  const first = letters[index % letters.length] || 'R';
  const second = letters[(index + 1) % letters.length] || 'G';
  return first + second;
};

const TeamCard = ({ team, index }: { team: TeamSummary; index: number }) => {
  const IconComp = TEAM_ICONS[index % TEAM_ICONS.length];
  const desc = getTeamDescription(team);
  const memberCount = Math.max(team.project_count + 2, 4);
  // Alternate top border between navy and orange
  const topColor = index % 2 === 0 ? '#173C7E' : '#F47A1E';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: 'easeOut' }}
      className="group/card relative rounded-2xl bg-white flex flex-col cursor-pointer overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300"
      style={{ borderTop: `3px solid ${topColor}` }}
    >
      {/* Card front */}
      <div className="p-6 flex flex-col flex-1">
        {/* Icon tile */}
        <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(23,60,126,0.08)' }}>
          <IconComp className="h-5 w-5" style={{ color: '#173C7E' }} />
        </div>

        {/* Group name + lab */}
        <h4 className="font-display font-bold text-lg leading-snug mb-0.5" style={{ color: '#0F172A' }}>{team.name}</h4>
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold mb-3" style={{ color: '#94A3B8' }}>{team.lab_name}</p>

        {/* Description */}
        <p className="text-[13px] leading-relaxed line-clamp-2 mb-4" style={{ color: '#64748B' }}>{desc}</p>

        {/* Member avatar stack */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex -space-x-2">
            {Array.from({ length: Math.min(4, memberCount) }).map((_, i) => (
              <div
                key={i}
                className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-white"
                style={{ background: i % 2 === 0 ? '#173C7E' : '#F47A1E' }}
              >
                {getInitials(i, team.name)}
              </div>
            ))}
          </div>
          <span className="text-[11px] font-medium" style={{ color: '#94A3B8' }}>Active team</span>
        </div>

        {/* Divider + stat pills */}
        <div className="border-t mt-auto" style={{ borderColor: '#F1F5F9' }} />
        <div className="flex items-center gap-2 pt-3 flex-wrap">
          {team.project_count > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ background: 'rgba(23,60,126,0.06)', color: '#173C7E' }}>
              <FolderOpen className="h-3 w-3" /> {team.project_count} Projects
            </span>
          )}
          {team.publication_count > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ background: 'rgba(244,122,30,0.08)', color: '#D16A1A' }}>
              <BookOpen className="h-3 w-3" /> {team.publication_count} Pubs
            </span>
          )}
        </div>
      </div>

      {/* Full-cover sliding navy panel */}
      <div
        className="absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center gap-4 -translate-x-full group-hover/card:translate-x-0 px-6"
        style={{
          background: team.picture_url 
            ? `linear-gradient(rgba(23,60,126, 0.2), rgba(23,60,126, 0.3))` 
            : '#173C7E',
          backgroundImage: team.picture_url
            ? `linear-gradient(rgba(23,60,126, 0.2), rgba(23,60,126, 0.3)), url(${team.picture_url.startsWith('/') ? `${BASE_URL}${team.picture_url}` : team.picture_url})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <h4 className="text-xl font-display font-bold text-white text-center leading-snug">{team.name}</h4>
        <p className="text-sm text-center leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{desc}</p>
        <Link
          to={`/group/${team.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold mt-2 group/link"
          style={{ color: '#F47A1E' }}
        >
          View Group <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-1" />
        </Link>
      </div>
    </motion.div>
  );
};

const ProjectPreviewCard = ({ project, callId, callTitle, deadline, index, featured, applied, onApply }: {
  project: any; callId?: number | null; callTitle?: string | null; deadline?: string | null; index: number; featured?: boolean; applied?: boolean; onApply?: (callId: number) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ delay: index * 0.07, duration: 0.45, ease: 'easeOut' }}
    className={cn(
      'relative p-6 md:p-7 rounded-2xl bg-white flex flex-col transition-all duration-300 cursor-default',
      'shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.1)] hover:-translate-y-1',
      featured && 'border-l-[3.5px] border-l-[#F47A1E]'
    )}
    style={{ borderTop: 'none', borderRight: 'none', borderBottom: 'none', borderLeft: featured ? undefined : 'none' }}
  >
    {/* Top row: status dot + date */}
    <div className="flex items-center justify-between gap-2 mb-5 text-xs">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-emerald-600 font-medium">Open</span>
        {deadline && (
          <>
            <span className="text-slate-300">/</span>
            <span className="text-slate-400">{new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </>
        )}
      </div>
      {applied && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3" /> Applied
        </span>
      )}
    </div>

    {/* Category pill (call title as tag, shown above the project title) */}
    {callTitle && callTitle !== project.title && (
      <span className="inline-flex self-start px-2.5 py-0.5 rounded-full text-[11px] font-medium mb-2.5" style={{ background: 'rgba(23,60,126,0.07)', color: '#173C7E' }}>
        {callTitle}
      </span>
    )}

    {/* Title */}
    <h4 className="font-display font-bold text-lg md:text-xl leading-snug mb-2 line-clamp-2" style={{ color: '#0F172A' }}>
      {project.title}
    </h4>

    {/* Description */}
    <p className="text-[13px] leading-relaxed line-clamp-2 mb-auto pb-5" style={{ color: '#64748B' }}>
      {project.description || 'Innovative research focusing on advancing artificial intelligence paradigms through experimental and theoretical approaches.'}
    </p>

    {/* Divider */}
    <div className="border-t" style={{ borderColor: '#F1F5F9' }} />

    {/* Bottom row */}
    <div className="flex items-center justify-between pt-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#94A3B8' }}>Group</span>
        <span className="text-sm font-semibold" style={{ color: '#334155' }}>{project.team_name}</span>
      </div>
      {callId && onApply ? (
        applied ? (
          <button
            disabled
            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Applied
          </button>
        ) : (
          <button
            onClick={() => onApply(callId)}
            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold text-white transition-all duration-200 hover:brightness-110 group/btn"
            style={{ background: '#F47A1E' }}
          >
            <Send className="h-3 w-3 transition-transform duration-200 group-hover/btn:translate-x-0.5" /> Join
          </button>
        )
      ) : (
        <Link to={`/discovery/projects/${project.id}`}>
          <button className="inline-flex items-center gap-1 h-8 px-3 rounded-full text-xs font-medium transition-colors duration-200 group/btn" style={{ color: '#173C7E' }}>
            View Details <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
          </button>
        </Link>
      )}
    </div>
  </motion.div>
);

/* ── Apply Dialog ── */
const ApplyDialog = ({ open, onOpenChange, callId, onApplied }: {
  open: boolean; onOpenChange: (v: boolean) => void; callId: number | null; onApplied?: (callId: number) => void;
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', institution: '', cv_url: '', motivation: '' });

  const handleClose = (v: boolean) => {
    if (!v) {
      setSubmitted(false);
      setForm({ full_name: '', email: '', institution: '', cv_url: '', motivation: '' });
    }
    onOpenChange(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callId) return;
    if (!form.full_name.trim() || !form.email.trim() || !form.cv_url.trim()) {
      toast({ title: 'Missing fields', description: 'Please fill in your name, email, and CV link.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await apiRepository.createCollaborationSubmission({
        call_id: callId,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        institution: form.institution.trim() || undefined,
        motivation: form.motivation.trim() || undefined,
        cv_url: form.cv_url.trim(),
        status: 'PENDING',
      });
      if (onApplied) {
        onApplied(callId);
      }
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: 'Submission failed', description: err?.message || 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {submitted ? (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <DialogTitle className="text-2xl font-display font-bold">Application Submitted!</DialogTitle>
            <p className="text-muted-foreground max-w-xs">
              Your application has been received. The project team will review it and get back to you via email.
            </p>
            <Button className="mt-4 rounded-full px-8" onClick={() => handleClose(false)}>Close</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-display font-bold">Apply for Project</DialogTitle>
              <DialogDescription>Fill in your details below. No account required.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="apply-name">Full Name <span className="text-destructive">*</span></Label>
                <Input id="apply-name" placeholder="Your full name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-email">Email <span className="text-destructive">*</span></Label>
                <Input id="apply-email" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-institution">Institution</Label>
                <Input id="apply-institution" placeholder="University or organization" value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-cv">CV / Resume Link <span className="text-destructive">*</span></Label>
                <Input id="apply-cv" type="url" placeholder="https://drive.google.com/..." value={form.cv_url} onChange={e => setForm(f => ({ ...f, cv_url: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-motivation">Motivation</Label>
                <Textarea id="apply-motivation" placeholder="Briefly describe your interest and relevant experience..." rows={3} value={form.motivation} onChange={e => setForm(f => ({ ...f, motivation: e.target.value }))} />
              </div>
              <Button type="submit" className="w-full rounded-lg h-11 text-sm font-semibold gap-2" style={{ background: '#F47A1E', color: '#fff' }} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Landing;