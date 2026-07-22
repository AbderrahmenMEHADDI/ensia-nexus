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
  Mail,
  Target,
  Globe2,
  Sparkles,
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
import { ProjectCard } from '@/components/shared/ProjectCard';
import { PublicationCard } from '@/components/shared/PublicationCard';

const getMemberRows = <T,>(items: T[], targetMax = 5): T[][] => {
  const total = items.length;
  if (total === 0) return [];
  if (total <= targetMax) return [items];

  const rows: T[][] = [];
  let index = 0;

  while (index < total) {
    let remaining = total - index;

    let countToTake = targetMax;
    if (remaining === targetMax + 1) {
      countToTake = Math.ceil(remaining / 2);
    } else if (remaining < targetMax) {
      countToTake = remaining;
    }

    rows.push(items.slice(index, index + countToTake));
    index += countToTake;
  }

  return rows;
};

// Team Member Card Component matching reference HTML
const TeamMemberCard = ({ member, isLeader, teacherInfo }: { member: GroupMember; isLeader: boolean; teacherInfo?: Teacher }) => {
  let roleText = 'TEACHER';
  if (isLeader) {
    roleText = 'TEAM LEAD';
  } else if (member.user_role === 'TEACHER' && teacherInfo?.grade) {
    roleText = teacherInfo.grade.replace('_', ' ').toUpperCase();
  } else if (member.user_role) {
    roleText = member.user_role.toUpperCase();
  }

  const defaultBios = [
    'Leading cutting-edge research in computational sciences and guiding our team toward breakthrough discoveries.',
    'Passionate educator committed to developing the next generation of researchers with innovative teaching methodologies.',
    'Expert in advanced technologies with a focus on practical applications and collaborative research initiatives.',
    'Dedicated to fostering innovation in academic environments with emphasis on interdisciplinary collaboration.',
    'Specializing in research excellence and mentoring emerging scholars with a commitment to quality.',
    'Contributing valuable insights in research development and advancement with interdisciplinary expertise.',
  ];
  const bioText = teacherInfo?.bio || defaultBios[member.user_id % defaultBios.length];

  const pastelColors = [
    'bg-[#d8bfd8]',
    'bg-[#f0d9e8]',
    'bg-[#b3e5db]',
    'bg-[#add8f5]',
    'bg-[#b3e0d8]',
    'bg-[#d1eee9]',
    'bg-[#f5e6d3]',
    'bg-[#e8d5f2]',
    'bg-[#f5d9e8]'
  ];
  const pastelBg = pastelColors[member.user_id % pastelColors.length];

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-none p-[20px] text-left flex flex-col h-full hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow duration-300 w-full">
      {/* Profile Circle */}
      <div className="mb-4 shrink-0">
        <ProfileAvatar
          userId={member.user_id}
          imageUrl={member.user_profile_picture_url}
          name={member.user_name || '?'}
          className={`w-[100px] h-[100px] rounded-full shadow-none text-2xl font-bold text-slate-700 ${!member.user_profile_picture_url ? pastelBg : ''}`}
          textClassName="text-2xl font-bold"
        />
      </div>

      {/* Member Name */}
      <div className="text-[16px] font-bold text-[#003d7a] mb-1 leading-snug break-words" title={member.user_name}>
        {member.user_name || 'Unknown Member'}
      </div>

      {/* Member Role */}
      <div className="text-[12px] font-semibold text-[#ff6b35] uppercase tracking-[0.5px] mb-3">
        {roleText}
      </div>

      {/* Member Bio Snippet */}
      <div className="text-[14px] text-[#6b7280] leading-[1.5] mb-4 flex-1 line-clamp-3">
        {bioText}
      </div>

      {/* Card Footer */}
      <div className="flex flex-col gap-3 items-start pt-1">
        <Link
          to={`/member/${member.user_id}`}
          className="text-[14px] font-medium text-[#2E9FDA] hover:text-[#173C7E] hover:underline cursor-pointer"
        >
          Read more &rarr;
        </Link>
        {member.user_email ? (
          <a
            href={`mailto:${member.user_email}`}
            className="bg-[#ff6b35] hover:bg-[#e55a24] text-white text-[13px] font-semibold px-4 py-2 rounded-none transition-colors border-none inline-block"
          >
            Contact
          </a>
        ) : (
          <span className="bg-[#ff6b35]/60 text-white text-[13px] font-semibold px-4 py-2 rounded-none cursor-not-allowed inline-block">
            Contact
          </span>
        )}
      </div>
    </div>
  );
};

const Landing = () => {
  const { toast } = useToast();
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

  // Contact Us states
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sendingContact, setSendingContact] = useState(false);

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
        const [res, allTeachers, allGroups] = await Promise.all([
          apiRepository.getLandingPageData(),
          apiRepository.getTeachers({ limit: 1000 }),
          apiRepository.getGroups()
        ]);
        setData(res);
        setTeachers(allTeachers);

        // Take the first group in the system dynamically (as there will only be one in the db)
        const mainGroup = allGroups?.[0];
        if (mainGroup) {
          const [teamProjects, groupMembers] = await Promise.all([
            apiRepository.getTeamProjects(mainGroup.id),
            apiRepository.getGroupMembersFiltered(mainGroup.id)
          ]);

          const labName = res.labs?.find(l => l.id === mainGroup.lab_id)?.name || "Artificial Intelligence Research Lab";

          const teamSummary: TeamSummary = {
            id: mainGroup.id,
            lab_id: mainGroup.lab_id,
            lab_name: labName,
            name: mainGroup.name,
            description: mainGroup.description,
            leader_user_id: mainGroup.leader_user_id,
            picture_url: mainGroup.picture_url,
            project_count: teamProjects.projects.length,
            open_project_count: teamProjects.projects.filter(p => p.accepting_collaborators).length,
            publication_count: teamProjects.projects.reduce((sum, p) => sum + (p.publication_count || 0), 0)
          };

          setAisiTeam(teamSummary);
          setAisiProjects(teamProjects.projects);
          setAisiMembers(groupMembers);

          // Get publications for this group's projects.
          if (teamProjects.projects.length > 0) {
            const pubsPromises = teamProjects.projects.map(p =>
              apiRepository.getPublications({ project_id: p.id, limit: 10 })
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

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactSubject.trim() || !contactMessage.trim()) {
      toast({ title: 'Please fill out all fields.', variant: 'destructive' });
      return;
    }

    setSendingContact(true);
    try {
      await apiRepository.sendContactMessage({
        name: contactName.trim(),
        email: contactEmail.trim(),
        subject: contactSubject.trim(),
        message: contactMessage.trim(),
        group_id: aisiTeam?.id,
      });

      toast({
        title: 'Message Sent Successfully!',
        description: "Your message has been stored and delivered to the team leader's email.",
      });

      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
    } catch (err: any) {
      toast({
        title: 'Submission Failed',
        description: err?.message || 'Could not send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSendingContact(false);
    }
  };


  return (
    <PublicLayout
      navLinks={[
        { label: 'Home', href: '#', isHash: true, isActive: true },
        { label: 'Objectives', href: '#objectives', isHash: true },
        { label: 'Team', href: '#team', isHash: true },
        { label: 'Activities', href: '#activities', isHash: true },
        { label: 'Opportunities', href: '#opportunities', isHash: true },
        { label: 'Contact', href: '#contact', isHash: true },
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
              Putting AI to work for <span className="text-[#F47A1E]" >people and communities</span>.
            </h1>
            <p className="font-sans font-normal text-[18px] leading-relaxed text-[#0E1B2E] max-w-[52ch] mb-10 animate-fade-up [animation-delay:0.06s]">
              We design and deploy AI systems that move from research to production — for public institutions, research partners, and the communities they serve.
            </p>
            <div className="flex items-center flex-wrap gap-6 animate-fade-up [animation-delay:0.12s]">
              <a
                href="#contact"
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
                href="#opportunities"
                className="inline-block text-[#2E9FDA] font-sans font-medium text-base py-4 border-b border-[#2E9FDA]/35 hover:border-[#2E9FDA] transition-colors duration-150"
              >
                Find Opportunities
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

      {/* Objectives Section */}
      <section id="objectives" className="scroll-mt-24 py-16 md:py-24 bg-white relative border-b border-slate-100">
        <div className="container max-w-7xl mx-auto px-8 md:px-12">
          {/* Header */}
          <div className="mb-16 md:mb-20">
            <span className="text-xs uppercase font-bold tracking-widest text-[#F47A1E] block mb-2 font-mono">
              OUR PURPOSE
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-[#003d7a] tracking-tight">
              Team Objectives
            </h2>
            <div className="h-[2.5px] w-24 bg-[#F47A1E] mt-5" />
          </div>

          <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-start">
            {/* Column 1: Mission Statement Pull-Quote (lg:col-span-5) */}
            <section className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 pb-12 lg:pb-0 lg:pr-16 relative">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <span className="bg-[#F47A1E] text-white text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded-sm">01</span>
                  <span className="text-xs uppercase font-bold tracking-widest text-[#173C7E] font-mono">MISSION STATEMENT</span>
                </div>

                <div className="relative pl-2 pt-2">
                  <span className="absolute -left-2 -top-6 text-7xl font-serif text-[#F47A1E]/20 select-none">“</span>
                  <p className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#173C7E] leading-[1.4] tracking-tight font-medium">
                    Put AI to work for real societal impact—designing and deploying intelligent systems that deliver measurable, practical changes in the real world.
                  </p>
                </div>
              </div>
            </section>

            {/* Column 2: Capabilities + Focus (lg:col-span-7) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-12 pl-0 lg:pl-4 lg:-mt-20">
              
              {/* 02. Capabilities */}
              <section className="space-y-6">
                <div className="flex items-center gap-2">
                  <span className="bg-[#173C7E] text-white text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded-sm">02</span>
                  <span className="text-xs uppercase font-bold tracking-widest text-[#173C7E] font-mono">CAPABILITIES</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6 mt-4">
                  {/* Left sub-column */}
                  <div className="space-y-5 border-l-2 border-[#F47A1E]/25 pl-6">
                    <div className="space-y-1.5">
                      <h4 className="font-sans font-bold text-base text-[#003d7a] tracking-wide">Machine Learning</h4>
                      <p className="text-sm text-slate-600 font-sans leading-relaxed">
                        Pattern discovery and data-driven insights.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-sans font-bold text-base text-[#003d7a] tracking-wide">Deep Learning</h4>
                      <p className="text-sm text-slate-600 font-sans leading-relaxed">
                        Hierarchical neural network architectures.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-sans font-bold text-base text-[#003d7a] tracking-wide">Computational Intelligence</h4>
                      <p className="text-sm text-slate-600 font-sans leading-relaxed">
                        Optimization algorithms and evolutionary search.
                      </p>
                    </div>
                  </div>

                  {/* Right sub-column */}
                  <div className="space-y-5 border-l-2 border-[#173C7E]/25 pl-6">
                    <div className="space-y-1.5">
                      <h4 className="font-sans font-bold text-base text-[#003d7a] tracking-wide">Recommender Systems</h4>
                      <p className="text-sm text-slate-600 font-sans leading-relaxed">
                        Personalization and collaborative filtering.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-sans font-bold text-base text-[#003d7a] tracking-wide">Natural Language Processing</h4>
                      <p className="text-sm text-slate-600 font-sans leading-relaxed">
                        Semantic translation and dialogue systems.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Hairline Divider */}
              <div className="border-t border-slate-150 w-full" />

              {/* 03. Focus Block */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#173C7E] text-white text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded-sm">03</span>
                  <span className="text-xs uppercase font-bold tracking-widest text-[#173C7E] font-mono">PRACTICAL FOCUS</span>
                </div>
                
                <div className="flex items-center gap-6 mt-3 bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                  {/* Node Motif SVG */}
                  <svg className="w-14 h-14 text-[#173C7E] shrink-0" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="30" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
                    <circle cx="50" cy="50" r="18" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="50" y1="50" x2="50" y2="20" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
                    <line x1="50" y1="50" x2="76" y2="58" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
                    <line x1="50" y1="50" x2="28" y2="68" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
                    <circle cx="50" cy="20" r="3.5" fill="#F47A1E" />
                    <circle cx="76" cy="58" r="3" fill="#173C7E" />
                    <circle cx="28" cy="68" r="3" fill="#173C7E" />
                    <circle cx="50" cy="50" r="2" fill="#173C7E" />
                  </svg>

                  <div className="flex-1 text-sm sm:text-base text-slate-600 leading-relaxed">
                    <span className="font-bold text-[#0F172A] mr-1.5">Real Societal Applications:</span>
                    Moving beyond abstract research to solve pressing challenges across critical public domains.
                    <a
                      href="#opportunities"
                      className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-[#173C7E] hover:text-[#F47A1E] transition-colors border-b border-[#173C7E]/20 pb-0.5 ml-3 font-mono uppercase"
                    >
                      Explore Opportunities <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      {/* Dedicated Meet the Team Section (Matching meet_the_team_left_sharp_small_btn.html UI) */}
      <section id="team" className="scroll-mt-24 py-16 md:py-24 bg-[#f9fafb] border-t border-b border-[#e5e7eb] overflow-x-hidden">
        <div className="container max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="mb-10">
            <h1 className="text-[36px] font-bold text-[#003d7a] relative inline-block mb-2 font-display">
              Meet the Team
              <span className="absolute -bottom-3 left-0 w-[80px] h-[4px] bg-[#ff6b35]" />
            </h1>
            <p className="text-[#6b7280] text-[16px] mt-5 max-w-[600px]">
              Meet the scientists, developers, and researchers driving our mission forward.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mt-10">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white border border-[#e5e7eb] rounded-none p-5 h-[320px] animate-pulse space-y-4">
                  <div className="w-[100px] h-[100px] rounded-full bg-slate-200" />
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded" />
                  <div className="h-12 w-full bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : aisiTeam ? (
            <div className="mt-10 space-y-5">
              {/* 1. DESKTOP LAYOUT (lg screens & up: Row 1 = 5 items, Row 2 = 4 items centered underneath) */}
              <div className="hidden lg:block space-y-5">
                {/* Row 1: First 5 members */}
                <div className="grid grid-cols-5 gap-5">
                  {aisiMembers.slice(0, 5).map((member) => (
                    <TeamMemberCard
                      key={member.user_id}
                      member={member}
                      isLeader={member.user_id === aisiTeam.leader_user_id}
                      teacherInfo={teachers.find(t => t.user_id === member.user_id)}
                    />
                  ))}
                </div>

                {/* Row 2: Next 4 members centered underneath Row 1 */}
                {aisiMembers.length > 5 && (
                  <div className="flex justify-center gap-5 w-full">
                    {aisiMembers.slice(5, 9).map((member) => (
                      <div key={member.user_id} className="w-[calc((100%-80px)/5)]">
                        <TeamMemberCard
                          member={member}
                          isLeader={member.user_id === aisiTeam.leader_user_id}
                          teacherInfo={teachers.find(t => t.user_id === member.user_id)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Overflow items if total members > 9: centered flex row */}
                {aisiMembers.length > 9 && (
                  <div className="flex flex-wrap justify-center gap-5 w-full pt-2">
                    {aisiMembers.slice(9).map((member) => (
                      <div key={member.user_id} className="w-[calc((100%-80px)/5)]">
                        <TeamMemberCard
                          member={member}
                          isLeader={member.user_id === aisiTeam.leader_user_id}
                          teacherInfo={teachers.find(t => t.user_id === member.user_id)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. TABLET / MEDIUM LAYOUT (md to lg screens: 3-column grid => 3 + 3 + 3 = 9, 0 orphans) */}
              <div className="hidden md:max-lg:grid grid-cols-3 gap-5">
                {aisiMembers.map((member) => (
                  <TeamMemberCard
                    key={member.user_id}
                    member={member}
                    isLeader={member.user_id === aisiTeam.leader_user_id}
                    teacherInfo={teachers.find(t => t.user_id === member.user_id)}
                  />
                ))}
              </div>

              {/* 3. MOBILE LAYOUT (below md screens: 2-column or 1-column responsive layout) */}
              <div className="block md:hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 justify-items-center">
                  {aisiMembers.map((member, index) => {
                    const isLast = index === aisiMembers.length - 1;
                    const isOdd = aisiMembers.length % 2 !== 0;

                    return (
                      <div
                        key={member.user_id}
                        className={cn(
                          "w-full max-w-[320px]",
                          isLast && isOdd ? "sm:col-span-2 sm:max-w-[320px] sm:mx-auto" : ""
                        )}
                      >
                        <TeamMemberCard
                          member={member}
                          isLeader={member.user_id === aisiTeam.leader_user_id}
                          teacherInfo={teachers.find(t => t.user_id === member.user_id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-none border border-dashed border-[#e5e7eb] mt-10">
              <p className="text-sm text-slate-500 italic">No team summary found.</p>
            </div>
          )}
        </div>
      </section>

      {/* AISI Research Projects & Activities Section */}
      <section id="activities" className="scroll-mt-24 py-16 md:py-24 bg-white border-t border-slate-100">
        <div className="container max-w-5xl mx-auto px-6">
          <SectionHeader
            title="Research Projects & Publications"
            subtitle="Explore our latest projects and scientific contributions."
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
                  <FolderOpen className="h-6 w-6 text-[#173C7E]" /> Latest Projects
                </h3>
                <div className="space-y-4">
                  {aisiProjects.map((proj) => {
                    return (
                      <ProjectCard
                        key={proj.id}
                        project={proj}
                        leftAccent="blue"
                        to={`/discovery/projects/${proj.id}`}
                      />
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
                  <BookOpen className="h-6 w-6 text-[#173C7E]" /> Publications & Contributions
                </h3>
                <div className="space-y-4">
                  {aisiPublications.map((pub) => (
                    <PublicationCard key={pub.id} publication={pub} />
                  ))}
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

      {/* Research Opportunities Section */}
      <section id="opportunities" className="scroll-mt-24 py-16 md:py-24 relative" style={{ background: '#EFF2F7' }}>
        <div className="container max-w-5xl mx-auto px-6">
          {/* Section header */}
          <SectionHeader
            title="Research Opportunities"
            subtitle="Discover open calls for collaboration and apply to join AISI team."
          />

          {/* Card grid */}
          {loading ? (
            <div className="grid sm:grid-cols-2 gap-7 md:gap-8">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-7 md:gap-8">
              {((data?.open_collaboration_calls && data.open_collaboration_calls.length > 0)
                ? data.open_collaboration_calls
                : (data?.open_projects || []))?.slice(0, 6).map((item: any, i: number) => {
                  const isCall = !!item.project;
                  const project = isCall ? item.project : item;
                  const callId = isCall ? item.id : null;
                  const callTitle = isCall ? item.title : null;
                  const deadline = isCall ? item.deadline : null;
                  return (
                    <ProjectCard
                      key={isCall ? `call-${item.id}` : `proj-${item.id}`}
                      project={{
                        ...project,
                        deadline: deadline || project.deadline,
                      }}
                      leftAccent="orange"
                      hideTags={true}
                      to={`/discovery/projects/${project.id}`}
                      callId={callId}
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

      {/* Contact Us Section */}
      <section id="contact" className="scroll-mt-24 py-16 md:py-24 bg-white border-t border-b border-slate-100">
        <div className="container max-w-5xl mx-auto px-6">
          <SectionHeader
            title="Contact the Team"
            subtitle="Get in touch with the AISI research group to discuss collaborations, projects, or applications."
          />

          <form onSubmit={handleContactSubmit} className="mt-16 max-w-3xl mx-auto bg-slate-50 p-8 md:p-10 rounded-[2rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Your Name</Label>
                <Input
                  id="contact-name"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="E.g., John Doe"
                  className="rounded-xl border-slate-200 focus:border-[#F47A1E] focus:ring-[#F47A1E]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Your Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="rounded-xl border-slate-200 focus:border-[#F47A1E] focus:ring-[#F47A1E]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-subject">Subject</Label>
              <Input
                id="contact-subject"
                required
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                placeholder="E.g., Collaboration proposal"
                className="rounded-xl border-slate-200 focus:border-[#F47A1E] focus:ring-[#F47A1E]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-message">Message</Label>
              <Textarea
                id="contact-message"
                required
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Write your message here..."
                rows={5}
                className="rounded-xl border-slate-200 focus:border-[#F47A1E] focus:ring-[#F47A1E]"
              />
            </div>

            <Button
              type="submit"
              disabled={sendingContact}
              className="w-full sm:w-auto rounded-full h-12 px-8 font-semibold text-white hover:brightness-110 transition-all flex items-center justify-center gap-2"
              style={{ background: '#F47A1E' }}
            >
              {sendingContact ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sendingContact ? 'Sending Message...' : 'Send Message'}
            </Button>
          </form>
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