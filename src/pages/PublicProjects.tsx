import { useEffect, useState, useMemo } from 'react';
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
import { ProjectCard } from '@/components/shared/ProjectCard';
import { PublicationCard } from '@/components/shared/PublicationCard';

const PublicProjects = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'projects' | 'papers'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [labs, setLabs] = useState<ResearchLab[]>([]);
  const [openCalls, setOpenCalls] = useState<CollaborationCall[]>([]);
  const [appliedCallIds, setAppliedCallIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFocusArea, setSelectedFocusArea] = useState('all');
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
        const [p, g, l, calls, pubs] = await Promise.all([
          apiRepository.getProjects(),
          apiRepository.getGroups(),
          apiRepository.getLabs(),
          apiRepository.getOpenCollaborationCalls(500),
          apiRepository.getPublications({ include_independent: true, limit: 1000 }),
        ]);
        setProjects(p.filter(project => project.status === 'APPROVED' && project.visibility === 'PUBLIC'));
        setGroups(g);
        setLabs(l);
        setOpenCalls(calls);
        setPublications(pubs || []);
        setAppliedCallIds(getAppliedCollaborations());
      } catch (err) {
        console.error('Failed to load projects & publications', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Get all unique focus areas
  const allFocusAreas = useMemo(() => {
    const areas = new Set<string>();
    projects.forEach(p => {
      if (p.focus_areas) {
        p.focus_areas.split(',').forEach(a => {
          const trimmed = a.trim();
          if (trimmed) areas.add(trimmed);
        });
      }
    });
    return Array.from(areas).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFocusArea = selectedFocusArea === 'all' || 
        (p.focus_areas && p.focus_areas.split(',').map(a => a.trim()).includes(selectedFocusArea));
      const matchesCollab = !showCollabOnly || p.accepting_collaborators;
      return matchesSearch && matchesFocusArea && matchesCollab;
    });
  }, [projects, searchQuery, selectedFocusArea, showCollabOnly]);

  const filteredPublications = useMemo(() => {
    return publications.filter(pub => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        pub.title?.toLowerCase().includes(q) ||
        pub.abstract?.toLowerCase().includes(q) ||
        pub.venue?.toLowerCase().includes(q) ||
        pub.journal?.toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [publications, searchQuery]);

  return (
    <PublicLayout>
      {/* ── Compact Header + Filters ── */}
      <div className="border-b" style={{ borderColor: '#E2E8F0' }}>
        <div className="container px-4 py-6">
          {/* Title row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold" style={{ color: '#173C7E' }}>
                Projects & Research Hub
              </h1>
              <div className="w-10 h-1 rounded-full mt-2 mb-1" style={{ background: '#F47A1E' }} />
              <p className="text-sm" style={{ color: '#64748B' }}>
                {activeTab === 'projects'
                  ? `Explore ${projects.length} research projects by AISI research team.`
                  : `Explore ${publications.length} research papers and publications by AISI research team.`}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#64748B' }}>
              {activeTab === 'projects' ? <FolderOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              {activeTab === 'projects' ? `${filteredProjects.length} results` : `${filteredPublications.length} results`}
            </div>
          </div>

          {/* Tab Switcher: Projects (Default) vs Papers */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setActiveTab('projects')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs",
                activeTab === 'projects'
                  ? "bg-[#173C7E] text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              <FolderOpen className="h-4 w-4" />
              Projects ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('papers')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs",
                activeTab === 'papers'
                  ? "bg-[#173C7E] text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              <FileText className="h-4 w-4" />
              Papers ({publications.length})
            </button>
          </div>

          {/* Search + Filters row */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#94A3B8' }} />
              <Input
                placeholder={activeTab === 'projects' ? "Search by title, topic, or tech..." : "Search papers by title, abstract, or venue..."}
                className="pl-10 h-10 rounded-lg border-slate-200 text-sm focus-visible:ring-1 focus-visible:ring-[#173C7E]/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter selects (Projects Tab only) */}
            {activeTab === 'projects' && (
              <>
                <select
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white cursor-pointer focus:ring-1 focus:ring-[#173C7E]/30 outline-none max-w-xs"
                  value={selectedFocusArea}
                  onChange={(e) => setSelectedFocusArea(e.target.value)}
                >
                  <option value="all">All Focus Areas</option>
                  {allFocusAreas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>

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
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Grid Content ── */}
      <div className="flex-1">
        <div className="container px-4 py-8">
          {loading ? (
            <div className="grid md:grid-cols-2 gap-6">
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
          ) : activeTab === 'projects' ? (
            filteredProjects.length === 0 ? (
              <div className="py-24 text-center">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(23,60,126,0.06)' }}>
                  <Search className="h-7 w-7" style={{ color: '#94A3B8' }} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#0F172A' }}>No matching projects</h3>
                <p className="text-sm mb-4" style={{ color: '#64748B' }}>Try adjusting your filters or search terms.</p>
                <button
                  className="text-sm font-semibold"
                  style={{ color: '#F47A1E' }}
                  onClick={() => { setSearchQuery(''); setSelectedFocusArea('all'); setShowCollabOnly(false); }}
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredProjects.map((project) => {
                  const assocCall = openCalls.find(c => c.project_id === project.id);
                  const callId = assocCall ? assocCall.id : null;
                  const applied = callId ? appliedCallIds.includes(callId) : false;
                  return (
                    <ProjectCard
                      key={project.id}
                      project={{
                        ...project,
                        group: groups.find(g => g.id === project.group_id)
                      }}
                      to={`/discovery/projects/${project.id}`}
                      callId={callId}
                      applied={applied}
                      showFeaturedAccent={false}
                      onApply={(cId) => {
                        setApplyCallId(cId);
                        setApplyDialogOpen(true);
                      }}
                    />
                  );
                })}
              </div>
            )
          ) : (
            /* activeTab === 'papers' */
            filteredPublications.length === 0 ? (
              <div className="py-24 text-center">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(23,60,126,0.06)' }}>
                  <FileText className="h-7 w-7" style={{ color: '#94A3B8' }} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#0F172A' }}>No matching research papers</h3>
                <p className="text-sm mb-4" style={{ color: '#64748B' }}>Try adjusting your search terms.</p>
                <button
                  className="text-sm font-semibold"
                  style={{ color: '#F47A1E' }}
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredPublications.map((pub) => (
                  <PublicationCard key={pub.id} publication={pub} />
                ))}
              </div>
            )
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
