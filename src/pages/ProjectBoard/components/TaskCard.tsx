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
  canParticipate?: boolean;
}

export const TaskCard = ({
  task,
  index,
  getUserById,
  handleDragStart,
  handleDragEnd,
  handleOpenEdit,
  isDragging,
  canParticipate = true,
}: TaskCardProps) => {
  const assignee = task.assignee_user_id ? getUserById(task.assignee_user_id) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      draggable={canParticipate}
      onDragStartCapture={(e: React.DragEvent) => {
        if (canParticipate) {
          handleDragStart(e, task.id);
        } else {
          e.preventDefault();
        }
      }}
      onDragEnd={canParticipate ? handleDragEnd : undefined}
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
      className={`p-4 rounded-xl border border-slate-100 bg-white border-l-4 ${getPriorityBorderClass(task.priority)} group ${canParticipate ? 'cursor-grab active:cursor-grabbing hover:border-[#F47A1E]/30' : 'cursor-default hover:border-slate-200'} shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)] focus-visible:ring-2 focus-visible:ring-[#F47A1E] focus:outline-none transition-all ${isDragging ? 'scale-95 shadow-lg' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-bold text-[#0F172A] leading-tight">{task.title}</span>
        {canParticipate && (
          <GripVertical className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-400 shrink-0 mt-0.5" />
        )}
      </div>
      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
      <div className="flex items-center justify-between">
        <PriorityBadge priority={task.priority} />
        {assignee && (
          <span title={assignee.full_name} aria-label={assignee.full_name}>
            <ProfileAvatar
              userId={assignee.id}
              name={assignee.full_name}
              className="h-6 w-6 rounded-full bg-slate-100 text-[10px] font-bold text-[#173C7E] ring-2 ring-white"
              textClassName="text-[10px] font-bold text-[#173C7E]"
            />
          </span>
        )}
      </div>
      {task.due_date && (
        <div className="flex items-center gap-1.5 mt-3 text-xs font-bold tracking-widest uppercase text-slate-400">
          <Calendar className="h-3.5 w-3.5" style={{ color: '#F47A1E' }} /> {task.due_date}
        </div>
      )}
    </motion.div>
  );
};
