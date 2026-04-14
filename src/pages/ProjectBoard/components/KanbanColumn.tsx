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
      className={`rounded-xl border border-border bg-card/50 p-3 transition-colors min-h-[200px] ${isOver ? 'border-primary/40 bg-primary/5' : ''}`}
      onDragOver={e => handleDragOver(e, status)}
      onDragLeave={handleDragLeave}
      onDrop={e => handleDrop(e, status)}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="ml-auto text-xs font-mono text-muted-foreground">{tasks.length}</span>
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
          />
        ))}
      </div>

      {canParticipate && (
        <button
          onClick={() => onAddTask(status)}
          className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border text-xs font-mono text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Plus className="h-3 w-3" /> Add task
        </button>
      )}
    </div>
  );
};
