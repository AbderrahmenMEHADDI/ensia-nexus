import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus, User } from '@/types';

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  color: string;
  tasks: Task[];
  draggedTaskId: number | null;
  dragOverColumn: TaskStatus | null;
  handleDragStart: (e: React.DragEvent, taskId: number) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: React.DragEvent, status: TaskStatus) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, status: TaskStatus) => void;
  handleOpenEdit: (task: Task) => void;
  canParticipate: boolean;
  onAddTask: (status: TaskStatus) => void;
  getUserById: (id: number) => User | undefined;
}

export const KanbanColumn = ({
  status,
  label,
  color,
  tasks,
  draggedTaskId,
  dragOverColumn,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleOpenEdit,
  canParticipate,
  onAddTask,
  getUserById,
}: KanbanColumnProps) => {
  const isOver = dragOverColumn === status;

  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-[#F8FAFC]/50 p-3 transition-colors min-h-[200px] shadow-sm ${isOver ? 'border-[#F37F20]/40 bg-[#F37F20]/5' : ''}`}
      onDragOver={canParticipate ? e => handleDragOver(e, status) : undefined}
      onDragLeave={canParticipate ? handleDragLeave : undefined}
      onDrop={canParticipate ? e => handleDrop(e, status) : undefined}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-sm font-bold" style={{ color: '#074a75' }}>{label}</span>
        <span className="ml-auto text-xs font-mono font-semibold" style={{ color: '#94A3B8' }}>{tasks.length}</span>
      </div>

      <div className="space-y-2">
        {tasks.map((task, i) => (
          <TaskCard
            key={task.id}
            task={task}
            index={i}
            getUserById={getUserById}
            handleDragStart={handleDragStart}
            handleDragEnd={handleDragEnd}
            handleOpenEdit={handleOpenEdit}
            isDragging={draggedTaskId === task.id}
            canParticipate={canParticipate}
          />
        ))}
      </div>

      {canParticipate && (
        <button
          onClick={() => onAddTask(status)}
          className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-slate-300 bg-white text-xs font-bold tracking-wider uppercase text-slate-500 hover:border-[#F37F20]/40 hover:text-[#F37F20] transition-colors shadow-sm"
        >
          <Plus className="h-3 w-3" /> Add task
        </button>
      )}
    </div>
  );
};
