import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectStatusBadge } from '@/components/Badges';
import { getProjectStatus } from '@/lib/projectAccess';
import type { Project, ProjectParticipant, ProjectReviewStatus, User } from '@/types';
import { ProfileAvatar } from '@/components/ProfileAvatar';

interface ProjectBoardHeaderProps {
  project: Project;
  projects: Project[];
  selectedProjectId: number | null;
  handleProjectChange: (val: string) => void;
  canManageProjects: boolean;
  canCreateProjects: boolean;
  setProjectFormOpen: (open: boolean) => void;
  setMemberFormOpen: (open: boolean) => void;
  canReviewSelectedProject: boolean;
  handleReviewSelectedProject: (status: 'APPROVED' | 'REJECTED') => void;
  projectReviewLoading: 'APPROVED' | 'REJECTED' | null;
  participants: ProjectParticipant[];
  getUserById: (id: number) => User | undefined;
  labName?: string;
  groupName?: string;
}

export const ProjectBoardHeader = ({
  project,
  projects,
  selectedProjectId,
  handleProjectChange,
  canManageProjects,
  canCreateProjects,
  setProjectFormOpen,
  setMemberFormOpen,
  canReviewSelectedProject,
  handleReviewSelectedProject,
  projectReviewLoading,
  participants,
  getUserById,
  labName,
  groupName,
}: ProjectBoardHeaderProps) => {
  return (
    <div className="mb-8">
      <div className='flex items-start justify-between w-full'>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3">
          <Select value={String(selectedProjectId)} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-full sm:w-[340px] h-auto py-2">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${project.visibility === 'PUBLIC' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
            {project.visibility}
          </span>
          <ProjectStatusBadge status={getProjectStatus(project)} />
        </div>
        {canManageProjects && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {canCreateProjects && (
              <Button size="sm" onClick={() => setProjectFormOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Project Details Form
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setMemberFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Member Details Form
            </Button>
          </div>
        )}
      </div>
      {/* <p className="text-muted-foreground text-sm max-w-2xl mb-3">{project.description}</p> */}

      {canReviewSelectedProject && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Button
            size="sm"
            onClick={() => handleReviewSelectedProject('APPROVED')}
            disabled={projectReviewLoading !== null}
          >
            {projectReviewLoading === 'APPROVED' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Approve Project
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleReviewSelectedProject('REJECTED')}
            disabled={projectReviewLoading !== null}
          >
            {projectReviewLoading === 'REJECTED' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reject Project
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">Team:</span>
        {participants.map(p => {
          const u = getUserById(p.user_id);
          if (!u) return null;
          return (
            <ProfileAvatar
              key={p.user_id}
              userId={u.id}
              name={u.full_name}
              className="h-7 w-7 rounded-full bg-secondary text-xs font-medium text-secondary-foreground"
              textClassName="text-xs font-medium text-secondary-foreground"
            />
          );
        })}
      </div>
    </div>
  );
};
