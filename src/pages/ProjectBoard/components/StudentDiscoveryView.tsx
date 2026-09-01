import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Calendar, FileText, Sparkles, FolderKanban, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ApplicationStatusBadge } from '@/components/Badges';
import type { Project, ProjectApplication, ResearchGroup } from '@/types';
import { apiRepository } from '@/repositories/apiRepository';
import { PublicationCard } from '@/components/shared/PublicationCard';
import { cn } from '@/lib/utils';

interface StudentDiscoveryViewProps {
  publicProjects: Project[];
  projects: Project[];
  applications: ProjectApplication[];
  getGroupById: (id: number) => ResearchGroup | undefined;
  getBlockingApplication: (projectId: number) => ProjectApplication | undefined;
  getApplyButtonLabel: (projectId: number) => string;
  handleOpenApply: (projectId: number) => void;
  applyOpen: boolean;
  setApplyOpen: (open: boolean) => void;
  applyMotivation: string;
  setApplyMotivation: (val: string) => void;
  applySubmitting: boolean;
  handleApplyToProject: () => void;
  className?: string;
}

export const StudentDiscoveryView = ({
  publicProjects,
  projects,
  applications,
  getGroupById,
  getBlockingApplication,
  getApplyButtonLabel,
  handleOpenApply,
  applyOpen,
  setApplyOpen,
  applyMotivation,
  setApplyMotivation,
  applySubmitting,
  handleApplyToProject,
  className = "container py-10",
}: StudentDiscoveryViewProps) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'papers'>('projects');
  const [publications, setPublications] = useState<any[]>([]);
  const [loadingPubs, setLoadingPubs] = useState(false);

  useEffect(() => {
    const fetchPubs = async () => {
      setLoadingPubs(true);
      try {
        const pubs = await apiRepository.getPublications({ include_independent: true, limit: 1000 });
        setPublications(pubs || []);
      } catch (err) {
        console.error('Failed to load publications in StudentDiscoveryView', err);
      } finally {
        setLoadingPubs(false);
      }
    };
    fetchPubs();
  }, []);

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8 border-b pb-6" style={{ borderColor: '#F1F5F9' }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#F47A1E' }}>Student Portal</span>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold mt-1" style={{ color: '#173C7E' }}>Project & Research Hub</h1>
          <p className="text-sm text-slate-500 mt-2">
            Explore approved public research projects, scientific papers, and track your application progress in real-time.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Public Projects or Papers */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tab Switcher: Projects (Default) vs Papers */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <button
                onClick={() => setActiveTab('projects')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                  activeTab === 'projects'
                    ? "bg-[#173C7E] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <FolderKanban className="h-4 w-4" />
                Available Projects ({publicProjects.length})
              </button>
              <button
                onClick={() => setActiveTab('papers')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                  activeTab === 'papers'
                    ? "bg-[#173C7E] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <BookOpen className="h-4 w-4" />
                Research Papers ({publications.length})
              </button>
            </div>

            {activeTab === 'projects' ? (
              <div className="grid sm:grid-cols-1 gap-4">
                {publicProjects.map(pubProject => {
                  const pubGroup = pubProject.group_id ? getGroupById(pubProject.group_id) : undefined;
                  const blockingApplication = getBlockingApplication(pubProject.id);

                return (
                  <div
                    key={pubProject.id}
                    className="rounded-xl border border-slate-100 p-5 bg-white shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-sm text-slate-800" style={{ color: '#0F172A' }}>{pubProject.title}</h3>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                          OPEN
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3 leading-relaxed">{pubProject.description || 'No description provided.'}</p>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-xs font-medium text-slate-400">
                        <span>Group: <strong className="text-slate-600">{pubGroup?.name || 'Independent'}</strong></span>
                        {pubProject.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Deadline: <strong className="text-slate-600">{new Date(pubProject.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t pt-4 mt-2" style={{ borderColor: '#F1F5F9' }}>
                      {blockingApplication ? (
                        <div className="flex items-center gap-2">
                          <ApplicationStatusBadge status={blockingApplication.status} />
                          {blockingApplication.ranking?.model_score !== undefined && (
                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                              {blockingApplication.ranking.model_score.toFixed(0)}% Fit
                            </span>
                          )}
                        </div>
                      ) : (
                        <div />
                      )}
                      <Button
                        size="sm"
                        className="rounded-lg font-semibold shadow-sm transition-all duration-200 hover:brightness-105"
                        style={{
                          background: blockingApplication ? '#E2E8F0' : '#F47A1E',
                          color: blockingApplication ? '#94A3B8' : '#FFFFFF'
                        }}
                        onClick={() => handleOpenApply(pubProject.id)}
                        disabled={Boolean(blockingApplication)}
                      >
                        {getApplyButtonLabel(pubProject.id)}
                      </Button>
                    </div>
                  </div>
                );
              })}
              {publicProjects.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                  <FolderKanban className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-600">No public projects available right now</p>
                  <p className="text-xs text-slate-400 mt-1">Check back later for new opportunities!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-1 gap-4">
              {loadingPubs ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                </div>
              ) : publications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                  <BookOpen className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-600">No research papers available right now</p>
                </div>
              ) : (
                publications.map(pub => (
                  <PublicationCard key={pub.id} publication={pub} />
                ))
              )}
            </div>
          )}
        </div>

          {/* Right Column: My Applications & Statuses */}
          <div className="lg:col-span-5 space-y-6 lg:border-l lg:pl-8" style={{ borderColor: '#F1F5F9' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold flex items-center gap-2" style={{ color: '#173C7E' }}>
                <FileText className="h-5 w-5" style={{ color: '#173C7E' }} />
                My Applications
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                {applications.length} Total
              </span>
            </div>

            <div className="space-y-4">
              {applications.map(app => {
                const appProject = projects.find(p => p.id === app.project_id);
                const appGroup = appProject && appProject.group_id ? getGroupById(appProject.group_id) : undefined;
                
                return (
                  <div
                    key={app.id}
                    className="rounded-xl border border-slate-100 p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden"
                    style={{
                      borderLeft: app.status === 'ACCEPTED' ? '4px solid #10B981' : 
                                  app.status === 'REJECTED' ? '4px solid #EF4444' : 
                                  '4px solid #F47A1E'
                    }}
                  >
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div>
                        <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">
                          {appProject ? appProject.title : `Project #${app.project_id}`}
                        </h4>
                        <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
                          Group: {appGroup?.name || 'Independent'}
                        </span>
                      </div>
                      <ApplicationStatusBadge status={app.status} />
                    </div>

                    {/* Matching score & Date */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t" style={{ borderColor: '#F8FAFC' }}>
                      <span className="flex items-center gap-1 font-mono">
                        Applied: {new Date(app.created_at).toLocaleDateString()}
                      </span>
                      {app.ranking?.model_score !== undefined && (
                        <span className="font-bold text-slate-600 flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                          <Sparkles className="h-3 w-3 text-amber-500" />
                          {app.ranking.model_score.toFixed(0)}% Match
                        </span>
                      )}
                    </div>

                    {/* Motivation snippet */}
                    {app.motivation && (
                      <div className="mt-3 bg-slate-50/70 p-2.5 rounded-lg border border-slate-50">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Your Motivation:</span>
                        <p className="text-[11px] text-slate-600 italic line-clamp-2 leading-relaxed">
                          "{app.motivation}"
                        </p>
                      </div>
                    )}

                    {/* Decision note / Feedback */}
                    {app.decision_note && (
                      <div
                        className="mt-3 p-3 rounded-lg border text-xs leading-relaxed"
                        style={{
                          background: app.status === 'ACCEPTED' ? '#ECFDF5' : '#FEF2F2',
                          borderColor: app.status === 'ACCEPTED' ? '#A7F3D0' : '#FCA5A5',
                          color: app.status === 'ACCEPTED' ? '#065F46' : '#991B1B'
                        }}
                      >
                        <span className="font-bold block mb-0.5">Feedback from Team:</span>
                        "{app.decision_note}"
                      </div>
                    )}
                  </div>
                );
              })}

              {applications.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                  <FileText className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-600">No active applications</p>
                  <p className="text-xs text-slate-400 mt-1">Browse public projects and submit your application to trace its status here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Application for Join Project</DialogTitle>
            <DialogDescription>
              Provide your motivation to apply for this public project.
              <br />
              <span className="text-muted-foreground text-xs mt-1 block">
                Note: The AI ranking model evaluates your application using your Motivation, Profile Skills/Bio/Interests, CV records, and Previous Projects. Make sure your profile is fully updated!
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Motivation</Label>
              <Textarea
                rows={4}
                value={applyMotivation}
                onChange={e => setApplyMotivation(e.target.value)}
                placeholder="Describe why your skills and experience make you a good fit. (Include details relevant to the project)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button onClick={handleApplyToProject} disabled={applySubmitting || !applyMotivation.trim()}>
              {applySubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
