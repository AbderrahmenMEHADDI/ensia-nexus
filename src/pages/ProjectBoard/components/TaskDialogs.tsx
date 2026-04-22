import { Loader2, Plus, MessageSquare, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { apiRepository } from '@/repositories/apiRepository';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import type { TaskStatus, TaskPriority, ProjectParticipant, User, TaskComment } from '@/types';

interface TaskDialogsProps {
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  createStatus: TaskStatus;
  setCreateStatus: (status: TaskStatus) => void;
  newTitle: string;
  setNewTitle: (val: string) => void;
  newDesc: string;
  setNewDesc: (val: string) => void;
  newPriority: TaskPriority;
  setNewPriority: (val: TaskPriority) => void;
  newAssigneeUserId: string;
  setNewAssigneeUserId: (val: string) => void;
  createLoading: boolean;
  handleCreateTask: () => void;
  
  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  editTaskId?: number;
  editTitle: string;
  setEditTitle: (val: string) => void;
  editDesc: string;
  setEditDesc: (val: string) => void;
  editStatus: TaskStatus;
  setEditStatus: (status: TaskStatus) => void;
  editPriority: TaskPriority;
  setEditPriority: (val: TaskPriority) => void;
  editAssigneeUserId: string;
  setEditAssigneeUserId: (val: string) => void;
  editLoading: boolean;
  handleUpdateTask: () => void;

  statusColumns: { status: TaskStatus; label: string; color: string }[];
  participants: ProjectParticipant[];
  getUserById: (id: number) => User | undefined;
}

export const TaskDialogs = ({
  createOpen,
  setCreateOpen,
  createStatus,
  setCreateStatus,
  newTitle,
  setNewTitle,
  newDesc,
  setNewDesc,
  newPriority,
  setNewPriority,
  newAssigneeUserId,
  setNewAssigneeUserId,
  createLoading,
  handleCreateTask,
  
  editOpen,
  setEditOpen,
  editTaskId,
  editTitle,
  setEditTitle,
  editDesc,
  setEditDesc,
  editStatus,
  setEditStatus,
  editPriority,
  setEditPriority,
  editAssigneeUserId,
  setEditAssigneeUserId,
  editLoading,
  handleUpdateTask,

  statusColumns,
  participants,
  getUserById,
}: TaskDialogsProps) => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    if (editOpen && editTaskId) {
      loadComments();
    } else {
      setComments([]);
      setNewComment("");
    }
  }, [editOpen, editTaskId]);

  const loadComments = async () => {
    if (!editTaskId) return;
    setIsLoadingComments(true);
    try {
      const data = await apiRepository.getTaskComments(editTaskId);
      setComments(data);
    } catch (error) {
      console.error("Failed to load comments", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!editTaskId || !newComment.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      const addedComment = await apiRepository.createTaskComment(editTaskId, { content: newComment });
      setComments([...comments, addedComment]);
      setNewComment("");
    } catch (error) {
      console.error("Failed to post comment", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await apiRepository.deleteTaskComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
      toast({ title: "Comment deleted" });
    } catch (error) {
      console.error("Failed to delete comment", error);
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast({ title: "Failed to delete comment", description: msg, variant: "destructive" });
    }
  };

  return (
    <>
      {/* Create Task Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Add a new task to the board.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input id="task-title" placeholder="Task title..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea id="task-desc" placeholder="Describe the task..." value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={createStatus} onValueChange={v => setCreateStatus(v as TaskStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusColumns.map(s => <SelectItem key={s.status} value={s.status}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newPriority} onValueChange={v => setNewPriority(v as TaskPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={newAssigneeUserId} onValueChange={setNewAssigneeUserId}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {participants.map(p => {
                    const u = getUserById(p.user_id);
                    return u ? <SelectItem key={u.id} value={String(u.id)}>{u.full_name}</SelectItem> : null;
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={createLoading || !newTitle.trim()}>
              {createLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>Modify task details or add a comment.</DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-8 my-2">
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Details</h3>
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea id="edit-desc" value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={v => setEditStatus(v as TaskStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusColumns.map(s => <SelectItem key={s.status} value={s.status}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={editPriority} onValueChange={v => setEditPriority(v as TaskPriority)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={editAssigneeUserId} onValueChange={setEditAssigneeUserId}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {participants.map(p => {
                      const pu = getUserById(p.user_id);
                      if (!pu) return null;
                      return <SelectItem key={pu.id} value={String(pu.id)}>{pu.full_name}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-4 flex flex-col h-[400px]">
              <h3 className="font-medium text-sm text-muted-foreground uppercase flex items-center tracking-wider"><MessageSquare className="h-4 w-4 mr-2" /> Comments</h3>
              
              <div className="flex-1 min-h-[250px] border rounded-md p-3 relative flex flex-col">
                {isLoadingComments ? (
                  <div className="flex-1 flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex-1 flex justify-center items-center text-sm text-muted-foreground">
                    No comments yet.
                  </div>
                ) : (
                  <ScrollArea className="flex-1 pr-3">
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 group">
                          <ProfileAvatar 
                            userId={comment.author.id} 
                            name={comment.author.full_name} 
                            className="h-8 w-8 shrink-0 bg-muted"
                          />
                          <div className="flex-1 bg-muted/50 rounded-lg p-3 pt-2 text-sm">
                            <div className="flex justify-between items-center mb-1 gap-2">
                              <span className="font-semibold text-foreground">{comment.author.full_name}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-muted-foreground">{format(new Date(comment.created_at), "MMM d, h:mm a")}</span>
                                {(currentUser?.id === comment.author.id || currentUser?.role === 'TEACHER') && (
                                  <button 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteComment(comment.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 bg-destructive/10 text-destructive rounded transition-all hover:bg-destructive hover:text-destructive-foreground relative z-10 cursor-pointer"
                                    title="Delete comment"
                                    type="button"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-foreground whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
              
              <div className="flex flex-col gap-2 pt-2">
                <Textarea 
                  placeholder="Add a comment..." 
                  value={newComment} 
                  onChange={e => setNewComment(e.target.value)} 
                  rows={2}
                  className="resize-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handlePostComment();
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  className="self-end" 
                  onClick={handlePostComment} 
                  disabled={!newComment.trim() || isSubmittingComment}
                >
                  {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-1" />}
                  Post Comment
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 pt-4 border-t w-full">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleUpdateTask} disabled={editLoading || !editTitle.trim()}>
              {editLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
