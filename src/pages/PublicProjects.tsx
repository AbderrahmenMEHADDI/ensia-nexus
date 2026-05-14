import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  ArrowRight,
  FlaskConical,
  Users,
  Calendar,
  ExternalLink,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiRepository } from '@/repositories/apiRepository';
import type { Project, ResearchGroup, ResearchLab } from '@/types';
import { cn } from '@/lib/utils';

const PublicProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [labs, setLabs] = useState<ResearchLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabId, setSelectedLabId] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, g, l] = await Promise.all([
          apiRepository.getProjects(),
          apiRepository.getGroups(),
          apiRepository.getLabs(),
        ]);
        // Only show approved and public projects
        setProjects(p.filter(project => project.status === 'APPROVED' && project.visibility === 'PUBLIC'));
        setGroups(g);
        setLabs(l);
      } catch (err) {
        console.error('Failed to load projects', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const group = groups.find(g => g.id === p.group_id);
    const matchesLab = selectedLabId === 'all' || (group && String(group.lab_id) === selectedLabId);
    return matchesSearch && matchesLab;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
        <p className="text-muted-foreground font-medium animate-pulse">Scanning research board...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border py-4">
        <div className="container px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Discovery</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/signin">
              <Button variant="ghost" size="sm" className="rounded-full px-4">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="rounded-full px-4 shadow-lg shadow-primary/20">Join Nexus</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -z-10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-blue-500/5 -z-10 blur-[100px]" />
        
        <div className="container px-4 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-6 bg-primary/5 text-primary border-primary/20 py-1 px-4 rounded-full text-xs font-bold uppercase tracking-widest">
              Research Opportunities
            </Badge>
            <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight mb-6 leading-tight">
              Open Project Board
            </h1>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Explore ongoing research endeavors across ENSIA. From AI safety to advanced robotics, find projects looking for collaborators and impact.
            </p>
          </motion.div>

          {/* Search & Filter Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col md:flex-row gap-4 bg-card border border-border p-2 rounded-[2rem] shadow-xl shadow-primary/5"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by title, topic, or tech..." 
                className="pl-11 h-12 rounded-full border-none focus-visible:ring-0 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select 
                className="bg-muted/50 border-none rounded-full px-6 h-12 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer min-w-[160px]"
                value={selectedLabId}
                onChange={(e) => setSelectedLabId(e.target.value)}
              >
                <option value="all">All Laboratories</option>
                {labs.map(lab => (
                  <option key={lab.id} value={String(lab.id)}>{lab.name}</option>
                ))}
              </select>
              <Button size="icon" variant="secondary" className="h-12 w-12 rounded-full shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-16">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>{filteredProjects.length} Projects found</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project, i) => (
              <ProjectDiscoveryCard 
                key={project.id} 
                project={project} 
                group={groups.find(g => g.id === project.group_id)}
                index={i}
              />
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="py-32 text-center border-2 border-dashed border-border rounded-[3rem] bg-muted/5">
              <div className="h-20 w-20 bg-background rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-border">
                <Search className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <h3 className="text-xl font-bold mb-2">No matching projects</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">Try adjusting your filters or search terms to find what you're looking for.</p>
              <Button 
                variant="link" 
                className="mt-4 text-primary"
                onClick={() => { setSearchQuery(''); setSelectedLabId('all'); }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 border-t border-border bg-primary/[0.02]">
        <div className="container px-4">
          <div className="bg-foreground text-background rounded-[3rem] p-12 md:p-20 relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px]" />
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Want to lead your own research?</h2>
              <p className="text-lg text-background/60 mb-10 leading-relaxed">
                Join ENSIA Nexus to create projects, recruit team members, and publish your findings. Our platform provides the tools you need for modern research management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="rounded-full px-8 py-6 text-lg h-auto shadow-xl shadow-primary/20">Get Started Now</Button>
                </Link>
                <Link to="/signin">
                  <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg h-auto border-background/20 hover:bg-background/10 text-background">Sign In</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

/* --- Helper Component --- */

const ProjectDiscoveryCard = ({ project, group, index }: { project: Project; group?: ResearchGroup; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.05 }}
  >
    <Card className="h-full rounded-[2.5rem] border-border bg-card hover:border-primary/20 transition-all group shadow-sm hover:shadow-2xl hover:shadow-primary/5 flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-4">
          {project.accepting_collaborators ? (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 py-0.5 px-3 rounded-full text-[10px] font-bold uppercase tracking-widest">
              Hiring Researchers
            </Badge>
          ) : (
            <Badge variant="outline" className="py-0.5 px-3 rounded-full text-[10px] font-bold uppercase tracking-widest border-border text-muted-foreground">
              Internal Project
            </Badge>
          )}
          <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
            #{project.id}
          </span>
        </div>
        <CardTitle className="text-2xl font-display group-hover:text-primary transition-colors line-clamp-2 leading-tight">
          {project.title}
        </CardTitle>
        <CardDescription className="line-clamp-3 leading-relaxed mt-4 min-h-[4.5rem]">
          {project.description || "Advancing research and innovation through collaborative efforts and rigorous scientific experimentation."}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="mt-auto pt-4 flex flex-col gap-6">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50">
          <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center border border-border shadow-sm">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Research Team</div>
            <div className="text-sm font-bold truncate">{group?.name || "Independent Group"}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Deadline</div>
            <div className="text-xs font-semibold flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-primary" />
              {project.deadline ? new Date(project.deadline).toLocaleDateString() : "No Deadline"}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Visibility</div>
            <div className="text-xs font-semibold flex items-center gap-1.5 capitalize">
              <ExternalLink className="h-3 w-3 text-primary" />
              {project.visibility.toLowerCase()}
            </div>
          </div>
        </div>

        <Link to={`/discovery/projects/${project.id}`} className="mt-4">
          <Button className="w-full rounded-2xl py-6 h-auto group-hover:shadow-lg group-hover:shadow-primary/20 transition-all font-bold gap-2">
            View details & Apply <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  </motion.div>
);

export default PublicProjects;
