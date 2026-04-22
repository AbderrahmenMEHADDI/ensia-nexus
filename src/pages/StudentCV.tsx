import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  GraduationCap,
  Briefcase,
  Brain,
  Wrench,
  User,
  Sparkles,
  Link as LinkIcon,
  Search,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import type { StudentCVEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const StudentCV = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cvs, setCvs] = useState<StudentCVEntry[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [university, setUniversity] = useState('');
  const [level, setLevel] = useState<StudentCVEntry['level']>('UNDERGRADUATE');
  const [major, setMajor] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [researchInterests, setResearchInterests] = useState('');
  const [skills, setSkills] = useState('');
  const [cvUrl, setCvUrl] = useState('');

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const records = await apiRepository.getStudentCVs(user.id);
        setCvs(records);
      } catch {
        setCvs([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const payload = {
      title: title.trim(),
      university: university.trim() || null,
      level,
      major: major.trim() || null,
      bio: bio.trim() || null,
      experience: experience.trim() || null,
      research_interests: researchInterests.trim() || null,
      skills: skills.trim() || null,
      cv_url: cvUrl.trim() || null,
    };

    try {
      const created = await apiRepository.createStudentCV({
        student_user_id: user.id,
        ...payload,
      });
      setCvs(prev => [created, ...prev]);
      setShowForm(false);
      resetForm();
      toast({ title: 'CV record created successfully' });
    } catch {
      toast({ title: 'Failed to save CV', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setUniversity('');
    setLevel('UNDERGRADUATE');
    setMajor('');
    setBio('');
    setExperience('');
    setResearchInterests('');
    setSkills('');
    setCvUrl('');
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRepository.deleteStudentCV(id);
      setCvs(prev => prev.filter(cv => cv.id !== id));
      toast({ title: 'CV deleted' });
    } catch {
      toast({ title: 'Failed to delete CV', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading your academic portfolio...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="relative mb-12">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold bg-primary/5 text-primary border-primary/20">
                Academic Portfolio
              </Badge>
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              My <span className="text-primary italic">Academic CVs</span>
            </h1>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className={cn(
              "rounded-xl h-12 px-6 shadow-lg shadow-primary/20 transition-all",
              showForm ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : "bg-primary hover:bg-primary/90"
            )}
          >
            {showForm ? 'Cancel Creation' : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Build New CV
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form Section */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden mb-12"
          >
            <Card className="border-primary/20 shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">CV Architect</CardTitle>
                <CardDescription>Construct a professional profile tailored to your next research opportunity.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">CV Version Title</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Computer Vision Research Profile" className="rounded-xl h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Institution</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input value={university} onChange={e => setUniversity(e.target.value)} placeholder="e.g., ENSIA" className="pl-10 rounded-xl h-11" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Academic Level</Label>
                  <Select value={level} onValueChange={(v) => setLevel(v as any)}>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNDERGRADUATE">Undergraduate</SelectItem>
                      <SelectItem value="GRADUATE">Graduate</SelectItem>
                      <SelectItem value="PHD">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Field of Study</Label>
                  <Input value={major} onChange={e => setMajor(e.target.value)} placeholder="e.g., AI & Data Science" className="rounded-xl h-11" />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">External CV Link (PDF/Drive)</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input value={cvUrl} onChange={e => setCvUrl(e.target.value)} placeholder="https://..." className="pl-10 rounded-xl h-11" />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-3 lg:col-span-1">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><User className="h-3 w-3" />Professional Bio</Label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Summarize your academic persona..." className="rounded-xl resize-none" />
                </div>
                <div className="space-y-2 md:col-span-3 lg:col-span-1">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Briefcase className="h-3 w-3" />Relevant Experience</Label>
                  <Textarea value={experience} onChange={e => setExperience(e.target.value)} rows={4} placeholder="Labs, internships, hackathons..." className="rounded-xl resize-none" />
                </div>
                <div className="space-y-2 md:col-span-3 lg:col-span-1">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Brain className="h-3 w-3" />Research Interests</Label>
                  <Textarea value={researchInterests} onChange={e => setResearchInterests(e.target.value)} rows={4} placeholder="Specific domains you wish to explore..." className="rounded-xl resize-none" />
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Wrench className="h-3 w-3" />Core Skills</Label>
                  <Input value={skills} onChange={e => setSkills(e.target.value)} placeholder="Python, PyTorch, SQL, Academic Writing..." className="rounded-xl h-11" />
                </div>
              </CardContent>
              <CardFooter className="bg-secondary/20 py-4 flex justify-end gap-3 rounded-b-xl border-t">
                <Button variant="ghost" onClick={() => setShowForm(false)}>Discard</Button>
                <Button onClick={handleSave} disabled={saving || !title.trim()} className="rounded-lg px-8">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Deploy CV Version
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CV Grid */}
      <div className="grid grid-cols-1 gap-8">
        {cvs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-border rounded-[2rem] bg-secondary/10">
            <div className="h-20 w-20 rounded-full bg-background flex items-center justify-center mb-6 shadow-sm">
              <Search className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No CV versions yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-8 px-4">
              Your professional profile is the key to joining prestigious research groups. Build your first CV now.
            </p>
            <Button variant="outline" onClick={() => setShowForm(true)} className="rounded-xl px-8 h-12">
              <Plus className="h-5 w-5 mr-2" /> Start Building
            </Button>
          </div>
        ) : (
          cvs.map((cv, idx) => (
            <motion.div
              key={cv.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="group relative overflow-hidden border-border hover:shadow-2xl transition-all duration-500 rounded-[2rem]">
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <Button variant="destructive" size="icon" className="rounded-full shadow-lg" onClick={() => handleDelete(cv.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[300px]">
                  {/* Sidebar Info */}
                  <div className="lg:col-span-4 bg-secondary/30 p-8 border-r border-border flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-none rounded-lg px-3 py-1 font-bold text-[10px] tracking-widest uppercase">
                          {cv.level?.replace('_', ' ') || 'Unknown Level'}
                        </Badge>
                      </div>
                      <h2 className="text-2xl font-black leading-tight text-foreground mb-4">{cv.title}</h2>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-primary shadow-sm">
                            <GraduationCap className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Institution</p>
                            <p className="font-semibold">{cv.university || 'Not Specified'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-primary shadow-sm">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Major</p>
                            <p className="font-semibold">{cv.major || 'Not Specified'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-border/50">
                      {cv.cv_url ? (
                        <Button asChild className="w-full rounded-xl h-12 shadow-md">
                          <a href={cv.cv_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2">
                            View Full Document
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <div className="p-4 rounded-xl bg-background/50 border border-dashed border-border text-center text-xs text-muted-foreground">
                          No external document linked
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="lg:col-span-8 p-8 space-y-8 bg-card relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />

                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <User className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Personal Summary</h4>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                        {cv.bio || "No summary provided for this CV version."}
                      </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <section>
                        <div className="flex items-center gap-2 mb-3">
                          <Briefcase className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Experience</h4>
                        </div>
                        <p className="text-xs text-foreground/70 leading-loose whitespace-pre-line">
                          {cv.experience || "No specific experience listed."}
                        </p>
                      </section>
                      <section>
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Research Interests</h4>
                        </div>
                        <p className="text-xs text-foreground/70 leading-loose whitespace-pre-line">
                          {cv.research_interests || "No research interests listed."}
                        </p>
                      </section>
                    </div>

                    <section className="pt-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Wrench className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Skillset & Tools</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {cv.skills ? cv.skills.split(',').map((skill, i) => (
                          <Badge key={i} variant="secondary" className="rounded-lg px-3 py-1.5 bg-secondary/50 hover:bg-secondary border-border text-xs font-medium">
                            {skill.trim()}
                          </Badge>
                        )) : (
                          <span className="text-xs text-muted-foreground italic">No skills specified</span>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentCV;
