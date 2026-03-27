import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import type { Student } from '@/types';
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
  const [existingProfile, setExistingProfile] = useState<Student | null>(null);

  const [university, setUniversity] = useState('');
  const [level, setLevel] = useState('UNDERGRADUATE');
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
        const profile = await apiRepository.getStudentProfile(user.id);
        setExistingProfile(profile);
        setUniversity(profile.university || '');
        setLevel(profile.level || 'UNDERGRADUATE');
        setMajor(profile.major || '');
        setBio(profile.bio || '');
        setExperience(profile.experience || '');
        setResearchInterests(profile.research_interests || '');
        setSkills(profile.skills || '');
        setCvUrl(profile.cv_url || '');
      } catch {
        setExistingProfile(null);
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
      const saved = existingProfile
        ? await apiRepository.updateStudentProfile(user.id, payload)
        : await apiRepository.createStudentProfile({ user_id: user.id, ...payload });

      setExistingProfile(saved);
      toast({ title: existingProfile ? 'CV updated' : 'CV created' });
    } catch {
      toast({ title: 'Failed to save CV', variant: 'destructive' });
    } finally {
      setSaving(false);
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
          <h1 className="text-3xl font-serif font-bold text-foreground mt-1">Create CV</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Fill your full student profile including description, experience, and research interests.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student CV Form</CardTitle>
            <CardDescription>This profile is managed by the student.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>University</Label>
              <Input value={university} onChange={e => setUniversity(e.target.value)} placeholder="ENSIA" />
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel}>
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
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {existingProfile ? 'Update CV' : 'Create CV'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default StudentCV;
