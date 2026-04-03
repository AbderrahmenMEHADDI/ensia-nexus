import type {
  ParticipantRole,
  Project,
  ProjectParticipant,
  ProjectStatus,
  ResearchGroup,
} from '@/types';

export const getProjectStatus = (project: Pick<Project, 'status'>): ProjectStatus =>
  project.status ?? 'APPROVED';

export const hasReviewerRole = (role: ParticipantRole): boolean =>
  role === 'LEAD' || role === 'REVIEWER';

export const isProjectOpenForStudentApplications = (
  project: Pick<Project, 'status' | 'visibility'>
): boolean => project.visibility === 'PUBLIC' && getProjectStatus(project) === 'APPROVED';

export const canUserReviewProject = (
  userId: number | undefined,
  project: Pick<Project, 'group_id'>,
  groups: Array<Pick<ResearchGroup, 'id' | 'leader_user_id'>>
): boolean => {
  if (!userId) return false;
  const group = groups.find(g => g.id === project.group_id);
  return group?.leader_user_id === userId;
};

export const canUserReviewProjectApplication = (
  userId: number | undefined,
  project: Pick<Project, 'id' | 'group_id'>,
  groups: Array<Pick<ResearchGroup, 'id' | 'leader_user_id'>>,
  participants: Array<Pick<ProjectParticipant, 'project_id' | 'user_id' | 'participant_role'>>
): boolean => {
  if (!userId) return false;
  if (canUserReviewProject(userId, project, groups)) return true;

  return participants.some(
    p => p.project_id === project.id && p.user_id === userId && hasReviewerRole(p.participant_role)
  );
};
