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
import type { LandingPageResponse, LandingLab, TeamSummary, GroupMember, PublicationPreview, Teacher, ProjectPreview } from '@/types';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { getAppliedCollaborations, markCollaborationAsApplied } from '@/lib/cookies';
import { BASE_URL } from '@/lib/apiClient';
import { AisiLogo } from '@/components/shared/AisiLogo';

const Landing = () => {
  const [data, setData] = useState<LandingPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyCallId, setApplyCallId] = useState<number | null>(null);
  const [appliedCallIds, setAppliedCallIds] = useState<number[]>([]);

  // States for AISI focused team
  const [aisiTeam, setAisiTeam] = useState<TeamSummary | null>(null);
  const [aisiProjects, setAisiProjects] = useState<ProjectPreview[]>([]);
  const [aisiMembers, setAisiMembers] = useState<GroupMember[]>([]);
  const [aisiPublications, setAisiPublications] = useState<PublicationPreview[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

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
        const [res, allTeachers] = await Promise.all([
          apiRepository.getLandingPageData(),
          apiRepository.getTeachers({ limit: 1000 })
        ]);
        setData(res);
        setTeachers(allTeachers);

        // Identify the AISI team. Since it's one-team focused, we fetch the first featured team.
        const mainTeam = res.featured_teams?.[0];
        if (mainTeam) {
          const [teamProjects, groupMembers] = await Promise.all([
            apiRepository.getTeamProjects(mainTeam.id),
            apiRepository.getGroupMembersFiltered(mainTeam.id)
          ]);
          setAisiTeam(mainTeam);
          setAisiProjects(teamProjects.projects);
          setAisiMembers(groupMembers);

          // Get publications for this group's projects.
          if (teamProjects.projects.length > 0) {
            const pubsPromises = teamProjects.projects.slice(0, 3).map(p =>
              apiRepository.getPublications({ project_id: p.id, limit: 5 })
            );
            const pubsResults = await Promise.all(pubsPromises);
            setAisiPublications(pubsResults.flat() as any);
          }
        }
      } catch (err) {
        console.error('Failed to fetch landing page data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const projectsCount = data?.featured_teams?.reduce((sum, t) => sum + (t.project_count || 0), 0) ?? 0;
  const publicationsCount = data?.featured_teams?.reduce((sum, t) => sum + (t.publication_count || 0), 0) ?? 0;
  return (
    <PublicLayout
      navLinks={[
        { label: 'Home', href: '#', isHash: true, isActive: true },
        { label: 'Opportunities', href: '#opportunities', isHash: true },
        { label: 'Activities', href: '#activities', isHash: true },
        { label: 'Team', href: '#team', isHash: true },
        { label: 'Projects', href: '/discovery/projects', isHash: false },
      ]}
    >

      {/* ── Hero Section ── */}
      <header className="py-[clamp(64px,9vw,120px)] overflow-hidden bg-background">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-12 grid grid-cols-1 min-[801px]:grid-cols-[3fr_2fr] items-center gap-14 min-[801px]:gap-20">
          <div className="hero-text">
            <h1
              className="font-display font-bold leading-[1.12] tracking-tight text-[#173C7E] max-w-[16ch] mb-6 animate-fade-up"
              style={{ fontSize: 'clamp(38px, 4.4vw, 58px)' }}
            >
              Applied intelligence, built for public <span className="text-[#F47A1E]">impact</span>.
            </h1>
            <p className="font-sans font-normal text-[18px] leading-relaxed text-[#0E1B2E] max-w-[52ch] mb-10 animate-fade-up [animation-delay:0.06s]">
              We design and deploy AI systems that move from research to production — for public institutions, research partners, and the communities they serve.
            </p>
            <div className="flex items-center flex-wrap gap-6 animate-fade-up [animation-delay:0.12s]">
              <a
                href="#opportunities"
                className="inline-flex items-center gap-2 bg-[#F47A1E] text-white font-sans font-semibold text-base py-4 px-8 rounded-lg hover:bg-[#dd6c14] transition-colors duration-150 group"
              >
                Deploy Solution
                <svg
                  className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="#fff"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a
                href="#docs"
                className="inline-block text-[#2E9FDA] font-sans font-medium text-base py-4 border-b border-[#2E9FDA]/35 hover:border-[#2E9FDA] transition-colors duration-150"
              >
                Read the Documentation
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center animate-fade-up [animation-delay:0.1s]">
            <AisiLogo className="w-[clamp(132px,12vw,176px)] h-[clamp(132px,12vw,176px)]" />
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="py-10 border-y border-border bg-muted/30">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-8">
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



      {/* AISI Research Projects & Activities Section */}
      <section id="activities" className="py-24 md:py-32 bg-white border-t border-slate-100">
        <div className="container max-w-5xl mx-auto px-6">
          <SectionHeader
            title="Research Projects & Publications"
            subtitle="Explore our active projects and latest scientific contributions."
          />

          {loading ? (
            <div className="grid md:grid-cols-2 gap-10 mt-12">
              <CardSkeleton tall />
              <CardSkeleton tall />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-10 mt-12">
              {/* Left Column: Projects */}
              <div className="space-y-6">
                <h3 className="text-2xl font-display font-bold text-[#0F172A] flex items-center gap-2 border-b border-slate-200 pb-3">
                  <FolderOpen className="h-6 w-6 text-[#173C7E]" /> Active Projects
                </h3>
                <div className="space-y-4">
                  {aisiProjects.map((proj, index) => {
                    const isFeatured = index === 0;
                    return (
                      <Link
                        key={proj.id}
                        to={`/discovery/projects/${proj.id}`}
                        className={`block relative p-6 bg-white rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] border border-slate-100 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group ${
                          isFeatured ? 'border-l-4 border-l-[#F47A1E]' : ''
                        }`}
                      >
                        {isFeatured && (
                          <div className="absolute -top-3 left-4 bg-[#F47A1E] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                            Featured
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3 mb-1.5">
                              <h4 className="font-display font-bold text-lg text-[#0F172A] group-hover:text-[#173C7E] transition-colors truncate">
                                {proj.title}
                              </h4>
                              {proj.accepting_collaborators ? (
                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] uppercase font-bold tracking-wider shrink-0 py-0 h-5">
                                  Hiring
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-slate-200 text-[10px] uppercase font-bold tracking-wider shrink-0 py-0 h-5">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-2">
                              {proj.description || "A collaborative research initiative focusing on advanced methodologies."}
                            </p>
                          </div>
                          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-50 flex items-center justify-center text-[#173C7E] group-hover:bg-[#F47A1E] group-hover:text-white transition-all">
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {aisiProjects.length === 0 && (
                    <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-500 italic">No public projects listed yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Publications */}
              <div className="space-y-6">
                <h3 className="text-2xl font-display font-bold text-[#0F172A] flex items-center gap-2 border-b border-slate-200 pb-3">
                  <BookOpen className="h-6 w-6 text-[#173C7E]" /> Publications & Activities
                </h3>
                <div className="space-y-4">
                  {aisiPublications.map((pub) => {
                    const pubYear = pub.publication_date ? new Date(pub.publication_date).getFullYear() : null;
                    return (
                      <div
                        key={pub.id}
                        className="p-5 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 line-clamp-2">{pub.title}</h4>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-1">
                            {pubYear && <span className="font-medium">{pubYear}</span>}
                            {pub.venue && <span className="font-semibold text-slate-600">{pub.venue}</span>}
                          </div>
                        </div>
                        {pub.paper_url && (
                          <a
                            href={pub.paper_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#173C7E] hover:text-[#F47A1E] transition-colors self-start"
                          >
                            Read Paper <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                  {aisiPublications.length === 0 && (
                    <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-500 italic">No publications recorded yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Dedicated Meet the Team Section */}
      <section id="team" className="py-24 md:py-32 bg-slate-50 border-t border-b border-slate-100">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-display font-bold text-[#2E9FDA] tracking-tight">
              Meet the Team
            </h2>
            <div className="w-12 h-1 bg-[#2E9FDA] mx-auto rounded-full" />
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 mt-12">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-4 text-center">
                  <div className="h-28 w-28 md:h-36 md:w-36 rounded-full bg-slate-200 animate-pulse mx-auto" />
                  <div className="h-4 w-24 bg-slate-200 animate-pulse mx-auto rounded" />
                  <div className="h-3 w-16 bg-slate-100 animate-pulse mx-auto rounded" />
                </div>
              ))}
            </div>
          ) : aisiTeam ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-8 gap-y-12 mt-12">
              {aisiMembers.map((member) => {
                const isLeader = member.user_id === aisiTeam.leader_user_id;
                
                const colors = [
                  'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 
                  'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700',
                  'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700'
                ];
                const colorClass = colors[member.user_id % colors.length];

                return (
                  <div key={member.user_id} className="text-center group flex flex-col items-center">
                    <Link to={`/member/${member.user_id}`} className="block focus:outline-none">
                      <div className="relative">
                        <ProfileAvatar
                          userId={member.user_id}
                          imageUrl={member.user_profile_picture_url}
                          name={member.user_name || '?'}
                          className={`h-28 w-28 md:h-36 md:w-36 rounded-full mx-auto shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105 ${
                            !member.user_profile_picture_url ? colorClass : ''
                          }`}
                          textClassName="text-2xl font-bold"
                        />
                      </div>
                      <span className="font-display font-bold text-[17px] leading-snug text-slate-800 mt-4 block group-hover:text-[#173C7E] transition-colors truncate max-w-[180px]">
                        {member.user_name || 'Unknown Member'}
                      </span>
                    </Link>
                    <span className="text-[13px] text-slate-500 mt-0.5 block capitalize truncate max-w-[180px]">
                      {isLeader ? 'Team Lead' : (member.user_role?.toLowerCase() || 'Researcher')}
                    </span>
                    {member.user_email ? (
                      <a
                        href={`mailto:${member.user_email}`}
                        className="text-sm font-semibold text-[#2E9FDA] hover:text-[#173C7E] transition-colors mt-2 inline-block"
                      >
                        Email
                      </a>
                    ) : (
                      <span className="text-sm font-semibold text-slate-300 mt-2 inline-block select-none">
                        No Email
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 mt-12">
              <p className="text-sm text-slate-500 italic">No team summary found.</p>
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
        {project.accepting_collaborators ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-600 font-medium">Open</span>
          </>
        ) : (
          <span className="text-slate-500 font-medium">Internal</span>
        )}
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
      {project.accepting_collaborators && callId && onApply ? (
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