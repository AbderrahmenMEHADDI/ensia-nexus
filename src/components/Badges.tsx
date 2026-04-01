import { type UserRole, type TaskPriority, type TaskStatus, type ApplicationStatus } from '@/types';

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  STUDENT: { label: 'Student', className: 'bg-info/15 text-info border-info/30' },
  TEACHER: { label: 'Teacher', className: 'bg-primary/15 text-primary border-primary/30' },
  ADMIN: { label: 'Admin', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  PARTNER: { label: 'Partner', className: 'bg-success/15 text-success border-success/30' },
};


export const RoleBadge = ({ role }: { role: UserRole }) => {
  const config = roleConfig[role];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
};

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'bg-priority-low/15 text-priority-low' },
  MEDIUM: { label: 'Medium', className: 'bg-priority-medium/15 text-priority-medium' },
  HIGH: { label: 'High', className: 'bg-priority-high/15 text-priority-high' },
  URGENT: { label: 'Urgent', className: 'bg-priority-urgent/15 text-priority-urgent' },
};

export const PriorityBadge = ({ priority }: { priority: TaskPriority }) => {
  const config = priorityConfig[priority];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  TODO: { label: 'To Do', className: 'bg-status-todo/15 text-status-todo' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-status-in-progress/15 text-status-in-progress' },
  BLOCKED: { label: 'Blocked', className: 'bg-status-blocked/15 text-status-blocked' },
  DONE: { label: 'Done', className: 'bg-status-done/15 text-status-done' },
  CANCELLED: { label: 'Cancelled', className: 'bg-status-cancelled/15 text-status-cancelled' },
};

export const StatusBadge = ({ status }: { status: TaskStatus }) => {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

const appStatusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-primary/15 text-primary border-primary/30' },
  ACCEPTED: { label: 'Accepted', className: 'bg-success/15 text-success border-success/30' },
  REJECTED: { label: 'Rejected', className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export const ApplicationStatusBadge = ({ status }: { status: ApplicationStatus }) => {
  const config = appStatusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
};

const priorityBorderColors: Record<TaskPriority, string> = {
  LOW: 'border-l-priority-low',
  MEDIUM: 'border-l-priority-medium',
  HIGH: 'border-l-priority-high',
  URGENT: 'border-l-priority-urgent',
};

export const getPriorityBorderClass = (priority: TaskPriority) => priorityBorderColors[priority];
