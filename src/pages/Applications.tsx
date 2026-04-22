import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import {
  FileText,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  Filter,
  Star,
  ShieldCheck,
  UserCircle2,
  Calendar,
  ChevronDown,
  BarChart3,
  Cpu,
  Microscope,
  MessagesSquare,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StudentProfileModal } from '@/components/StudentProfileModal';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [expandedAnalysis, setExpandedAnalysis] = useState<number[]>([]);

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
      if (!isTeacher) return true;

      const p = getProjectById(app.project_id);
      if (!p) return false;
      const g = getGroupById(p.group_id);
      const isLeader = g?.leader_user_id === user?.id;

      if (isLeader) return true;
      return app.status === 'ACCEPTED';
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
    return { technical_fit: 3, research_fit: 3, communication: 3, reliability_potential: 3, note: '' };
  };

  const getRatingDraft = (app: ProjectApplication): ProjectApplicationReviewerRatingInput => {
    return ratingDrafts[app.id] || getDefaultRatingDraft(app);
  };

  const updateRatingDraft = (appId: number, key: keyof ProjectApplicationReviewerRatingInput, value: number | string) => {
    setRatingDrafts(prev => {
      const current = prev[appId] || { technical_fit: 3, research_fit: 3, communication: 3, reliability_potential: 3, note: '' };
      return { ...prev, [appId]: { ...current, [key]: value } };
    });
  };

  const toggleAnalysis = (appId: number) => {
    setExpandedAnalysis(prev => prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]);
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
          return { ...item, reviewer_ratings: [saved, ...others], ranking: refreshedRanking };
        })
      );

      toast({ title: 'Evaluation saved', description: 'Student metrics have been updated.' });
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
        toast({ title: 'Application rejected' });
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
      setProjects(prev => prev.map(p => (p.id === projectId ? updated : p)));
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Syncing review board...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto px-4">
      {/* Header Section */}
      <div className="relative mb-12">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {isTeacher ? (isAnyGroupLeader ? 'Application' : 'Student') : 'My'} <span className="text-primary italic">Reviews</span>
            </h1>
          </div>

          {uniqueProjectIdsInApps.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="bg-secondary/50 p-1 rounded-xl border border-border flex items-center gap-2">
                <Select
                  value={filterProjectId.toString()}
                  onValueChange={(val) => setFilterProjectId(val === 'all' ? 'all' : Number(val))}
                >
                  <SelectTrigger className="w-[200px] border-none bg-transparent focus:ring-0 h-9">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {uniqueProjectIdsInApps.map(id => {
                      const p = getProjectById(id);
                      return <SelectItem key={id} value={id.toString()}>{p?.title || `Project #${id}`}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending Projects Alert Section */}
      <AnimatePresence>
        {pendingProjectsForReview.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-10"
          >
            <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Action Required: Projects Awaiting Approval</h2>
              </div>
              <div className="grid gap-3">
                {pendingProjectsForReview.map(project => (
                  <Card key={project.id} className="border-border/50 shadow-sm overflow-hidden group">
                    <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-primary">
                          {project.title.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-sm">{project.title}</CardTitle>
                          <CardDescription className="text-[10px]">
                            Research Group: {getGroupById(project.group_id)?.name}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant={selectedProject === project.id ? "secondary" : "ghost"}
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
                      >
                        {selectedProject === project.id ? 'Cancel' : 'Review Project'}
                        <ArrowRight className="h-3 w-3 ml-1.5" />
                      </Button>
                    </CardHeader>
                    {selectedProject === project.id && (
                      <CardContent className="px-4 pb-4 pt-2 border-t bg-secondary/10">
                        <textarea
                          value={projectDecisionNote}
                          onChange={e => setProjectDecisionNote(e.target.value)}
                          rows={2}
                          placeholder="Add a decision note (optional)..."
                          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none mb-3"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => handleProjectReview(project.id, 'APPROVED')}>
                            Approve Project
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleProjectReview(project.id, 'REJECTED')}>
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Applications list */}
      <div className="space-y-6">
        {displayApps.map((app, i) => {
          const student = getUserById(app.student_user_id);
          const project = getProjectById(app.project_id);
          const reviewer = app.reviewed_by ? getUserById(app.reviewed_by) : null;
          const isSelected = selectedApp === app.id;
          const isAnalysisExpanded = expandedAnalysis.includes(app.id);

          const canReviewThisApp = project ? canUserReviewProjectApplication(user?.id, project, groups, participants) : false;
          const canRateAcceptedApp = project ? (
            participants.some(p => p.project_id === project.id && p.user_id === user?.id) ||
            groups.some(g => g.id === project.group_id && g.leader_user_id === user?.id) ||
            groupMembers.some(m => m.group_id === project.group_id && m.user_id === user?.id && m.is_active)
          ) : false;

          const draft = getRatingDraft(app);
          const myExistingRating = app.reviewer_ratings?.find(r => r.reviewer_user_id === user?.id);

          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="overflow-hidden border-border hover:shadow-md transition-shadow group">
                <div className={cn(
                  "h-1 w-full bg-gradient-to-r",
                  app.status === 'ACCEPTED' ? "from-success/50 to-success" : "from-primary/50 to-primary"
                )} />

                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <ProfileAvatar
                        userId={student?.id}
                        name={student?.full_name}
                        className="h-14 w-14 rounded-2xl ring-2 ring-secondary shadow-sm"
                        textClassName="text-lg font-bold"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-xl">{student?.full_name || 'Candidate'}</CardTitle>
                          <ApplicationStatusBadge status={app.status} />
                          {isTeacher && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-widest border border-primary/20">
                              {app.status === 'ACCEPTED' ? 'Review' : 'Pending'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Applied {new Date(app.created_at).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><UserCircle2 className="h-3.5 w-3.5" />{project?.title || 'Unknown Project'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="bg-secondary/30 px-4 py-2 rounded-2xl border border-border flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Rank</div>
                          <div className="text-lg font-black text-primary">#{app.ranking?.rank_position ?? '-'}</div>
                        </div>
                        <div className="w-px h-8 bg-border/50" />
                        <div className="text-center">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Final Score</div>
                          <div className="text-lg font-black text-foreground">{app.ranking?.final_score != null ? app.ranking.final_score.toFixed(1) : '-'}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] h-7 font-bold uppercase tracking-widest gap-1.5"
                        onClick={() => toggleAnalysis(app.id)}
                      >
                        <BarChart3 className="h-3 w-3" />
                        {isAnalysisExpanded ? 'Hide Analysis' : 'Show Analysis'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Analysis Dropdown */}
                  <AnimatePresence>
                    {isAnalysisExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                              <Star className="h-3.5 w-3.5 text-primary" />
                              Scoring Breakdown
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">AI Model Score</span>
                                <span className="font-mono font-bold text-primary">{app.ranking?.model_score?.toFixed(1) || '0.0'}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Reviewer Average</span>
                                <span className="font-mono font-bold text-primary">{app.ranking?.reviewer_score?.toFixed(1) || '0.0'}</span>
                              </div>
                              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-1">
                                <div className="h-full bg-primary" style={{ width: `${app.ranking?.final_score || 0}%` }} />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                              <MessageSquare className="h-3.5 w-3.5 text-primary" />
                              AI Insights
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                              "{app.ranking?.explanation || "No automated explanation generated for this ranking."}"
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Motivation Section */}
                  <div className="relative p-3 rounded-2xl bg-secondary/40 border border-border/50 italic text-sm text-foreground/80 leading-relaxed group-hover:bg-secondary/60 transition-colors">
                    "{app.motivation || "No motivation letter provided."}"
                  </div>

                  {/* Decision Info */}
                  {app.decision_note && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/50 text-sm">
                      <UserCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Note from {reviewer?.full_name}:</span>
                        <p className="mt-1 text-foreground/90 leading-relaxed">{app.decision_note}</p>
                      </div>
                    </div>
                  )}

                  {/* Member Evaluation Form */}
                  {canRateAcceptedApp && app.status === 'ACCEPTED' && (
                    <div className="pt-6 border-t border-border/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-primary" />
                          <h4 className="text-sm font-bold uppercase tracking-widest">Mentor Evaluation</h4>
                        </div>
                        {myExistingRating && (
                          <span className="text-[10px] font-bold text-success flex items-center gap-1 bg-success/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Already Rated
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {[
                          { key: 'technical_fit', label: 'Technical Fit', icon: Cpu },
                          { key: 'research_fit', label: 'Research Fit', icon: Microscope },
                          { key: 'communication', label: 'Communication', icon: MessagesSquare },
                          { key: 'reliability_potential', label: 'Reliability', icon: Activity },
                        ].map(({ key, label, icon: Icon }) => (
                          <div key={key} className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                              <Icon className="h-3 w-3" />
                              {label}
                            </label>
                            <Select
                              value={draft[key as keyof ProjectApplicationReviewerRatingInput]?.toString()}
                              onValueChange={(v) => updateRatingDraft(app.id, key as any, Number(v))}
                            >
                              <SelectTrigger className="h-10 rounded-xl bg-background shadow-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map(v => (
                                  <SelectItem key={v} value={v.toString()}>{v} — {['Poor', 'Fair', 'Good', 'Very Good', 'Expert'][v - 1]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <textarea
                          value={draft.note || ''}
                          onChange={e => updateRatingDraft(app.id, 'note', e.target.value)}
                          rows={1}
                          placeholder="Confidential reviewer notes for this student..."
                          className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none transition-all"
                        />
                        <Button
                          className="h-auto rounded-xl px-6 self-stretch shadow-sm"
                          onClick={() => handleSaveMyRating(app)}
                          disabled={savingRatingAppId === app.id}
                        >
                          {savingRatingAppId === app.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            null
                          )}
                          Save Scores
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Decision Buttons for Pending */}
                  {canReviewThisApp && app.status === 'PENDING' && (
                    <div className="pt-6 border-t border-border/50">
                      {!isSelected ? (
                        <Button className="w-full rounded-2xl h-12 text-sm font-bold shadow-sm group/btn" onClick={() => setSelectedApp(app.id)}>
                          Evaluate Candidate Decision
                          <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4"
                        >
                          <textarea
                            value={decisionNote}
                            onChange={e => setDecisionNote(e.target.value)}
                            rows={2}
                            placeholder="Add a reason for your decision..."
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                          />
                          <div className="flex gap-2">
                            <Button className="flex-1 h-11 rounded-xl bg-success hover:bg-success/90 font-bold" onClick={() => handleReview(app.id, 'ACCEPTED')}>
                              Approve Candidate
                            </Button>
                            <Button className="flex-1 h-11 rounded-xl bg-destructive hover:bg-destructive/90 font-bold" onClick={() => handleReview(app.id, 'REJECTED')}>
                              Reject Application
                            </Button>
                            <Button variant="ghost" className="h-11 rounded-xl px-6 font-semibold" onClick={() => { setSelectedApp(null); setDecisionNote(''); }}>
                              Cancel
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {displayApps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-3xl bg-secondary/20">
            <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center mb-4 shadow-sm">
              <FileText className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold">No records found</h3>
            <p className="text-sm text-muted-foreground max-w-xs text-center">
              {isTeacher
                ? (isAnyGroupLeader ? 'There are currently no new applications for your research projects.' : 'No students have been assigned to your projects for evaluation yet.')
                : 'You have not submitted any applications yet.'}
            </p>
          </div>
        )}
      </div>

      <StudentProfileModal user={viewingProfileUser} onClose={() => setViewingProfileUser(null)} />
    </div>
  );
};

export default Applications;
