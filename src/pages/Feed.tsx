import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import { RoleBadge } from '@/components/Badges';
import {
  Heart, Bookmark, MessageCircle, Send, MoreHorizontal,
  Users, FlaskConical, ChevronDown, ChevronUp, Sparkles, Loader2, Info, Tag as TagIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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
  onAddComment
}: {
  post: Announcement;
  index: number;
  user: User | null;
  getUserById: (id: number) => User | undefined;
  onReact: (id: number, type: string) => Promise<void>;
  onAddComment: (id: number, text: string) => Promise<void>;
}) => {
  const author = getUserById(post.author_user_id);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const { toast } = useToast();

  const isLiked = post.interactions?.user_reacted === 'like';
  const reactionsCount = post.interactions?.reactions_count || 0;
  const commentsCount = post.interactions?.comments_count || 0;

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
    if (!newComment.trim() || !user) return;
    try {
      await onAddComment(post.id, newComment.trim());
      // Refresh comments if shown
      if (showComments) {
        const res = await apiRepository.getComments(post.id);
        setComments(res);
      }
      setNewComment('');
    } catch {
      toast({ title: 'Failed to post comment', variant: 'destructive' });
    }
  };

  if (!author) return null;

  const tags = post.tags ? (Array.isArray(post.tags) ? post.tags : (post.tags as string).split(',').filter(Boolean)) : [];

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Author header */}
      <div className="flex items-start gap-3 p-5 pb-0">
        <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
          {author.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{author.full_name}</span>
            <RoleBadge role={author.role} />
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-accent/50 border-border`}>
              {post.category}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-3 pb-4">
        <h3 className="text-base font-semibold text-foreground mb-2">{post.title}</h3>
        <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{post.content}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent text-accent-foreground">
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
            <button
              onClick={toggleComments}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {commentsCount} comment{commentsCount > 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center border-t border-border">
        <button
          onClick={() => onReact(post.id, 'like')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors hover:bg-accent/50 ${isLiked ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-primary' : ''}`} />
          Like
        </button>
        <button
          onClick={toggleComments}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50"
        >
          <MessageCircle className="h-4 w-4" />
          Comment
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50"
        >
          <Bookmark className="h-4 w-4" />
          Save
        </button>
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
                  return (
                    <div key={comment.id} className="flex gap-2.5">
                      <div className="h-7 w-7 shrink-0 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                        {cAuthor.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="rounded-lg bg-accent/50 p-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{cAuthor.full_name}</span>
                            <span className="text-[11px] text-muted-foreground">{timeAgo(comment.created_at)}</span>
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
                  <div className="h-7 w-7 shrink-0 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                    {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submitComment()}
                      placeholder="Write a comment..."
                      className="flex-1 text-xs bg-accent/40 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={submitComment} disabled={!newComment.trim()}>
                      <Send className="h-3.5 w-3.5" />
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

  const loadData = async () => {
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
          const interactions = await apiRepository.getInteractions(a.id);
          return { ...a, interactions };
        } catch { return a; }
      }));

      setAnnouncements(richAnn);
      setUsers(u);
      setGroups(g);
      setProjects(p);
      setTasks(t);
    } catch (e) {
      console.error('Feed data load error:', e);
      toast({ title: 'Failed to synchronize feed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getUserById = (id: number) => users.find(u => u.id === id);

  const handleReact = async (id: number, type: string) => {
    if (!user) return;
    try {
      const res = await apiRepository.reactToAnnouncement(id, {
        announcement_id: id,
        user_id: user.id,
        reaction_type: type
      });
      // Refresh this announcement's interactions
      const newItem = await apiRepository.getInteractions(id);
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, interactions: newItem } : a));
    } catch {
      toast({ title: 'Reaction failed', variant: 'destructive' });
    }
  };

  const handleAddComment = async (id: number, text: string) => {
    if (!user) return;
    try {
      await apiRepository.createComment(id, {
        announcement_id: id,
        author_user_id: user.id,
        content: text
      });
      // Refresh interactions for count
      const newItem = await apiRepository.getInteractions(id);
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, interactions: newItem } : a));
    } catch {
      throw new Error('Comment failed');
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
      toast({ title: 'Announcement posted' });
      setNewPostContent('');
      setNewPostTitle('');
      // Reload feed
      loadData();
    } catch {
      toast({ title: 'Failed to post', variant: 'destructive' });
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          {/* Main column */}
          <div className="space-y-4">
            {/* Composer */}
            {(isTeacher || isAdmin) && (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                    {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      value={newPostTitle}
                      onChange={e => setNewPostTitle(e.target.value)}
                      placeholder="Title (optional)"
                      className="w-full text-sm font-semibold bg-transparent text-foreground placeholder:text-muted-foreground border-none focus:outline-none"
                    />
                    <textarea
                      value={newPostContent}
                      onChange={e => setNewPostContent(e.target.value)}
                      placeholder="Share an update, insight, or milestone..."
                      rows={3}
                      className="w-full text-sm bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Visible to all members</span>
                      </div>
                      <Button size="sm" onClick={handlePost} disabled={!newPostContent.trim()} className="h-8 px-4 text-xs">
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
          <aside className="hidden lg:block space-y-5">
            {/* Quick stats */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-base font-semibold text-muted-foreground">
                  {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{user?.full_name}</p>
                  <RoleBadge role={user?.role || 'STUDENT'} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-accent/50">
                  <span className="text-lg font-display font-semibold text-foreground">{projects.length}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Projects</p>
                </div>
                <div className="p-2 rounded-lg bg-accent/50">
                  <span className="text-lg font-display font-semibold text-foreground">{activeTasks.length}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Tasks</p>
                </div>
                <div className="p-2 rounded-lg bg-accent/50">
                  <span className="text-lg font-display font-semibold text-foreground">{myGroups.length}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Groups</p>
                </div>
              </div>
            </div>

            {/* My Groups */}
            {myGroups.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
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
              <div className="rounded-xl border border-border bg-card p-4">
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
