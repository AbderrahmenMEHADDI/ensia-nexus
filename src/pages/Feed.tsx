import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  currentUser, feedPosts, feedComments, feedLikes, feedSaves,
  getUserById, projects, getCommentsByPost, getLikesByPost, getSavesByPost,
  researchGroups, groupMembers, getLabById, users, tasks, projectParticipants,
} from '@/data/mockData';
import { RoleBadge } from '@/components/Badges';
import {
  Heart, Bookmark, MessageCircle, Send, MoreHorizontal,
  Users, FlaskConical, ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FeedComment, FeedLike, FeedSave } from '@/types';

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

const PostCard = ({ post, index }: { post: typeof feedPosts[0]; index: number }) => {
  const author = getUserById(post.author_user_id);
  const project = post.project_id ? projects.find(p => p.id === post.project_id) : null;

  const [likes, setLikes] = useState<FeedLike[]>(getLikesByPost(post.id));
  const [saves, setSaves] = useState<FeedSave[]>(getSavesByPost(post.id));
  const [comments, setComments] = useState<FeedComment[]>(getCommentsByPost(post.id));
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const isLiked = likes.some(l => l.user_id === currentUser.id);
  const isSaved = saves.some(s => s.user_id === currentUser.id);

  const toggleLike = () => {
    setLikes(prev =>
      isLiked ? prev.filter(l => l.user_id !== currentUser.id) : [...prev, { post_id: post.id, user_id: currentUser.id }]
    );
  };

  const toggleSave = () => {
    setSaves(prev =>
      isSaved ? prev.filter(s => s.user_id !== currentUser.id) : [...prev, { post_id: post.id, user_id: currentUser.id }]
    );
  };

  const submitComment = () => {
    if (!newComment.trim()) return;
    setComments(prev => [...prev, {
      id: Date.now(),
      post_id: post.id,
      author_user_id: currentUser.id,
      content: newComment.trim(),
      created_at: new Date().toISOString(),
    }]);
    setNewComment('');
    setShowComments(true);
  };

  if (!author) return null;

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
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
            {project && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <Link to={`/projects/${project.id}`} className="text-xs text-primary hover:underline truncate">
                  {project.title}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-3 pb-4">
        <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{post.content}</p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent text-accent-foreground">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Engagement stats */}
      {(likes.length > 0 || comments.length > 0) && (
        <div className="flex items-center justify-between px-5 py-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {likes.length > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3 fill-primary text-primary" />
                {likes.length}
              </span>
            )}
          </div>
          {comments.length > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {comments.length} comment{comments.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center border-t border-border">
        <button
          onClick={toggleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors hover:bg-accent/50 ${isLiked ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-primary' : ''}`} />
          Like
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50"
        >
          <MessageCircle className="h-4 w-4" />
          Comment
        </button>
        <button
          onClick={toggleSave}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors hover:bg-accent/50 ${isSaved ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-primary' : ''}`} />
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
              {comments.map(comment => {
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
              })}

              {/* New comment input */}
              <div className="flex gap-2.5 pt-1">
                <div className="h-7 w-7 shrink-0 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                  {currentUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

const Feed = () => {
  const [newPostContent, setNewPostContent] = useState('');

  const myGroupIds = groupMembers.filter(m => m.user_id === currentUser.id && m.is_active).map(m => m.group_id);
  const myGroups = researchGroups.filter(g => myGroupIds.includes(g.id));
  const myParticipations = projectParticipants.filter(p => p.user_id === currentUser.id);
  const myProjects = myParticipations.map(p => projects.find(proj => proj.id === p.project_id)!).filter(Boolean);
  const activeTasks = tasks.filter(
    t => (t.assignee_user_id === currentUser.id || t.created_by === currentUser.id) &&
      (t.status === 'IN_PROGRESS' || t.status === 'TODO')
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          {/* Main column */}
          <div className="space-y-4">
            {/* Composer */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                  {currentUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
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
                    <Button size="sm" disabled={!newPostContent.trim()} className="h-8 px-4 text-xs">
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts feed */}
            {feedPosts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </div>

          {/* Right sidebar */}
          <aside className="hidden lg:block space-y-5">
            {/* Quick stats */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-base font-semibold text-muted-foreground">
                  {currentUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{currentUser.full_name}</p>
                  <RoleBadge role={currentUser.role} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-accent/50">
                  <span className="text-lg font-display font-semibold text-foreground">{myProjects.length}</span>
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
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">My Groups</h3>
                <div className="space-y-2.5">
                  {myGroups.map(group => {
                    const lab = getLabById(group.lab_id);
                    const memberCount = groupMembers.filter(m => m.group_id === group.id && m.is_active).length;
                    return (
                      <div key={group.id} className="flex items-start gap-2.5">
                        <div className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FlaskConical className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{group.name}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Users className="h-3 w-3" /> {memberCount}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trending tags */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Trending Topics</h3>
              <div className="flex flex-wrap gap-1.5">
                {['NLP', 'Research', 'Computer Vision', 'Blockchain', 'Reinforcement Learning', 'Medical AI', 'Data Engineering'].map(tag => (
                  <span key={tag} className="px-2 py-1 rounded-full text-[11px] font-medium bg-accent text-accent-foreground cursor-pointer hover:bg-accent/80 transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
};

export default Feed;
