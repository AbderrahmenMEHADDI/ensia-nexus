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
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { apiRepository } from '@/repositories/apiRepository';
import type { Project, ResearchGroup, ResearchLab, User, Publication } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicationCard } from '@/components/shared/PublicationCard';

const PublicProjectDetails = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [group, setGroup] = useState<ResearchGroup | null>(null);
  const [lab, setLab] = useState<ResearchLab | null>(null);
  const [leader, setLeader] = useState<User | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!projectId) return;
      try {
        const [p, pubs] = await Promise.all([
          apiRepository.getProject(Number(projectId)),
          apiRepository.getPublications({ project_id: Number(projectId) })
        ]);
        setProject(p);
        setPublications(pubs);
        
        let groupObj: ResearchGroup | null = null;
        if (p.group_id) {
          const [g, labs] = await Promise.all([
            apiRepository.getGroup(p.group_id),
            apiRepository.getLabs()
          ]);
          groupObj = g;
          setGroup(g);
          
          if (g && g.lab_id) {
            const labData = await apiRepository.getLab(g.lab_id);
            setLab(labData);
          }
        } else {
          setGroup(null);
          setLab(null);
        }

        const leaderUserId = p.created_by || groupObj?.leader_user_id;
        if (leaderUserId) {
          try {
            const leaderData = await apiRepository.getPublicUser(leaderUserId);
            setLeader(leaderData);
          } catch (e) {
            console.warn("Leader data restricted or unavailable");
            setLeader(null);
          }
        }

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
      <PublicLayout>
        {/* Skeleton Hero Header */}
        <header className="relative pt-12 pb-24 overflow-hidden border-b border-border bg-[#F8FAFC]">
          <div className="container px-4 mb-8">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3 mb-6">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
              </div>
              <Skeleton className="h-12 w-3/4 rounded-xl mb-4" />
              <Skeleton className="h-12 w-1/2 rounded-xl mb-8" />
              <div className="flex flex-wrap gap-6 items-center">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Skeleton Content Section */}
        <main className="container px-4 py-20">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-12">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-12">
              <section className="space-y-4">
                <Skeleton className="h-7 w-48 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </section>
              <Separator className="bg-border/50" />
              <section className="space-y-4">
                <Skeleton className="h-7 w-48 rounded-lg" />
                <div className="flex flex-wrap gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-28 rounded-xl" />
                  ))}
                </div>
              </section>
              <Skeleton className="h-44 w-full rounded-2xl" />
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-8">
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="p-6 bg-slate-150">
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-2xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </PublicLayout>
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
          <Button variant="outline" className="rounded-full px-8">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <PublicLayout>
      {/* Hero Header */}
      <header className="relative pt-12 pb-24 overflow-hidden border-b border-border bg-[#F8FAFC]">
        <div className="container px-4 mb-8">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link to="/discovery/projects" className="flex items-center gap-2 text-sm font-semibold hover:opacity-80 transition-opacity" style={{ color: '#F47A1E' }}>
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Discovery Hub</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full text-[#173C7E] hover:bg-[#173C7E]/10" onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast({ title: "Link copied to clipboard" });
              }}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
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

            <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-8 leading-tight" style={{ color: '#173C7E' }}>
              {project.title}
            </h1>

            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                  <FlaskConical className="h-6 w-6" style={{ color: '#F47A1E' }} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest" style={{ color: '#94A3B8' }}>Laboratory</div>
                  <div className="text-sm font-bold" style={{ color: '#0F172A' }}>{lab?.name || "Independent"}</div>
                </div>
              </div>

              <Separator orientation="vertical" className="h-10 hidden md:block" />

              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                  <Users className="h-6 w-6" style={{ color: '#F47A1E' }} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest" style={{ color: '#94A3B8' }}>Research Group</div>
                  <div className="text-sm font-bold" style={{ color: '#0F172A' }}>{group?.name || "General"}</div>
                </div>
              </div>

              <Separator orientation="vertical" className="h-10 hidden md:block" />

              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                  <Calendar className="h-6 w-6" style={{ color: '#F47A1E' }} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest" style={{ color: '#94A3B8' }}>Deadline</div>
                  <div className="text-sm font-bold" style={{ color: '#0F172A' }}>{project.deadline ? new Date(project.deadline).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : "Open Ended"}</div>
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
              <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2" style={{ color: '#173C7E' }}>
                <Globe className="h-6 w-6" style={{ color: '#F47A1E' }} />
                Key Focus Areas
              </h2>
              <div className="flex flex-wrap gap-3">
                {project.focus_areas ? (
                  project.focus_areas.split(/[,;\n]+/).map(tag => {
                    const trimmed = tag.trim();
                    if (!trimmed) return null;
                    return (
                      <span
                        key={trimmed}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border shadow-sm transition-all hover:scale-105"
                        style={{
                          background: 'rgba(23, 60, 126, 0.08)',
                          color: '#173C7E',
                          borderColor: 'rgba(23, 60, 126, 0.2)',
                        }}
                      >
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: '#F47A1E' }} />
                        {trimmed}
                      </span>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-400 italic">No specific focus areas listed for this project.</p>
                )}
              </div>
            </section>

            {/* Project Publications */}
            {publications.length > 0 && (
              <>
                <Separator className="bg-border/50" />
                <section>
                  <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2" style={{ color: '#173C7E' }}>
                    <BookOpen className="h-6 w-6" style={{ color: '#F47A1E' }} />
                    Project Publications ({publications.length})
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {publications.map(pub => (
                      <PublicationCard key={pub.id} publication={pub} />
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Application Info for non-logged in */}
            <section className="p-8 rounded-2xl bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#173C7E' }}>Want to join this project?</h3>
                <p className="text-muted-foreground mb-6">
                  Collaboration on this project is managed through the Nexus portal. You need to be a registered student or researcher at ENSIA to apply.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to={`/signin?redirect=/discovery/projects/${project.id}`}>
                    <Button className="rounded-lg px-8 h-11 font-semibold gap-2 transition-all hover:brightness-110" style={{ background: '#F47A1E', color: '#fff' }}>
                      Sign In to Apply <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="outline" className="rounded-lg px-8 h-11 font-semibold text-[#173C7E] border-[#173C7E]/20 hover:bg-[#173C7E] hover:text-white transition-colors">
                      Create Account
                    </Button>
                  </Link>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            <Card className="rounded-2xl border border-slate-100 bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] overflow-hidden">
              <div className="p-6" style={{ background: '#173C7E' }}>
                <h3 className="font-display font-bold text-lg text-white">Project Lead</h3>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="shrink-0">
                    <ProfileAvatar
                      userId={leader?.id || 0}
                      imageUrl={leader?.profile_picture_url}
                      name={leader?.full_name || 'Project Lead'}
                      className="h-16 w-16 rounded-2xl text-xl font-bold border border-slate-200 shadow-sm"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-lg text-[#0F172A] truncate">{leader?.full_name || "Nexus Researcher"}</div>
                    <div className="text-sm text-slate-500 truncate">{leader?.institution || "ENSIA Academic"}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-500 min-w-0">
                    <Mail className="h-4 w-4 text-[#F47A1E] shrink-0" />
                    <span className="truncate">{leader?.contact_email || leader?.email || "Email restricted"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Shield className="h-4 w-4 text-[#F47A1E] shrink-0" />
                    <span>Validated Researcher</span>
                  </div>
                </div>
                <Separator className="my-6" />
                <Button className="w-full rounded-lg h-11 font-semibold gap-2 bg-slate-100 text-[#173C7E] hover:bg-slate-200" onClick={() => {
                  const leadEmail = leader?.contact_email || leader?.email;
                  if (leadEmail && !leadEmail.includes('restricted')) {
                    window.location.href = `mailto:${leadEmail}?subject=Inquiry: ${project.title}`;
                  } else {
                    toast({ title: "Contact info restricted" });
                  }
                }}>
                  Contact Researcher
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-100 bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)]">
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
    </PublicLayout>
  );
};

export default PublicProjectDetails;
