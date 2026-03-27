import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Plus, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import type { StudentCVEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

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
      setTitle('');
      setUniversity('');
      setLevel('UNDERGRADUATE');
      setMajor('');
      setBio('');
      setExperience('');
      setResearchInterests('');
      setSkills('');
      setCvUrl('');
      toast({ title: 'CV created' });
    } catch {
      toast({ title: 'Failed to save CV', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
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
      <div className="container py-10 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <span className="text-xs font-mono text-primary uppercase tracking-wider">Student Area</span>
          <h1 className="text-3xl font-serif font-bold text-foreground mt-1">My CVs</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            You can create multiple CVs. Click Create CV to add a new one.
          </p>
          <div className="mt-4">
            <Button onClick={() => setShowForm(s => !s)}>
              <Plus className="h-4 w-4 mr-1" /> {showForm ? 'Close Form' : 'Create CV'}
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New CV</CardTitle>
              <CardDescription>Fill the form and confirm to create a new CV record.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>CV Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="CV for AI Internship" />
              </div>
              <div className="space-y-2">
                <Label>University</Label>
                <Input value={university} onChange={e => setUniversity(e.target.value)} placeholder="ENSIA" />
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={level} onValueChange={(v) => setLevel(v as StudentCVEntry['level'])}>
                  <SelectTrigger>
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
                <Label>Major</Label>
                <Input value={major} onChange={e => setMajor(e.target.value)} placeholder="Computer Science" />
              </div>
              <div className="space-y-2">
                <Label>CV URL</Label>
                <Input value={cvUrl} onChange={e => setCvUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Short profile description" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Experience</Label>
                <Textarea value={experience} onChange={e => setExperience(e.target.value)} rows={3} placeholder="Internships, projects, labs..." />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Research Interests</Label>
                <Textarea value={researchInterests} onChange={e => setResearchInterests(e.target.value)} rows={3} placeholder="AI, NLP, Cybersecurity..." />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Skills</Label>
                <Textarea value={skills} onChange={e => setSkills(e.target.value)} rows={2} placeholder="Python, SQL, React..." />
              </div>
              <div className="md:col-span-2">
                <Button onClick={handleSave} disabled={saving || !title.trim()}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirm Create CV
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {cvs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No CVs yet. Click Create CV to add your first one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {cvs.map(cv => (
              <Card key={cv.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{cv.title}</CardTitle>
                      <CardDescription>
                        {cv.university || 'No university'} · {cv.level || 'No level'} · {cv.major || 'No major'}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(cv.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {cv.bio && <p><span className="font-medium">Description:</span> {cv.bio}</p>}
                  {cv.experience && <p><span className="font-medium">Experience:</span> {cv.experience}</p>}
                  {cv.research_interests && <p><span className="font-medium">Research interests:</span> {cv.research_interests}</p>}
                  {cv.skills && <p><span className="font-medium">Skills:</span> {cv.skills}</p>}
                  {cv.cv_url && (
                    <a href={cv.cv_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      Open CV Link <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentCV;
