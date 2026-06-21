import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import { ApplicationStatusBadge, ProjectStatusBadge, RoleBadge } from '@/components/Badges';
import {
  canUserReviewProjectApplication,
  getProjectStatus,
} from '@/lib/projectAccess';
import type {
  ProjectApplication,
  User,
  Project,
  ResearchGroup,
  ProjectParticipant,
  ProjectReviewStatus,
  GroupMember,
  CollaborationCall,
  CollaborationSubmission,
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
  ArrowRight,
  Building,
  Building2,
  Mail,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

  const [viewingProfileUser, setViewingProfileUser] = useState<User | null>(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState<number[]>([]);
  const [expandedCards, setExpandedCards] = useState<number[]>([]);

  const toggleCard = (id: number) => {
    setExpandedCards(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Unified Active Tab State
  const [activeTab, setActiveTab] = useState<'students' | 'collaborations' | 'external'>('students');

  // External submissions state
  const [externalSubmissions, setExternalSubmissions] = useState<CollaborationSubmission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [submissionDecisionNote, setSubmissionDecisionNote] = useState('');
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<number | null>(null);



  const getUserById = (id: number) => users.find(u => u.id === id);
  const getProjectById = (id: number) => projects.find(p => p.id === id);
  const getGroupById = (id?: number | null) => id ? groups.find(g => g.id === id) : undefined;

  useEffect(() => {
    const load = async () => {
      try {
        const [a, initialUsers, p, g, pp, gm] = await Promise.all([
          apiRepository.getApplications(),
          apiRepository.getUsers(),
          apiRepository.getProjects(),
          apiRepository.getGroups(),
          apiRepository.getProjectParticipants(),
          apiRepository.getGroupMembers(),
        ]);

        let u = [...initialUsers];
        const missingUserIds = Array.from(new Set(
          a.map(app => app.student_user_id).filter(id => id && !u.some(usr => usr.id === id))
        )) as number[];

        if (missingUserIds.length > 0) {
          try {
            const fetchedMissing = await Promise.all(
              missingUserIds.map(id => apiRepository.getUser(id).catch(() => null))
            );
            const validFetched = fetchedMissing.filter((x): x is User => x !== null);
            u = [...u, ...validFetched];
          } catch (fetchErr) {
            console.error('Error fetching missing users:', fetchErr);
          }
        }

        setApps(a);
        setUsers(u);
        setProjects(p);
        setGroups(g);
        setParticipants(pp);
        setGroupMembers(gm);

        if (isTeacher) {
          try {
            const extSubs = await apiRepository.getReceivedCollaborationSubmissions();
            setExternalSubmissions(extSubs);
          } catch (e) {
            console.error('Error fetching received collaboration submissions:', e);
          }
        }


      } catch (e) {
        console.error('Applications load error:', e);
        toast({ title: 'Error loading applications', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast, isTeacher, user]);





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

      // Teachers who have review access (e.g. group leader, project lead/reviewer, or individual project creator)
      // should see all applications (including PENDING) for their projects.
      const canReview = canUserReviewProjectApplication(user?.id, p, groups, participants);
      if (canReview) return true;

      // Otherwise, they only see the student if the application was already accepted.
      return app.status === 'ACCEPTED';
    });
  }, [sortedApps, user?.id, projects, groups, participants, isTeacher]);


  const filteredExternalSubmissions = useMemo(() => {
    return externalSubmissions.filter(sub => {
      if (filterProjectId === 'all') return true;
      return sub.call?.project_id === filterProjectId;
    });
  }, [externalSubmissions, filterProjectId]);

  const uniqueProjectIds = useMemo(() => {
    const ids = new Set<number>();
    apps.forEach(a => ids.add(a.project_id));
    externalSubmissions.forEach(sub => {
      if (sub.call?.project_id) ids.add(sub.call.project_id);
    });
    return Array.from(ids);
  }, [apps, externalSubmissions]);

  const isAnyGroupLeader = useMemo(() => {
    return groups.some(g => g.leader_user_id === user?.id);
  }, [groups, user?.id]);



  const toggleAnalysis = (appId: number) => {
    setExpandedAnalysis(prev => prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]);
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



  const handleSubmissionReview = async (submissionId: number, decision: 'ACCEPTED' | 'REJECTED') => {
    setReviewingSubmissionId(submissionId);
    try {
      await apiRepository.updateCollaborationSubmission(submissionId, {
        status: decision,
        decision_note: submissionDecisionNote.trim() || undefined,
      });

      if (decision === 'REJECTED') {
        setExternalSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
        toast({ title: 'Submission rejected successfully' });
      } else {
        setExternalSubmissions(prev =>
          prev.map(sub => (sub.id === submissionId ? { ...sub, status: decision, decision_note: submissionDecisionNote.trim() || undefined } : sub))
        );
        toast({ title: `Submission ${decision.toLowerCase()} successfully` });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Review failed', variant: 'destructive' });
    } finally {
      setReviewingSubmissionId(null);
      setSelectedSubmissionId(null);
      setSubmissionDecisionNote('');
    }
  };

  const handleViewStudentProfile = async (studentUserId?: number) => {
    if (!studentUserId) return;
    const existing = users.find(u => u.id === studentUserId);
    if (existing) {
      setViewingProfileUser(existing);
      return;
    }
    try {
      const fetched = await apiRepository.getUser(studentUserId);
      setUsers(prev => [...prev, fetched]);
      setViewingProfileUser(fetched);
    } catch (err) {
      console.error("Failed to fetch user profile", err);
      toast({ title: "Failed to load student profile", variant: "destructive" });
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
      <div className="relative mb-8">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {isTeacher ? (isAnyGroupLeader ? 'Application' : 'Student') : 'My'} <span className="text-primary italic">Reviews</span>
            </h1>
          </div>

          {(activeTab === 'students' || activeTab === 'external') && uniqueProjectIds.length > 0 && (
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
                    {uniqueProjectIds.map(id => {
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

      {/* Segmented Tab Switcher */}
      {user?.role !== 'STUDENT' && (
        <div className="flex flex-wrap border-b border-border mb-8 gap-6">
          <button
            onClick={() => setActiveTab('students')}
            className={cn(
              "pb-4 text-sm font-semibold tracking-wide border-b-2 transition-all px-2 flex items-center gap-2",
              activeTab === 'students'
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Student Applications
            <Badge variant="secondary" className="px-1.5 py-0.5 rounded-full text-[10px]">
              {displayApps.length}
            </Badge>
          </button>



          {isTeacher && (
            <button
              onClick={() => setActiveTab('external')}
              className={cn(
                "pb-4 text-sm font-semibold tracking-wide border-b-2 transition-all px-2 flex items-center gap-2",
                activeTab === 'external'
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              External Submissions
              <Badge variant="secondary" className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary border-primary/20">
                {filteredExternalSubmissions.length}
              </Badge>
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="space-y-6">
        {activeTab === 'students' && (
          /* Student Applications List */
          <div className="space-y-6">
              {displayApps.map((app, i) => {
                const student = getUserById(app.student_user_id);
                const project = getProjectById(app.project_id);
                const reviewer = app.reviewed_by ? getUserById(app.reviewed_by) : null;
                const isSelected = selectedApp === app.id;
                const isAnalysisExpanded = expandedAnalysis.includes(app.id);
                const isCardExpanded = expandedCards.includes(app.id);

                const canReviewThisApp = project ? canUserReviewProjectApplication(user?.id, project, groups, participants) : false;


                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="overflow-hidden border-border hover:border-border transition-all duration-200 rounded-2xl bg-card/40 hover:bg-card/75 shadow-sm group">
                      <div className={cn(
                        "h-1 w-full bg-gradient-to-r",
                        app.status === 'ACCEPTED' ? "from-success/50 to-success" : "from-primary/50 to-primary"
                      )} />

                      {/* Compact Header Row */}
                      <div
                        onClick={() => toggleCard(app.id)}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewStudentProfile(app.student_user_id);
                            }}
                            className="cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                          >
                            <ProfileAvatar
                              userId={student?.id}
                              name={student?.full_name}
                              className="h-10 w-10 rounded-xl ring-1 ring-border shadow-sm shrink-0"
                              textClassName="text-sm font-bold"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewStudentProfile(app.student_user_id);
                                }}
                                className="text-sm font-extrabold text-foreground tracking-tight truncate max-w-[180px] cursor-pointer hover:text-primary transition-colors"
                              >
                                {student?.full_name || 'Candidate'}
                              </h4>
                              <ApplicationStatusBadge status={app.status} />
                              {isTeacher && (
                                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider border border-primary/15 shrink-0">
                                  {app.status === 'ACCEPTED' ? 'Review' : 'Pending'}
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-muted-foreground truncate max-w-[200px] flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" /> {new Date(app.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Middle Section: Project details */}
                        <div className="flex-1 min-w-0 sm:px-4 text-xs font-semibold text-muted-foreground truncate">
                          Project: <span className="text-foreground font-bold">{project?.title || 'Unknown Project'}</span>
                        </div>

                        {/* Score & Rank Badges */}
                        <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                          <div className="flex items-center gap-1.5">
                            {app.ranking?.rank_position != null && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                                Rank #{app.ranking.rank_position}
                              </span>
                            )}
                            {app.ranking?.final_score != null && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/20 shrink-0">
                                Score: {app.ranking.final_score.toFixed(1)}
                              </span>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCard(app.id);
                            }}
                          >
                            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", isCardExpanded && "rotate-180")} />
                          </Button>
                        </div>
                      </div>

                      {/* Expandable Details */}
                      <AnimatePresence initial={false}>
                        {isCardExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <CardContent className="px-4 pb-4 pt-2 border-t border-border/40 space-y-4">
                              {/* Analysis & Details Button */}
                              {isTeacher && app.ranking && (
                                <div className="flex justify-between items-center bg-secondary/20 p-2 rounded-xl border border-border/20 text-xs">
                                  <span className="text-muted-foreground font-semibold">Automated AI Rank & Scoring Breakdown</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[10px] h-7 font-bold uppercase tracking-widest gap-1"
                                    onClick={() => toggleAnalysis(app.id)}
                                  >
                                    <BarChart3 className="h-3.5 w-3.5 text-primary" />
                                    {isAnalysisExpanded ? 'Hide Analysis' : 'Show Analysis'}
                                  </Button>
                                </div>
                              )}

                              {/* Analysis Dropdown */}
                              <AnimatePresence>
                                {isAnalysisExpanded && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10 grid grid-cols-1 md:grid-cols-2 gap-4 mb-2 text-xs">
                                      <div className="space-y-2">
                                        <h5 className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-primary">
                                          <Star className="h-3 w-3" />
                                          Scoring Breakdown
                                        </h5>
                                        <div className="space-y-1.5">
                                          <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">AI Model Score</span>
                                            <span className="font-mono font-bold text-primary">{app.ranking?.model_score?.toFixed(1) || '0.0'}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Reviewer Average</span>
                                            <span className="font-mono font-bold text-primary">{app.ranking?.reviewer_score?.toFixed(1) || '0.0'}</span>
                                          </div>
                                          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-1">
                                            <div className="h-full bg-primary" style={{ width: `${app.ranking?.final_score || 0}%` }} />
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <h5 className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-primary">
                                          <MessageSquare className="h-3 w-3" />
                                          AI Insights
                                        </h5>
                                        <p className="text-muted-foreground leading-relaxed italic">
                                          "{app.ranking?.explanation || "No automated explanation generated for this ranking."}"
                                        </p>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Motivation Section */}
                              <div className="space-y-1">
                                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Candidate Motivation</h5>
                                <div className="p-3.5 rounded-xl bg-background border border-border/30 max-h-40 overflow-y-auto italic text-xs text-foreground/80 leading-relaxed">
                                  "{app.motivation || "No motivation letter provided."}"
                                </div>
                              </div>

                              {/* Decision Info */}
                              {app.decision_note && (
                                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/30 text-xs">
                                  <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider">Note from {reviewer?.full_name || 'Reviewer'}:</span>
                                    <p className="mt-0.5 text-foreground/90 leading-relaxed">{app.decision_note}</p>
                                  </div>
                                </div>
                              )}



                              {/* Decision Buttons for Pending */}
                              {canReviewThisApp && app.status === 'PENDING' && (
                                <div className="pt-3 border-t border-border/30">
                                  {!isSelected ? (
                                    <Button className="w-full rounded-xl h-9 text-xs font-bold shadow-sm group/btn" onClick={() => setSelectedApp(app.id)}>
                                      Evaluate Candidate Decision
                                      <ArrowRight className="h-3.5 w-3.5 ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                  ) : (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="space-y-3"
                                    >
                                      <textarea
                                        value={decisionNote}
                                        onChange={e => setDecisionNote(e.target.value)}
                                        rows={2}
                                        placeholder="Add a reason for your decision..."
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                      />
                                      <div className="flex gap-2">
                                        <Button className="flex-1 h-9 rounded-lg bg-success hover:bg-success/90 text-xs font-bold" onClick={() => handleReview(app.id, 'ACCEPTED')}>
                                          Approve
                                        </Button>
                                        <Button className="flex-1 h-9 rounded-lg bg-destructive hover:bg-destructive/90 text-xs font-bold" onClick={() => handleReview(app.id, 'REJECTED')}>
                                          Reject
                                        </Button>
                                        <Button variant="ghost" className="h-9 rounded-lg px-4 text-xs font-semibold" onClick={() => { setSelectedApp(null); setDecisionNote(''); }}>
                                          Cancel
                                        </Button>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
        )}

        {activeTab === 'external' && isTeacher && (
          <>
            {filteredExternalSubmissions.map((sub, i) => {
              const project = sub.call?.project_id ? getProjectById(sub.call.project_id) : null;
              const isSelected = selectedSubmissionId === sub.id;
              const isExpanded = expandedCards.includes(sub.id);

              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border border-border/60 hover:border-border transition-all duration-200 rounded-2xl overflow-hidden bg-card/40 hover:bg-card/75 shadow-sm group">
                    {/* Compact Header Row */}
                    <div
                      onClick={() => toggleCard(sub.id)}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ProfileAvatar
                          name={sub.full_name}
                          className="h-10 w-10 rounded-xl ring-1 ring-border shadow-sm shrink-0"
                          textClassName="text-sm font-bold"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-extrabold text-foreground tracking-tight truncate max-w-[180px]">
                              {sub.full_name}
                            </h4>
                            <ApplicationStatusBadge status={sub.status} />
                          </div>

                          <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                            {sub.email}
                          </div>
                        </div>
                      </div>

                      {/* Middle Section: Project/Call details */}
                      <div className="flex-1 min-w-0 sm:px-4">
                        {sub.call && (
                          <div className="text-xs font-semibold text-muted-foreground truncate">
                            Call: <span className="text-foreground font-bold">{sub.call.title}</span>
                          </div>
                        )}
                      </div>

                      {/* Right Section: Date and Chevron toggle */}
                      <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                        {sub.submitted_at && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(sub.submitted_at).toLocaleDateString()}
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCard(sub.id);
                          }}
                        >
                          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", isExpanded && "rotate-180")} />
                        </Button>
                      </div>
                    </div>

                    {/* Expandable Content */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <CardContent className="px-4 pb-4 pt-2 border-t border-border/40 space-y-4">
                            {/* Call and Project Information */}
                            {sub.call && (
                              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div>
                                  <div className="font-bold text-foreground">
                                    {sub.call.title}
                                  </div>
                                  {project && (
                                    <div className="text-muted-foreground mt-0.5">
                                      Project: <span className="font-semibold text-foreground/80">{project.title}</span>
                                    </div>
                                  )}
                                  {sub.institution && (
                                    <div className="text-muted-foreground mt-0.5 flex items-center gap-1">
                                      <Building className="h-3 w-3" />
                                      {sub.institution}
                                    </div>
                                  )}
                                </div>

                                <a
                                  href={sub.cv_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold bg-background border border-border/80 hover:bg-secondary transition-all shadow-sm shrink-0 self-start sm:self-auto"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Open Applicant CV
                                </a>
                              </div>
                            )}

                            {/* Motivation */}
                            {sub.motivation && (
                              <div className="space-y-1">
                                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Motivation Statement</h5>
                                <div className="p-3.5 rounded-xl bg-background border border-border/30 max-h-48 overflow-y-auto">
                                  <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                    {sub.motivation}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Decision review history */}
                            {sub.status !== 'PENDING' && sub.decision_note && (
                              <div className="p-3 rounded-xl bg-secondary/20 border border-border/30 text-xs">
                                <h5 className="font-bold text-foreground mb-0.5">Decision Note</h5>
                                <p className="text-muted-foreground">{sub.decision_note}</p>
                              </div>
                            )}

                            {/* Review Forms / Evaluation for Pending */}
                            {sub.status === 'PENDING' && (
                              <div className="pt-3 border-t border-border/30">
                                {!isSelected ? (
                                  <Button className="w-full rounded-xl h-9 text-xs font-bold shadow-sm group/btn" onClick={() => setSelectedSubmissionId(sub.id)}>
                                    Evaluate Candidate Decision
                                    <ArrowRight className="h-3.5 w-3.5 ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
                                  </Button>
                                ) : (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-3"
                                  >
                                    <textarea
                                      value={submissionDecisionNote}
                                      onChange={e => setSubmissionDecisionNote(e.target.value)}
                                      rows={2}
                                      placeholder="Add a reason for your decision..."
                                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        className="flex-1 h-9 rounded-lg bg-success hover:bg-success/90 text-xs font-bold"
                                        onClick={() => handleSubmissionReview(sub.id, 'ACCEPTED')}
                                        disabled={reviewingSubmissionId === sub.id}
                                      >
                                        {reviewingSubmissionId === sub.id && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                        Approve
                                      </Button>
                                      <Button
                                        className="flex-1 h-9 rounded-lg bg-destructive hover:bg-destructive/90 text-xs font-bold"
                                        onClick={() => handleSubmissionReview(sub.id, 'REJECTED')}
                                        disabled={reviewingSubmissionId === sub.id}
                                      >
                                        {reviewingSubmissionId === sub.id && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                        Reject
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        className="h-9 rounded-lg px-4 text-xs font-semibold"
                                        onClick={() => { setSelectedSubmissionId(null); setSubmissionDecisionNote(''); }}
                                        disabled={reviewingSubmissionId === sub.id}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}

            {filteredExternalSubmissions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-3xl bg-secondary/20">
                <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center mb-4 shadow-sm">
                  <FileText className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <h3 className="text-lg font-bold">No external submissions found</h3>
                <p className="text-sm text-muted-foreground max-w-xs text-center">
                  There are currently no external candidate collaboration submissions awaiting your review for this project category.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <StudentProfileModal user={viewingProfileUser} onClose={() => setViewingProfileUser(null)} />
    </div>
  );
};

export default Applications;
