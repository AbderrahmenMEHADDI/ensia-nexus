import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import type { Announcement, User } from '@/types';
import { Megaphone, Calendar, Tag, Plus, Loader2, Info, User as UserIcon } from 'lucide-react';
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
        setAnnouncements(a);
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

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'RESEARCH': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ADMIN': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'EVENT': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
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
            return (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-border bg-card hover:border-primary/20 transition-all shadow-sm"
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
