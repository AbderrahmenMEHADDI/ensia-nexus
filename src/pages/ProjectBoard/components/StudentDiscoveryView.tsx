import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ApplicationStatusBadge } from '@/components/Badges';
import type { Project, ProjectApplication, ResearchGroup } from '@/types';

interface StudentDiscoveryViewProps {
  publicProjects: Project[];
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
}

export const StudentDiscoveryView = ({
  publicProjects,
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
}: StudentDiscoveryViewProps) => {
  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <span className="text-xs font-mono text-primary uppercase tracking-wider">Projects</span>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-1">Public Projects</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Apply to approved public projects. Pending or accepted applications cannot be submitted again.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {publicProjects.map(pubProject => {
            const pubGroup = getGroupById(pubProject.group_id);
            const blockingApplication = getBlockingApplication(pubProject.id);

            return (
              <div key={pubProject.id} className="rounded-lg border border-border p-4 bg-card">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-medium text-foreground">{pubProject.title}</h3>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-success/15 text-success">PUBLIC</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{pubProject.description}</p>
                <p className="text-xs text-muted-foreground mb-3">Group: {pubGroup?.name || 'N/A'}</p>
                {blockingApplication && (
                  <div className="mb-3">
                    <ApplicationStatusBadge status={blockingApplication.status} />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Model score: {blockingApplication.ranking?.model_score?.toFixed?.(2) ?? '-'} / 100
                    </p>
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={() => handleOpenApply(pubProject.id)}
                  disabled={Boolean(blockingApplication)}
                >
                  {getApplyButtonLabel(pubProject.id)}
                </Button>
              </div>
            );
          })}
          {publicProjects.length === 0 && (
            <p className="text-sm text-muted-foreground">No public projects available right now.</p>
          )}
        </div>
      </motion.div>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Application for Join Project</DialogTitle>
            <DialogDescription>
              Provide your motivation to apply for this public project.
              <br/>
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
