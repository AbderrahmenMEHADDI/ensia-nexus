import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Users,
  FlaskConical,
  ExternalLink,
  Shield,
  Loader2,
  FileText,
  Briefcase,
  Globe,
  Share2,
  Bookmark,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { apiRepository } from '@/repositories/apiRepository';
import type { Project, ResearchGroup, ResearchLab, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PublicProjectDetails = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [group, setGroup] = useState<ResearchGroup | null>(null);
  const [lab, setLab] = useState<ResearchLab | null>(null);
  const [leader, setLeader] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!projectId) return;
      try {
        const p = await apiRepository.getProject(Number(projectId));
        setProject(p);
        
        const [g, l] = await Promise.all([
          apiRepository.getGroup(p.group_id),
          apiRepository.getLabs().then(labs => labs.find(lab => lab.id === p.group_id)) // This logic might be wrong, groups have lab_id
        ]);
        
        setGroup(g);
        
        // Correcting lab fetch
        const labData = await apiRepository.getLab(g.lab_id);
        setLab(labData);

        // Fetch leader info
        const leaderData = await apiRepository.getUser(g.leader_user_id);
        setLeader(leaderData);

      } catch (err) {
        console.error('Failed to load project details', err);
        toast({
          title: "Project not found",
          description: "This project may be private or no longer exists.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [projectId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
        <p className="text-muted-foreground font-medium animate-pulse">Retrieving project dossier...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Briefcase className="h-10 w-10 text-muted-foreground/30" />
        </div>
        <h1 className="text-3xl font-display font-bold mb-2">Project Unavailable</h1>
        <p className="text-muted-foreground max-w-md mb-8">We couldn't find the project you're looking for. It might be private or the link might be broken.</p>
        <Link to="/discovery/projects">
          <Button variant="outline" className="rounded-full px-8">Back to Board</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border py-4">
        <div className="container px-4 flex items-center justify-between">
          <Link to="/discovery/projects" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Discovery Hub</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast({ title: "Link copied to clipboard" });
            }}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="relative pt-16 pb-24 overflow-hidden border-b border-border bg-muted/30">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02] -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
        
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Badge className="bg-primary/10 text-primary border-primary/20 py-1 px-4 rounded-full text-xs font-bold uppercase tracking-widest">
                {project.visibility} PROJECT
              </Badge>
              {project.accepting_collaborators && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 py-1 px-4 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Now Recruiting
                </Badge>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight mb-8 leading-tight">
              {project.title}
            </h1>

            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center border border-border shadow-sm">
                  <FlaskConical className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Laboratory</div>
                  <div className="text-sm font-bold">{lab?.name || "Independent"}</div>
                </div>
              </div>

              <Separator orientation="vertical" className="h-10 hidden md:block" />

              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center border border-border shadow-sm">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Research Group</div>
                  <div className="text-sm font-bold">{group?.name || "General"}</div>
                </div>
              </div>

              <Separator orientation="vertical" className="h-10 hidden md:block" />

              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center border border-border shadow-sm">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Deadline</div>
                  <div className="text-sm font-bold">{project.deadline ? new Date(project.deadline).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : "Open Ended"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content Section */}
      <main className="container px-4 py-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Project Description
              </h2>
              <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                {project.description || "No description provided for this project."}
              </div>
            </section>

            <Separator className="bg-border/50" />

            <section>
              <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                <Globe className="h-6 w-6 text-primary" />
                Key Focus Areas
              </h2>
              <div className="flex flex-wrap gap-3">
                {["Academic Research", "Cross-disciplinary", "ENSIA Innovation", "Nexus Collaboration"].map(tag => (
                  <Badge key={tag} variant="secondary" className="px-4 py-2 rounded-xl text-sm font-medium bg-muted/50 hover:bg-primary/10 transition-colors cursor-default border border-border">
                    {tag}
                  </Badge>
                ))}
              </div>
            </section>

            {/* Application Info for non-logged in */}
            <section className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl" />
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-4">Want to join this project?</h3>
                <p className="text-muted-foreground mb-6">
                  Collaboration on this project is managed through the Nexus portal. You need to be a registered student or researcher at ENSIA to apply.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to={`/signin?redirect=/discovery/projects/${project.id}`}>
                    <Button className="rounded-full px-8 py-6 h-auto shadow-lg shadow-primary/20 gap-2">
                      Sign In to Apply <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="outline" className="rounded-full px-8 py-6 h-auto bg-transparent">
                      Create Account
                    </Button>
                  </Link>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            <Card className="rounded-[2rem] border-border bg-card shadow-sm overflow-hidden">
              <div className="bg-primary p-6 text-primary-foreground">
                <h3 className="font-display font-bold text-lg">Project Lead</h3>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center border-2 border-background shadow-md overflow-hidden">
                    {leader?.profile_picture_url ? (
                      <img src={leader.profile_picture_url} alt={leader.full_name} className="h-full w-full object-cover" />
                    ) : (
                      <Users className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{leader?.full_name || "Nexus Researcher"}</div>
                    <div className="text-sm text-muted-foreground">{leader?.institution || "ENSIA Academic"}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="truncate">{leader?.email || "Email restricted"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Validated Researcher</span>
                  </div>
                </div>
                <Separator className="my-6" />
                <Button variant="secondary" className="w-full rounded-xl py-6 h-auto font-bold gap-2" onClick={() => {
                  if (leader?.email) window.location.href = `mailto:${leader.email}?subject=Inquiry: ${project.title}`;
                  else toast({ title: "Contact info restricted" });
                }}>
                  Contact Researcher
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-display font-bold">Research Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant="outline" className="bg-background border-border text-[10px] font-bold uppercase tracking-widest">{project.status}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-sm font-medium">Recruitment</span>
                  <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                    {project.accepting_collaborators ? <><CheckCircle2 className="h-3 w-3" /> Active</> : "Closed"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-sm font-medium">Lab Affiliation</span>
                  <span className="text-xs font-bold truncate max-w-[120px]">{lab?.name || "Independent"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-12 border-t border-border bg-muted/10">
        <div className="container px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
            <img src="/logo_small.svg" alt="Nexus" className="h-5 w-5 grayscale" />
            <span className="font-display font-bold text-sm tracking-tight">ENSIA Nexus Discovery Hub</span>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em]">
            Advancing the frontiers of knowledge through open collaboration
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicProjectDetails;
