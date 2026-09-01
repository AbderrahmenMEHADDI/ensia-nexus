import { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  X,
  SlidersHorizontal,
  Filter,
  ChevronDown,
  User,
  Tag,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const navigate = useNavigate();

  let roleText = 'TEACHER';
  if (isLeader) {
    roleText = 'TEAM LEAD';
  } else if (member.user_role === 'TEACHER' && teacherInfo?.grade) {
    roleText = teacherInfo.grade.replace('_', ' ').toUpperCase();
  } else if (member.user_role) {
    roleText = member.user_role.toUpperCase();
  }

  const defaultBios = [
    'Leading cutting-edge research in computational sciences and guiding our team toward breakthrough discoveries, advancing intelligent architectures and state-of-the-art methodology.',
    'Passionate educator committed to developing the next generation of researchers with innovative teaching methodologies and comprehensive academic mentorship.',
    'Expert in advanced technologies with a focus on practical applications, algorithmic optimization, and collaborative research initiatives.',
    'Dedicated to fostering innovation in academic environments with emphasis on interdisciplinary collaboration and applied computational frameworks.',
    'Specializing in research excellence, machine intelligence foundations, and mentoring emerging scholars with a commitment to quality.',
    'Contributing valuable insights in research development, data analytics, and advancement with interdisciplinary expertise.',
    'Leading collaborative projects that bridge theoretical foundations and practice with innovative research methodologies.',
    'Committed to advancing knowledge through rigorous research, open collaboration, and mentorship of next-generation scientists.',
    'Fostering innovation and excellence in research while supporting emerging talent across the academic community.',
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

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Avoid navigation if user clicked a link, button, or interactive element inside the card
    if ((e.target as HTMLElement).closest('a, button')) {
      return;
    }
    navigate(`/member/${member.user_id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group bg-white border border-[#e5e7eb] rounded-none p-[20px] text-left flex flex-col h-full hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 w-full cursor-pointer"
    >
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
      <div className="text-[16px] font-bold text-[#003d7a] mb-1 leading-snug break-words group-hover:text-[#2E9FDA] transition-colors" title={member.user_name}>
        {member.user_name || 'Unknown Member'}
      </div>

      {/* Member Role */}
      <div className="text-[12px] font-semibold text-[#ff6b35] uppercase tracking-[0.5px] mb-3">
        {roleText}
      </div>

      {/* Member Bio Snippet with three dots in blue */}
      <div className="text-[14px] text-[#6b7280] leading-[1.55] mb-4 flex-1 line-clamp-5">
        <span>{bioText}</span>
        <span className="text-[#2E9FDA] font-bold ml-1 tracking-wider group-hover:underline">...</span>
      </div>

      {/* Card Footer */}
      <div className="flex flex-col gap-3 items-start pt-1 mt-auto">
        {member.user_email ? (
          <a
            href={`mailto:${member.user_email}`}
            onClick={(e) => e.stopPropagation()}
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

  // Active Tab for activities section
  const [activitiesTab, setActivitiesTab] = useState<'all' | 'projects' | 'publications'>('all');

  // Filter & Pagination state for Projects
  const [projectSearch, setProjectSearch] = useState('');
  const [projectResearcher, setProjectResearcher] = useState('all');
  const [projectTopic, setProjectTopic] = useState('all');
  const [projectSort, setProjectSort] = useState<'default' | 'latest' | 'trending'>('default');
  const [projectLimit, setProjectLimit] = useState(4);

  // Filter & Pagination state for Publications
  const [pubSearch, setPubSearch] = useState('');
  const [pubResearcher, setPubResearcher] = useState('all');
  const [pubTopic, setPubTopic] = useState('all');
  const [pubSort, setPubSort] = useState<'default' | 'latest' | 'trending'>('default');
  const [pubLimit, setPubLimit] = useState(4);

  // IntersectionObserver refs
  const projectObserverTargetRef = useRef<HTMLDivElement | null>(null);
  const pubObserverTargetRef = useRef<HTMLDivElement | null>(null);

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
        const [res, allTeachers, allGroups, allProjectsList] = await Promise.all([
          apiRepository.getLandingPageData(),
          apiRepository.getTeachers({ limit: 1000 }),
          apiRepository.getGroups(),
          apiRepository.getProjects().catch(() => [])
        ]);
        setData(res);
        setTeachers(allTeachers);

        // Take the first group in the system dynamically
        const mainGroup = allGroups?.[0];
        let loadedProjects: ProjectPreview[] = [];
        if (mainGroup) {
          const [teamProjects, groupMembers] = await Promise.all([
            apiRepository.getTeamProjects(mainGroup.id),
            apiRepository.getGroupMembersFiltered(mainGroup.id)
          ]);
          setAisiMembers(groupMembers);

          const labName = res.labs?.find(l => l.id === mainGroup.lab_id)?.name || "Artificial Intelligence Research Lab";

          // Get all publications including independent publications
          const allPubs = await apiRepository.getPublications({ include_independent: true, limit: 1000 });
          const sortedPubs = [...allPubs].sort((a, b) => {
            const orderA = (a as any).landing_page_order ?? 999999;
            const orderB = (b as any).landing_page_order ?? 999999;
            if (orderA !== orderB) return orderA - orderB;
            return new Date((b as any).publication_date || (b as any).created_at || 0).getTime() - new Date((a as any).publication_date || (a as any).created_at || 0).getTime();
          });

          // Merge all projects across endpoints into single list
          const mergedProjectsMap = new Map<number, ProjectPreview>();
          (teamProjects?.projects || []).forEach(p => mergedProjectsMap.set(p.id, p));
          (res?.open_projects || []).forEach(p => mergedProjectsMap.set(p.id, p));
          (allProjectsList || []).forEach((p: any) => mergedProjectsMap.set(p.id, p));
          loadedProjects = Array.from(mergedProjectsMap.values());

          const teamSummary: TeamSummary = {
            id: mainGroup.id,
            lab_id: mainGroup.lab_id,
            lab_name: labName,
            name: mainGroup.name,
            description: mainGroup.description,
            leader_user_id: mainGroup.leader_user_id,
            picture_url: mainGroup.picture_url,
            project_count: loadedProjects.length,
            open_project_count: loadedProjects.filter(p => p.accepting_collaborators).length,
            publication_count: sortedPubs.length
          };

          setAisiTeam(teamSummary);
          setAisiProjects(loadedProjects);
          setAisiPublications(sortedPubs as any);
        } else {
          const mergedProjectsMap = new Map<number, ProjectPreview>();
          (res?.open_projects || []).forEach(p => mergedProjectsMap.set(p.id, p));
          (allProjectsList || []).forEach((p: any) => mergedProjectsMap.set(p.id, p));
          loadedProjects = Array.from(mergedProjectsMap.values());
          setAisiProjects(loadedProjects);

          const allPubs = await apiRepository.getPublications({ include_independent: true, limit: 1000 });
          setAisiPublications(allPubs as any);
        }
      } catch (err) {
        console.error('Failed to fetch landing page data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Unique Researchers list for Projects
  const projectResearchers = useMemo(() => {
    const set = new Set<string>();
    aisiProjects.forEach((p) => {
      if (p.team_name) set.add(p.team_name);
      if ((p as any).group_name) set.add((p as any).group_name);
    });
    aisiMembers.forEach((m) => {
      if (m.user_name) set.add(m.user_name);
    });
    teachers.forEach((t) => {
      const name = t.full_name || t.user?.full_name;
      if (name) set.add(name);
    });
    return Array.from(set).filter(Boolean).sort();
  }, [aisiProjects, aisiMembers, teachers]);

  // Unique Topics list for Projects
  const projectTopics = useMemo(() => {
    const set = new Set<string>();
    aisiProjects.forEach((p) => {
      if (p.focus_areas) {
        p.focus_areas.split(/[,;/]+/).forEach((t) => {
          const clean = t.trim();
          if (clean) set.add(clean);
        });
      }
    });
    return Array.from(set).filter(Boolean).sort();
  }, [aisiProjects]);

  // Processed Projects (Filtered & Sorted)
  const processedProjects = useMemo(() => {
    let result = [...aisiProjects];

    // Search query: searches title, description, focus_areas, team_name, group_name
    if (projectSearch.trim()) {
      const q = projectSearch.toLowerCase().trim();
      result = result.filter((p) => {
        const titleMatch = p.title?.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const focusMatch = p.focus_areas?.toLowerCase().includes(q);
        const teamMatch = (p.team_name || (p as any).group_name || '').toLowerCase().includes(q);
        return titleMatch || descMatch || focusMatch || teamMatch;
      });
    }

    // Researcher filter
    if (projectResearcher !== 'all') {
      const r = projectResearcher.toLowerCase();
      result = result.filter((p) => {
        const team = (p.team_name || (p as any).group_name || '').toLowerCase();
        const focus = (p.focus_areas || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return team.includes(r) || focus.includes(r) || desc.includes(r);
      });
    }

    // Topic filter
    if (projectTopic !== 'all') {
      const t = projectTopic.toLowerCase();
      result = result.filter((p) => {
        const focus = (p.focus_areas || '').toLowerCase();
        const title = (p.title || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return focus.includes(t) || title.includes(t) || desc.includes(t);
      });
    }

    // Sorting logic
    result.sort((a, b) => {
      if (projectSort === 'default') {
        const orderA = a.landing_page_order ?? 999999;
        const orderB = b.landing_page_order ?? 999999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      } else if (projectSort === 'latest') {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      } else if (projectSort === 'trending') {
        // Prioritize active and accepting collaborations, then latest creation date
        const aActive = a.is_active ?? true;
        const aAccepting = a.accepting_collaborators ?? false;
        const bActive = b.is_active ?? true;
        const bAccepting = b.accepting_collaborators ?? false;

        const getScore = (active: boolean, accepting: boolean) => {
          if (active && accepting) return 3;
          if (accepting) return 2;
          if (active) return 1;
          return 0;
        };

        const scoreA = getScore(aActive, aAccepting);
        const scoreB = getScore(bActive, bAccepting);

        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }

        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      }
      return 0;
    });

    return result;
  }, [aisiProjects, projectSearch, projectResearcher, projectTopic, projectSort]);

  const visibleProjects = useMemo(() => {
    return processedProjects.slice(0, projectLimit);
  }, [processedProjects, projectLimit]);

  // Unique Researchers list for Publications
  const pubResearchers = useMemo(() => {
    const set = new Set<string>();
    aisiPublications.forEach((pub) => {
      if (pub.authors && Array.isArray(pub.authors)) {
        pub.authors.forEach((a: any) => {
          const name = a.user?.full_name || a.full_name;
          if (name) set.add(name);
        });
      }
    });
    aisiMembers.forEach((m) => {
      if (m.user_name) set.add(m.user_name);
    });
    return Array.from(set).filter(Boolean).sort();
  }, [aisiPublications, aisiMembers]);

  // Unique Topics list for Publications
  const pubTopics = useMemo(() => {
    const set = new Set<string>();
    aisiPublications.forEach((pub) => {
      if (pub.venue) set.add(pub.venue);
      if (pub.journal) set.add(pub.journal);
      if (pub.project?.focus_areas) {
        pub.project.focus_areas.split(/[,;/]+/).forEach((t) => {
          const clean = t.trim();
          if (clean) set.add(clean);
        });
      }
    });
    return Array.from(set).filter(Boolean).sort();
  }, [aisiPublications]);

  // Shared Researchers list for unified filter
  const sharedResearchers = useMemo(() => {
    const set = new Set<string>([...projectResearchers, ...pubResearchers]);
    return Array.from(set).filter(Boolean).sort();
  }, [projectResearchers, pubResearchers]);

  // Shared Topics list for unified filter
  const sharedTopics = useMemo(() => {
    const set = new Set<string>([...projectTopics, ...pubTopics]);
    return Array.from(set).filter(Boolean).sort();
  }, [projectTopics, pubTopics]);

  // Shared Filter Handler callbacks
  const handleSharedSearch = (val: string) => {
    setProjectSearch(val);
    setPubSearch(val);
    setProjectLimit(4);
    setPubLimit(4);
  };

  const handleSharedResearcher = (val: string) => {
    setProjectResearcher(val);
    setPubResearcher(val);
    setProjectLimit(4);
    setPubLimit(4);
  };

  const handleSharedTopic = (val: string) => {
    setProjectTopic(val);
    setPubTopic(val);
    setProjectLimit(4);
    setPubLimit(4);
  };

  const handleSharedSort = (val: 'default' | 'latest' | 'trending') => {
    setProjectSort(val);
    setPubSort(val);
    setProjectLimit(4);
    setPubLimit(4);
  };

  const handleResetSharedFilters = () => {
    setProjectSearch('');
    setPubSearch('');
    setProjectResearcher('all');
    setPubResearcher('all');
    setProjectTopic('all');
    setPubTopic('all');
    setProjectSort('default');
    setPubSort('default');
    setProjectLimit(4);
    setPubLimit(4);
  };

  // Processed Publications (Filtered & Sorted)
  const processedPublications = useMemo(() => {
    let result = [...aisiPublications];

    // Search query: title, abstract, venue, journal, doi, authors
    if (pubSearch.trim()) {
      const q = pubSearch.toLowerCase().trim();
      result = result.filter((pub) => {
        const titleMatch = pub.title?.toLowerCase().includes(q);
        const abstractMatch = pub.abstract?.toLowerCase().includes(q);
        const venueMatch = (pub.venue || pub.journal || '').toLowerCase().includes(q);
        const doiMatch = pub.doi?.toLowerCase().includes(q);
        let authorMatch = false;
        if (pub.authors && Array.isArray(pub.authors)) {
          authorMatch = pub.authors.some((a: any) =>
            (a.user?.full_name || a.full_name || '').toLowerCase().includes(q)
          );
        }
        return titleMatch || abstractMatch || venueMatch || doiMatch || authorMatch;
      });
    }

    // Researcher filter
    if (pubResearcher !== 'all') {
      const r = pubResearcher.toLowerCase();
      result = result.filter((pub) => {
        if (pub.authors && Array.isArray(pub.authors)) {
          return pub.authors.some((a: any) =>
            (a.user?.full_name || a.full_name || '').toLowerCase().includes(r)
          );
        }
        return false;
      });
    }

    // Topic filter
    if (pubTopic !== 'all') {
      const t = pubTopic.toLowerCase();
      result = result.filter((pub) => {
        const venue = (pub.venue || pub.journal || '').toLowerCase();
        const title = (pub.title || '').toLowerCase();
        const abstract = (pub.abstract || '').toLowerCase();
        const projectFocus = (pub.project?.focus_areas || '').toLowerCase();
        return venue.includes(t) || title.includes(t) || abstract.includes(t) || projectFocus.includes(t);
      });
    }

    // Sorting logic
    result.sort((a, b) => {
      if (pubSort === 'default') {
        const orderA = (a as any).landing_page_order ?? 999999;
        const orderB = (b as any).landing_page_order ?? 999999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        const dateA = new Date(a.publication_date || a.created_at || 0).getTime();
        const dateB = new Date(b.publication_date || b.created_at || 0).getTime();
        return dateB - dateA;
      } else if (pubSort === 'latest') {
        const dateA = new Date(a.publication_date || a.created_at || 0).getTime();
        const dateB = new Date(b.publication_date || b.created_at || 0).getTime();
        return dateB - dateA;
      } else if (pubSort === 'trending') {
        const projScoreA = a.project?.accepting_collaborators ? 3 : (a.project?.is_active ? 2 : 1);
        const projScoreB = b.project?.accepting_collaborators ? 3 : (b.project?.is_active ? 2 : 1);
        const citeA = a.citation_count ?? 0;
        const citeB = b.citation_count ?? 0;

        if (projScoreA !== projScoreB) return projScoreB - projScoreA;
        if (citeA !== citeB) return citeB - citeA;

        const dateA = new Date(a.publication_date || a.created_at || 0).getTime();
        const dateB = new Date(b.publication_date || b.created_at || 0).getTime();
        return dateB - dateA;
      }
      return 0;
    });

    return result;
  }, [aisiPublications, pubSearch, pubResearcher, pubTopic, pubSort]);

  const visiblePublications = useMemo(() => {
    return processedPublications.slice(0, pubLimit);
  }, [processedPublications, pubLimit]);



  const projectsCount = aisiProjects.length > 0
    ? aisiProjects.length
    : (data?.featured_teams?.reduce((sum, t) => sum + (t.project_count || 0), 0) ?? 0);
  const publicationsCount = aisiPublications.length > 0
    ? aisiPublications.length
    : (data?.featured_teams?.reduce((sum, t) => sum + (t.publication_count || 0), 0) || data?.publications?.length || 0);

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
                className="inline-flex items-center gap-2 bg-[#F47A1E] text-white font-sans font-semibold text-base py-4 px-8 rounded-lg hover:bg-[#dd6c14] hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 group"
              >
                Deploy Solution
                <svg
                  className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
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
                className="inline-block text-[#2E9FDA] font-sans font-medium text-base py-4 border-b border-[#2E9FDA]/35 hover:border-[#2E9FDA] hover:text-[#173C7E] transition-all duration-200"
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
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            viewport={{ once: true, margin: '-40px' }}
            className="mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-[#003d7a] tracking-tight">
              Team Objectives
            </h2>
            <div className="h-[4.5px] w-24 bg-[#F47A1E] mt-4 rounded-full" />
          </motion.div>

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
                  {/* AISI Logo */}
                  <AisiLogo className="w-12 h-12 shrink-0" />

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
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            viewport={{ once: true, margin: '-40px' }}
            className="mb-10"
          >
            <h1 className="text-[36px] font-bold text-[#003d7a] relative inline-block mb-2 font-display">
              Meet the Team
              <span className="absolute -bottom-3 left-0 w-[80px] h-[4px] bg-[#ff6b35]" />
            </h1>
            <p className="text-[#6b7280] text-[16px] mt-5 max-w-[600px]">
              Meet the scientists, developers, and researchers driving our mission forward.
            </p>
          </motion.div>

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
            <motion.div 
              className="mt-10 space-y-5"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.08,
                  },
                },
              }}
            >
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
            </motion.div>
          ) : (
            <div className="p-8 text-center bg-white rounded-none border border-dashed border-[#e5e7eb] mt-10">
              <p className="text-sm text-slate-500 italic">No team summary found.</p>
            </div>
          )}
        </div>
      </section>

      {/* AISI Research Projects & Activities Section */}
      <section id="activities" className="scroll-mt-24 py-16 md:py-24 bg-white border-t border-slate-100">
        <div className="container max-w-6xl mx-auto px-6 space-y-8">
          <SectionHeader
            title="Research Projects & Publications"
            subtitle="Explore our latest projects and scientific contributions."
          />

          {/* Shared Filter Bar (Above Columns) */}
          <div className="bg-slate-50/80 p-3.5 md:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            {/* Single Row: [ Search Bar (replaces Researcher) ] [ Topic ▼ ] [ Sort by ▼ ] */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Search box */}
              <div className="space-y-1 sm:col-span-6">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 pl-1">
                  <Search className="h-3.5 w-3.5 text-[#173C7E]" /> Search
                </label>
                <div className="relative w-full">
                  <Input
                    type="text"
                    placeholder="Search projects & papers by title, abstract, topic..."
                    value={projectSearch || pubSearch}
                    onChange={(e) => handleSharedSearch(e.target.value)}
                    className="pl-3 pr-8 h-9 rounded-xl border-slate-200 bg-white text-xs shadow-xs focus:ring-2 focus:ring-[#173C7E]/20"
                  />
                  {(projectSearch || pubSearch) && (
                    <button
                      onClick={() => handleSharedSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Topic Dropdown */}
              <div className="space-y-1 sm:col-span-3">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 pl-1">
                  <Tag className="h-3.5 w-3.5 text-[#173C7E]" /> Topic / Field
                </label>
                <Select
                  value={projectTopic !== 'all' ? projectTopic : (pubTopic !== 'all' ? pubTopic : 'all')}
                  onValueChange={(val) => handleSharedTopic(val)}
                >
                  <SelectTrigger className="w-full h-9 bg-white rounded-xl border-slate-200 text-xs">
                    <SelectValue placeholder="All Topics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {sharedTopics.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By Dropdown */}
              <div className="space-y-1 sm:col-span-3">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 pl-1">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#173C7E]" /> Sort By
                </label>
                <Select
                  value={projectSort !== 'default' ? projectSort : (pubSort !== 'default' ? pubSort : 'default')}
                  onValueChange={(val: any) => handleSharedSort(val)}
                >
                  <SelectTrigger className="w-full h-9 bg-white rounded-xl border-slate-200 text-xs">
                    <SelectValue placeholder="Sort Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Order</SelectItem>
                    <SelectItem value="latest">Latest First</SelectItem>
                    <SelectItem value="trending">Trending & Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Row */}
            {((projectSearch || pubSearch) || (projectTopic !== 'all' || pubTopic !== 'all') || (projectSort !== 'default' || pubSort !== 'default')) && (
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs border-t border-slate-200/60 mt-2">
                <span className="font-semibold text-slate-500 flex items-center gap-1">
                  <Filter className="h-3 w-3 text-[#173C7E]" /> Active:
                </span>
                {(projectSearch || pubSearch) && (
                  <Badge variant="secondary" className="gap-1 bg-white border border-slate-200 text-xs py-0.5">
                    Search: "{projectSearch || pubSearch}"
                    <X className="h-3 w-3 cursor-pointer" onClick={() => handleSharedSearch('')} />
                  </Badge>
                )}
                {(projectTopic !== 'all' || pubTopic !== 'all') && (
                  <Badge variant="secondary" className="gap-1 bg-white border border-slate-200 text-xs py-0.5">
                    Topic: {projectTopic !== 'all' ? projectTopic : pubTopic}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => handleSharedTopic('all')} />
                  </Badge>
                )}
                {(projectSort !== 'default' || pubSort !== 'default') && (
                  <Badge variant="secondary" className="gap-1 bg-white border border-slate-200 capitalize text-xs py-0.5">
                    Sort: {projectSort !== 'default' ? projectSort : pubSort}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => handleSharedSort('default')} />
                  </Badge>
                )}
                <button
                  onClick={handleResetSharedFilters}
                  className="ml-auto text-xs text-[#173C7E] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 gap-10 lg:gap-14 mt-8">
              <CardSkeleton tall />
              <CardSkeleton tall />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start mt-8">
              {/* ── Left Column: Latest Projects ── */}
              {(activitiesTab === 'all' || activitiesTab === 'projects') && (
                <div className={cn(
                  "space-y-6",
                  activitiesTab === 'projects' && "lg:col-span-2 max-w-3xl mx-auto w-full"
                )}>
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                    <h3 className="text-xl md:text-2xl font-display font-bold text-[#0F172A] flex items-center gap-2.5">
                      <FolderOpen className="h-6 w-6 text-[#173C7E]" /> Latest Projects
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      {processedProjects.length} Projects
                    </span>
                  </div>

                  <div className="space-y-6">
                    {visibleProjects.map((proj, idx) => (
                      <motion.div
                        key={proj.id}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        viewport={{ once: true, margin: '-40px' }}
                      >
                        <ProjectCard
                          project={proj}
                          leftAccent="blue"
                          to={`/discovery/projects/${proj.id}`}
                        />
                      </motion.div>
                    ))}

                    {processedProjects.length === 0 && (
                      <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
                        <FolderOpen className="h-8 w-8 text-slate-300 mx-auto" />
                        <p className="text-sm font-semibold text-slate-700">No projects found</p>
                        <p className="text-xs text-slate-500">
                          Try modifying your search text or clear active filters.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetSharedFilters}
                          className="mt-2 rounded-full text-xs"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    )}

                    {/* Load More Controls for Projects */}
                    {processedProjects.length > 0 && (
                      <div className="pt-4 flex flex-col items-center gap-3">
                        {projectLimit < processedProjects.length ? (
                          <Button
                            onClick={() => setProjectLimit((prev) => prev + 4)}
                            variant="outline"
                            className="rounded-full px-6 py-2.5 text-xs font-bold border-[#173C7E]/30 text-[#173C7E] bg-white hover:bg-[#173C7E] hover:text-white transition-all shadow-xs hover:shadow-md group cursor-pointer"
                          >
                            Show More Projects ({processedProjects.length - visibleProjects.length} remaining)
                            <ChevronDown className="h-4 w-4 ml-1.5 group-hover:translate-y-0.5 transition-transform" />
                          </Button>
                        ) : (
                          processedProjects.length > 4 && (
                            <span className="text-xs text-slate-400 italic font-medium">All {processedProjects.length} projects loaded</span>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Right Column: Publications & Contributions ── */}
              {(activitiesTab === 'all' || activitiesTab === 'publications') && (
                <div className={cn(
                  "space-y-6",
                  activitiesTab === 'publications' && "lg:col-span-2 max-w-3xl mx-auto w-full"
                )}>
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                    <h3 className="text-xl md:text-2xl font-display font-bold text-[#0F172A] flex items-center gap-2.5">
                      <BookOpen className="h-6 w-6 text-[#173C7E]" /> Publications & Contributions
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      {processedPublications.length} Papers
                    </span>
                  </div>

                  <div className="space-y-6">
                    {visiblePublications.map((pub, idx) => (
                      <motion.div
                        key={pub.id}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        viewport={{ once: true, margin: '-40px' }}
                      >
                        <PublicationCard publication={pub} />
                      </motion.div>
                    ))}

                    {processedPublications.length === 0 && (
                      <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
                        <BookOpen className="h-8 w-8 text-slate-300 mx-auto" />
                        <p className="text-sm font-semibold text-slate-700">No research papers found</p>
                        <p className="text-xs text-slate-500">
                          Try modifying your search text or clear active filters.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetSharedFilters}
                          className="mt-2 rounded-full text-xs"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    )}

                    {/* Load More Controls for Publications */}
                    {processedPublications.length > 0 && (
                      <div className="pt-4 flex flex-col items-center gap-3">
                        {pubLimit < processedPublications.length ? (
                          <Button
                            onClick={() => setPubLimit((prev) => prev + 4)}
                            variant="outline"
                            className="rounded-full px-6 py-2.5 text-xs font-bold border-[#173C7E]/30 text-[#173C7E] bg-white hover:bg-[#173C7E] hover:text-white transition-all shadow-xs hover:shadow-md group cursor-pointer"
                          >
                            Show More Papers ({processedPublications.length - visiblePublications.length} remaining)
                            <ChevronDown className="h-4 w-4 ml-1.5 group-hover:translate-y-0.5 transition-transform" />
                          </Button>
                        ) : (
                          processedPublications.length > 4 && (
                            <span className="text-xs text-slate-400 italic font-medium">All {processedPublications.length} papers loaded</span>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
            <motion.div 
              className="grid sm:grid-cols-2 gap-7 md:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.08,
                  },
                },
              }}
            >
              {((data?.open_collaboration_calls && data.open_collaboration_calls.length > 0)
                ? data.open_collaboration_calls
                : (data?.open_projects || []))?.slice(0, 6).map((item: any, i: number) => {
                  const isCall = !!item.project;
                  const project = isCall ? item.project : item;
                  const callId = isCall ? item.id : null;
                  const callTitle = isCall ? item.title : null;
                  const deadline = isCall ? item.deadline : null;
                  return (
                    <motion.div
                      key={isCall ? `call-${item.id}` : `proj-${item.id}`}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      viewport={{ once: true }}
                    >
                      <ProjectCard
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
                    </motion.div>
                  );
                })}
            </motion.div>
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
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            viewport={{ once: true, margin: '-40px' }}
          >
            <SectionHeader
              title="Contact the Team"
              subtitle="Get in touch with the AISI research group to discuss collaborations, projects, or applications."
            />
          </motion.div>

          <motion.form 
            onSubmit={handleContactSubmit} 
            className="mt-16 max-w-3xl mx-auto bg-slate-50 p-8 md:p-10 rounded-[2rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            viewport={{ once: true, margin: '-40px' }}
          >
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
          </motion.form>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true, margin: '-40px' }}
            className="relative rounded-[2.5rem] overflow-hidden p-12 md:p-20 group" 
            style={{ background: '#173C7E' }}
          >
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
          </motion.div>
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