import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import type { Announcement, User, Comment } from '@/types';
import { Megaphone, Calendar, Tag, Plus, Loader2, Info, User as UserIcon, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const Announcements = () => {
  const { user, isTeacher, isAdmin } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [newCommentText, setNewCommentText] = useState<Record<number, string>>({});

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'RESEARCH' | 'ADMIN' | 'EVENT'>('RESEARCH');
  const [newTags, setNewTags] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [a, u] = await Promise.all([
          apiRepository.getAnnouncements(),
          apiRepository.getUsers(),
        ]);
        
        // Fetch interactions for each announcement
        const announcementsWithInteractions = await Promise.all(
          a.map(async (ann) => {
            try {
              const interactions = await apiRepository.getInteractions(ann.id);
              return { ...ann, interactions };
            } catch {
              return ann;
            }
          })
        );
        
        setAnnouncements(announcementsWithInteractions);
        setUsers(u);
      } catch (e) {
        console.error('Announcements load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getUserById = (id: number) => users.find(u => u.id === id);

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim() || !user) return;
    try {
      const created = await apiRepository.createAnnouncement({
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        tags: newTags.split(','),
        author_user_id: user.id,
      });
      setAnnouncements(prev => [created, ...prev]);
      toast({ title: 'Announcement posted' });
      setCreateOpen(false);
      setNewTitle(''); setNewContent(''); setNewTags('');
    } catch {
      toast({ title: 'Failed to post announcement', variant: 'destructive' });
    }
  };

  const handleReact = async (annId: number, type: string) => {
    if (!user) return;
    try {
      const res = await apiRepository.reactToAnnouncement(annId, {
        announcement_id: annId,
        user_id: user.id,
        reaction_type: type
      });
      
      // Update local state
      setAnnouncements(prev => prev.map(ann => {
        if (ann.id !== annId) return ann;
        const currentRes = ann.interactions || { comments_count: 0, reactions_count: 0, reactions_by_type: {} };
        const newReactions = { ...currentRes.reactions_by_type };
        
        // Remove old reaction if any
        if (currentRes.user_reacted) {
          newReactions[currentRes.user_reacted] = Math.max(0, (newReactions[currentRes.user_reacted] || 1) - 1);
        }
        
        // Add new reaction if not toggled off
        let newCount = currentRes.reactions_count + (currentRes.user_reacted ? -1 : 1);
        if (res.reaction && res.reaction !== currentRes.user_reacted) {
          newReactions[res.reaction] = (newReactions[res.reaction] || 0) + 1;
          newCount = currentRes.reactions_count + (currentRes.user_reacted ? 0 : 1);
        } else if (res.reaction === null && currentRes.user_reacted) {
          // Toggled off - already handled count reduction above
        }

        return {
          ...ann,
          interactions: {
            ...currentRes,
            reactions_count: newCount,
            reactions_by_type: newReactions,
            user_reacted: res.reaction || undefined
          }
        };
      }));
    } catch {
      toast({ title: 'Reaction failed', variant: 'destructive' });
    }
  };

  const toggleComments = async (annId: number) => {
    const isExpanded = expandedComments[annId];
    setExpandedComments(prev => ({ ...prev, [annId]: !isExpanded }));
    
    if (!isExpanded && !comments[annId]) {
      try {
        const c = await apiRepository.getComments(annId);
        setComments(prev => ({ ...prev, [annId]: c }));
      } catch (e) {
        console.error('Failed to load comments:', e);
      }
    }
  };

  const handleAddComment = async (annId: number) => {
    const text = newCommentText[annId];
    if (!text?.trim() || !user) return;
    
    try {
      const c = await apiRepository.createComment(annId, {
        announcement_id: annId,
        author_user_id: user.id,
        content: text.trim()
      });
      setComments(prev => ({ ...prev, [annId]: [...(prev[annId] || []), c] }));
      setNewCommentText(prev => ({ ...prev, [annId]: '' }));
      
      // Update count in announcements list
      setAnnouncements(prev => prev.map(ann => 
        ann.id === annId ? {
          ...ann,
          interactions: {
            ...(ann.interactions || { reactions_count: 0, reactions_by_type: {}, comments_count: 0 }),
            comments_count: (ann.interactions?.comments_count || 0) + 1
          }
        } : ann
      ));
    } catch {
      toast({ title: 'Failed to post comment', variant: 'destructive' });
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'RESEARCH': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ADMIN': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'EVENT': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const reactionIcons: Record<string, string> = {
    'like': '👍',
    'celebrate': '🎉',
    'insightful': '💡',
    'curious': '🤔'
  };

  if (loading) {
    return (
      <div className="container py-10 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Announcements</h1>
              <p className="text-muted-foreground text-sm">Stay updated with the latest research news and events.</p>
            </div>
          </div>
          {(isTeacher || isAdmin) && (
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Post New
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {announcements.map((ann, i) => {
            const author = getUserById(ann.author_user_id);
            const annComments = comments[ann.id] || [];
            const isExpanded = expandedComments[ann.id];
            
            return (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-border bg-card hover:border-primary/10 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${getCategoryColor(ann.category)}`}>
                        {ann.category}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        <Calendar className="h-3.5 w-3.5" /> {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="text-xl font-display font-semibold text-foreground">{ann.title}</h2>
                  </div>
                </div>
                
                <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-wrap">
                  {ann.content}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-sm">
                      <span className="text-foreground font-medium block">{author?.full_name || 'Anonymous Researcher'}</span>
                      <span className="text-xs text-muted-foreground">{author?.role || 'Contributor'}</span>
                    </div>
                  </div>
                  
                  {ann.tags && (
                    <div className="flex gap-2">
                      {ann.tags.map(tag => (
                        <span key={tag} className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                          <Tag className="h-3 w-3" /> {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Interactions Bar */}
                <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Object.entries(reactionIcons).map(([type, icon]) => {
                      const isActive = ann.interactions?.user_reacted === type;
                      const count = ann.interactions?.reactions_by_type[type] || 0;
                      return (
                        <button
                          key={type}
                          onClick={() => handleReact(ann.id, type)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/20 text-primary border border-primary/30' : 'hover:bg-secondary text-muted-foreground'}`}
                        >
                          <span>{icon}</span>
                          {count > 0 && <span className="font-mono text-xs">{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button 
                    onClick={() => toggleComments(ann.id)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="font-medium">{ann.interactions?.comments_count || 0} Comments</span>
                  </button>
                </div>

                {/* Comments Section */}
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 pt-4 border-t border-border/30 overflow-hidden"
                  >
                    <div className="space-y-4 mb-6">
                      {annComments.map(comment => {
                        const commentAuthor = getUserById(comment.author_user_id);
                        return (
                          <div key={comment.id} className="flex gap-3">
                            <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-[10px] font-bold text-muted-foreground">{commentAuthor?.full_name[0]}</span>
                            </div>
                            <div className="bg-secondary/30 rounded-2xl p-3 flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-foreground">{commentAuthor?.full_name}</span>
                                <span className="text-[10px] font-mono text-muted-foreground">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        );
                      })}
                      {annComments.length === 0 && (
                        <p className="text-center text-xs text-muted-foreground py-4 italic">No comments yet. Be the first to share your thoughts!</p>
                      )}
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{user?.full_name[0]}</span>
                      </div>
                      <div className="relative flex-1">
                        <Input 
                          placeholder="Write a comment..." 
                          className="pr-12 bg-secondary/20 border-border/50 rounded-xl text-sm"
                          value={newCommentText[ann.id] || ''}
                          onChange={(e) => setNewCommentText(prev => ({ ...prev, [ann.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(ann.id)}
                        />
                        <button 
                          onClick={() => handleAddComment(ann.id)}
                          disabled={!newCommentText[ann.id]?.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {announcements.length === 0 && (
            <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
              <Info className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No announcements found.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Post Announcement</DialogTitle>
            <DialogDescription>Share important updates with the research community.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium">Title</label>
              <Input className="col-span-3" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Main headline..." />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium">Category</label>
              <Select value={newCategory} onValueChange={(v: any) => setNewCategory(v)}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESEARCH">Research Update</SelectItem>
                  <SelectItem value="ADMIN">Administrative</SelectItem>
                  <SelectItem value="EVENT">Scientific Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-right text-sm font-medium pt-2">Content</label>
              <Textarea className="col-span-3" value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Type your message here..." rows={5} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium">Tags</label>
              <Input className="col-span-3" value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="e.g. NLP, Machine Learning (comma separated)" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newTitle.trim() || !newContent.trim()}>Publish Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Announcements;
