import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiRepository } from '@/repositories/apiRepository';
import { RoleBadge } from '@/components/Badges';
import { Link } from 'react-router-dom';
import { FlaskConical, Users, ChevronDown, ChevronRight, CheckCircle2, Clock, FolderOpen, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ResearchLab, ResearchGroup, GroupMember, Project, User } from '@/types';

const LabExplorer = () => {
  const [expandedLab, setExpandedLab] = useState<number | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [labs, setLabs] = useState<ResearchLab[]>([]);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [l, g, m, p, u] = await Promise.all([
          apiRepository.getLabs(),
          apiRepository.getGroups(),
          apiRepository.getGroupMembers(),
          apiRepository.getProjects(),
          apiRepository.getUsers(),
        ]);
        setLabs(l);
        setGroups(g);
        setMembers(m);
        setProjects(p);
        setUsers(u);
        if (l.length > 0) setExpandedLab(l[0].id);
      } catch (e) {
        console.error('LabExplorer load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getUserById = (id: number) => users.find(u => u.id === id);
  const getMembersByGroup = (groupId: number) => members.filter(m => m.group_id === groupId);
  const getProjectsByGroup = (groupId: number) => projects.filter(p => p.group_id === groupId);

  if (loading) {
    return (
      <div className="container py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <span className="text-xs font-mono text-primary uppercase tracking-wider">Explorer</span>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-1 mb-8">Labs &amp; Research Groups</h1>

        <div className="space-y-6">
          {labs.map((lab) => {
            const head = getUserById(lab.head_teacher_id);
            const labGroups = groups.filter(g => g.lab_id === lab.id);
            const isExpanded = expandedLab === lab.id;

            return (
              <motion.div
                key={lab.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setExpandedLab(isExpanded ? null : lab.id)}
                  className="w-full flex items-start gap-4 p-6 text-left hover:bg-secondary/30 transition-colors"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FlaskConical className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-serif font-semibold text-foreground">{lab.name}</h2>
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{lab.description}</p>
                  </div>
                  <Link to={`/labs/${lab.id}`} onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" className="rounded-xl gap-2 font-mono text-[10px] uppercase tracking-wider">
                      Full Details <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    {labGroups.map(group => {
                      const leader = getUserById(group.leader_user_id);
                      const groupMembers = getMembersByGroup(group.id);
                      const groupProjects = getProjectsByGroup(group.id);
                      const isGroupExpanded = expandedGroup === group.id;

                      return (
                        <div key={group.id} className="border-b border-border last:border-b-0">
                          <button
                            onClick={() => setExpandedGroup(isGroupExpanded ? null : group.id)}
                            className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-secondary/20 transition-colors"
                          >
                            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                              <Users className="h-4 w-4 text-secondary-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                              <h3 className="font-medium text-foreground">{group.name}</h3>
                                {group.is_validated ? (
                                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                                ) : (
                                  <Clock className="h-4 w-4 text-primary shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
                            </div>
                            <Link to={`/groups/${group.id}`} onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            {isGroupExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                          </button>

                          {isGroupExpanded && (
                            <div className="px-6 pb-4 space-y-4">
                              {/* Members */}
                              <div>
                                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Members ({groupMembers.length})</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {groupMembers.map(m => {
                                    const user = getUserById(m.user_id);
                                    if (!user) return null;
                                    return (
                                      <div key={m.user_id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm">
                                        <span className="text-foreground">{user.full_name}</span>
                                        <RoleBadge role={user.role} />
                                        {user.id === group.leader_user_id && (
                                          <span className="text-xs font-mono text-primary">Leader</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Leader info */}
                              {leader && (
                                <div className="text-xs font-mono text-muted-foreground">
                                  Led by <span className="text-foreground">{leader.full_name}</span>
                                  {' · '}
                                  {leader.role}
                                </div>
                              )}

                              {/* Projects */}
                              {groupProjects.length > 0 && (
                                <div>
                                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Projects ({groupProjects.length})</span>
                                  <div className="grid sm:grid-cols-2 gap-3 mt-2">
                                    {groupProjects.map(proj => (
                                      <Link
                                        key={proj.id}
                                        to={`/projects/${proj.id}`}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors"
                                      >
                                        <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                                        <div className="min-w-0">
                                          <span className="text-sm font-medium text-foreground block truncate">{proj.title}</span>
                                          <span className={`text-xs font-mono ${proj.visibility === 'PUBLIC' ? 'text-success' : 'text-muted-foreground'}`}>
                                            {proj.visibility}
                                          </span>
                                        </div>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
          {labs.length === 0 && (
            <p className="text-muted-foreground text-center py-16">No laboratories found.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LabExplorer;
