import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  ArrowRight,
  Users,
  Calendar,
  ExternalLink,
  Loader2,
  FlaskConical,
  FileText,
  FolderOpen,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { apiRepository } from '@/repositories/apiRepository';
import type { Project, ResearchGroup, ResearchLab } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PublicLayout } from '@/components/layout/PublicLayout';

const PublicProjects = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [labs, setLabs] = useState<ResearchLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabId, setSelectedLabId] = useState('all');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [showCollabOnly, setShowCollabOnly] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyProjectId, setApplyProjectId] = useState<number | null>(null);
  const [applyForm, setApplyForm] = useState({ fullName: '', email: '', institution: '', cv: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, g, l] = await Promise.all([
          apiRepository.getProjects(),
          apiRepository.getGroups(),
          apiRepository.getLabs(),
        ]);
        setProjects(p.filter(project => project.status === 'APPROVED' && project.visibility === 'PUBLIC'));
        setGroups(g);
        setLabs(l);
      } catch (err) {
        console.error('Failed to load projects', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const group = groups.find(g => g.id === p.group_id);
    const matchesLab = selectedLabId === 'all' || (group && String(group.lab_id) === selectedLabId);
    const matchesGroup = selectedGroupId === 'all' || String(p.group_id) === selectedGroupId;
    const matchesCollab = !showCollabOnly || p.accepting_collaborators;
    return matchesSearch && matchesLab && matchesGroup && matchesCollab;
  });

  // Get groups filtered by selected lab for cascading filter
  const filteredGroups = selectedLabId === 'all'
    ? groups
    : groups.filter(g => String(g.lab_id) === selectedLabId);

  return (
    <PublicLayout activePath="/discovery/projects">
      {/* ── Compact Header + Filters ── */}
      <div className="border-b" style={{ borderColor: '#E2E8F0' }}>
        <div className="container px-4 py-6">
          {/* Title row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold" style={{ color: '#074a75' }}>
                Project Board
              </h1>
              <div className="w-10 h-1 rounded-full mt-2 mb-1" style={{ background: '#F37F20' }} />
              <p className="text-sm" style={{ color: '#64748B' }}>
                Explore {projects.length} research projects across ENSIA.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#64748B' }}>
              <FolderOpen className="h-4 w-4" />
              {filteredProjects.length} results
            </div>
          </div>

          {/* Search + Filters row */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#94A3B8' }} />
              <Input
                placeholder="Search by title, topic, or tech..."
                className="pl-10 h-10 rounded-lg border-slate-200 text-sm focus-visible:ring-1 focus-visible:ring-[#074a75]/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter selects */}
            <select
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white cursor-pointer focus:ring-1 focus:ring-[#074a75]/30 outline-none"
              value={selectedLabId}
              onChange={(e) => { setSelectedLabId(e.target.value); setSelectedGroupId('all'); }}
            >
              <option value="all">All Labs</option>
              {labs.map(lab => (
                <option key={lab.id} value={String(lab.id)}>{lab.name}</option>
              ))}
            </select>

            <select
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white cursor-pointer focus:ring-1 focus:ring-[#074a75]/30 outline-none"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              <option value="all">All Teams</option>
              {filteredGroups.map(g => (
                <option key={g.id} value={String(g.id)}>{g.name}</option>
              ))}
            </select>

            {/* Collab toggle */}
            <button
              className={cn(
                "h-10 px-4 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 shrink-0",
                showCollabOnly
                  ? "text-white border-transparent"
                  : "border-slate-200 text-[#475569] hover:border-[#074a75]/30"
              )}
              style={showCollabOnly ? { background: '#074a75' } : {}}
              onClick={() => setShowCollabOnly(!showCollabOnly)}
            >
              <span className={cn("h-2 w-2 rounded-full", showCollabOnly ? "bg-emerald-400" : "bg-slate-300")} />
              Open for Collaboration
            </button>
          </div>
        </div>
      </div>

      {/* ── Projects Grid ── */}
      <div className="flex-1">
        <div className="container px-4 py-8">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white p-6 animate-pulse h-64">
                  <div className="h-4 w-20 rounded-full bg-slate-200 mb-4" />
                  <div className="h-5 w-3/4 rounded bg-slate-200 mb-3" />
                  <div className="h-3 w-full rounded bg-slate-100 mb-2" />
                  <div className="h-3 w-5/6 rounded bg-slate-100 mb-6" />
                  <div className="border-t border-slate-100 pt-4 flex justify-between">
                    <div className="h-6 w-24 rounded-full bg-slate-100" />
                    <div className="h-8 w-20 rounded-full bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-24 text-center">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(7,74,117,0.06)' }}>
                <Search className="h-7 w-7" style={{ color: '#94A3B8' }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#0F172A' }}>No matching projects</h3>
              <p className="text-sm mb-4" style={{ color: '#64748B' }}>Try adjusting your filters or search terms.</p>
              <button
                className="text-sm font-semibold"
                style={{ color: '#F37F20' }}
                onClick={() => { setSearchQuery(''); setSelectedLabId('all'); setSelectedGroupId('all'); setShowCollabOnly(false); }}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  group={groups.find(g => g.id === project.group_id)}
                  index={i}
                  onApply={(id) => {
                    setApplyProjectId(id);
                    setApplyDialogOpen(true);
                    setSubmitted(false);
                    setApplyForm({ fullName: '', email: '', institution: '', cv: '' });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Apply Dialog ── */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl" style={{ color: '#074a75' }}>Apply to Collaborate</DialogTitle>
            <DialogDescription className="text-sm" style={{ color: '#64748B' }}>
              Submit your details to express interest in this project.
            </DialogDescription>
          </DialogHeader>
          {submitted ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4" style={{ color: '#059669' }} />
              <h4 className="font-display font-bold text-lg mb-1" style={{ color: '#0F172A' }}>Application Submitted!</h4>
              <p className="text-sm" style={{ color: '#64748B' }}>The research team will review your application.</p>
            </div>
          ) : (
            <form
              className="space-y-4 pt-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmitting(true);
                try {
                  await apiRepository.createCollaborationSubmission({
                    collaboration_call_id: applyProjectId ?? undefined,
                    full_name: applyForm.fullName,
                    email: applyForm.email,
                    institution: applyForm.institution,
                    cv_url: applyForm.cv,
                  } as any);
                  setSubmitted(true);
                } catch {
                  toast({ title: 'Error', description: 'Failed to submit. Please try again.', variant: 'destructive' });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <div className="space-y-1.5">
                <Label className="text-sm font-medium" style={{ color: '#334155' }}>Full Name</Label>
                <Input className="rounded-lg" required value={applyForm.fullName} onChange={(e) => setApplyForm(f => ({ ...f, fullName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium" style={{ color: '#334155' }}>Email</Label>
                <Input type="email" className="rounded-lg" required value={applyForm.email} onChange={(e) => setApplyForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium" style={{ color: '#334155' }}>Institution</Label>
                <Input className="rounded-lg" required value={applyForm.institution} onChange={(e) => setApplyForm(f => ({ ...f, institution: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium" style={{ color: '#334155' }}>CV / Portfolio URL</Label>
                <Input className="rounded-lg" placeholder="https://..." value={applyForm.cv} onChange={(e) => setApplyForm(f => ({ ...f, cv: e.target.value }))} />
              </div>
              <Button type="submit" disabled={submitting} className="w-full rounded-lg h-11 font-semibold text-white" style={{ background: '#F37F20' }}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Submit Application</>}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
};

/* ── Project Card ── */

const ProjectCard = ({ project, group, index, onApply }: { project: Project; group?: ResearchGroup; index: number; onApply?: (projectId: number) => void }) => {
  const isOpen = project.accepting_collaborators;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="group/card relative rounded-2xl bg-white flex flex-col cursor-default overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300"
      style={{ borderTop: isOpen ? '3px solid #F37F20' : '3px solid #074a75' }}
    >
      {/* Card front */}
      <div className="p-6 flex flex-col flex-1">
        {/* Status row */}
        <div className="flex items-center justify-between mb-4">
          {isOpen ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: '#059669' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Open for Collaboration
            </span>
          ) : (
            <span className="text-[11px] font-medium" style={{ color: '#94A3B8' }}>Internal Project</span>
          )}
          <span className="text-[10px] font-medium" style={{ color: '#CBD5E1' }}>#{project.id}</span>
        </div>

        {/* Title */}
        <h4 className="font-display font-bold text-lg leading-snug mb-2 line-clamp-2" style={{ color: '#0F172A' }}>
          {project.title}
        </h4>

        {/* Description */}
        <p className="text-[13px] leading-relaxed line-clamp-2 mb-auto pb-4" style={{ color: '#64748B' }}>
          {project.description || 'Advancing research through collaborative efforts and rigorous experimentation.'}
        </p>

        {/* Divider + bottom row */}
        <div className="border-t" style={{ borderColor: '#F1F5F9' }} />
        <div className="flex items-center justify-between pt-4">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#94A3B8' }}>Team</span>
            <span className="text-sm font-semibold truncate" style={{ color: '#334155' }}>{group?.name || 'Independent'}</span>
          </div>
          {project.deadline && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium shrink-0" style={{ color: '#94A3B8' }}>
              <Calendar className="h-3 w-3" />
              {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      {/* Full-cover sliding navy panel */}
      <div
        className="absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center gap-4 -translate-x-full group-hover/card:translate-x-0 px-6"
        style={{
          background: '#074a75',
          transition: 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <h4 className="text-xl font-display font-bold text-white text-center leading-snug">{project.title}</h4>
        <p className="text-sm text-center leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {group?.name || 'Independent Research'}
        </p>
        <div className="flex flex-col items-center gap-2 mt-2">
          <Link
            to={`/discovery/projects/${project.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold group/link"
            style={{ color: '#F37F20' }}
          >
            View Project Details
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-1" />
          </Link>
          {isOpen && onApply && (
            <button
              className="inline-flex items-center gap-2 mt-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110"
              style={{ background: '#F37F20' }}
              onClick={(e) => { e.stopPropagation(); onApply(project.id); }}
            >
              <Send className="h-3.5 w-3.5" /> Apply Now
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
export default PublicProjects;
