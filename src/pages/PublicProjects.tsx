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
import type { Project, ResearchGroup, ResearchLab, CollaborationCall } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { getAppliedCollaborations, markCollaborationAsApplied } from '@/lib/cookies';

const PublicProjects = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [labs, setLabs] = useState<ResearchLab[]>([]);
  const [openCalls, setOpenCalls] = useState<CollaborationCall[]>([]);
  const [appliedCallIds, setAppliedCallIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabId, setSelectedLabId] = useState('all');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [showCollabOnly, setShowCollabOnly] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyCallId, setApplyCallId] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, g, l, calls] = await Promise.all([
          apiRepository.getProjects(),
          apiRepository.getGroups(),
          apiRepository.getLabs(),
          apiRepository.getOpenCollaborationCalls(500),
        ]);
        setProjects(p.filter(project => project.status === 'APPROVED' && project.visibility === 'PUBLIC'));
        setGroups(g);
        setLabs(l);
        setOpenCalls(calls);
        setAppliedCallIds(getAppliedCollaborations());
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
              <h1 className="text-2xl md:text-3xl font-display font-bold" style={{ color: '#173C7E' }}>
                Project Board
              </h1>
              <div className="w-10 h-1 rounded-full mt-2 mb-1" style={{ background: '#F47A1E' }} />
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
                className="pl-10 h-10 rounded-lg border-slate-200 text-sm focus-visible:ring-1 focus-visible:ring-[#173C7E]/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter selects */}
            <select
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white cursor-pointer focus:ring-1 focus:ring-[#173C7E]/30 outline-none"
              value={selectedLabId}
              onChange={(e) => { setSelectedLabId(e.target.value); setSelectedGroupId('all'); }}
            >
              <option value="all">All Labs</option>
              {labs.map(lab => (
                <option key={lab.id} value={String(lab.id)}>{lab.name}</option>
              ))}
            </select>

            <select
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white cursor-pointer focus:ring-1 focus:ring-[#173C7E]/30 outline-none"
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
                  : "border-slate-200 text-[#475569] hover:border-[#173C7E]/30"
              )}
              style={showCollabOnly ? { background: '#173C7E' } : {}}
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
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(23,60,126,0.06)' }}>
                <Search className="h-7 w-7" style={{ color: '#94A3B8' }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#0F172A' }}>No matching projects</h3>
              <p className="text-sm mb-4" style={{ color: '#64748B' }}>Try adjusting your filters or search terms.</p>
              <button
                className="text-sm font-semibold"
                style={{ color: '#F47A1E' }}
                onClick={() => { setSearchQuery(''); setSelectedLabId('all'); setSelectedGroupId('all'); setShowCollabOnly(false); }}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, i) => {
                const assocCall = openCalls.find(c => c.project_id === project.id);
                const callId = assocCall ? assocCall.id : null;
                const applied = callId ? appliedCallIds.includes(callId) : false;
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    group={groups.find(g => g.id === project.group_id)}
                    index={i}
                    callId={callId}
                    applied={applied}
                    onApply={(cId) => {
                      setApplyCallId(cId);
                      setApplyDialogOpen(true);
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Apply/Join Dialog ── */}
      <ApplyDialog
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        callId={applyCallId}
        onApplied={(cId) => {
          markCollaborationAsApplied(cId);
          setAppliedCallIds(getAppliedCollaborations());
        }}
      />
    </PublicLayout>
  );
};

/* ── Project Card ── */

const ProjectCard = ({
  project,
  group,
  index,
  callId,
  applied,
  onApply
}: {
  project: Project;
  group?: ResearchGroup;
  index: number;
  callId: number | null;
  applied: boolean;
  onApply?: (callId: number) => void;
}) => {
  const isOpen = project.accepting_collaborators;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="group/card relative rounded-2xl bg-white flex flex-col cursor-default overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300"
      style={{ borderTop: isOpen ? '3px solid #F47A1E' : '3px solid #173C7E' }}
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
          background: '#173C7E',
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
            style={{ color: '#F47A1E' }}
          >
            View Project Details
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-1" />
          </Link>
          {isOpen && callId && onApply && (
            applied ? (
              <button
                disabled
                className="inline-flex items-center gap-1.5 mt-2 h-9 px-5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Applied
              </button>
            ) : (
              <button
                className="inline-flex items-center gap-1.5 mt-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110 group/btn"
                style={{ background: '#F47A1E' }}
                onClick={(e) => { e.stopPropagation(); onApply(callId); }}
              >
                <Send className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" /> Join
              </button>
            )
          )}
        </div>
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

export default PublicProjects;
