import { api } from '../lib/apiClient';
import type {
  User, Student, Teacher,
  ResearchLab, ResearchGroup, GroupMember,
  Project, ProjectParticipant, ProjectApplication, ProjectResource,
  Task, TaskUpdate, Announcement, Comment, Reaction,
} from '@/types';

/**
 * Centralized API repository for all entity CRUD operations.
 */
export const apiRepository = {
  // ── Users ────────────────────────────────────────────────────────────────
  getUsers: () => api.get<User[]>('/users'),
  getUser: (id: number) => api.get<User>(`/users/${id}`),

  // ── Student / Teacher profiles ───────────────────────────────────────────
  getStudentProfile: (userId: number) => api.get<Student>(`/students/${userId}`),
  getTeacherProfile: (userId: number) => api.get<Teacher>(`/teachers/${userId}`),

  // ── Labs ─────────────────────────────────────────────────────────────────
  getLabs: () => api.get<ResearchLab[]>('/labs/'),
  getLab: (id: number) => api.get<ResearchLab>(`/labs/${id}`),
  createLab: (data: Partial<ResearchLab>) => api.post<ResearchLab>('/labs/', data),
  updateLab: (id: number, data: Partial<ResearchLab>) => api.put<ResearchLab>(`/labs/${id}`, data),

  // ── Groups ───────────────────────────────────────────────────────────────
  getGroups: (labId?: number) =>
    api.get<ResearchGroup[]>(labId ? `/groups/?lab_id=${labId}` : '/groups/'),
  getGroup: (id: number) => api.get<ResearchGroup>(`/groups/${id}`),
  createGroup: (data: Partial<ResearchGroup>) => api.post<ResearchGroup>('/groups/', data),
  updateGroup: (id: number, data: Partial<ResearchGroup>) =>
    api.put<ResearchGroup>(`/groups/${id}`, data),

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
