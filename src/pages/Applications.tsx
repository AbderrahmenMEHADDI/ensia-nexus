import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import { ApplicationStatusBadge, RoleBadge } from '@/components/Badges';
import type { ProjectApplication, User, Project, ResearchGroup, GroupMember } from '@/types';
import { FileText, CheckCircle2, XCircle, MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Applications = () => {
  const { user, isTeacher, isAdmin } = useAuth();
  const { toast } = useToast();
  const [apps, setApps] = useState<ProjectApplication[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<number | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [newMotivation, setNewMotivation] = useState('');
  const [applyProjectId, setApplyProjectId] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isGroupOwner = (projectId: number) => {
    if (!user) return false;
    if (isAdmin) return true;
    const project = projects.find(p => p.id === projectId);
    if (!project) return false;
    if (project.created_by === user.id) return true;
    const group = groups.find(g => g.id === project.group_id);
    return group?.leader_user_id === user.id;
  };

  const isGroupMember = (groupId: number) => {
    if (!user) return false;
    return groupMembers.some(gm => gm.group_id === groupId && gm.user_id === user.id && gm.is_active);
  };

  const canSeeApp = (app: ProjectApplication) => {
    if (!user) return false;
    if (app.student_user_id === user.id) return true;
    const project = projects.find(p => p.id === app.project_id);
    if (project && isGroupMember(project.group_id)) return true;
    return false;
  };

  const getUserById = (id: number) => users.find(u => u.id === id);
  const getProjectById = (id: number) => projects.find(p => p.id === id);

  useEffect(() => {
    const load = async () => {
      try {
        const [a, u, p, g, gm] = await Promise.all([
          apiRepository.getApplications(),
          apiRepository.getUsers(),
          apiRepository.getProjects(),
          apiRepository.getGroups(),
          apiRepository.getGroupMembers(),
        ]);
        setApps(a);
        setUsers(u);
        setProjects(p);
        setGroups(g);
        setGroupMembers(gm);
      } catch (e) {
        console.error('Applications load error:', e);
        toast({ title: 'Error loading applications', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleReview = async (appId: number, decision: 'ACCEPTED' | 'REJECTED') => {
    try {
      const updated = await apiRepository.reviewApplication(appId, {
        status: decision,
        decision_note: decisionNote,
        reviewed_at: new Date().toISOString(),
      });
      setApps(prev => prev.map(a => a.id === appId ? updated : a));
      toast({ title: `Application ${decision.toLowerCase()}` });
    } catch (e) {
      toast({ title: 'Review failed', variant: 'destructive' });
    }
    setSelectedApp(null);
    setDecisionNote('');
  };

  const handleApply = async () => {
    if (!newMotivation.trim() || !applyProjectId || !user) return;
    setSubmitting(true);
    try {
      const newApp = await apiRepository.createApplication({
        project_id: Number(applyProjectId),
        student_user_id: user.id,
        motivation: newMotivation,
        status: 'PENDING',
      });
      setApps(prev => [newApp, ...prev]);
      setNewMotivation('');
      setApplyProjectId('');
      setShowApplyForm(false);
      toast({ title: 'Application submitted!' });
    } catch (e) {
      toast({ title: 'Submission failed', variant: 'destructive' });
    }
    setSubmitting(false);
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
              {isTeacher ? 'Review Applications' : 'My Applications'}
            </h1>
          </div>
          {!isTeacher && (
            <button
              onClick={() => setShowApplyForm(!showApplyForm)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <FileText className="h-4 w-4" /> Apply to Project
            </button>
          )}
        </div>

        {/* Apply form */}
        {showApplyForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 p-6 rounded-xl border border-primary/20 bg-card"
          >
            <h3 className="font-serif font-semibold text-foreground mb-4">Submit Application</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1">Project</label>
                <select
                  value={applyProjectId}
                  onChange={e => setApplyProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select a project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1">Motivation Statement</label>
                <textarea
                  value={newMotivation}
                  onChange={e => setNewMotivation(e.target.value)}
                  rows={4}
                  placeholder="Explain why you want to join this project..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
              <button
                onClick={handleApply}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                Submit Application
              </button>
            </div>
          </motion.div>
        )}

        {/* Applications list */}
        <div className="space-y-4">
          {apps.filter(canSeeApp).map((app, i) => {
            const student = getUserById(app.student_user_id);
            const project = getProjectById(app.project_id);
            const reviewer = app.reviewed_by ? getUserById(app.reviewed_by) : null;
            const isSelected = selectedApp === app.id;

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

                  {isGroupOwner(app.project_id) && app.status === 'PENDING' && (
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
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-success/15 text-success text-sm font-medium hover:bg-success/25 transition-colors"
                            >
                              <CheckCircle2 className="h-4 w-4" /> Accept
                            </button>
                            <button
                              onClick={() => handleReview(app.id, 'REJECTED')}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-destructive/15 text-destructive text-sm font-medium hover:bg-destructive/25 transition-colors"
                            >
                              <XCircle className="h-4 w-4" /> Reject
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
          {apps.filter(canSeeApp).length === 0 && (
            <p className="text-muted-foreground text-center py-16">No applications found.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Applications;
