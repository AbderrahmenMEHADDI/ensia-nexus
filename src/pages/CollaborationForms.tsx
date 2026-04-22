import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import { isProjectOpenForStudentApplications } from '@/lib/projectAccess';
import type { GroupMember, ParticipantRole, Project, ResearchGroup, Student, User, Visibility } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const CollaborationForms = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [applicationProjectId, setApplicationProjectId] = useState('');
  const [motivation, setMotivation] = useState('');

  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectGroupId, setProjectGroupId] = useState('');
  const [projectVisibility, setProjectVisibility] = useState<Visibility>('PRIVATE');

  const [memberProjectId, setMemberProjectId] = useState('');
  const [memberUserId, setMemberUserId] = useState('');
  const [participantRole, setParticipantRole] = useState<ParticipantRole>('MEMBER');

  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [university, setUniversity] = useState('');
  const [level, setLevel] = useState('UNDERGRADUATE');
  const [major, setMajor] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [researchInterests, setResearchInterests] = useState('');
  const [skills, setSkills] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const availableApplicationProjects = projects.filter(isProjectOpenForStudentApplications);
  const validatedGroups = groups.filter(group => group.is_validated);
  const myValidatedGroups = user
    ? validatedGroups.filter(group =>
      groupMembers.some(
        member => member.group_id === group.id && member.user_id === user.id && member.is_active
      )
    )
    : [];

  useEffect(() => {
    const load = async () => {
      try {
        const [allProjects, allGroups, allGroupMembers, allUsers] = await Promise.all([
          apiRepository.getProjects(),
          apiRepository.getGroups(),
          apiRepository.getGroupMembers(),
          apiRepository.getUsers(),
        ]);

        setProjects(allProjects);
        setGroups(allGroups);
        setGroupMembers(allGroupMembers);
        setUsers(allUsers);

        if (user?.role === 'STUDENT') {
          try {
            const profile = await apiRepository.getStudentProfile(user.id);
            setStudentProfile(profile);
            setUniversity(profile.university || '');
            setLevel(profile.level || 'UNDERGRADUATE');
            setMajor(profile.major || '');
            setBio(profile.bio || '');
            setExperience(profile.experience || '');
            setResearchInterests(profile.research_interests || '');
            setSkills(profile.skills || '');
            setCvUrl(profile.cv_url || '');
          } catch {
            setStudentProfile(null);
          }
        }
      } catch (error) {
        toast({ title: 'Failed to load form data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, toast]);

  const submitApplication = async () => {
    if (!user || !applicationProjectId || !motivation.trim()) return;
    setSubmitting('application');
    try {
      await apiRepository.createApplication({
        project_id: Number(applicationProjectId),
        student_user_id: user.id,
        motivation: motivation.trim(),
        status: 'PENDING',
      });
      setMotivation('');
      setApplicationProjectId('');
      toast({ title: 'Application submitted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      toast({
        title: 'Failed to submit application',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(null);
    }
  };

  const submitProjectDetails = async () => {
    if (!user || !projectTitle.trim() || !projectGroupId) return;
    if (user.role === 'ADMIN') {
      toast({ title: 'Admins cannot create projects', variant: 'destructive' });
      return;
    }
    setSubmitting('project');
    try {
      const created = await apiRepository.createProject({
        group_id: Number(projectGroupId),
        title: projectTitle.trim(),
        description: projectDescription.trim(),
        visibility: projectVisibility,
        created_by: user.id,
      });
      setProjects(prev => [created, ...prev]);
      setProjectTitle('');
      setProjectDescription('');
      setProjectGroupId('');
      setProjectVisibility('PRIVATE');
      toast({ title: 'Project created successfully' });
    } catch {
      toast({ title: 'Failed to create project', variant: 'destructive' });
    } finally {
      setSubmitting(null);
    }
  };

  const submitMemberDetails = async () => {
    if (!memberProjectId || !memberUserId) return;
    setSubmitting('member');
    try {
      await apiRepository.createProjectParticipant({
        project_id: Number(memberProjectId),
        user_id: Number(memberUserId),
        participant_role: participantRole,
      });
      setMemberProjectId('');
      setMemberUserId('');
      setParticipantRole('MEMBER');
      toast({ title: 'Member added to project' });
    } catch {
      toast({ title: 'Failed to save member details', variant: 'destructive' });
    } finally {
      setSubmitting(null);
    }
  };

  const submitStudentCv = async () => {
    if (!user || role !== 'STUDENT') return;
    setSubmitting('student-profile');
    try {
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

      const saved = studentProfile
        ? await apiRepository.updateStudentProfile(user.id, payload)
        : await apiRepository.createStudentProfile({ user_id: user.id, ...payload });

      setStudentProfile(saved);
      toast({ title: 'Student profile saved' });
    } catch {
      toast({ title: 'Failed to save student profile', variant: 'destructive' });
    } finally {
      setSubmitting(null);
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-8">
          <span className="text-xs font-mono text-primary uppercase tracking-wider">Collaboration Workspace</span>
          <h1 className="text-3xl font-serif font-bold text-foreground mt-1">Project & Profile Forms</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Fill these forms to apply to projects, create project records, manage member details, and complete your student CV/profile description.
          </p>
        </div>

        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Application for Join Project</CardTitle>
              <CardDescription>
                Students can apply only to approved public projects.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={applicationProjectId} onValueChange={setApplicationProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableApplicationProjects.map(project => (
                      <SelectItem key={project.id} value={String(project.id)}>{project.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableApplicationProjects.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No approved public projects are available for applications right now.
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Note: The AI ranking model evaluates your application using your Motivation, Profile Skills/Bio/Interests, CV records, and Previous Projects. Make sure your profile is fully updated!
                </p>
              </div>
              <div className="space-y-2">
                <Label>Motivation</Label>
                <Textarea
                  value={motivation}
                  onChange={e => setMotivation(e.target.value)}
                  placeholder="Describe why your skills and experience make you a good fit. (Include details relevant to the project)"
                  rows={4}
                />
              </div>
              <Button onClick={submitApplication} disabled={submitting === 'application' || !applicationProjectId || !motivation.trim()}>
                {submitting === 'application' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Application
              </Button>
            </CardContent>
          </Card>

          {role !== 'ADMIN' && (
            <Card>
              <CardHeader>
                <CardTitle>Project Details Form</CardTitle>
                <CardDescription>Create a project with full details and description.</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Project Title</Label>
                  <Input value={projectTitle} onChange={e => setProjectTitle(e.target.value)} placeholder="Project title" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={projectDescription}
                    onChange={e => setProjectDescription(e.target.value)}
                    rows={4}
                    placeholder="Project description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Research Group</Label>
                  <Select value={projectGroupId} onValueChange={setProjectGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {myValidatedGroups.map(group => (
                        <SelectItem key={group.id} value={String(group.id)}>{group.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {myValidatedGroups.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      You can only create projects for validated groups where you are an active member.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select value={projectVisibility} onValueChange={v => setProjectVisibility(v as Visibility)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Button onClick={submitProjectDetails} disabled={submitting === 'project' || !projectTitle.trim() || !projectGroupId}>
                    {submitting === 'project' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Project Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Member Details Form</CardTitle>
              <CardDescription>Add a user to a project and set role details.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={memberProjectId} onValueChange={setMemberProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={String(project.id)}>{project.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Member</Label>
                <Select value={memberUserId} onValueChange={setMemberUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(candidate => (
                      <SelectItem key={candidate.id} value={String(candidate.id)}>{candidate.full_name} ({candidate.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={participantRole} onValueChange={v => setParticipantRole(v as ParticipantRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="REVIEWER">Reviewer</SelectItem>
                    <SelectItem value="OBSERVER">Observer</SelectItem>
                    <SelectItem value="LEAD">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                <Button onClick={submitMemberDetails} disabled={submitting === 'member' || !memberProjectId || !memberUserId}>
                  {submitting === 'member' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Member Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {role === 'STUDENT' && (
            <Card>
              <CardHeader>
                <CardTitle>Student CV & Profile Description</CardTitle>
                <CardDescription>
                  Complete your student profile with experience, research interests, and CV information.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4" id="student-profile">
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
                  <Label>Description / Bio</Label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Short student profile description" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Experience</Label>
                  <Textarea value={experience} onChange={e => setExperience(e.target.value)} rows={3} placeholder="Internships, projects, labs, etc." />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Research Interests</Label>
                  <Textarea value={researchInterests} onChange={e => setResearchInterests(e.target.value)} rows={3} placeholder="AI, NLP, cybersecurity..." />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Skills</Label>
                  <Textarea value={skills} onChange={e => setSkills(e.target.value)} rows={2} placeholder="Python, React, SQL..." />
                </div>
                <div className="md:col-span-2">
                  <Button onClick={submitStudentCv} disabled={submitting === 'student-profile'}>
                    {submitting === 'student-profile' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Student Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CollaborationForms;
