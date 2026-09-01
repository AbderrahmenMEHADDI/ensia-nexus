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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiRepository } from '@/repositories/apiRepository';
import type { TeamSummary, ProjectPreview, GroupMember, Publication, Teacher } from '@/types';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { PublicationCard } from '@/components/shared/PublicationCard';

const GroupLanding = () => {
  const { toast } = useToast();
  const { groupId } = useParams();
  const [team, setTeam] = useState<TeamSummary | null>(null);
  const [projects, setProjects] = useState<ProjectPreview[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  // Contact Leader state
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sendingContact, setSendingContact] = useState(false);
  const [contactSent, setContactSent] = useState(false);


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

        // Fetch publications for all group projects & independent publications
        const pubsPromises = teamProjects.projects.map(p => 
          apiRepository.getPublications({ project_id: p.id, limit: 100 })
        );
        const independentPubsPromise = apiRepository.getPublications({ independent_only: true, limit: 100 });
        const [pubsResults, independentPubs] = await Promise.all([
          Promise.all(pubsPromises),
          independentPubsPromise
        ]);
        const allPubsMap = new Map<number, Publication>();
        pubsResults.flat().forEach(p => allPubsMap.set(p.id, p));
        independentPubs.forEach(p => allPubsMap.set(p.id, p));
        const sortedPubs = Array.from(allPubsMap.values()).sort((a, b) => {
          const orderA = (a as any).landing_page_order ?? 0;
          const orderB = (b as any).landing_page_order ?? 0;
          if (orderA !== orderB) return orderA - orderB;
          return new Date((b as any).publication_date || (b as any).created_at || 0).getTime() - new Date((a as any).publication_date || (a as any).created_at || 0).getTime();
        });
        setPublications(sortedPubs);
        setTeam(prev => prev ? { ...prev, publication_count: sortedPubs.length } : summary);
      } catch (err) {
        console.error('Failed to load group landing data', err);
      } finally {
        setLoading(false);
      }
    };
    loadGroupData();
  }, [groupId]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.subject.trim() || !contactForm.message.trim()) {
      toast({ title: 'Missing fields', description: 'Please fill out all contact fields.', variant: 'destructive' });
      return;
    }
    setSendingContact(true);
    try {
      await apiRepository.sendContactMessage({
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        subject: contactForm.subject.trim(),
        message: contactForm.message.trim(),
        group_id: team?.id,
      });
      setContactSent(true);
      toast({ title: 'Message Sent!', description: "Your message was sent to the team leader's email and stored in database." });
    } catch (err: any) {
      toast({ title: 'Failed to send message', description: err?.message || 'Something went wrong.', variant: 'destructive' });
    } finally {
      setSendingContact(false);
    }
  };

  const handleCloseContactDialog = (v: boolean) => {
    if (!v) {
      setContactSent(false);
      setContactForm({ name: '', email: '', subject: '', message: '' });
    }
    setContactDialogOpen(v);
  };

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
                onClick={() => setContactDialogOpen(true)}
              >
                <Mail className="h-3 w-3 mr-1.5" /> Contact Leader
              </Button>
              <a
                href="https://www.linkedin.com/company/aisi-research-team"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-7 rounded-full text-xs font-semibold px-3 border border-slate-200 text-[#173C7E] bg-white hover:bg-slate-50 transition-colors"
              >
                <svg className="h-3 w-3 mr-1.5 text-[#0A66C2] fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                Team LinkedIn
              </a>
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
              {projects.map((proj) => (
                <ProjectCard
                  key={proj.id}
                  project={proj}
                  to={`/discovery/projects/${proj.id}`}
                />
              ))}
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
                        {teacherInfo?.grade ? (
                          <span className="text-xs font-medium text-slate-500 truncate block capitalize mt-1">
                            {teacherInfo.grade.replace('_', ' ').toLowerCase()}
                          </span>
                        ) : isLeader ? (
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
            {publications.map((pub) => (
              <PublicationCard key={pub.id} publication={pub} />
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

      {/* Contact Leader Dialog Modal */}
      <Dialog open={contactDialogOpen} onOpenChange={handleCloseContactDialog}>
        <DialogContent className="sm:max-w-lg">
          {contactSent ? (
            <div className="flex flex-col items-center text-center py-8 gap-4">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Mail className="h-7 w-7 text-emerald-600" />
              </div>
              <DialogTitle className="text-2xl font-display font-bold text-[#0F172A]">Message Sent!</DialogTitle>
              <p className="text-slate-600 max-w-xs leading-relaxed text-sm">
                Your message has been delivered to the team leader's email and registered in the database.
              </p>
              <Button className="mt-4 rounded-full px-8" style={{ background: '#F47A1E', color: '#fff' }} onClick={() => handleCloseContactDialog(false)}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-display font-bold text-[#173C7E]">Contact {members.find(m => m.user_id === team.leader_user_id)?.user_name || 'Team Leader'}</DialogTitle>
                <DialogDescription>
                  Send a direct inquiry regarding research in <strong>{team.name}</strong>.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleContactSubmit} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="gl-contact-name">Your Name <span className="text-destructive">*</span></Label>
                  <Input id="gl-contact-name" placeholder="John Doe" value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gl-contact-email">Your Email <span className="text-destructive">*</span></Label>
                  <Input id="gl-contact-email" type="email" placeholder="john@example.com" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gl-contact-subject">Subject <span className="text-destructive">*</span></Label>
                  <Input id="gl-contact-subject" placeholder="Research collaboration inquiry" value={contactForm.subject} onChange={e => setContactForm(f => ({ ...f, subject: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gl-contact-message">Message <span className="text-destructive">*</span></Label>
                  <Textarea id="gl-contact-message" placeholder="Type your message here..." rows={4} value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} required />
                </div>
                <Button type="submit" className="w-full rounded-lg h-11 text-sm font-semibold gap-2" style={{ background: '#F47A1E', color: '#fff' }} disabled={sendingContact}>
                  {sendingContact ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {sendingContact ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
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



export default GroupLanding;
