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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRepository } from '@/repositories/apiRepository';
import type { TeamSummary, ProjectPreview, GroupMember, Publication } from '@/types';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const GroupLanding = () => {
  const { toast } = useToast();
  const { groupId } = useParams();
  const [team, setTeam] = useState<TeamSummary | null>(null);
  const [projects, setProjects] = useState<ProjectPreview[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGroupData = async () => {
      if (!groupId) return;
      try {
        const id = Number(groupId);
        const [summary, teamProjects, groupMembers] = await Promise.all([
          apiRepository.getTeamSummary(id),
          apiRepository.getTeamProjects(id),
          apiRepository.getGroupMembersFiltered(id),
        ]);
        
        setTeam(summary);
        setProjects(teamProjects.projects);
        setMembers(groupMembers);

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
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Header/Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border py-4">
        <div className="container px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Discovery Hub</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast({ title: "Link Copied", description: "The group profile link is now in your clipboard." });
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Link to="/signup">
              <Button size="sm" className="rounded-full px-4">Join Network</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden border-b border-border">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -z-10 blur-[120px]" />
        
        <div className="container px-4">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="flex-1 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 py-1 px-3 rounded-full text-xs font-bold uppercase tracking-widest">
                    Research Group
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <FlaskConical className="h-3 w-3" />
                    {team.lab_name}
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight leading-tight">
                  {team.name}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                  {team.description || "Advancing the frontiers of artificial intelligence through rigorous experimentation, cross-disciplinary collaboration, and academic excellence."}
                </p>
              </div>

              <div className="flex flex-wrap gap-6">
                <StatCard icon={BookOpen} label="Publications" value={team.publication_count} />
                <StatCard icon={FolderOpen} label="Projects" value={team.project_count} />
                <StatCard icon={Users} label="Members" value={members.length} />
              </div>
            </div>

            <div className="w-full lg:w-80">
              <Card className="rounded-[2rem] border-2 border-primary/10 shadow-xl shadow-primary/5">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-4 p-1 rounded-full bg-primary/5 border border-primary/10 w-fit">
                    <ProfileAvatar 
                      userId={team.leader_user_id} 
                      className="h-20 w-20 rounded-full border-4 border-background shadow-lg"
                      textClassName="text-xl font-bold"
                    />
                  </div>
                  <CardTitle className="text-xl">Group Leader</CardTitle>
                  <CardDescription>Scientific Direction</CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-sm font-semibold">ENSIA Professor</p>
                  <Button 
                    className="w-full rounded-full gap-2" 
                    variant="secondary"
                    onClick={() => {
                      const leader = members.find(m => m.user_id === team.leader_user_id);
                      if (leader?.user_email) {
                        window.location.href = `mailto:${leader.user_email}`;
                      }
                    }}
                  >
                    <Mail className="h-4 w-4" /> Contact Leader
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-24 bg-muted/20">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-12">
            <div className="space-y-1">
              <h2 className="text-3xl font-display font-bold">Research Projects</h2>
              <p className="text-muted-foreground">Active and completed scientific endeavors.</p>
            </div>
            <Link to="/discovery/projects">
              <Button variant="ghost" className="gap-1">View all board <ChevronRight className="h-4 w-4" /></Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project, i) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            {projects.length === 0 && (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-[2rem] bg-background">
                <FolderOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No public projects listed yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Members Section */}
      <section className="py-24">
        <div className="container px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold mb-4">Scientific Team</h2>
            <p className="text-muted-foreground">The brilliant minds behind our research breakthroughs.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            {members.map((member, i) => (
              <motion.div
                key={member.user_id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group flex flex-col items-center text-center"
              >
                <div className="relative mb-4">
                  <div className="absolute inset-0 rounded-full bg-primary/20 scale-0 group-hover:scale-110 transition-transform duration-300" />
                  <ProfileAvatar 
                    userId={member.user_id} 
                    name={member.user_name}
                    className="h-20 w-20 rounded-full border-2 border-background shadow-md relative z-10"
                    textClassName="text-xl font-bold"
                  />
                </div>
                <h4 className="font-bold text-sm mb-1 line-clamp-1">{member.user_name}</h4>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-70">
                  {member.user_id === team.leader_user_id ? "Leader" : "Researcher"}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-24 bg-foreground text-background">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-4">
              <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none rounded-full px-4">
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
          <h2 className="text-3xl font-display font-bold mb-6">Interested in our work?</h2>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            We are always looking for passionate students and collaborators to join our research efforts. Explore our open projects or contact the group leader for more information.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/discovery/projects">
              <Button size="lg" className="rounded-full px-8">Explore Projects</Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full px-8"
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
    </div>
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
