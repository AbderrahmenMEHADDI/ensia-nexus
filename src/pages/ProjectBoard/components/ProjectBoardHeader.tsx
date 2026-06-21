import { Plus, Loader2, Edit, Trash2 } from 'lucide-react';
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
  isIndividualProjectCreator?: boolean;
  handleOpenEditProject?: () => void;
  setDeleteProjectConfirmOpen?: (open: boolean) => void;
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
  isIndividualProjectCreator,
  handleOpenEditProject,
  setDeleteProjectConfirmOpen,
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
              <Button size="sm" className="rounded-lg h-9 font-semibold" style={{ background: '#F37F20', color: '#fff' }} onClick={() => setProjectFormOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Project Details Form
              </Button>
            )}
            <Button size="sm" variant="outline" className="rounded-lg h-9 font-semibold text-[#074a75] border-[#074a75]/20 hover:bg-[#074a75] hover:text-white" onClick={() => setMemberFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Member Details Form
            </Button>
            {isIndividualProjectCreator && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg h-9 font-semibold text-blue-600 border-blue-600/20 hover:bg-blue-50 hover:border-blue-600/50 hover:text-blue-700"
                  onClick={handleOpenEditProject}
                >
                  <Edit className="h-4 w-4 mr-1" /> Edit Project
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg h-9 font-semibold text-red-600 border-red-600/20 hover:bg-red-50 hover:border-red-600/50 hover:text-red-700"
                  onClick={() => setDeleteProjectConfirmOpen?.(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete Project
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      {/* <p className="text-muted-foreground text-sm max-w-2xl mb-3">{project.description}</p> */}

      {canReviewSelectedProject && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Button
            size="sm"
            className="rounded-lg h-9 font-semibold bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleReviewSelectedProject('APPROVED')}
            disabled={projectReviewLoading !== null}
          >
            {projectReviewLoading === 'APPROVED' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Approve Project
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg h-9 font-semibold text-red-600 border-red-600/20 hover:bg-red-600 hover:text-white"
            onClick={() => handleReviewSelectedProject('REJECTED')}
            disabled={projectReviewLoading !== null}
          >
            {projectReviewLoading === 'REJECTED' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reject Project
          </Button>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">Team:</span>
        <span className="text-xs font-semibold text-slate-700">
          {project.group_id ? (groupName || 'Loading...') : 'Independent Project'}
        </span>
      </div>

    </div>
  );
};
