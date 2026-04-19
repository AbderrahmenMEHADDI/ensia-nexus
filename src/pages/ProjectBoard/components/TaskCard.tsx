import { motion } from 'framer-motion';
import { Calendar, GripVertical } from 'lucide-react';
import {getPriorityBorderClass, PriorityBadge} from '@/components/Badges';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import type { Task, User } from '@/types';

interface TaskCardProps {
  task: Task;
  index: number;
  getUserById: (id: number) => User | undefined;
  handleDragStart: (e: React.DragEvent, taskId: number) => void;
  handleDragEnd: () => void;
  handleOpenEdit: (task: Task) => void;
  isDragging: boolean;
}

export const TaskCard = ({
  task,
  index,
  getUserById,
  handleDragStart,
  handleDragEnd,
  handleOpenEdit,
  isDragging,
}: TaskCardProps) => {
  const assignee = task.assignee_user_id ? getUserById(task.assignee_user_id) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      draggable
      onDragStartCapture={(e: React.DragEvent) => handleDragStart(e, task.id)}
      onDragEnd={handleDragEnd}
      onClick={() => handleOpenEdit(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpenEdit(task);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}. Click to edit.`}
      className={`p-3 rounded-lg border border-border bg-card border-l-4 ${getPriorityBorderClass(task.priority)} group cursor-grab active:cursor-grabbing hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary focus:outline-none transition-all ${isDragging ? 'scale-95 shadow-lg' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-foreground leading-tight">{task.title}</span>
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 mt-0.5" />
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
      <div className="flex items-center justify-between">
        <PriorityBadge priority={task.priority} />
        {assignee && (
          <span title={assignee.full_name} aria-label={assignee.full_name}>
            <ProfileAvatar
              userId={assignee.id}
              name={assignee.full_name}
              className="h-5 w-5 rounded-full bg-secondary text-[10px] font-medium text-secondary-foreground"
              textClassName="text-[10px] font-medium text-secondary-foreground"
            />
          </span>
        )}
      </div>
      {task.due_date && (
        <div className="flex items-center gap-1 mt-2 text-xs font-mono text-muted-foreground">
          <Calendar className="h-3 w-3" /> {task.due_date}
        </div>
      )}
    </motion.div>
  );
};
