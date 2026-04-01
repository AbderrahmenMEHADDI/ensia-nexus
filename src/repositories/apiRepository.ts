import { api } from '../lib/apiClient';
import type {
  User, UserListResponse, Student, Teacher,
  ResearchLab, ResearchGroup, GroupMember, ResearchLabAdmin, 
  Project, ProjectParticipant, ProjectApplication, ProjectResource,
  Task, TaskUpdate, Announcement, Comment, Reaction, StudentCVEntry, StudentPreviousProject,
  UserRole,
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
    return api.get<User[]>(qs ? `/users?${qs}` : '/users');
  },
  getUser: (id: number) => api.get<User>(`/users/${id}`),
  updateUser: (id: number, data: Partial<User>) => api.put<User>(`/users/${id}`, data),
  setPlatformAdmin: (id: number, is_platform_admin: boolean) =>
    api.patch<User>(`/users/${id}/platform-admin`, { is_platform_admin }),
  getUsersPaged: (params: {
    skip?: number;
    limit?: number;
    role?: UserRole;
    search?: string;
    is_platform_admin?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (typeof params.skip !== 'undefined') searchParams.set('skip', params.skip.toString());
    if (typeof params.limit !== 'undefined') searchParams.set('limit', params.limit.toString());
    if (params.role) searchParams.set('role', params.role);
    if (params.search) searchParams.set('search', params.search);
    if (typeof params.is_platform_admin !== 'undefined') {
      searchParams.set('is_platform_admin', String(params.is_platform_admin));
    }
    const qs = searchParams.toString();
    return api.get<UserListResponse>(qs ? `/users/paged?${qs}` : '/users/paged');
  },

  // ── Student / Teacher profiles ───────────────────────────────────────────
  getTeachers: () => api.get<Teacher[]>('/teachers/'),
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

  // ── Projects ─────────────────────────────────────────────────────────────
  getProjects: (groupId?: number) =>
    api.get<Project[]>(groupId ? `/projects/?group_id=${groupId}` : '/projects/'),
  getProject: (id: number) => api.get<Project>(`/projects/${id}`),
  createProject: (data: Partial<Project>) => api.post<Project>('/projects/', data),

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

  // ── Tasks ─────────────────────────────────────────────────────────────────
  getTasks: (projectId?: number) =>
    api.get<Task[]>(projectId ? `/tasks/?project_id=${projectId}` : '/tasks/'),
  getTask: (id: number) => api.get<Task>(`/tasks/${id}`),
  createTask: (data: Partial<Task>) => api.post<Task>('/tasks/', data),
  updateTask: (id: number, data: Partial<Task>) => api.put<Task>(`/tasks/${id}`, data),

  // ── Task updates ──────────────────────────────────────────────────────────
  getTaskUpdates: (taskId: number) =>
    api.get<TaskUpdate[]>(`/task-updates/?task_id=${taskId}`),

  // ── Applications ─────────────────────────────────────────────────────────
  getApplications: () => api.get<ProjectApplication[]>('/project-applications/'),
  getApplication: (id: number) => api.get<ProjectApplication>(`/project-applications/${id}`),
  createApplication: (data: Partial<ProjectApplication>) =>
    api.post<ProjectApplication>('/project-applications/', data),
  reviewApplication: (id: number, data: Partial<ProjectApplication>) =>
    api.put<ProjectApplication>(`/project-applications/${id}`, data),

  // ── Announcements ────────────────────────────────────────────────────────
  getAnnouncements: () => api.get<Announcement[]>('/announcements/'),
  createAnnouncement: (data: Partial<Announcement>) => api.post<Announcement>('/announcements/', data),
  getInteractions: (id: number) => api.get<Announcement['interactions']>(`/announcements/${id}/interactions`),
  getComments: (id: number) => api.get<Comment[]>(`/announcements/${id}/comments`),
  createComment: (id: number, data: Partial<Comment>) => api.post<Comment>(`/announcements/${id}/comments`, data),
  reactToAnnouncement: (id: number, data: Partial<Reaction>) => api.post<{status: string, reaction: string | null}>(`/announcements/${id}/react`, data),

  // ── Auth utility endpoints ───────────────────────────────────────────────
  forgetPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forget_password', { email }),
  resetPasswordConfirm: (token: string, newPassword: string) =>
    api.post('/auth/reset_password_confirm', { token, new_password: newPassword }),
};
