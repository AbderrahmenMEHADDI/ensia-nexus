import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import { ApplicationStatusBadge, ProjectStatusBadge, RoleBadge } from '@/components/Badges';
import {
  canUserReviewProject,
  canUserReviewProjectApplication,
  getProjectStatus,
} from '@/lib/projectAccess';
import type {
  ProjectApplication,
  ProjectApplicationReviewerRatingInput,
  User,
  Project,
  ResearchGroup,
  ProjectParticipant,
  ProjectReviewStatus,
  GroupMember,
} from '@/types';
import { FileText, CheckCircle2, XCircle, MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StudentProfileModal } from '@/components/StudentProfileModal';
const Applications = () => {
  const { user, isTeacher } = useAuth();
  const { toast } = useToast();
  const [apps, setApps] = useState<ProjectApplication[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [participants, setParticipants] = useState<ProjectParticipant[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<number | null>(null);
  const [reviewingAppId, setReviewingAppId] = useState<number | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [filterProjectId, setFilterProjectId] = useState<number | 'all'>('all');
  const [ratingDrafts, setRatingDrafts] = useState<Record<number, ProjectApplicationReviewerRatingInput>>({});
  const [savingRatingAppId, setSavingRatingAppId] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [projectDecisionNote, setProjectDecisionNote] = useState('');
  const [reviewingProjectId, setReviewingProjectId] = useState<number | null>(null);
  const [viewingProfileUser, setViewingProfileUser] = useState<User | null>(null);

  const getUserById = (id: number) => users.find(u => u.id === id);
  const getProjectById = (id: number) => projects.find(p => p.id === id);
  const getGroupById = (id: number) => groups.find(g => g.id === id);

  useEffect(() => {
    const load = async () => {
      try {
        const [a, u, p, g, pp, gm] = await Promise.all([
          apiRepository.getApplications(),
          apiRepository.getUsers(),
          apiRepository.getProjects(),
          apiRepository.getGroups(),
          apiRepository.getProjectParticipants(),
          apiRepository.getGroupMembers(),
        ]);
        setApps(a);
        setUsers(u);
        setProjects(p);
        setGroups(g);
        setParticipants(pp);
        setGroupMembers(gm);
      } catch (e) {
        console.error('Applications load error:', e);
        toast({ title: 'Error loading applications', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const pendingProjectsForReview = useMemo(
    () =>
      projects.filter(
        project =>
          getProjectStatus(project) === 'PENDING' &&
          canUserReviewProject(user?.id, project, groups)
      ),
    [groups, projects, user?.id]
  );

  const sortedApps = useMemo(
    () => {
      const filtered = filterProjectId === 'all'
        ? apps
        : apps.filter(a => a.project_id === filterProjectId);

      return [...filtered].sort((a, b) => {
        const rankA = a.ranking?.rank_position ?? 999999;
        const rankB = b.ranking?.rank_position ?? 999999;
        if (rankA !== rankB) return rankA - rankB;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    },
    [apps, filterProjectId]
  );

  const displayApps = useMemo(() => {
    return sortedApps.filter(app => {
      if (!isTeacher) return true; // Students see all their own apps

      const p = getProjectById(app.project_id);
      if (!p) return false;
      const g = getGroupById(p.group_id);
      const isLeader = g?.leader_user_id === user?.id;

      if (isLeader) return true; // Group leaders see all relevant apps (Pending/Accepted)
      return app.status === 'ACCEPTED'; // Normal teachers only see accepted students
    });
  }, [sortedApps, user?.id, projects, groups, isTeacher]);

  const uniqueProjectIdsInApps = useMemo(() => Array.from(new Set(apps.map(a => a.project_id))), [apps]);

  const isAnyGroupLeader = useMemo(() => {
    return groups.some(g => g.leader_user_id === user?.id);
  }, [groups, user?.id]);

  const getDefaultRatingDraft = (app: ProjectApplication): ProjectApplicationReviewerRatingInput => {
    const myRating = app.reviewer_ratings?.find(r => r.reviewer_user_id === user?.id);
    if (myRating) {
      return {
        technical_fit: myRating.technical_fit,
        research_fit: myRating.research_fit,
        communication: myRating.communication,
        reliability_potential: myRating.reliability_potential,
        note: myRating.note || '',
      };
    }
    return {
      technical_fit: 3,
      research_fit: 3,
      communication: 3,
      reliability_potential: 3,
      note: '',
    };
  };

  const getRatingDraft = (app: ProjectApplication): ProjectApplicationReviewerRatingInput => {
    return ratingDrafts[app.id] || getDefaultRatingDraft(app);
  };

  const updateRatingDraft = (
    appId: number,
    key: keyof ProjectApplicationReviewerRatingInput,
    value: number | string
  ) => {
    setRatingDrafts(prev => {
      const current = prev[appId] || {
        technical_fit: 3,
        research_fit: 3,
        communication: 3,
        reliability_potential: 3,
        note: '',
      };
      return {
        ...prev,
        [appId]: {
          ...current,
          [key]: value,
        },
      };
    });
  };

  const handleSaveMyRating = async (app: ProjectApplication) => {
    setSavingRatingAppId(app.id);
    try {
      const draft = getRatingDraft(app);
      const saved = await apiRepository.upsertMyApplicationRating(app.id, draft);
      const refreshedRanking = await apiRepository.getApplicationRanking(app.id);

      setApps(prev =>
        prev.map(item => {
          if (item.id !== app.id) return item;
          const others = (item.reviewer_ratings || []).filter(r => r.reviewer_user_id !== saved.reviewer_user_id);
          return {
            ...item,
            reviewer_ratings: [saved, ...others],
            ranking: refreshedRanking,
          };
        })
      );

      toast({ title: 'Evaluation saved' });
    } catch (e) {
      toast({ title: 'Failed to save evaluation', variant: 'destructive' });
    } finally {
      setSavingRatingAppId(null);
    }
  };

  const handleReview = async (appId: number, decision: 'ACCEPTED' | 'REJECTED') => {
    setReviewingAppId(appId);
    try {
      const updated = await apiRepository.reviewApplication(appId, {
        status: decision,
        decision_note: decisionNote.trim() || undefined,
      });
      if (decision === 'REJECTED') {
        setApps(prev => prev.filter(a => a.id !== appId));
        toast({ title: 'Application rejected and removed' });
      } else {
        setApps(prev => prev.map(a => a.id === appId ? updated : a));
        toast({ title: `Application ${decision.toLowerCase()}` });
      }
    } catch (e) {
      toast({ title: 'Review failed', variant: 'destructive' });
    } finally {
      setReviewingAppId(null);
      setSelectedApp(null);
      setDecisionNote('');
    }
  };

  const handleProjectReview = async (projectId: number, decision: ProjectReviewStatus) => {
    setReviewingProjectId(projectId);
    try {
      const updated = await apiRepository.reviewProject(projectId, {
        status: decision,
        decision_note: projectDecisionNote.trim() || undefined,
      });
      setProjects(prev => prev.map(project => (project.id === projectId ? updated : project)));
      toast({ title: `Project ${decision === 'APPROVED' ? 'approved' : 'rejected'}` });
    } catch (e) {
      toast({ title: 'Project review failed', variant: 'destructive' });
    } finally {
      setReviewingProjectId(null);
      setSelectedProject(null);
      setProjectDecisionNote('');
    }
  };

  if (loading) {
    return (
      <div className="container py-10 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <motion.div >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-mono text-primary uppercase tracking-wider">Management</span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-1">
              {isTeacher 
                ? (isAnyGroupLeader ? 'Application Review' : 'Student Reviews') 
                : 'Application Access'}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              {isTeacher 
                ? (isAnyGroupLeader 
                    ? 'Review and manage applications for your research group projects.' 
                    : 'Evaluate students who have joined your projects.') 
                : 'View your submitted applications and their current status.'}
            </p>
          </div>
          {uniqueProjectIdsInApps.length > 0 && (
            <div className="flex flex-col gap-1.5 md:w-64">
              <label className="text-xs font-mono text-muted-foreground">Filter by Project</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                value={filterProjectId}
                onChange={e => setFilterProjectId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              >
                <option value="all">All Projects</option>
                {uniqueProjectIdsInApps.map(id => {
                  const p = getProjectById(id);
                  return (
                    <option key={id} value={id}>
                      {p ? p.title : `Project #${id}`}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {pendingProjectsForReview.length > 0 && (
          <div className="mb-8 p-5 rounded-xl border border-primary/20 bg-card space-y-4">
            <div>
              <h2 className="font-serif font-semibold text-foreground">Pending Projects To Review</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Only research group leaders can approve or reject pending projects.
              </p>
            </div>
            <div className="space-y-3">
              {pendingProjectsForReview.map(project => {
                const group = getGroupById(project.group_id);
                const isSelectedProject = selectedProject === project.id;

                return (
                  <div key={project.id} className="rounded-lg border border-border bg-background/40 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-foreground">{project.title}</h3>
                          <ProjectStatusBadge status={getProjectStatus(project)} />
                        </div>
                        <p className="text-xs text-muted-foreground">Group: {group?.name || 'Unknown group'}</p>
                      </div>
                      {!isSelectedProject && (
                        <button
                          onClick={() => setSelectedProject(project.id)}
                          className="text-sm font-mono text-primary hover:underline"
                        >
                          Review project →
                        </button>
                      )}
                    </div>

                    {isSelectedProject && (
                      <div className="space-y-3 mt-3 pt-3 border-t border-border">
                        <textarea
                          value={projectDecisionNote}
                          onChange={e => setProjectDecisionNote(e.target.value)}
                          rows={2}
                          placeholder="Optional decision note..."
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleProjectReview(project.id, 'APPROVED')}
                            disabled={reviewingProjectId === project.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-success/15 text-success text-sm font-medium hover:bg-success/25 transition-colors disabled:opacity-60"
                          >
                            {reviewingProjectId === project.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleProjectReview(project.id, 'REJECTED')}
                            disabled={reviewingProjectId === project.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-destructive/15 text-destructive text-sm font-medium hover:bg-destructive/25 transition-colors disabled:opacity-60"
                          >
                            {reviewingProjectId === project.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProject(null);
                              setProjectDecisionNote('');
                            }}
                            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Applications list */}
        <div className="space-y-4">
          {displayApps.map((app, i) => {
            const student = getUserById(app.student_user_id);
            const project = getProjectById(app.project_id);
            const reviewer = app.reviewed_by ? getUserById(app.reviewed_by) : null;
            const isSelected = selectedApp === app.id;
            const canReviewThisApp = project
              ? canUserReviewProjectApplication(user?.id, project, groups, participants)
              : false;
            const canRateAcceptedApp = project
              ? participants.some(p => p.project_id === project.id && p.user_id === user?.id)
              || groups.some(g => g.id === project.group_id && g.leader_user_id === user?.id)
              || groupMembers.some(m => m.group_id === project.group_id && m.user_id === user?.id && m.is_active)
              : false;
            const draft = getRatingDraft(app);
            const myExistingRating = app.reviewer_ratings?.find(r => r.reviewer_user_id === user?.id);

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {isTeacher && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-tighter">
                            {app.status === 'ACCEPTED' ? 'Review' : 'Application'}
                          </span>
                        )}
                        <h3 className="font-medium text-foreground">{project?.title || 'Unknown Project'}</h3>
                        <ApplicationStatusBadge status={app.status} />
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                        <span>by <button onClick={() => setViewingProfileUser(student || null)} className="hover:underline hover:text-primary transition-colors focus:outline-none">{student?.full_name || 'Unknown'}</button></span>
                        {student && <RoleBadge role={student.role} />}
                        <span>· Applied {new Date(app.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-secondary/50 mb-3">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-sm text-foreground/80 italic">{app.motivation}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 mb-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                      <span className="text-primary">Rank #{app.ranking?.rank_position ?? '-'}</span>
                      <span className="text-foreground">Final: {app.ranking?.final_score != null ? app.ranking.final_score.toFixed(2) : '-'} / 100</span>
                      <span className="text-muted-foreground">Model: {app.ranking?.model_score != null ? app.ranking.model_score.toFixed(2) : '-'}</span>
                      <span className="text-muted-foreground">Member eval: {app.ranking?.reviewer_score != null ? app.ranking.reviewer_score.toFixed(2) : '-'}</span>
                    </div>
                    {app.ranking?.explanation && (
                      <p className="text-xs text-muted-foreground mt-2">{app.ranking.explanation}</p>
                    )}
                  </div>

                  {app.decision_note && (
                    <div className="p-3 rounded-lg bg-muted/50 mb-3 text-sm">
                      <span className="text-xs font-mono text-muted-foreground">Decision note by {reviewer?.full_name}:</span>
                      <p className="text-foreground/80 mt-1">{app.decision_note}</p>
                    </div>
                  )}

                  {canRateAcceptedApp && app.status === 'ACCEPTED' && (
                    <div className="mb-3 p-3 rounded-lg border border-border bg-background/50">
                      <div className="text-xs font-mono text-muted-foreground mb-2">
                        Post-acceptance Member Evaluation {myExistingRating ? '(your evaluation is saved)' : ''}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                        <label className="text-xs text-muted-foreground">
                          Technical Fit
                          <select
                            value={draft.technical_fit}
                            onChange={e => updateRatingDraft(app.id, 'technical_fit', Number(e.target.value))}
                            className="mt-1 w-full px-2 py-2 rounded-md border border-border bg-background text-sm"
                          >
                            {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Research Fit
                          <select
                            value={draft.research_fit}
                            onChange={e => updateRatingDraft(app.id, 'research_fit', Number(e.target.value))}
                            className="mt-1 w-full px-2 py-2 rounded-md border border-border bg-background text-sm"
                          >
                            {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Communication
                          <select
                            value={draft.communication}
                            onChange={e => updateRatingDraft(app.id, 'communication', Number(e.target.value))}
                            className="mt-1 w-full px-2 py-2 rounded-md border border-border bg-background text-sm"
                          >
                            {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Reliability Potential
                          <select
                            value={draft.reliability_potential}
                            onChange={e => updateRatingDraft(app.id, 'reliability_potential', Number(e.target.value))}
                            className="mt-1 w-full px-2 py-2 rounded-md border border-border bg-background text-sm"
                          >
                            {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </label>
                      </div>
                      <textarea
                        value={draft.note || ''}
                        onChange={e => updateRatingDraft(app.id, 'note', e.target.value)}
                        rows={2}
                        placeholder="Optional reviewer note..."
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none mb-2"
                      />
                      <button
                        onClick={() => handleSaveMyRating(app)}
                        disabled={savingRatingAppId === app.id}
                        className="px-3 py-2 rounded-lg bg-primary/15 text-primary text-sm font-medium hover:bg-primary/25 transition-colors disabled:opacity-60"
                      >
                        {savingRatingAppId === app.id ? 'Saving...' : 'Save Evaluation'}
                      </button>
                    </div>
                  )}

                  {canReviewThisApp && app.status === 'PENDING' && (
                    <div>
                      {!isSelected ? (
                        <button
                          onClick={() => setSelectedApp(app.id)}
                          className="text-sm font-mono text-primary hover:underline"
                        >
                          Review this application →
                        </button>
                      ) : (
                        <div className="space-y-3 pt-2 border-t border-border">
                          <textarea
                            value={decisionNote}
                            onChange={e => setDecisionNote(e.target.value)}
                            rows={2}
                            placeholder="Add a decision note..."
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReview(app.id, 'ACCEPTED')}
                              disabled={reviewingAppId === app.id}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-success/15 text-success text-sm font-medium hover:bg-success/25 transition-colors disabled:opacity-60"
                            >
                              {reviewingAppId === app.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              Accept
                            </button>
                            <button
                              onClick={() => handleReview(app.id, 'REJECTED')}
                              disabled={reviewingAppId === app.id}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-destructive/15 text-destructive text-sm font-medium hover:bg-destructive/25 transition-colors disabled:opacity-60"
                            >
                              {reviewingAppId === app.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              Reject
                            </button>
                            <button
                              onClick={() => { setSelectedApp(null); setDecisionNote(''); }}
                              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          {displayApps.length === 0 && (
            <div className="text-muted-foreground text-center py-16">
              <FileText className="h-5 w-5 mx-auto mb-2" />
              <p>
                {isTeacher 
                  ? (isAnyGroupLeader ? 'No applications to review.' : 'No students to evaluate.') 
                  : 'No applications found.'}
              </p>
            </div>
          )}
        </div>
      </motion.div>
      <StudentProfileModal user={viewingProfileUser} onClose={() => setViewingProfileUser(null)} />
    </div>
  );
};

export default Applications;
