import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiRepository } from '@/repositories/apiRepository';
import { useAuth } from '@/contexts/AuthContext';
import { RoleBadge } from '@/components/Badges';
import type { ResearchGroup, GroupMember, Project, User, ResearchLab } from '@/types';
import { Users, FolderOpen, ChevronRight, Loader2, UserPlus, Info, ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const GroupDetails = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [group, setGroup] = useState<ResearchGroup | null>(null);
  const [lab, setLab] = useState<ResearchLab | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    const load = async () => {
      try {
        const [g, m, p, u, labs] = await Promise.all([
          apiRepository.getGroup(parseInt(groupId)),
          apiRepository.getGroupMembers(parseInt(groupId)),
          apiRepository.getProjects(parseInt(groupId)),
          apiRepository.getUsers(),
          apiRepository.getLabs(),
        ]);
        setGroup(g);
        setMembers(m);
        setProjects(p);
        setUsers(u);

        const parentLab = labs.find(l => l.id === g.lab_id);
        if (parentLab) setLab(parentLab);
      } catch (e) {
        console.error('GroupDetails load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [groupId]);

  const getUserById = (id: number) => users.find(u => u.id === id);
  const isMember = members.some(m => m.user_id === user?.id);
  const leader = getUserById(group?.leader_user_id || 0);

  const handleJoinRequest = () => {
    toast({
      title: "Request Sent",
      description: "Working on integrating join requests API. Your interest is noted!",
    });
  };

  if (loading) {
    return (
      <div className="container py-10 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!group) return <div className="container py-20 text-center">Group not found.</div>;

  return (
    <div className="container py-10 max-w-5xl">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Link to="/labs" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Explorater
        </Link>
      </motion.div>

      <motion.div >
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Header Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-widest mb-3">
              <Building2 className="h-3.5 w-3.5" /> {lab?.name || 'Laboratory'}
            </div>
            <h1 className="text-4xl font-display font-bold text-foreground mb-4">
              {group.name}
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {group.description}
            </p>

            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Group Leader</span>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">{leader?.full_name[0]}</span>
                  </div>
                  <span className="text-sm font-medium">{leader?.full_name}</span>
                </div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Status</span>
                <div className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${group.is_validated ? 'bg-success' : 'bg-primary animate-pulse'}`} />
                  <span className="text-xs font-medium">{group.is_validated ? 'Active' : 'Awaiting Validation'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="w-full md:w-80 h-fit p-6 rounded-2xl border border-border bg-card shadow-sm">
            <h4 className="font-semibold mb-2">Interested in this group?</h4>
            <p className="text-xs text-muted-foreground mb-4">Join our research efforts and collaborate on world-class projects.</p>
            {!isMember ? (
              <Button onClick={handleJoinRequest} className="w-full gap-2 rounded-xl">
                <UserPlus className="h-4 w-4" /> Request to Join
              </Button>
            ) : (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2 text-primary">
                <Info className="h-4 w-4" />
                <span className="text-xs font-medium">You are a member</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {/* Left Column: Projects */}
          <div className="md:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" /> Active Projects
              </h2>
              <div className="space-y-4">
                {projects.map(proj => (
                  <Link
                    key={proj.id}
                    to={`/projects/${proj.id}`}
                    className="flex items-center justify-between p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all group"
                  >
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{proj.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{proj.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
                {projects.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10 bg-muted/20 rounded-2xl italic">No projects listed yet.</p>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Members */}
          <aside className="space-y-8">
            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Members ({members.length})
              </h2>
              <div className="space-y-3">
                {members.map(m => {
                  const u = getUserById(m.user_id);
                  if (!u) return null;
                  return (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs">
                          {u.full_name[0]}
                        </div>
                        <div>
                          <span className="text-sm font-medium block">{u.full_name}</span>
                          <RoleBadge role={u.role} />
                        </div>
                      </div>
                      {u.id === group.leader_user_id && (
                        <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">Lead</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
      </motion.div>
    </div>
  );
};

export default GroupDetails;
