import { KanbanColumn } from './KanbanColumn';
import type { Task, TaskStatus, User } from '@/types';

interface KanbanBoardProps {
  statusColumns: { status: TaskStatus; label: string; color: string }[];
  localTasks: Task[];
  selectedProjectId: number | null;
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

export const KanbanBoard = ({
  statusColumns,
  localTasks,
  selectedProjectId,
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
}: KanbanBoardProps) => {
  return (
    <div className="grid md:grid-cols-4 gap-4 mb-10">
      {statusColumns.map(col => {
        const columnTasks = localTasks.filter(
          t => t.project_id === selectedProjectId && t.status === col.status
        );
        return (
          <KanbanColumn
            key={col.status}
            status={col.status}
            label={col.label}
            color={col.color}
            tasks={columnTasks}
            draggedTaskId={draggedTaskId}
            dragOverColumn={dragOverColumn}
            handleDragStart={handleDragStart}
            handleDragEnd={handleDragEnd}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            handleOpenEdit={handleOpenEdit}
            canParticipate={canParticipate}
            onAddTask={onAddTask}
            getUserById={getUserById}
          />
        );
      })}
    </div>
  );
};
