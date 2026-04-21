import { User } from './index';

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  created_at: string;
  author: User;
}

export interface TaskCommentCreate {
  content: string;
}
