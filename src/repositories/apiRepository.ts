import { api } from '../lib/apiClient';
import type { ResearchLab, ResearchGroup, Project, Task, ProjectApplication } from '@/types';

/**
 * General API Repository for various entities.
 * Methods here handle CRUD operations for labs, groups, projects, etc.
 */
export const apiRepository = {
  // Labs
  getLabs: () => api.get<ResearchLab[]>('/labs'),
  getLab: (id: number) => api.get<ResearchLab>(`/labs/${id}`),

  // Groups
  getGroups: (labId?: number) => api.get<ResearchGroup[]>(labId ? `/groups?lab_id=${labId}` : '/groups'),
  getGroup: (id: number) => api.get<ResearchGroup>(`/groups/${id}`),

  // Projects
  getProjects: (groupId?: number) => api.get<Project[]>(groupId ? `/projects?group_id=${groupId}` : '/projects'),
  getProject: (id: number) => api.get<Project>(`/projects/${id}`),

  // Tasks
  getTasks: (projectId: number) => api.get<Task[]>(`/projects/${projectId}/tasks`),
  createTask: (projectId: number, data: Partial<Task>) => api.post<Task>(`/projects/${projectId}/tasks`, data),

  // Applications
  getApplications: () => api.get<ProjectApplication[]>('/project-applications'),
  submitApplication: (data: Partial<ProjectApplication>) => api.post<ProjectApplication>('/project-applications', data),
};
