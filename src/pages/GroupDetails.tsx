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
import { Badge } from '@/components/ui/badge';

declare global {
  interface Window {
    __dynamicBreadcrumbs?: Record<string, string>;
  }
}

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
        let u: User[] = [];
        try {
          u = await apiRepository.getUsers();
        } catch (err) {
          console.warn('Failed to fetch users list (unauthorized or network error):', err);
        }

        const [g, m, p, labs] = await Promise.all([
          apiRepository.getGroup(parseInt(groupId)),
          apiRepository.getGroupMembers(parseInt(groupId)),
          apiRepository.getProjects(parseInt(groupId)),
          apiRepository.getLabs(),
        ]);

        // Fetch lab admins without failing if unauthorized
        let adminList = [];
        try {
          adminList = await apiRepository.getLabAdmins(g.lab_id);
        } catch (err) {
          // Ignore
        }

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

  useEffect(() => {
    if (group && groupId) {
      window.__dynamicBreadcrumbs = window.__dynamicBreadcrumbs || {};
      window.__dynamicBreadcrumbs[groupId] = group.name;
      window.dispatchEvent(new Event('breadcrumb-update'));
    }
  }, [group, groupId]);

  const getUserById = (id: number) => users.find(u => u.id === id);
  const leader = getUserById(group?.leader_user_id || 0);
  const leaderName = leader?.full_name || members.find(m => m.user_id === group?.leader_user_id)?.user_name || 'Group Leader';

  if (loading) {
    return (
      <div className="container py-10 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!group) return <div className="container py-20 text-center">Group not found.</div>;

  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Top Header Banner */}
      <div className="w-full bg-white border-b border-slate-200 border-t-[3px] border-t-[#F47A1E] pt-12 pb-10 px-6 sm:px-12 relative">
        <div className="container max-w-5xl mx-auto relative z-10 flex flex-col">
          <div className="flex-1 space-y-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-500 text-xs font-bold tracking-widest uppercase">
              <Building2 className="h-3 w-3" />
              {lab?.name || 'Research Laboratory'}
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-[#173C7E] tracking-tight">
                {group.name}
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                {group.description || "Advancing research and innovation through collaborative projects and academic excellence in this specialized research domain."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 pt-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-[#173C7E] shadow-sm ring-1 ring-slate-200">
                  {leaderName?.[0] || 'L'}
                </div>
                <span className="font-medium">Led by <span className="text-[#0F172A]">{leaderName}</span></span>
              </div>
              <div className="h-4 w-[1px] bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${group.is_validated ? 'bg-emerald-500 ring-4 ring-emerald-50' : 'bg-amber-400 animate-pulse ring-4 ring-amber-50'}`} />
                <span className="font-medium">{group.is_validated ? 'Active Research Group' : 'Awaiting Validation'}</span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-8 mt-10 pt-6 border-t border-slate-100">
            <div className="flex flex-col">
              <span className="text-2xl font-display font-bold text-[#0F172A] leading-none mb-1">{projects.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Projects</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-2xl font-display font-bold text-[#0F172A] leading-none mb-1">{members.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Members</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-2xl font-display font-bold text-[#0F172A] leading-none mb-1">0</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Publications</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-6 sm:px-12 -mt-6 relative z-20 space-y-12">
        <div className="grid md:grid-cols-5 gap-10">
          
          {/* Left Column: Projects */}
          <div className="md:col-span-3 space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-[#0F172A] flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-[#173C7E]" /> Active Projects
              </h2>
            </div>
            
            <div className="space-y-4">
              {projects.map((proj, index) => {
                const isFeatured = index === 0;
                return (
                  <Link
                    key={proj.id}
                    to={`/projects/${proj.id}`}
                    className={`block relative p-5 bg-white rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] border border-slate-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group ${
                      isFeatured ? 'border-l-4 border-l-[#F47A1E]' : ''
                    }`}
                  >
                    {isFeatured && (
                      <div className="absolute -top-3 left-4 bg-[#F47A1E] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                        Featured
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-display font-bold text-lg text-[#0F172A] group-hover:text-[#173C7E] transition-colors truncate">
                            {proj.title}
                          </h3>
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 text-[10px] uppercase font-bold tracking-wider shrink-0 py-0 h-5">
                            Active
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-1">
                          {proj.description || "A collaborative research initiative focusing on advanced methodologies."}
                        </p>
                      </div>
                      <div className="h-10 w-10 shrink-0 rounded-full bg-slate-50 flex items-center justify-center text-[#173C7E] group-hover:bg-[#F47A1E] group-hover:text-white transition-all">
                        <ChevronRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
              {projects.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm text-slate-500 italic">No research projects listed yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Members */}
          <aside className="md:col-span-2 space-y-6 pt-6">
            <h2 className="text-xl font-display font-bold text-[#0F172A] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#173C7E]" /> Research Team
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map(m => {
                const u = getUserById(m.user_id);
                const isLeader = m.user_id === group.leader_user_id;
                const memberName = u?.full_name || m.user_name || 'Unknown Member';
                const memberRole = u?.role || m.user_role || (isLeader ? 'TEACHER' : 'STUDENT');
                
                // Assign a consistent pastel color based on user ID
                const colors = [
                  'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 
                  'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700',
                  'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700'
                ];
                const colorClass = colors[m.user_id % colors.length];

                return (
                  <div key={m.user_id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${isLeader ? 'bg-slate-50 border-[#173C7E]/20 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
                    <div className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${colorClass}`}>
                      {memberName?.[0] || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#0F172A] truncate block">{memberName}</span>
                        {isLeader ? (
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-[#173C7E] px-1.5 py-0.5 rounded w-fit mt-0.5">
                            Lead
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-500 truncate block capitalize">
                            {memberRole?.toLowerCase() || 'Member'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;
