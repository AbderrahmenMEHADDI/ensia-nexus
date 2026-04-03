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
  User,
  Project,
  ResearchGroup,
  ProjectParticipant,
  ProjectReviewStatus,
} from '@/types';
import { FileText, CheckCircle2, XCircle, MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Applications = () => {
  const { user, isTeacher } = useAuth();
  const { toast } = useToast();
  const [apps, setApps] = useState<ProjectApplication[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [participants, setParticipants] = useState<ProjectParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<number | null>(null);
  const [reviewingAppId, setReviewingAppId] = useState<number | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [projectDecisionNote, setProjectDecisionNote] = useState('');
  const [reviewingProjectId, setReviewingProjectId] = useState<number | null>(null);

  const getUserById = (id: number) => users.find(u => u.id === id);
  const getProjectById = (id: number) => projects.find(p => p.id === id);
  const getGroupById = (id: number) => groups.find(g => g.id === id);

  useEffect(() => {
    const load = async () => {
      try {
        const [a, u, p, g, pp] = await Promise.all([
          apiRepository.getApplications(),
          apiRepository.getUsers(),
          apiRepository.getProjects(),
          apiRepository.getGroups(),
          apiRepository.getProjectParticipants(),
        ]);
        setApps(a);
        setUsers(u);
        setProjects(p);
        setGroups(g);
        setParticipants(pp);
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

  const handleReview = async (appId: number, decision: 'ACCEPTED' | 'REJECTED') => {
    setReviewingAppId(appId);
    try {
      const updated = await apiRepository.reviewApplication(appId, {
        status: decision,
        decision_note: decisionNote.trim() || undefined,
      });
      setApps(prev => prev.map(a => a.id === appId ? updated : a));
      toast({ title: `Application ${decision.toLowerCase()}` });
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-mono text-primary uppercase tracking-wider">Applications</span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-1">
              {isTeacher ? 'Review Applications' : 'Application Access'}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              You can review applications only if you are a group leader or a project participant with LEAD/REVIEWER role.
            </p>
          </div>
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
          {apps.map((app, i) => {
            const student = getUserById(app.student_user_id);
            const project = getProjectById(app.project_id);
            const reviewer = app.reviewed_by ? getUserById(app.reviewed_by) : null;
            const isSelected = selectedApp === app.id;
            const canReviewThisApp = project
              ? canUserReviewProjectApplication(user?.id, project, groups, participants)
              : false;

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
                        <h3 className="font-medium text-foreground">{project?.title || 'Unknown Project'}</h3>
                        <ApplicationStatusBadge status={app.status} />
                        {project && <ProjectStatusBadge status={getProjectStatus(project)} />}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                        <span>by {student?.full_name}</span>
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

                  {app.decision_note && (
                    <div className="p-3 rounded-lg bg-muted/50 mb-3 text-sm">
                      <span className="text-xs font-mono text-muted-foreground">Decision note by {reviewer?.full_name}:</span>
                      <p className="text-foreground/80 mt-1">{app.decision_note}</p>
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
          {apps.length === 0 && (
            <div className="text-muted-foreground text-center py-16">
              <FileText className="h-5 w-5 mx-auto mb-2" />
              <p>No applications available for your current reviewer scope.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Applications;
