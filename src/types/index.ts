export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PARTNER';
export type Visibility = 'PUBLIC' | 'PRIVATE';
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ParticipantRole = 'MEMBER' | 'REVIEWER' | 'OBSERVER' | 'LEAD';
export type TeacherGrade = 'MCA' | 'PROFESSOR' | 'DOCTOR' | 'RESEARCHER';
export type ResourceType = 'PAPER_DOC' | 'GIT_REPO' | 'DATASET' | 'OTHER';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  author_user_id: number;
  created_at: string;
  category: 'RESEARCH' | 'ADMIN' | 'EVENT';
  tags?: string[];
  interactions?: {
    comments_count: number;
    reactions_count: number;
    reactions_by_type: Record<string, number>;
    user_reacted?: string;
  };
}

export interface Comment {
  id: number;
  content: string;
  announcement_id: number;
  author_user_id: number;
  created_at: string;
}

export interface Reaction {
  announcement_id: number;
  user_id: number;
  reaction_type: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Student {
  user_id: number;
  university: string;
  level: string;
  major: string;
  created_at: string;
}

export interface Teacher {
  user_id: number;
  experience_years: number;
  grade: TeacherGrade;
  department: string;
  research_interests: string;
  created_at: string;
}

export interface ResearchLab {
  id: number;
  name: string;
  description: string;
  head_teacher_id: number;
  created_at: string;
}

export interface ResearchGroup {
  id: number;
  lab_id: number;
  name: string;
  description: string;
  leader_user_id: number;
  is_validated: boolean;
  validated_by_admin_id?: number;
  validated_at?: string;
  created_at: string;
}

export interface GroupMember {
  group_id: number;
  user_id: number;
  is_active: boolean;
  joined_at: string;
}

export interface Project {
  id: number;
  group_id: number;
  title: string;
  description: string;
  visibility: Visibility;
  created_by: number;
  created_at: string;
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
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  created_by: number;
  assignee_user_id?: number;
  due_date?: string;
  created_at: string;
  updated_at: string;
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

// Chat types
export interface ChatRoom {
  id: number;
  name: string;
  type: 'TEAM' | 'PROJECT';
  project_id?: number;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  room_id: number;
  sender_user_id: number;
  content: string;
  created_at: string;
}

// Feed types
export interface FeedPost {
  id: number;
  author_user_id: number;
  content: string;
  tags: string[];
  project_id?: number;
  group_id?: number;
  created_at: string;
}

export interface FeedComment {
  id: number;
  post_id: number;
  author_user_id: number;
  content: string;
  created_at: string;
}

export interface FeedLike {
  post_id: number;
  user_id: number;
}

export interface FeedSave {
  post_id: number;
  user_id: number;
}
