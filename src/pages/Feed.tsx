import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import { RoleBadge } from '@/components/Badges';
import {
  Heart, MessageCircle, Send, MoreHorizontal,
  Users, FlaskConical, ChevronDown, ChevronUp, Sparkles, Loader2, Info, Tag as TagIcon, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import type { Announcement, User, Project, ResearchGroup, Task, Comment } from '@/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const PostCard = ({
  post,
  index,
  user,
  getUserById,
  onReact,
  onAddComment,
  onDeletePost,
  onDeleteComment
}: {
  post: Announcement;
  index: number;
  user: User | null;
  getUserById: (id: number) => User | undefined;
  onReact: (id: number, type: string) => Promise<void>;
  onAddComment: (id: number, text: string) => Promise<void>;
  onDeletePost: (id: number) => Promise<void>;
  onDeleteComment: (postId: number, commentId: number) => Promise<void>;
}) => {
  const author = getUserById(post.author_user_id);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [deletingCommentIds, setDeletingCommentIds] = useState<number[]>([]);
  const [newComment, setNewComment] = useState('');
  const { toast } = useToast();

  const isLiked = post.interactions?.user_reacted === 'like';
  const reactionsCount = post.interactions?.reactions_count || 0;
  const commentsCount = post.interactions?.comments_count || 0;
  const canDeletePost = !!user && (user.role === 'ADMIN' || user.id === post.author_user_id);

  const handleDeletePost = async () => {
    if (!canDeletePost || deletingPost) return;
    setDeletingPost(true);
    try {
      await onDeletePost(post.id);
    } catch {
      toast({ title: 'Failed to delete post', variant: 'destructive' });
    } finally {
      setDeletingPost(false);
    }
  };

  const toggleComments = async () => {
    const nextShow = !showComments;
    setShowComments(nextShow);
    if (nextShow && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await apiRepository.getComments(post.id);
        setComments(res);
      } catch (e) {
        toast({ title: 'Failed to load comments', variant: 'destructive' });
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !user || postingComment) return;
    
    const commentText = newComment.trim();
    setNewComment('');
    setPostingComment(true);

    // Optimistic UI for the comment list
    const tempId = -Math.floor(Math.random() * 1000000);
    const optimisticComment: Comment = {
      id: tempId,
      content: commentText,
      announcement_id: post.id,
      author_user_id: user.id,
      created_at: new Date().toISOString()
    };
    
    setComments(prev => [...prev, optimisticComment]);

    try {
      await onAddComment(post.id, commentText);
      // On success, we refresh to get the real ID and timestamps
      const res = await apiRepository.getComments(post.id);
      setComments(res);
    } catch {
      toast({ title: 'Failed to post comment', variant: 'destructive' });
      setComments(prev => prev.filter(c => c.id !== tempId));
      setNewComment(commentText); // Restore input
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!user) return;
    const canDeleteComment = user.role === 'ADMIN' || user.id === comment.author_user_id;
    if (!canDeleteComment || deletingCommentIds.includes(comment.id)) return;

    setDeletingCommentIds(prev => [...prev, comment.id]);
    try {
      await onDeleteComment(post.id, comment.id);
      setComments(prev => prev.filter(c => c.id !== comment.id));
    } catch {
      toast({ title: 'Failed to delete comment', variant: 'destructive' });
    } finally {
      setDeletingCommentIds(prev => prev.filter(id => id !== comment.id));
    }
  };

  if (!author) return null;

  const tags = post.tags ? (Array.isArray(post.tags) ? post.tags : (post.tags as string).split(',').filter(Boolean)) : [];

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm"
    >
      {/* Author header */}
      <div className="flex items-start gap-3 p-5 pb-2">
        <ProfileAvatar
          userId={author.id}
          name={author.full_name}
          className="h-10 w-10 shrink-0 rounded-full bg-muted text-sm font-medium text-muted-foreground"
          textClassName="text-sm font-medium text-muted-foreground"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-semibold text-foreground leading-none">{author.full_name}</span>
            <RoleBadge role={author.role} />
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-accent/40 border-border/70 text-muted-foreground">
              {post.category}
            </span>
            {canDeletePost && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeletePost}
                disabled={deletingPost}
                className="ml-auto h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-60"
                aria-label="Delete post"
                title="Delete post"
              >
                {deletingPost ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-2 pb-4">
        <h3 className="text-lg font-semibold text-foreground mb-2 leading-snug">{post.title}</h3>
        <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">{post.content}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-accent/70 text-accent-foreground border border-border/60">
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Engagement stats */}
      {(reactionsCount > 0 || commentsCount > 0) && (
        <div className="flex items-center justify-between px-5 py-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {reactionsCount > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3 fill-primary text-primary" />
                {reactionsCount}
              </span>
            )}
          </div>
          {commentsCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleComments}
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors"
            >
              {commentsCount} comment{commentsCount > 1 ? 's' : ''}
            </Button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 border-t border-border/70">
        <Button
          variant="ghost"
          onClick={() => onReact(post.id, 'like')}
          className={`flex items-center justify-center gap-2 rounded-none py-5 text-sm font-medium transition-colors hover:bg-accent/40 ${isLiked ? 'text-primary hover:text-primary' : 'text-muted-foreground'}`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-primary' : ''}`} />
          Like
        </Button>
        <Button
          variant="ghost"
          onClick={toggleComments}
          className="flex items-center justify-center gap-2 rounded-none py-5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/40"
        >
          {loadingComments ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
          {loadingComments ? 'Loading...' : 'Comment'}
        </Button>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-4 space-y-3">
              {loadingComments ? (
                <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
              ) : (
                comments.map(comment => {
                  const cAuthor = getUserById(comment.author_user_id);
                  if (!cAuthor) return null;
                  const canDeleteComment = !!user && (user.role === 'ADMIN' || user.id === comment.author_user_id);
                  const isDeletingComment = deletingCommentIds.includes(comment.id);
                  return (
                    <div key={comment.id} className="flex gap-2.5">
                      <ProfileAvatar
                        userId={cAuthor.id}
                        name={cAuthor.full_name}
                        className="h-7 w-7 shrink-0 rounded-full bg-muted text-[10px] font-medium text-muted-foreground"
                        textClassName="text-[10px] font-medium text-muted-foreground"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="rounded-lg bg-accent/50 p-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{cAuthor.full_name}</span>
                            <span className="text-[11px] text-muted-foreground">{timeAgo(comment.created_at)}</span>
                            {canDeleteComment && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteComment(comment)}
                                disabled={isDeletingComment}
                                className="ml-auto h-7 w-7 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-60"
                                title="Delete comment"
                                aria-label="Delete comment"
                              >
                                {isDeletingComment ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-foreground mt-1 leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* New comment input */}
              {user && (
                <div className="flex gap-2.5 pt-1">
                  <ProfileAvatar
                    userId={user.id}
                    name={user.full_name}
                    className="h-7 w-7 shrink-0 rounded-full bg-muted text-[10px] font-medium text-muted-foreground"
                    textClassName="text-[10px] font-medium text-muted-foreground"
                  />
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !postingComment && submitComment()}
                      placeholder="Write a comment..."
                      disabled={postingComment}
                      className="flex-1 text-xs bg-accent/40 rounded-lg h-9 border-border focus:ring-1 focus:ring-primary/30"
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={submitComment} disabled={!newComment.trim() || postingComment}>
                      {postingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

const Feed = () => {
  const { user, isTeacher, isAdmin } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');

  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  const sortAnnouncementsByNewest = (items: Announcement[]) => (
    [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  );

  const loadData = async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      const [ann, u, g, p, t] = await Promise.all([
        apiRepository.getAnnouncements(),
        apiRepository.getUsers(),
        apiRepository.getGroups(),
        apiRepository.getProjects(),
        apiRepository.getTasks()
      ]);

      // Fetch interactions for announcements
      const richAnn = await Promise.all(ann.map(async (a) => {
        try {
          // If we are currently performing an optimistic update on this ID,
          // we might want to skip fetching its interactions to avoid flicker,
          // or merge them carefully. For now, we fetch but will filter in setAnnouncements.
          const interactions = await apiRepository.getInteractions(a.id);
          return { ...a, interactions };
        } catch { return a; }
      }));

      setAnnouncements(prev => {
        const sorted = sortAnnouncementsByNewest(richAnn);
        // Don't overwrite announcements that have a pending interaction change
        return sorted.map(newA => {
          if (pendingIds.has(newA.id)) {
            const existing = prev.find(p => p.id === newA.id);
            return existing ? { ...newA, interactions: existing.interactions } : newA;
          }
          return newA;
        });
      });
      
      setUsers(u);
      setGroups(g);
      setProjects(p);
      setTasks(t);
    } catch (e) {
      console.error('Feed data load error:', e);
      if (!silent) {
        toast({ title: 'Failed to synchronize feed', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const intervalId = window.setInterval(() => {
      loadData({ silent: true });
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, []);

  const getUserById = (id: number) => users.find(u => u.id === id);

  const handleReact = async (id: number, type: string) => {
    if (!user || pendingIds.has(id)) return;

    // 1. Optimistic Update
    const originalAnnouncement = announcements.find(a => a.id === id);
    if (!originalAnnouncement) return;

    const currentInteractions = originalAnnouncement.interactions || {
      comments_count: 0,
      reactions_count: 0,
      reactions_by_type: {},
      user_reacted: undefined
    };

    const isRemoving = currentInteractions.user_reacted === type;
    const newReactionsByType = { ...currentInteractions.reactions_by_type };
    
    // Adjust counts and types
    if (isRemoving) {
      newReactionsByType[type] = Math.max(0, (newReactionsByType[type] || 0) - 1);
    } else {
      // If they had a different reaction before, remove that one first
      if (currentInteractions.user_reacted) {
        const oldType = currentInteractions.user_reacted;
        newReactionsByType[oldType] = Math.max(0, (newReactionsByType[oldType] || 0) - 1);
      }
      newReactionsByType[type] = (newReactionsByType[type] || 0) + 1;
    }

    const optimisticInteractions = {
      ...currentInteractions,
      user_reacted: isRemoving ? undefined : type,
      reactions_count: currentInteractions.reactions_count + (isRemoving ? -1 : (currentInteractions.user_reacted ? 0 : 1)),
      reactions_by_type: newReactionsByType
    };

    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, interactions: optimisticInteractions } : a));
    setPendingIds(prev => new Set(prev).add(id));

    try {
      const updatedInteractions = await apiRepository.reactToAnnouncement(id, {
        announcement_id: id,
        user_id: user.id,
        reaction_type: type
      });
      // Sync with server response
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, interactions: updatedInteractions } : a));
    } catch {
      toast({ title: 'Reaction failed', variant: 'destructive' });
      // Rollback: Fetch fresh interactions
      try {
        const fresh = await apiRepository.getInteractions(id);
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, interactions: fresh } : a));
      } catch { /* if this fails too, it will sync on next poll */ }
    } finally {
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleAddComment = async (id: number, text: string) => {
    if (!user) return;
    
    // Optimistic count update for the parent feed
    setAnnouncements(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          interactions: {
            ...a.interactions!,
            comments_count: (a.interactions?.comments_count || 0) + 1
          }
        };
      }
      return a;
    }));

    try {
      await apiRepository.createComment(id, {
        announcement_id: id,
        author_user_id: user.id,
        content: text
      });
      // The PostCard component handles its own comment list refresh, 
      // so we just need to make sure the interactions count remains correct.
      const newItem = await apiRepository.getInteractions(id);
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, interactions: newItem } : a));
    } catch (e) {
      // Rollback count
      const fresh = await apiRepository.getInteractions(id);
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, interactions: fresh } : a));
      throw e;
    }
  };

  const handlePost = async () => {
    if (!newPostContent.trim() || !user) return;
    try {
      const created = await apiRepository.createAnnouncement({
        title: newPostTitle.trim() || 'New Update',
        content: newPostContent.trim(),
        category: 'RESEARCH',
        author_user_id: user.id,
      });

      const createdWithInteractions: Announcement = {
        ...created,
        interactions: {
          comments_count: 0,
          reactions_count: 0,
          reactions_by_type: {}
        }
      };

      // Show the newly created post immediately without waiting for a full reload.
      setAnnouncements(prev => sortAnnouncementsByNewest([
        createdWithInteractions,
        ...prev.filter(a => a.id !== created.id)
      ]));

      toast({ title: 'Announcement posted' });
      setNewPostContent('');
      setNewPostTitle('');
      loadData({ silent: true });
    } catch {
      toast({ title: 'Failed to post', variant: 'destructive' });
    }
  };

  const handleDeletePost = async (id: number) => {
    await apiRepository.deleteAnnouncement(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    toast({ title: 'Post deleted' });
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    await apiRepository.deleteComment(postId, commentId);

    try {
      const newItem = await apiRepository.getInteractions(postId);
      setAnnouncements(prev => prev.map(a => a.id === postId ? { ...a, interactions: newItem } : a));
    } catch {
      // The delete already succeeded; treat the interactions refresh as best-effort.
    }
  };

  // Stats
  const activeTasks = tasks.filter(t => (t.assignee_user_id === user?.id) && (t.status === 'IN_PROGRESS' || t.status === 'TODO'));
  const myGroups = groups.filter(g => g.leader_user_id === user?.id); // Should ideally check group members too

  // Tags aggregation
  const allTags = announcements.flatMap(a => {
    const t = a.tags;
    if (!t) return [];
    if (Array.isArray(t)) return t;
    return (t as string).split(',').filter(Boolean);
  }).map(t => t.trim());
  const trendingTags = Array.from(new Set(allTags)).slice(0, 7);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px] gap-6 lg:gap-8 items-start">
          {/* Main column */}
          <div className="space-y-5">
            {/* Composer */}
            {(isTeacher || isAdmin) && (
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <div className="flex gap-3 items-start">
                  <ProfileAvatar
                    userId={user?.id}
                    name={user?.full_name}
                    className="h-10 w-10 shrink-0 rounded-full bg-muted text-sm font-medium text-muted-foreground"
                    textClassName="text-sm font-medium text-muted-foreground"
                  />
                  <div className="flex-1 space-y-3">
                    <Input
                      value={newPostTitle}
                      onChange={e => setNewPostTitle(e.target.value)}
                      placeholder="Title (optional)"
                      className="h-10 w-full text-sm font-semibold rounded-xl bg-background/60 border border-border/70 text-foreground placeholder:text-muted-foreground"
                    />
                    <Textarea
                      value={newPostContent}
                      onChange={e => setNewPostContent(e.target.value)}
                      placeholder="Share an update, insight, or milestone..."
                      rows={3}
                      className="w-full text-sm rounded-xl bg-background/60 border border-border/70 text-foreground placeholder:text-muted-foreground resize-none min-h-[104px]"
                    />
                    <div className="flex items-center justify-between gap-3 mt-1">
                      <Button size="sm" onClick={handlePost} disabled={!newPostContent.trim()} className="h-9 px-4 text-xs rounded-lg">
                        Post Announcement
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Posts feed */}
            {announcements.length > 0 ? (
              announcements.map((post, i) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={i}
                  user={user || null}
                  getUserById={getUserById}
                  onReact={handleReact}
                  onAddComment={handleAddComment}
                  onDeletePost={handleDeletePost}
                  onDeleteComment={handleDeleteComment}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
                <Info className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No feed items yet.</p>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="hidden lg:block space-y-5 lg:sticky lg:top-4">
            {/* Quick stats */}
            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <ProfileAvatar
                  userId={user?.id}
                  name={user?.full_name}
                  className="h-12 w-12 rounded-full bg-muted text-base font-semibold text-muted-foreground"
                  textClassName="text-base font-semibold text-muted-foreground"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">{user?.full_name}</p>
                  <RoleBadge role={user?.role || 'STUDENT'} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-2.5 rounded-lg bg-accent/50">
                  <span className="text-lg font-display font-semibold text-foreground">{projects.length}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Projects</p>
                </div>
                <div className="p-2.5 rounded-lg bg-accent/50">
                  <span className="text-lg font-display font-semibold text-foreground">{activeTasks.length}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Tasks</p>
                </div>
                <div className="p-2.5 rounded-lg bg-accent/50">
                  <span className="text-lg font-display font-semibold text-foreground">{myGroups.length}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Groups</p>
                </div>
              </div>
            </div>

            {/* My Groups */}
            {myGroups.length > 0 && (
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">My Led Groups</h3>
                <div className="space-y-2.5">
                  {myGroups.map(group => (
                    <div key={group.id} className="flex items-start gap-2.5">
                      <div className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FlaskConical className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{group.name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Users className="h-3 w-3" /> Managed by you
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending tags */}
            {trendingTags.length > 0 && (
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Recent Topics</h3>
                <div className="flex flex-wrap gap-1.5">
                  {trendingTags.map(tag => (
                    <span key={tag} className="px-2 py-1 rounded-full text-[11px] font-medium bg-accent text-accent-foreground cursor-pointer hover:bg-accent/80 transition-colors">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </motion.div>
    </div>
  );
};

export default Feed;
