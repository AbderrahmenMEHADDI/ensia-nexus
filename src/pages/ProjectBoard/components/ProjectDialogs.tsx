import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
  formAcceptingCollaborators: boolean;
  setFormAcceptingCollaborators: (val: boolean) => void;
  formDeadline: string;
  setFormDeadline: (val: string) => void;
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

  editProjectOpen?: boolean;
  setEditProjectOpen?: (open: boolean) => void;
  editProjectTitle?: string;
  setEditProjectTitle?: (val: string) => void;
  editProjectDescription?: string;
  setEditProjectDescription?: (val: string) => void;
  editProjectVisibility?: Visibility;
  setEditProjectVisibility?: (val: Visibility) => void;
  editProjectAcceptingCollaborators?: boolean;
  setEditProjectAcceptingCollaborators?: (val: boolean) => void;
  editProjectDeadline?: string;
  setEditProjectDeadline?: (val: string) => void;
  editProjectLoading?: boolean;
  handleUpdateProject?: () => void;
  isIndependent?: boolean;
  leaderGroups?: ResearchGroup[];
  editProjectGroupId?: string;
  setEditProjectGroupId?: (val: string) => void;
  currentGroupName?: string;

  deleteProjectConfirmOpen?: boolean;
  setDeleteProjectConfirmOpen?: (open: boolean) => void;
  deleteProjectLoading?: boolean;
  handleDeleteProject?: () => void;
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
  formAcceptingCollaborators,
  setFormAcceptingCollaborators,
  formDeadline,
  setFormDeadline,
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

  editProjectOpen,
  setEditProjectOpen,
  editProjectTitle,
  setEditProjectTitle,
  editProjectDescription,
  setEditProjectDescription,
  editProjectVisibility,
  setEditProjectVisibility,
  editProjectAcceptingCollaborators,
  setEditProjectAcceptingCollaborators,
  editProjectDeadline,
  setEditProjectDeadline,
  editProjectLoading,
  handleUpdateProject,
  isIndependent,
  leaderGroups = [],
  editProjectGroupId,
  setEditProjectGroupId,
  currentGroupName,

  deleteProjectConfirmOpen,
  setDeleteProjectConfirmOpen,
  deleteProjectLoading,
  handleDeleteProject,
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
                    <SelectItem value="none">None (Independent Project)</SelectItem>
                    {validatedGroups.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select 
                  value={formVisibility} 
                  onValueChange={v => {
                    setFormVisibility(v as Visibility);
                    if (v === 'PRIVATE') {
                      setFormAcceptingCollaborators(false);
                    }
                  }}
                >
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
            <div className="grid grid-cols-2 gap-4 items-center pt-2">
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Accepting Collaborators</Label>
                  <p className="text-[10px] text-muted-foreground">Allow Collaboration requests in the landing page.</p>
                </div>
                <Switch
                  checked={formAcceptingCollaborators}
                  onCheckedChange={setFormAcceptingCollaborators}
                  disabled={formVisibility === 'PRIVATE'}
                />
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={formDeadline}
                  onChange={e => setFormDeadline(e.target.value)}
                  className="h-10"
                />
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

      {/* Edit Project Dialog */}
      <Dialog open={editProjectOpen} onOpenChange={setEditProjectOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Project Details</DialogTitle>
            <DialogDescription>Make changes to your independent project details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Project Title</Label>
              <Input value={editProjectTitle} onChange={e => setEditProjectTitle?.(e.target.value)} placeholder="Project title" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editProjectDescription} onChange={e => setEditProjectDescription?.(e.target.value)} rows={4} placeholder="Project description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Research Group</Label>
                {isIndependent ? (
                  <Select value={editProjectGroupId} onValueChange={setEditProjectGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Independent Project)</SelectItem>
                      {leaderGroups.map(g => (
                        <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={currentGroupName || "Research Group Project"} disabled className="bg-muted text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select 
                  value={editProjectVisibility} 
                  onValueChange={v => {
                    setEditProjectVisibility?.(v as Visibility);
                    if (v === 'PRIVATE') {
                      setEditProjectAcceptingCollaborators?.(false);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                    <SelectItem value="PUBLIC">Public: Show in Landing Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 items-center pt-2">
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Accepting Collaborators</Label>
                  <p className="text-[10px] text-muted-foreground">Allow Collaboration requests in the landing page.</p>
                </div>
                <Switch
                  checked={editProjectAcceptingCollaborators}
                  onCheckedChange={setEditProjectAcceptingCollaborators}
                  disabled={editProjectVisibility === 'PRIVATE'}
                />
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={editProjectDeadline}
                  onChange={e => setEditProjectDeadline?.(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProjectOpen?.(false)}>Cancel</Button>
            <Button onClick={handleUpdateProject} disabled={editProjectLoading || !editProjectTitle?.trim()}>
              {editProjectLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation Dialog */}
      <Dialog open={deleteProjectConfirmOpen} onOpenChange={setDeleteProjectConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">Delete Project</DialogTitle>
            <DialogDescription>
              Are you absolutely sure you want to delete this project? This action is permanent and cannot be undone. All tasks, resources, and applications related to this project will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteProjectConfirmOpen?.(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProject} disabled={deleteProjectLoading}>
              {deleteProjectLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
