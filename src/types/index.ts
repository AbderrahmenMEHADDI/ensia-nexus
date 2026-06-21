export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PARTNER';
export type Visibility = 'PUBLIC' | 'PRIVATE';
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type ProjectStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ProjectReviewStatus = 'APPROVED' | 'REJECTED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ParticipantRole = 'MEMBER' | 'REVIEWER' | 'OBSERVER' | 'LEAD';
export type TeacherGrade = 'MCA' | 'PROFESSOR' | 'DOCTOR' | 'RESEARCHER';
export type ResourceType = 'INTERNAL_DOC' | 'GIT_REPO' | 'DATASET' | 'OTHER';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  profile_picture_url?: string;
  institution?: string;
  department?: string;
  contact_email?: string;
  phone_number?: string;
  address?: string;
  website?: string;
  created_at: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
}

export interface Student {
  user_id: number;
  university: string;
  level: string;
  major: string;
  bio?: string;
  experience?: string;
  research_interests?: string;
  skills?: string;
  cv_url?: string;
  created_at: string;
}

export interface StudentCVEntry {
  id: number;
  student_user_id: number;
  title: string;
  university?: string;
  level?: 'PHD' | 'UNDERGRADUATE' | 'GRADUATE';
  major?: string;
  bio?: string;
  experience?: string;
  research_interests?: string;
  skills?: string;
  cv_url?: string;
  created_at: string;
}

export interface StudentPreviousProject {
  id: number;
  student_user_id: number;
  title: string;
  project_link?: string;
  description?: string;
  created_at: string;
}

export interface Teacher {
  user_id: number;
  experience_years: number;
  grade: TeacherGrade;
  department: string;
  research_interests?: string;
  created_at: string;
}

export interface ResearchLab {
  id: number;
  name: string;
  description: string;
  head_teacher_id: number;
  created_at: string;
}

export interface ResearchLabAdmin {
  lab_id: number;
  user_id: number;
  created_at: string;
  created_by?: number;
}

export interface ResearchGroup {
  id: number;
  lab_id: number;
  name: string;
  description: string;
  leader_user_id: number;
  is_validated: boolean;
  show_on_landing_page: boolean;
  picture_url?: string;
  validated_by_admin_id?: number; 
  validated_at?: string;
  created_at: string;
  requested_by_user_id?: number;
}
export interface GroupMember {
  group_id: number;
  user_id: number;
  is_active: boolean;
  joined_at: string;
  user_name?: string;
  user_email?: string;
  user_role?: UserRole;
}

export interface GroupInvitation {
  id: number;
  group_id: number;
  teacher_user_id: number;
  invited_by_user_id: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: string;
  responded_at?: string;
}

export interface Project {
  id: number;
  group_id?: number | null;
  title: string;
  description: string;
  visibility: Visibility;
  status?: ProjectStatus;
  accepting_collaborators: boolean;
  deadline?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  decision_note?: string;
  created_by: number;
  created_at: string;
  participants?: ProjectParticipant[];
}

export interface ProjectParticipant {
  project_id: number;
  user_id: number;
  participant_role: ParticipantRole;
  joined_at: string;
}

export interface ProjectApplication {
  id: number;
  project_id: number;
  student_user_id: number;
  motivation: string;
  status: ApplicationStatus;
  reviewed_by?: number;
  reviewed_at?: string;
  decision_note?: string;
  created_at: string;
  ranking?: ProjectApplicationRanking;
  reviewer_ratings?: ProjectApplicationReviewerRating[];
}

export interface ProjectApplicationRanking {
  application_id: number;
  model_score: number;
  reviewer_score?: number | null;
  final_score: number;
  rank_position?: number | null;
  model_version: string;
  score_breakdown?: Record<string, number> | null;
  explanation?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectApplicationReviewerRating {
  id: number;
  application_id: number;
  reviewer_user_id: number;
  technical_fit: number;
  research_fit: number;
  communication: number;
  reliability_potential: number;
  note?: string;
  overall_score: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectApplicationReviewerRatingInput {
  technical_fit: number;
  research_fit: number;
  communication: number;
  reliability_potential: number;
  note?: string;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  created_by: number;
  assignee_user_id?: number | null;
  due_date?: string;
  created_at: string;
  updated_at?: string | null;
}

export interface TaskUpdate {
  id: number;
  task_id: number;
  author_user_id: number;
  note: string;
  hours_added: number;
  new_status?: TaskStatus;
  new_progress?: number;
  created_at: string;
}

export interface ProjectResource {
  id: number;
  project_id: number;
  resource_type: ResourceType;
  title: string;
  url?: string;
  created_by: number;
  created_at: string;
}

// Group join requests
export interface GroupJoinRequest {
  id: number;
  group_id: number;
  user_id: number;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
}

// Publication types
export interface PublicationAuthor {
  user_id: number;
  author_order: number;
  is_corresponding: boolean;
  publication_id?: number;
  user?: User;
}

export interface Publication {
  id: number;
  project_id?: number;
  title: string;
  abstract?: string;
  publication_date?: string;
  venue?: string;
  doi?: string;
  paper_url?: string;
  citation_count: number;
  created_at?: string;
  authors: PublicationAuthor[];
}

// Collaboration types
export type CollaborationCallStatus = 'OPEN' | 'CLOSED' | 'ARCHIVED';
export type CollaborationSubmissionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface CollaborationCall {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  requirements?: string;
  status: CollaborationCallStatus;
  deadline?: string;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface CollaborationSubmission {
  id: number;
  call_id: number;
  full_name: string;
  email: string;
  institution?: string;
  motivation?: string;
  cv_url: string;
  status: CollaborationSubmissionStatus;
  reviewed_by?: number;
  reviewed_at?: string;
  decision_note?: string;
  submitted_at?: string;
  call?: CollaborationCall;
}

// Notification types
export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  content: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  unread_count: number;
}

// Analytics types
export interface SystemStats {
  total_users: number;
  total_labs: number;
  total_projects: number;
  total_publications: number;
  total_applications: number;
  pending_applications: number;
}

export interface ActivityDatapoint {
  date: string;
  count: number;
}

export interface AnalyticsResponse {
  stats: SystemStats;
  user_growth: ActivityDatapoint[];
  application_trends: ActivityDatapoint[];
}

// Landing Page types
export interface ProjectPreview {
  id: number;
  group_id: number;
  team_id: number;
  team_name: string;
  lab_id: number;
  lab_name: string;
  title: string;
  description?: string;
  accepting_collaborators: boolean;
  open_collaboration_calls_count: number;
  publication_count: number;
  created_at?: string;
}

export interface TeamSummary {
  id: number;
  lab_id: number;
  lab_name: string;
  name: string;
  description?: string;
  leader_user_id?: number;
  picture_url?: string;
  project_count: number;
  open_project_count: number;
  publication_count: number;
}

export interface TeamProjectsResponse {
  team: TeamSummary;
  projects: ProjectPreview[];
}

export interface LandingTeam extends TeamSummary {
  projects: ProjectPreview[];
}

export interface LandingLab {
  id: number;
  name: string;
  description?: string;
  head_teacher_id?: number;
  teams: LandingTeam[];
}

export interface CollaborationCallPreview {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  requirements?: string;
  deadline?: string;
  created_at?: string;
  project: ProjectPreview;
}

export interface PublicationPreview {
  id: number;
  project_id?: number;
  title: string;
  abstract?: string;
  publication_date?: string;
  venue?: string;
  doi?: string;
  paper_url?: string;
  citation_count: number;
  author_count: number;
  project?: ProjectPreview;
  created_at?: string;
}

export interface LandingPageResponse {
  labs: LandingLab[];
  featured_teams: TeamSummary[];
  open_projects: ProjectPreview[];
  open_collaboration_calls: CollaborationCallPreview[];
  publications: PublicationPreview[];
}

export * from './task_comment';
