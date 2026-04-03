import { describe, expect, it } from 'vitest';
import {
  canUserReviewProject,
  canUserReviewProjectApplication,
  getProjectStatus,
  hasReviewerRole,
  isProjectOpenForStudentApplications,
} from '@/lib/projectAccess';

describe('projectAccess helpers', () => {
  const groups = [{ id: 10, leader_user_id: 3 }];

  it('defaults missing project status to APPROVED', () => {
    expect(getProjectStatus({ status: undefined })).toBe('APPROVED');
    expect(getProjectStatus({ status: 'PENDING' })).toBe('PENDING');
  });

  it('accepts only lead/reviewer as application reviewers', () => {
    expect(hasReviewerRole('LEAD')).toBe(true);
    expect(hasReviewerRole('REVIEWER')).toBe(true);
    expect(hasReviewerRole('MEMBER')).toBe(false);
    expect(hasReviewerRole('OBSERVER')).toBe(false);
  });

  it('opens student applications only for APPROVED public projects', () => {
    expect(
      isProjectOpenForStudentApplications({ visibility: 'PUBLIC', status: 'APPROVED' })
    ).toBe(true);
    expect(
      isProjectOpenForStudentApplications({ visibility: 'PUBLIC', status: 'PENDING' })
    ).toBe(false);
    expect(
      isProjectOpenForStudentApplications({ visibility: 'PRIVATE', status: 'APPROVED' })
    ).toBe(false);
  });

  it('allows project review only for group leaders', () => {
    expect(canUserReviewProject(3, { group_id: 10 }, groups)).toBe(true);
    expect(canUserReviewProject(7, { group_id: 10 }, groups)).toBe(false);
  });

  it('allows application review for group leaders or reviewer roles', () => {
    const project = { id: 99, group_id: 10 };
    const participants = [
      { project_id: 99, user_id: 8, participant_role: 'REVIEWER' as const },
      { project_id: 99, user_id: 9, participant_role: 'MEMBER' as const },
    ];

    expect(canUserReviewProjectApplication(3, project, groups, participants)).toBe(true);
    expect(canUserReviewProjectApplication(8, project, groups, participants)).toBe(true);
    expect(canUserReviewProjectApplication(9, project, groups, participants)).toBe(false);
  });
});
