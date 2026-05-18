import { api } from '../lib/apiClient';
import type { TaskComment, TaskCommentCreate } from '../types';
import type {
  User, UserListResponse, Student, Teacher,
  ResearchLab, ResearchGroup, GroupMember, ResearchLabAdmin, 
  Project, ProjectParticipant, ProjectApplication, ProjectResource,
  ProjectApplicationRanking, ProjectApplicationReviewerRating, ProjectApplicationReviewerRatingInput,
  Task, TaskUpdate, StudentCVEntry, StudentPreviousProject,
  UserRole, GroupInvitation, ProjectReviewStatus,
  Publication, CollaborationCall, CollaborationSubmission, Notification, NotificationListResponse, AnalyticsResponse,
  LandingPageResponse, TeamSummary, TeamProjectsResponse
} from '@/types';

/**
 * Centralized API repository for all entity CRUD operations.
 */
export const apiRepository = {
  // ── Users ────────────────────────────────────────────────────────────────
  getUsers: (params?: { skip?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (typeof params?.skip !== 'undefined') searchParams.set('skip', params.skip.toString());
    if (typeof params?.limit !== 'undefined') searchParams.set('limit', params.limit.toString());
    const qs = searchParams.toString();
    return api.get<User[]>(qs ? `/users/?${qs}` : '/users/');
  },
  createUser: (data: Partial<User> & { full_name: string; email: string; role: UserRole; password?: string }) =>
    api.post<User>('/users/', data),
  getUser: (id: number) => api.get<User>(`/users/${id}/`),
  updateUser: (id: number, data: Partial<User>) => api.put<User>(`/users/${id}/`, data),
  updateProfilePicture: (data: FormData) => api.put<User>(`/users/profile-picture`, data),
  deleteUser: (id: number) => api.delete<void>(`/users/${id}`),
  getUsersPaged: (params: {
    skip?: number;
    limit?: number;
    role?: UserRole;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (typeof params.skip !== 'undefined') searchParams.set('skip', params.skip.toString());
    if (typeof params.limit !== 'undefined') searchParams.set('limit', params.limit.toString());
    if (params.role) searchParams.set('role', params.role);
    if (params.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return api.get<UserListResponse>(qs ? `/users/paged/?${qs}` : '/users/paged/');
  },

  // ── Student / Teacher profiles ───────────────────────────────────────────
  getTeachers: (params?: { skip?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (typeof params?.skip !== 'undefined') searchParams.set('skip', params.skip.toString());
    if (typeof params?.limit !== 'undefined') searchParams.set('limit', params.limit.toString());
    const qs = searchParams.toString();
    return api.get<Teacher[]>(qs ? `/teachers/?${qs}` : '/teachers/');
  },
  getStudentProfile: (userId: number) => api.get<Student>(`/students/${userId}`),
  createStudentProfile: (data: Partial<Student> & { user_id: number }) =>
    api.post<Student>('/students/', data),
  updateStudentProfile: (userId: number, data: Partial<Student>) =>
    api.put<Student>(`/students/${userId}`, data),
  getTeacherProfile: (userId: number) => api.get<Teacher>(`/teachers/${userId}`),
  getStudentCVs: (studentUserId?: number) =>
    api.get<StudentCVEntry[]>(
      studentUserId ? `/student-cvs/?student_user_id=${studentUserId}` : '/student-cvs/'
    ),
  createStudentCV: (data: Partial<StudentCVEntry> & { student_user_id: number; title: string }) =>
    api.post<StudentCVEntry>('/student-cvs/', data),
  deleteStudentCV: (id: number) => api.delete<void>(`/student-cvs/${id}`),
  getStudentPreviousProjects: (studentUserId?: number) =>
    api.get<StudentPreviousProject[]>(
      studentUserId
        ? `/student-previous-projects/?student_user_id=${studentUserId}`
        : '/student-previous-projects/'
    ),
  createStudentPreviousProject: (
    data: Partial<StudentPreviousProject> & { student_user_id: number; title: string }
  ) => api.post<StudentPreviousProject>('/student-previous-projects/', data),
  deleteStudentPreviousProject: (id: number) =>
    api.delete<void>(`/student-previous-projects/${id}`),

  // ── Labs ─────────────────────────────────────────────────────────────────
  getLabs: () => api.get<ResearchLab[]>('/labs/'),
  getLab: (id: number) => api.get<ResearchLab>(`/labs/${id}`),
  createLab: (data: Partial<ResearchLab>) => api.post<ResearchLab>('/labs/', data),
  updateLab: (id: number, data: Partial<ResearchLab>) => api.put<ResearchLab>(`/labs/${id}`, data),
  deleteLab: (id: number) => api.delete<void>(`/labs/${id}`),
  
  // ── Lab admins ──────────────────────────────────────────────────────────
  getLabAdmins: (labId?: number) =>
    api.get<ResearchLabAdmin[]>(labId ? `/lab-admins/?lab_id=${labId}` : '/lab-admins/'),
  addLabAdmin: (labId: number, userId: number) =>
    api.post<ResearchLabAdmin>('/lab-admins/', { lab_id: labId, user_id: userId }),
  removeLabAdmin: (labId: number, userId: number) =>
    api.delete<void>(`/lab-admins/${labId}/${userId}`),

  // ── Groups ───────────────────────────────────────────────────────────────
  getGroups: (labId?: number) =>
    api.get<ResearchGroup[]>(labId ? `/groups/?lab_id=${labId}` : '/groups/'),
  getGroup: (id: number) => api.get<ResearchGroup>(`/groups/${id}`),
  createGroup: (data: Partial<ResearchGroup>) => api.post<ResearchGroup>('/groups/', data),
  updateGroup: (id: number, data: Partial<ResearchGroup>) =>
    api.put<ResearchGroup>(`/groups/${id}`, data),
  validateGroup: (id: number) => api.post<ResearchGroup>(`/groups/${id}/approve`),
  deleteGroup: (id: number) => api.delete<void>(`/groups/${id}`),


  // ── Group members ────────────────────────────────────────────────────────
  getGroupMembers: (groupId?: number) =>
    api.get<GroupMember[]>(groupId ? `/group-members/?group_id=${groupId}` : '/group-members/'),
  bulkAssignGroupMembers: (data: { group_ids: number[]; teacher_user_ids: number[] }) =>
    api.post<GroupMember[]>('/group-members/bulk-assign', data),
  getMyGroupInvitations: () => api.get<GroupInvitation[]>('/group-invitations/mine'),
  getGroupInvitations: (groupId: number) => api.get<GroupInvitation[]>(`/group-invitations/group/${groupId}`),
  inviteTeacherToGroup: (groupId: number, teacherUserId: number) =>
    api.post<GroupInvitation>('/group-invitations/', { group_id: groupId, teacher_user_id: teacherUserId }),
  inviteTeachersToGroupBulk: (groupId: number, teacherUserIds: number[]) =>
    api.post<GroupInvitation[]>('/group-invitations/bulk', { group_id: groupId, teacher_user_ids: teacherUserIds }),
  cancelGroupInvitation: (invitationId: number) =>
    api.delete<void>(`/group-invitations/${invitationId}`),
  respondToGroupInvitation: (invitationId: number, status: 'ACCEPTED' | 'REJECTED') =>
    api.patch<GroupInvitation>(`/group-invitations/${invitationId}/respond`, { status }),
  removeGroupMember: (groupId: number, userId: number) =>
    api.delete<void>(`/group-members/${groupId}/${userId}`),

  // ── Projects ─────────────────────────────────────────────────────────────
  getProjects: (groupId?: number) =>
    api.get<Project[]>(groupId ? `/projects/?group_id=${groupId}` : '/projects/'),
  getProject: (id: number) => api.get<Project>(`/projects/${id}`),
  createProject: (data: Partial<Project>) => api.post<Project>('/projects/', data),
  reviewProject: (id: number, data: { status: ProjectReviewStatus; decision_note?: string }) =>
    api.post<Project>(`/projects/${id}/review`, data),

  // ── Project participants ──────────────────────────────────────────────────
  getProjectParticipants: (projectId?: number) =>
    api.get<ProjectParticipant[]>(
      projectId ? `/project-participants/?project_id=${projectId}` : '/project-participants/'
    ),
  createProjectParticipant: (data: Partial<ProjectParticipant>) =>
    api.post<ProjectParticipant>('/project-participants/', data),

  // ── Project resources ─────────────────────────────────────────────────────
  getProjectResources: (projectId?: number) =>
    api.get<ProjectResource[]>(
      projectId ? `/project-resources/?project_id=${projectId}` : '/project-resources/'
    ),
  createProjectResource: (data: Partial<ProjectResource>) =>
    api.post<ProjectResource>('/project-resources/', data),
  deleteProjectResource: (id: number) =>
    api.delete<void>(`/project-resources/${id}`),

  // ── Tasks ─────────────────────────────────────────────────────────────────
  getTasks: (projectId?: number) =>
    api.get<Task[]>(projectId ? `/tasks/?project_id=${projectId}` : '/tasks/'),
  getTask: (id: number) => api.get<Task>(`/tasks/${id}`),
  createTask: (data: Partial<Task>) => api.post<Task>('/tasks/', data),
  updateTask: (id: number, data: Partial<Task>) => api.put<Task>(`/tasks/${id}`, data),
  deleteTask: (id: number) => api.delete<void>(`/tasks/${id}`),

  // ── Task updates ──────────────────────────────────────────────────────────
  
  // Task Comments
  getTaskComments: (taskId: number) => 
    api.get<TaskComment[]>(`/task-comments/?task_id=${taskId}`),
  createTaskComment: (taskId: number, data: TaskCommentCreate) => 
    api.post<TaskComment>(`/task-comments/?task_id=${taskId}`, data),
  deleteTaskComment: (commentId: number) => 
    api.delete(`/task-comments/${commentId}/`),

  getTaskUpdates: (taskId: number) =>
    api.get<TaskUpdate[]>(`/task-updates/?task_id=${taskId}`),

  // ── Publications ─────────────────────────────────────────────────────────
  getPublications: (params?: { skip?: number; limit?: number; project_id?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.project_id) searchParams.set('project_id', params.project_id.toString());
    const qs = searchParams.toString();
    return api.get<Publication[]>(qs ? `/publications/?${qs}` : '/publications/');
  },
  getPublication: (id: number) => api.get<Publication>(`/publications/${id}`),
  createPublication: (data: Partial<Publication>) => api.post<Publication>('/publications/', data),
  updatePublication: (id: number, data: Partial<Publication>) => api.put<Publication>(`/publications/${id}`, data),
  deletePublication: (id: number) => api.delete<void>(`/publications/${id}`),

  // ── Collaboration ─────────────────────────────────────────────────────────
  getCollaborationCalls: (projectId: number) =>
    api.get<CollaborationCall[]>(`/collaboration-calls?project_id=${projectId}`),
  getOpenCollaborationCalls: (limit: number = 12) =>
    api.get<CollaborationCall[]>(`/collaboration-calls/open?limit=${limit}`),
  getCollaborationCall: (id: number) =>
    api.get<CollaborationCall>(`/collaboration-calls/${id}`),
  createCollaborationCall: (data: Partial<CollaborationCall>) =>
    api.post<CollaborationCall>('/collaboration-calls', data),
  updateCollaborationCall: (id: number, data: Partial<CollaborationCall>) =>
    api.put<CollaborationCall>(`/collaboration-calls/${id}`, data),
  deleteCollaborationCall: (id: number) =>
    api.delete<void>(`/collaboration-calls/${id}`),

  getReceivedCollaborationSubmissions: () =>
    api.get<CollaborationSubmission[]>('/collaboration-submissions/user/received'),
  getCollaborationSubmissions: (callId: number) =>
    api.get<CollaborationSubmission[]>(`/collaboration-submissions/call/${callId}`),
  getCollaborationSubmission: (id: number) =>
    api.get<CollaborationSubmission>(`/collaboration-submissions/${id}`),
  createCollaborationSubmission: (data: Partial<CollaborationSubmission>) =>
    api.post<CollaborationSubmission>('/collaboration-submissions', data),
  updateCollaborationSubmission: (id: number, data: Partial<CollaborationSubmission>) =>
    api.put<CollaborationSubmission>(`/collaboration-submissions/${id}`, data),

  // ── Notifications ────────────────────────────────────────────────────────
  getNotifications: () => api.get<NotificationListResponse>('/notifications/'),
  markNotificationAsRead: (id: number) => api.patch<Notification>(`/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.post<{ message: string }>('/notifications/read-all'),

  // ── Analytics ────────────────────────────────────────────────────────────
  getSystemAnalytics: () => api.get<AnalyticsResponse>('/analytics/system-stats'),

  // ── Landing Page & discovery ──────────────────────────────────────────
  getLandingPageData: () => api.get<LandingPageResponse>('/landing-page'),
  getTeamSummary: (teamId: number) => api.get<TeamSummary>(`/landing-page/teams/${teamId}/summary`),
  getTeamProjects: (teamId: number) => api.get<TeamProjectsResponse>(`/landing-page/teams/${teamId}/projects`),

  // ── Groups & Members ──────────────────────────────────────────────────
  getGroupMembersFiltered: (groupId: number) => api.get<GroupMember[]>(`/group-members/?group_id=${groupId}`),

  // ── Auth utility endpoints ───────────────────────────────────────────────
  getApplications: () => api.get<ProjectApplication[]>('/project-applications/'),
  getMyApplications: () => api.get<ProjectApplication[]>('/project-applications/mine'),
  getApplication: (id: number) => api.get<ProjectApplication>(`/project-applications/${id}`),
  createApplication: (data: Partial<ProjectApplication>) =>
    api.post<ProjectApplication>('/project-applications/', data),
  reviewApplication: (id: number, data: Partial<ProjectApplication>) =>
    api.put<ProjectApplication>(`/project-applications/${id}`, data),
  deleteApplication: (id: number) =>
    api.delete<void>(`/project-applications/${id}`),
  getApplicationRanking: (id: number) =>
    api.get<ProjectApplicationRanking>(`/project-applications/${id}/ranking`),
  getApplicationReviewerRatings: (id: number) =>
    api.get<ProjectApplicationReviewerRating[]>(`/project-applications/${id}/reviewer-ratings`),
  upsertMyApplicationRating: (id: number, data: ProjectApplicationReviewerRatingInput) =>
    api.put<ProjectApplicationReviewerRating>(`/project-applications/${id}/my-rating/`, data),

  // ── Auth utility endpoints ───────────────────────────────────────────────
  forgetPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forget_password', { email }),
  resetPasswordConfirm: (token: string, newPassword: string) =>
    api.post('/auth/reset_password_confirm', { token, new_password: newPassword }),
};
