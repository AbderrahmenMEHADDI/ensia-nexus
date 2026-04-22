import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import { RoleBadge, StatusBadge, PriorityBadge } from '@/components/Badges';
import { Link } from 'react-router-dom';
import { Mail, Calendar, Settings, Plus, ExternalLink, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { cn } from '@/lib/utils';
import type { Student, Teacher, Project, Task, ProjectParticipant, User, StudentPreviousProject, ParticipantRole } from '@/types';

const Profile = () => {
  const { user, isTeacher } = useAuth();
  const { toast } = useToast();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isEditingProfileDetails, setIsEditingProfileDetails] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [institution, setInstitution] = useState('');
  const [department, setDepartment] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [previousProjects, setPreviousProjects] = useState<StudentPreviousProject[]>([]);
  const [showPreviousProjectForm, setShowPreviousProjectForm] = useState(false);
  const [savingPreviousProject, setSavingPreviousProject] = useState(false);
  const [newPreviousProjectTitle, setNewPreviousProjectTitle] = useState('');
  const [newPreviousProjectLink, setNewPreviousProjectLink] = useState('');
  const [newPreviousProjectDescription, setNewPreviousProjectDescription] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [participants, setParticipants] = useState<ProjectParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [p, t, part] = await Promise.all([
          apiRepository.getProjects(),
          apiRepository.getTasks(),
          apiRepository.getProjectParticipants(),
        ]);
        setProjects(p || []);
        setTasks(t || []);
        setParticipants(part || []);
        // Fetch role-specific profile
        if (isTeacher) {
          try {
            setTeacher(await apiRepository.getTeacherProfile(user.id));
          } catch { /* not a teacher */ }
        } else if (user.role === 'STUDENT') {
          try {
            setStudent(await apiRepository.getStudentProfile(user.id));
          } catch { /* not a student */ }
        }

        const fullUser = await apiRepository.getUser(user.id);
        if (fullUser) {
          setProfileUser(fullUser);
          setInstitution(fullUser.institution || '');
          setDepartment(fullUser.department || '');
          setContactEmail(fullUser.contact_email || '');
          setPhoneNumber(fullUser.phone_number || '');
          setAddress(fullUser.address || '');
          setWebsite(fullUser.website || '');
        }

        if (user.role === 'STUDENT') {
          try {
            setPreviousProjects((await apiRepository.getStudentPreviousProjects(user.id)) || []);
          } catch {
            setPreviousProjects([]);
          }
        }
      } catch (e) {
        console.error('Profile load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, isTeacher]);

  const handleSaveProfileDetails = async () => {
    if (!user) return;
    const normalizedContactEmail = contactEmail.trim();
    if (normalizedContactEmail && !/^\S+@\S+\.\S+$/.test(normalizedContactEmail)) {
      toast({ title: 'Contact email is invalid', variant: 'destructive' });
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await apiRepository.updateUser(user.id, {
        institution: institution.trim() || null,
        department: department.trim() || null,
        contact_email: normalizedContactEmail || null,
        phone_number: phoneNumber.trim() || null,
        address: address.trim() || null,
        website: website.trim() || null,
      } as Partial<User>);
      setProfileUser(updated);
      setIsEditingProfileDetails(false);
      toast({ title: 'Profile details updated' });
    } catch (e: unknown) {
      toast({
        title: 'Failed to update profile details',
        description: e instanceof Error ? e.message : 'Request failed',
        variant: 'destructive'
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddPreviousProject = async () => {
    if (!user || !newPreviousProjectTitle.trim()) return;
    setSavingPreviousProject(true);
    try {
      const created = await apiRepository.createStudentPreviousProject({
        student_user_id: user.id,
        title: newPreviousProjectTitle.trim(),
        project_link: newPreviousProjectLink.trim() || null,
        description: newPreviousProjectDescription.trim() || null,
      });
      setPreviousProjects(prev => [created, ...prev]);
      setNewPreviousProjectTitle('');
      setNewPreviousProjectLink('');
      setNewPreviousProjectDescription('');
      setShowPreviousProjectForm(false);
      toast({ title: 'Previous project added' });
    } catch (e: unknown) {
      toast({
        title: 'Failed to add previous project',
        description: e instanceof Error ? e.message : 'Request failed',
        variant: 'destructive'
      });
    } finally {
      setSavingPreviousProject(false);
    }
  };

  const handleDeletePreviousProject = async (projectId: number) => {
    try {
      await apiRepository.deleteStudentPreviousProject(projectId);
      setPreviousProjects(prev => prev.filter(item => item.id !== projectId));
      toast({ title: 'Previous project removed' });
    } catch (e: unknown) {
      toast({
        title: 'Failed to remove previous project',
        description: e instanceof Error ? e.message : 'Request failed',
        variant: 'destructive'
      });
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiRepository.updateProfilePicture(formData);
      window.location.reload();
    } catch (e: unknown) {
      toast({
        title: 'Failed to update profile picture',
        description: e instanceof Error ? e.message : 'Request failed',
        variant: 'destructive'
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarUrlUpdate = async () => {
    if (!user || !avatarUrl.trim()) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('url', avatarUrl.trim());
      await apiRepository.updateProfilePicture(formData);
      window.location.reload();
    } catch (e: unknown) {
      toast({
        title: 'Failed to update profile picture',
        description: e instanceof Error ? e.message : 'Request failed',
        variant: 'destructive'
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) return null;

  const myParticipations = (participants || []).filter(p => p.user_id === user.id);
  const myProjects = myParticipations
    .map(p => {
      const proj = (projects || []).find(proj => proj.id === p.project_id);
      return proj ? { ...proj, role: p.participant_role } : null;
    })
    .filter((p): p is (Project & { role: ParticipantRole }) => p !== null);

  const myTasks = (tasks || []).filter(t => t.assignee_user_id === user.id || t.created_by === user.id);
  const recentTasks = [...myTasks]
    .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
    .slice(0, 6);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="flex gap-4 items-center"><div className="h-16 w-16 bg-muted rounded-2xl" /><div className="space-y-2"><div className="h-5 bg-muted rounded w-40" /><div className="h-4 bg-muted rounded w-24" /></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Profile Sidebar */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">

            {/* Profile Header Card */}
            <div className="relative overflow-hidden p-6 rounded-3xl border border-border bg-card shadow-sm group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

              <div className="flex flex-col items-center text-center space-y-6">
                <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="relative group rounded-3xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all hover:scale-105 active:scale-95">
                      <ProfileAvatar
                        userId={user.id}
                        name={user.full_name}
                        className="h-32 w-32 rounded-3xl bg-primary/10 ring-4 ring-background shadow-xl"
                        textClassName="text-4xl font-display font-bold text-primary"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/60 backdrop-blur-sm rounded-3xl">
                        <span className="text-sm font-semibold text-foreground">Change</span>
                      </div>
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Profile Picture</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="profile-picture">Upload Image</Label>
                        <Input
                          id="profile-picture"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAvatarUpload(file);
                          }}
                          disabled={uploadingAvatar}
                        />
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profile-url">Paste URL</Label>
                        <div className="flex gap-2">
                          <Input
                            id="profile-url"
                            type="url"
                            placeholder="https://..."
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            disabled={uploadingAvatar}
                          />
                          <Button onClick={handleAvatarUrlUpdate} disabled={uploadingAvatar || !avatarUrl.trim()}>
                            {uploadingAvatar ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="space-y-2 w-full">
                  <h1 className="text-2xl font-display font-bold text-foreground leading-tight px-2">{user.full_name}</h1>
                  <div className="flex flex-col items-center gap-3">
                    <RoleBadge role={user.role} className="px-4 py-1" />
                    <div className="flex flex-col items-center gap-1.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5 hover:text-foreground transition-colors truncate max-w-full">
                        <Mail className="h-4 w-4 shrink-0" /> {user.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col w-full gap-2 pt-2">
                  {user.role === 'STUDENT' && (
                    <Button variant="default" className="w-full rounded-xl shadow-sm" asChild>
                      <Link to="/student-cv">Manage Student CV</Link>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full rounded-xl" asChild>
                    <Link to="/settings">
                      <Settings className="h-4 w-4 mr-2" /> Settings
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Information Sidebar Section */}
            <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-6">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Information
              </h2>

              <div className="space-y-4">
                {teacher && (
                  <>
                    <div className="flex flex-col space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Department</span>
                      <span className="text-sm font-medium text-foreground">{teacher?.department}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Grade</span>
                      <span className="text-sm font-medium text-foreground">{teacher?.grade}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Experience</span>
                      <span className="text-sm font-medium text-foreground">{teacher?.experience_years} years</span>
                    </div>
                    {teacher.research_interests && (
                      <div className="flex flex-col space-y-3 pt-2 border-t border-border">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Research Interests</span>
                        <div className="flex flex-wrap gap-2">
                          {teacher?.research_interests?.split(',').filter(Boolean).map(interest => (
                            <span key={interest.trim()} className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-[11px] font-semibold border border-primary/10">
                              #{interest.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {student && student.cv_url && (
                  <div className="flex flex-col space-y-1 pt-2 border-t border-border">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">CV</span>
                    <a href={student.cv_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate">View CV</a>
                  </div>
                )}
                <div className="flex flex-col space-y-1 pt-2 border-t border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Member Since</span>
                  <span className="text-xs text-foreground font-medium">{new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Main Content Area */}
          <div className="lg:col-span-8 space-y-8">

            {user.role !== 'PARTNER' && (
              <>
                {/* Profile Details */}
                <section className="p-8 rounded-3xl border border-border bg-card shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Detailed Profile
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingProfileDetails(true)} className="text-xs h-8">
                      Edit Details
                    </Button>
                  </div>

                  {!isEditingProfileDetails ? (
                    <div className="grid sm:grid-cols-2 gap-x-12 gap-y-6">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Institution</span>
                        <p className="text-sm font-medium text-foreground">{profileUser?.institution || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Department</span>
                        <p className="text-sm font-medium text-foreground">{profileUser?.department || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Contact Email</span>
                        <p className="text-sm font-medium text-foreground">{profileUser?.contact_email || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Phone</span>
                        <p className="text-sm font-medium text-foreground">{profileUser?.phone_number || '-'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Institution</Label>
                          <Input value={institution} onChange={e => setInstitution(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Department</Label>
                          <Input value={department} onChange={e => setDepartment(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Contact Email</Label>
                          <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="Email for contact" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Phone Number</Label>
                          <Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="e.g., +213..." />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingProfileDetails(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleSaveProfileDetails} disabled={savingProfile}>
                          {savingProfile ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  )}
                </section>

                {/* About & Bio */}
                {student && (student.bio || student.experience || student.skills) && (
                  <section className="p-8 rounded-3xl border border-border bg-card shadow-sm space-y-8">
                    {student?.bio && (
                      <div>
                        <h2 className="text-lg font-display font-bold text-foreground mb-4">About</h2>
                        <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{student?.bio}</p>
                      </div>
                    )}
                    {student?.experience && (
                      <div className="pt-8 border-t border-border">
                        <h2 className="text-lg font-display font-bold text-foreground mb-4">Experience</h2>
                        <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{student?.experience}</p>
                      </div>
                    )}
                  </section>
                )}

                {/* Previous Projects */}
                <section>
                  <div className="flex items-center justify-between mb-6 px-2">
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Portfolio
                    </h2>
                    <Button variant="outline" size="sm" onClick={() => setShowPreviousProjectForm(v => !v)} className="rounded-xl border-primary/20 text-primary hover:bg-primary/5">
                      <Plus className="h-4 w-4 mr-1" /> Add Project
                    </Button>
                  </div>

                  {showPreviousProjectForm && (
                    <div className="rounded-3xl border border-border bg-card p-8 shadow-lg mb-8 animate-in fade-in slide-in-from-top-4">
                      <div className="grid gap-6">
                        <div className="space-y-2">
                          <Label>Project Title</Label>
                          <Input value={newPreviousProjectTitle} onChange={e => setNewPreviousProjectTitle(e.target.value)} placeholder="e.g., Autonomous Drone Navigation" />
                        </div>
                        <div className="space-y-2">
                          <Label>Project Link</Label>
                          <Input value={newPreviousProjectLink} onChange={e => setNewPreviousProjectLink(e.target.value)} placeholder="https://github.com/..." />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea value={newPreviousProjectDescription} onChange={e => setNewPreviousProjectDescription(e.target.value)} rows={3} placeholder="Briefly explain your role and the technologies used." />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-6">
                        <Button variant="ghost" onClick={() => setShowPreviousProjectForm(false)}>Cancel</Button>
                        <Button onClick={handleAddPreviousProject} disabled={savingPreviousProject || !newPreviousProjectTitle.trim()}>
                          {savingPreviousProject ? 'Saving...' : 'Save Project'}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4">
                    {previousProjects.map(item => (
                      <div key={item.id} className="relative group">
                        <a
                          href={item.project_link || '#'}
                          target={item.project_link ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className={cn(
                            "p-6 rounded-3xl border border-border bg-card hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all block h-full",
                            !item.project_link && "cursor-default"
                          )}
                          onClick={(e) => {
                            if (!item.project_link) e.preventDefault();
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2">
                              <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{item.title}</h3>
                              {item.project_link && (
                                <span className="text-xs text-primary font-medium inline-flex items-center gap-1.5 bg-primary/5 px-2.5 py-1 rounded-lg">
                                  <ExternalLink className="h-3 w-3" /> External Project Link
                                </span>
                              )}
                              <p className="text-sm text-muted-foreground leading-relaxed pt-2">{item.description}</p>
                            </div>
                          </div>
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive z-10 h-8 w-8"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeletePreviousProject(item.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Current Active Projects */}
            {user.role !== 'PARTNER' && (
              <section>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 px-2 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Active Involvements
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {myProjects.map(p => (
                    <Link key={p.id} to={`/projects/${p.id}`} className="group p-6 rounded-3xl border border-border bg-card hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all">
                      <div className="flex flex-col h-full space-y-6">
                        <div className="space-y-2">
                          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg line-clamp-1">{p.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">{p.role}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{p.visibility}</span>
                          </div>
                        </div>
                        <div className="mt-auto flex items-center text-xs text-muted-foreground group-hover:text-primary transition-colors">
                          View details <ChevronRight className="ml-1 h-3 w-3" />
                        </div>
                      </div>
                    </Link>
                  ))}
                  {myProjects.length === 0 && (
                    <div className="sm:col-span-2 p-12 text-center rounded-3xl border border-dashed border-border bg-muted/20">
                      <p className="text-sm text-muted-foreground italic">No active project involvements.</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Activity Timeline / Tasks */}
            {user.role !== 'STUDENT' && (
              <section>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 px-2 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Recent Activity
                </h2>
                <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden divide-y divide-border/50">
                  {recentTasks.map(task => {
                    const proj = (projects || []).find(p => p.id === task.project_id);
                    return (
                      <div key={task.id} className="p-6 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-6">
                          <div className="space-y-1.5 min-w-0">
                            <h4 className="text-sm font-bold text-foreground truncate">{task.title}</h4>
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="text-[11px] font-medium text-muted-foreground truncate">{proj?.title}</span>
                              <span className="text-[11px] text-muted-foreground/30">•</span>
                              <span className="text-[11px] text-muted-foreground whitespace-nowrap">{new Date(task.updated_at || '').toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <PriorityBadge priority={task.priority} />
                            <StatusBadge status={task.status} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {recentTasks.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground italic text-sm">
                      No recent activity recorded.
                    </div>
                  )}
                </div>
              </section>
            )}

          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
