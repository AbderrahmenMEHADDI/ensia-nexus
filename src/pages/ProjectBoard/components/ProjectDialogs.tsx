import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ResearchGroup, Visibility, Project, User, ParticipantRole } from '@/types';

interface ProjectDialogsProps {
  projectFormOpen: boolean;
  setProjectFormOpen: (open: boolean) => void;
  formProjectTitle: string;
  setFormProjectTitle: (val: string) => void;
  formProjectDescription: string;
  setFormProjectDescription: (val: string) => void;
  formGroupId: string;
  setFormGroupId: (val: string) => void;
  formVisibility: Visibility;
  setFormVisibility: (val: Visibility) => void;
  formCreateProjectLoading: boolean;
  handleCreateProjectFromForm: () => void;
  validatedGroups: ResearchGroup[];
  
  memberFormOpen: boolean;
  setMemberFormOpen: (open: boolean) => void;
  formMemberProjectId: string;
  setFormMemberProjectId: (val: string) => void;
  formMemberUserId: string;
  setFormMemberUserId: (val: string) => void;
  formMemberRole: ParticipantRole;
  setFormMemberRole: (val: ParticipantRole) => void;
  formAddMemberLoading: boolean;
  handleAddMemberFromForm: () => void;
  projects: Project[];
  availableMemberOptions: User[];
}

export const ProjectDialogs = ({
  projectFormOpen,
  setProjectFormOpen,
  formProjectTitle,
  setFormProjectTitle,
  formProjectDescription,
  setFormProjectDescription,
  formGroupId,
  setFormGroupId,
  formVisibility,
  setFormVisibility,
  formCreateProjectLoading,
  handleCreateProjectFromForm,
  validatedGroups,
  
  memberFormOpen,
  setMemberFormOpen,
  formMemberProjectId,
  setFormMemberProjectId,
  formMemberUserId,
  setFormMemberUserId,
  formMemberRole,
  setFormMemberRole,
  formAddMemberLoading,
  handleAddMemberFromForm,
  projects,
  availableMemberOptions,
}: ProjectDialogsProps) => {
  return (
    <>
      <Dialog open={projectFormOpen} onOpenChange={setProjectFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Project Details Form</DialogTitle>
            <DialogDescription>Fill this form to create a new project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Project Title</Label>
              <Input value={formProjectTitle} onChange={e => setFormProjectTitle(e.target.value)} placeholder="Project title" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formProjectDescription} onChange={e => setFormProjectDescription(e.target.value)} rows={4} placeholder="Project description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Research Group</Label>
                <Select value={formGroupId} onValueChange={setFormGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {validatedGroups.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {validatedGroups.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No validated groups are available for project creation.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={formVisibility} onValueChange={v => setFormVisibility(v as Visibility)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectFormOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateProjectFromForm} disabled={formCreateProjectLoading || !formProjectTitle.trim() || !formGroupId}>
              {formCreateProjectLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={memberFormOpen} onOpenChange={setMemberFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Member Details Form</DialogTitle>
            <DialogDescription>Add a member to a project and choose membership role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={formMemberProjectId} onValueChange={value => { setFormMemberProjectId(value); setFormMemberUserId(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Member</Label>
                <Select value={formMemberUserId} onValueChange={setFormMemberUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder={formMemberProjectId ? 'Select group member' : 'Select project first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMemberOptions.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {formMemberProjectId && availableMemberOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground">No active members found in this project's group.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formMemberRole} onValueChange={v => setFormMemberRole(v as ParticipantRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="REVIEWER">Reviewer</SelectItem>
                    <SelectItem value="OBSERVER">Observer</SelectItem>
                    <SelectItem value="LEAD">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberFormOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMemberFromForm} disabled={formAddMemberLoading || !formMemberProjectId || !formMemberUserId}>
              {formAddMemberLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
