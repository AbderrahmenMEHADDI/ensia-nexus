import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  FlaskConical,
  Users,
  FileText,
  Zap,
  Loader2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRepository } from '@/repositories/apiRepository';
import type { LandingPageResponse, LandingLab, TeamSummary } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const Landing = () => {
  const { toast } = useToast();
  const [data, setData] = useState<LandingPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiRepository.getLandingPageData();
        setData(res);
      } catch (err) {
        console.error('Failed to fetch landing page data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Navbar */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        scrolled ? "bg-background/80 backdrop-blur-md py-3 border-border" : "bg-transparent py-5 border-transparent"
      )}>
        <div className="container flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <img src="/logo_small.svg" alt="Logo" className="h-6 w-6 brightness-0 invert" />
            </div>
            <span className="font-display font-bold text-foreground text-lg tracking-tight">ENSIA Nexus</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/signin">
              <Button variant="ghost" className="font-medium">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button className="rounded-full px-6 shadow-md shadow-primary/20">Join Hub</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
        </div>

        <div className="container px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold tracking-wide uppercase">
              <Zap className="h-3 w-3" />
              Advanced Research Collaboration
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold text-foreground leading-[1.05] tracking-tight mb-8">
              Where AI Excellence <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-indigo-600">Meets Real-World Impact</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed mb-10">
              The central hub for ENSIA labs and groups to manage projects, track milestones, and showcase academic breakthroughs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/discovery/projects">
                <Button size="lg" className="rounded-full px-8 py-6 text-lg h-auto shadow-xl shadow-primary/20 gap-2">
                  Browse Project Board <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#discovery">
                <Button variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg border-2">
                  Explore Labs
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 border-y border-border bg-muted/30">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem label="Active Labs" value="12+" />
            <StatItem label="Research Groups" value="45+" />
            <StatItem label="Ongoing Projects" value="180+" />
            <StatItem label="Publications" value="320+" />
          </div>
        </div>
      </section>

      {/* Discovery Section - Labs & Groups */}
      <section id="discovery" className="py-24 md:py-32">
        <div className="container px-4">
          <SectionHeader
            title="Discover Research Units"
            description="Explore specialized labs and high-impact research groups driving innovation at ENSIA."
          />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
              <p className="text-muted-foreground animate-pulse">Loading research ecosystem...</p>
            </div>
          ) : (
            <div className="space-y-24">
              {/* Labs Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {data?.labs.map((lab, i) => (
                  <LabCard key={lab.id} lab={lab} index={i} />
                ))}
              </div>

              {/* Featured Teams */}
              <div className="pt-16 border-t border-border">
                <div className="flex items-center justify-between mb-12">
                  <h3 className="text-3xl font-display font-bold">Featured Research Groups</h3>
                  <Button
                    variant="ghost"
                    className="gap-1 text-primary"
                    onClick={() => toast({
                      title: "Discovery Mode",
                      description: "Scroll down to explore all featured research groups."
                    })}
                  >
                    View all groups <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {data?.featured_teams.map((team, i) => (
                    <TeamCard key={team.id} team={team} index={i} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Open Projects Section */}
      <section className="py-24 md:py-32 bg-secondary/30 relative">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Research Opportunities</h2>
              <p className="text-muted-foreground">Apply to join ongoing projects and collaborate with expert teams.</p>
            </div>
            <Link to="/discovery/projects">
              <Button className="rounded-full gap-2 group">
                Browse Project Board <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.open_projects.slice(0, 6).map((project, i) => (
              <ProjectPreviewCard key={project.id} project={project} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="container px-4">
          <div className="relative rounded-[2.5rem] bg-foreground text-background p-12 md:p-20 overflow-hidden group">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-700" />
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-8 leading-tight">
                Ready to contribute to the future of AI?
              </h2>
              <p className="text-lg text-muted-foreground mb-12">
                Join our collaborative ecosystem today and start building high-impact research projects with the brightest minds.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="rounded-full h-14 px-10 text-lg bg-background text-foreground hover:bg-muted transition-colors">
                    Create Account
                  </Button>
                </Link>
                <Link to="/signin">
                  <Button variant="outline" size="lg" className="rounded-full h-14 px-10 text-lg border-background/20 hover:bg-background/10">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 md:py-20">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <img src="/logo_small.svg" alt="Logo" className="h-5 w-5 brightness-0 invert" />
                </div>
                <span className="font-display font-bold text-foreground text-lg">ENSIA Nexus</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The official research management and collaboration platform of the École Nationale Supérieure d'Intelligence Artificielle.
              </p>
            </div>
            <FooterCol
              title="Platform"
              links={[
                { label: 'Discovery', href: '#discovery' },
                { label: 'Project Board', href: '/discovery/projects' },
                { label: 'Publications', href: '/publications' },
                { label: 'Project Board', href: '/discovery/projects' },
              ]}
            />
            <FooterCol
              title="Resources"
              links={[
                { label: 'Documentation', href: '#' },
                { label: 'API Reference', href: '#' },
                { label: 'Research Guidelines', href: '#' },
                { label: 'Terms of Service', href: '#' },
              ]}
            />
            <FooterCol
              title="Connect"
              links={[
                { label: 'Lab Support', href: '#' },
                { label: 'Institutional Contact', href: '#' },
                { label: 'ENSIA Website', href: 'https://ensia.edu.dz' },
                { label: 'Feedback Hub', href: '#' },
              ]}
            />
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs text-muted-foreground">© 2026 ENSIA Nexus. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <SocialIcon icon={Users} />
              <SocialIcon icon={FileText} />
              <SocialIcon icon={FlaskConical} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* --- Sub-components --- */

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-display font-bold text-foreground mb-1">{value}</div>
    <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{label}</div>
  </div>
);

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="max-w-3xl mb-16">
    <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 tracking-tight">{title}</h2>
    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

const LabCard = ({ lab, index }: { lab: LandingLab; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
    className="group relative p-8 rounded-[2rem] border border-border bg-card hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5"
  >
    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
      <FlaskConical className="h-7 w-7 text-primary" />
    </div>
    <h3 className="text-2xl font-display font-bold mb-3 group-hover:text-primary transition-colors">{lab.name}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-2">{lab.description || "Leading innovations and fundamental research in the heart of ENSIA's scientific ecosystem."}</p>

    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
        Active Groups
      </div>
      <div className="flex flex-wrap gap-2">
        {lab.teams.slice(0, 3).map(team => (
          <Link key={team.id} to={`/group/${team.id}`}>
            <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer border border-border">
              {team.name}
            </span>
          </Link>
        ))}
        {lab.teams.length > 3 && (
          <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium border border-border">
            +{lab.teams.length - 3} more
          </span>
        )}
      </div>
    </div>
  </motion.div>
);

const TeamCard = ({ team, index }: { team: TeamSummary; index: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.05 }}
  >
    <Link to={`/group/${team.id}`}>
      <div className="p-6 rounded-3xl border border-border bg-card hover:bg-secondary/50 transition-all cursor-pointer group">
        <div className="flex justify-between items-start mb-4">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </div>
        <h4 className="font-display font-bold text-lg mb-1 group-hover:text-primary transition-colors">{team.name}</h4>
        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-tighter mb-4 opacity-70">{team.lab_name}</p>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div>
            <div className="text-lg font-bold">{team.project_count}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Projects</div>
          </div>
          <div>
            <div className="text-lg font-bold">{team.publication_count}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Pubs</div>
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);

const ProjectPreviewCard = ({ project, index }: { project: any; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.08 }}
    className="p-6 rounded-3xl border border-border bg-card hover:shadow-xl transition-all"
  >
    <div className="flex items-center gap-2 mb-4">
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-600 uppercase tracking-widest border border-green-500/20">
        Open for Collaboration
      </span>
    </div>
    <h4 className="font-display font-bold text-xl mb-2 line-clamp-1">{project.title}</h4>
    <p className="text-sm text-muted-foreground line-clamp-2 mb-6 leading-relaxed">
      {project.description || "Innovative research focusing on advancing artificial intelligence paradigms through experimental and theoretical approaches."}
    </p>
    <div className="flex items-center justify-between pt-6 border-t border-border">
      <div className="flex flex-col">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Group</span>
        <span className="text-sm font-semibold">{project.team_name}</span>
      </div>
      <Link to={`/discovery/projects/${project.id}`}>
        <Button variant="ghost" size="sm" className="h-8 px-3 rounded-full hover:bg-primary/10 hover:text-primary">
          View Details
        </Button>
      </Link>
    </div>
  </motion.div>
);

const FooterCol = ({ title, links }: { title: string; links: { label: string; href: string }[] }) => (
  <div className="space-y-6">
    <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">{title}</h4>
    <ul className="space-y-4">
      {links.map(link => (
        <li key={link.label}>
          <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{link.label}</Link>
        </li>
      ))}
    </ul>
  </div>
);

const SocialIcon = ({ icon: Icon }: { icon: any }) => (
  <div className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:bg-primary/5 hover:border-primary/30 hover:text-primary cursor-pointer transition-all">
    <Icon className="h-4 w-4" />
  </div>
);

export default Landing;