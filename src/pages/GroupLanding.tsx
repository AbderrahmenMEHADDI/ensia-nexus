import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  FlaskConical,
  FileText,
  ArrowLeft,
  ArrowRight,
  FolderOpen,
  Mail,
  ExternalLink,
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  Loader2,
  Share2,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRepository } from '@/repositories/apiRepository';
import type { TeamSummary, ProjectPreview, GroupMember, Publication, Teacher } from '@/types';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PublicLayout } from '@/components/layout/PublicLayout';

const GroupLanding = () => {
  const { toast } = useToast();
  const { groupId } = useParams();
  const [team, setTeam] = useState<TeamSummary | null>(null);
  const [projects, setProjects] = useState<ProjectPreview[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGroupData = async () => {
      if (!groupId) return;
      try {
        const id = Number(groupId);
        const [summary, teamProjects, groupMembers, allTeachers] = await Promise.all([
          apiRepository.getTeamSummary(id),
          apiRepository.getTeamProjects(id),
          apiRepository.getGroupMembersFiltered(id),
          apiRepository.getTeachers({ limit: 1000 }),
        ]);
        
        setTeam(summary);
        setProjects(teamProjects.projects);
        setMembers(groupMembers);
        setTeachers(allTeachers);

        // Fetch publications for the group's projects
        // For simplicity, we fetch recent publications from the first 3 projects
        if (teamProjects.projects.length > 0) {
          const pubsPromises = teamProjects.projects.slice(0, 3).map(p => 
            apiRepository.getPublications({ project_id: p.id, limit: 5 })
          );
          const pubsResults = await Promise.all(pubsPromises);
          const allPubs = pubsResults.flat();
          setPublications(allPubs);
        }
      } catch (err) {
        console.error('Failed to load group landing data', err);
      } finally {
        setLoading(false);
      }
    };
    loadGroupData();
  }, [groupId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
        <p className="text-muted-foreground font-medium animate-pulse">Building research profile...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Research Group Not Found</h2>
        <p className="text-muted-foreground mb-6">The research team you are looking for does not exist or has been moved.</p>
        <Link to="/">
          <Button variant="outline" className="rounded-full">Back to Discovery</Button>
        </Link>
      </div>
    );
  }

  return (
    <PublicLayout>
      {/* Top Header Banner */}
      <div className="w-full bg-white border-b border-slate-200 border-t-[3px] border-t-[#F47A1E] pt-8 pb-10 px-4 sm:px-12 relative">
        <div className="container max-w-5xl mx-auto relative z-10 flex flex-col">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-10">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold hover:opacity-80 transition-opacity" style={{ color: '#F47A1E' }}>
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Discovery Hub</span>
            </Link>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full text-[#173C7E] hover:bg-slate-100"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: "Link Copied", description: "The group profile link is now in your clipboard." });
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Link to="/signup">
                <Button size="sm" className="rounded-full px-5 h-9 font-semibold" style={{ background: '#F47A1E', color: '#fff' }}>
                  Join Network
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex-1 space-y-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-500 text-xs font-bold tracking-widest uppercase">
              <Building2 className="h-3 w-3" />
              {team.lab_name || 'Research Laboratory'}
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-[#173C7E] tracking-tight">
                {team.name}
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                {team.description || "Advancing research and innovation through collaborative projects and academic excellence in this specialized research domain."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 pt-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-[#173C7E] shadow-sm ring-1 ring-slate-200">
                  {members.find(m => m.user_id === team.leader_user_id)?.user_name?.[0] || 'L'}
                </div>
                <span className="font-medium">Led by <span className="text-[#0F172A]">{members.find(m => m.user_id === team.leader_user_id)?.user_name || 'Group Leader'}</span></span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 rounded-full text-xs font-semibold px-3 border-slate-200 text-[#173C7E] hover:bg-slate-50"
                onClick={() => {
                  const leader = members.find(m => m.user_id === team.leader_user_id);
                  if (leader?.user_email) {
                    window.location.href = `mailto:${leader.user_email}`;
                  }
                }}
              >
                <Mail className="h-3 w-3 mr-1.5" /> Contact Leader
              </Button>
              <div className="h-4 w-[1px] bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                <span className="font-medium">Active Research Group</span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-8 mt-10 pt-6 border-t border-slate-100">
            <div className="flex flex-col">
              <span className="text-2xl font-display font-bold text-[#0F172A] leading-none mb-1">{team.project_count}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Projects</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-2xl font-display font-bold text-[#0F172A] leading-none mb-1">{members.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Members</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-2xl font-display font-bold text-[#0F172A] leading-none mb-1">{team.publication_count}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Publications</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 sm:px-12 relative z-20 space-y-16 py-16">
        <div className="grid md:grid-cols-5 gap-10">
          
          {/* Left Column: Projects */}
          <div className="md:col-span-3 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-[#0F172A] flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-[#173C7E]" /> Public Projects
              </h2>
              <Link to="/discovery/projects">
                <Button variant="ghost" size="sm" className="text-[#F47A1E] hover:text-[#F47A1E] hover:bg-[#F47A1E]/10">View Board <ChevronRight className="h-4 w-4 ml-1" /></Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {projects.map((proj, index) => {
                const isFeatured = index === 0;
                return (
                  <Link
                    key={proj.id}
                    to={`/discovery/projects/${proj.id}`}
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
                          {proj.accepting_collaborators ? (
                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] uppercase font-bold tracking-wider shrink-0 py-0 h-5">
                              Hiring
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-slate-200 text-[10px] uppercase font-bold tracking-wider shrink-0 py-0 h-5">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-1">
                          {proj.description || "A collaborative research initiative focusing on advanced methodologies."}
                        </p>
                      </div>
                      <div className="h-10 w-10 shrink-0 rounded-full bg-slate-50 flex items-center justify-center text-[#173C7E] group-hover:bg-[#F47A1E] group-hover:text-white transition-all">
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
              {projects.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm text-slate-500 italic">No public projects listed yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Members */}
          <aside className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-display font-bold text-[#0F172A] flex items-center gap-2 mb-6">
              <Users className="h-5 w-5 text-[#173C7E]" /> Research Team
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              {members.map(member => {
                const isLeader = member.user_id === team.leader_user_id;
                const teacherInfo = teachers.find(t => t.user_id === member.user_id);
                
                // Assign a consistent pastel color based on user ID
                const colors = [
                  'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 
                  'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700',
                  'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700'
                ];
                const colorClass = colors[member.user_id % colors.length];

                return (
                  <Link to={`/member/${member.user_id}`} key={member.user_id} className={`flex items-center gap-4 p-4 rounded-3xl border transition-all ${isLeader ? 'bg-slate-50 border-[#173C7E]/20 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 hover:-translate-y-0.5'}`}>
                    <div className="shrink-0">
                      <ProfileAvatar
                        userId={member.user_id}
                        imageUrl={member.user_profile_picture_url}
                        name={member.user_name || '?'}
                        className={`h-20 w-20 rounded-2xl ${!member.user_profile_picture_url ? colorClass : ''}`}
                        textClassName="text-xl font-bold"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-[#0F172A] truncate block group-hover:text-[#173C7E]">{member.user_name || 'Unknown'}</span>
                        {teacherInfo?.research_interests && (
                          <span className="text-sm text-slate-500 line-clamp-1 mt-0.5">
                            {teacherInfo.research_interests}
                          </span>
                        )}
                        {isLeader ? (
                          <span className="text-xs font-bold text-white uppercase tracking-widest bg-[#173C7E] px-2 py-0.5 rounded-md w-fit mt-2">
                            Lead
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-500 truncate block capitalize mt-1">
                            Researcher
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                  </Link>
                );
              })}
            </div>
          </aside>
        </div>
      </div>

      {/* Achievements Section */}
      <section className="py-24 text-white" style={{ background: '#173C7E' }}>
        <div className="container px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-4">
              <Badge className="bg-white/10 text-white hover:bg-white/20 border-none rounded-full px-4">
                Impact & Achievements
              </Badge>
              <h2 className="text-4xl md:text-5xl font-display font-bold">Latest Publications</h2>
            </div>
            <Button 
              variant="outline" 
              className="rounded-full border-background/20 hover:bg-background/10 text-background"
              onClick={() => toast({
                title: "Academic Repository",
                description: "Redirecting to the institutional publication archive..."
              })}
            >
              Academic Repository <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="space-y-6">
            {publications.map((pub, i) => (
              <PublicationListItem key={pub.id} pub={pub} />
            ))}
            {publications.length === 0 && (
              <div className="py-20 text-center border border-background/10 rounded-[2rem]">
                <Award className="h-16 w-16 text-background/10 mx-auto mb-6" />
                <p className="text-xl font-medium text-background/60">Research data pending publication.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 border-t border-border">
        <div className="container px-4 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-display font-bold mb-6" style={{ color: '#173C7E' }}>Interested in our work?</h2>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            We are always looking for passionate students and collaborators to join our research efforts. Explore our open projects or contact the group leader for more information.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/discovery/projects">
              <Button size="lg" className="rounded-lg px-8 h-12 font-semibold" style={{ background: '#F47A1E', color: '#fff' }}>Explore Projects</Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-lg px-8 h-12 font-semibold text-[#173C7E] border-[#173C7E]/20 hover:bg-[#173C7E] hover:text-white"
              onClick={() => toast({
                title: "Research Followed",
                description: `You will now receive updates from ${team.name}.`
              })}
            >
              Follow Research
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

/* --- Sub-components --- */

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: number }) => (
  <div className="flex items-center gap-4 bg-muted/50 border border-border p-4 rounded-2xl min-w-[140px]">
    <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <div>
      <div className="text-xl font-extrabold">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{label}</div>
    </div>
  </div>
);

const ProjectCard = ({ project }: { project: ProjectPreview }) => (
  <Card className="rounded-[2rem] border-border bg-card hover:border-primary/20 transition-all group shadow-sm hover:shadow-xl hover:shadow-primary/5">
    <CardHeader>
      <div className="flex justify-between items-start mb-4">
        {project.accepting_collaborators ? (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
            Hiring Researchers
          </Badge>
        ) : (
          <Badge variant="outline" className="py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
            Internal Project
          </Badge>
        )}
      </div>
      <CardTitle className="text-2xl font-display group-hover:text-primary transition-colors line-clamp-1">{project.title}</CardTitle>
      <CardDescription className="line-clamp-2 leading-relaxed mt-2">{project.description || "Advancing research and innovation through collaborative efforts."}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-center gap-6 pt-4 border-t border-border">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Collaborations</span>
          <span className="text-sm font-semibold">{project.open_collaboration_calls_count} Open Calls</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Scientific Output</span>
          <span className="text-sm font-semibold">{project.publication_count} Publications</span>
        </div>
        <Link to={`/discovery/projects/${project.id}`} className="ml-auto">
          <Button size="icon" variant="ghost" className="rounded-full group-hover:bg-primary group-hover:text-white transition-all">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
);

const PublicationListItem = ({ pub }: { pub: Publication }) => {
  const pubYear = pub.publication_date ? new Date(pub.publication_date).getFullYear() : null;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="group p-6 rounded-2xl border border-background/10 hover:bg-background/5 transition-all flex flex-col md:flex-row md:items-center gap-6"
    >
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Award className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <h4 className="text-xl font-bold line-clamp-1 group-hover:text-primary transition-colors">{pub.title}</h4>
        <div className="flex flex-wrap gap-4 text-sm text-background/60">
          {pubYear && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> {pubYear}
            </span>
          )}
          <span className="flex items-center gap-1.5 font-semibold text-background/80">
            <ExternalLink className="h-4 w-4" /> {pub.venue || "Academic Journal"}
          </span>
        </div>
      </div>
      <a href={pub.paper_url || '#'} target="_blank" rel="noopener noreferrer">
        <Button variant="ghost" className="rounded-full border border-background/20 text-background hover:bg-background hover:text-foreground">
          Read Paper
        </Button>
      </a>
    </motion.div>
  );
};

export default GroupLanding;
