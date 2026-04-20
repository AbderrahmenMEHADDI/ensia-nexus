import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiRepository } from '@/repositories/apiRepository';
import { RoleBadge, StatusBadge, PriorityBadge } from '@/components/Badges';
import { Link } from 'react-router-dom';
import { Mail, Calendar, Settings, Plus, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import type { Student, Teacher, Project, Task, ProjectParticipant, User, StudentPreviousProject } from '@/types';

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
        setProjects(p);
        setTasks(t);
        setParticipants(part);
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
        setProfileUser(fullUser);
        setInstitution(fullUser.institution || '');
        setDepartment(fullUser.department || '');
        setContactEmail(fullUser.contact_email || '');
        setPhoneNumber(fullUser.phone_number || '');
        setAddress(fullUser.address || '');
        setWebsite(fullUser.website || '');

        if (user.role === 'STUDENT') {
          try {
            setPreviousProjects(await apiRepository.getStudentPreviousProjects(user.id));
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

  const myParticipations = participants.filter(p => p.user_id === user.id);
  const myProjects = myParticipations
    .map(p => ({ ...projects.find(proj => proj.id === p.project_id)!, role: p.participant_role }))
    .filter(p => p.id);

  const myTasks = tasks.filter(t => t.assignee_user_id === user.id || t.created_by === user.id);
  const recentTasks = [...myTasks]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 6);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="flex gap-4 items-center"><div className="h-16 w-16 bg-muted rounded-2xl" /><div className="space-y-2"><div className="h-5 bg-muted rounded w-40" /><div className="h-4 bg-muted rounded w-24" /></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6 p-6 rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-5">
            <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
              <DialogTrigger asChild>
                <button className="relative group rounded-2xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  <ProfileAvatar
                    userId={user.id}
                    name={user.full_name}
                    className="h-20 w-20 rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-inner"
                    textClassName="text-2xl font-display font-bold text-primary"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 rounded-2xl">
                    <span className="text-xs font-semibold text-white">Edit</span>
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
            <div className="space-y-1">
              <h1 className="text-2xl font-display font-bold text-foreground leading-tight">{user.full_name}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <RoleBadge role={user.role} />
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.role === 'STUDENT' && (
              <Link to="/student-cv">
                <Button variant="default" size="sm" className="gap-1.5">
                  Create CV
                </Button>
              </Link>
            )}
            <Link to="/settings">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Settings className="h-3.5 w-3.5" /> Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Info */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Details</h2>
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            {teacher && (
              <>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Department</span><span className="text-foreground">{teacher.department}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Grade</span><span className="text-foreground">{teacher.grade}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Experience</span><span className="text-foreground">{teacher.experience_years} years</span></div>
                <div className="pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground block mb-2">Research Interests</span>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.research_interests.split(', ').map(interest => (
                      <span key={interest} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{interest}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
            {student && (
              <>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">University</span><span className="text-foreground">{student.university}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Level</span><span className="text-foreground">{student.level}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Major</span><span className="text-foreground">{student.major}</span></div>
                {student.cv_url && (
                  <div className="flex justify-between text-sm gap-3">
                    <span className="text-muted-foreground">CV</span>
                    <a className="text-primary hover:underline truncate" href={student.cv_url} target="_blank" rel="noreferrer">{student.cv_url}</a>
                  </div>
                )}
                {student.research_interests && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Research Interests</span>
                    <p className="text-sm text-foreground/90">{student.research_interests}</p>
                  </div>
                )}
                {student.experience && (
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Experience</span>
                    <p className="text-sm text-foreground/90">{student.experience}</p>
                  </div>
                )}
                {student.skills && (
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Skills</span>
                    <p className="text-sm text-foreground/90">{student.skills}</p>
                  </div>
                )}
                {student.bio && (
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Description</span>
                    <p className="text-sm text-foreground/90">{student.bio}</p>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Joined</span><span className="text-foreground">{user.created_at}</span></div>
          </div>
        </section>

        {/* Projects */}
        {user.role === 'STUDENT' && (
          <section className="mb-10">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Profile Details</h2>
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              {!isEditingProfileDetails ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Institution</p>
                      <p className="text-foreground">{profileUser?.institution || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Department</p>
                      <p className="text-foreground">{profileUser?.department || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Contact Email</p>
                      <p className="text-foreground">{profileUser?.contact_email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
                      <p className="text-foreground">{profileUser?.phone_number || '-'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Website</p>
                      <p className="text-foreground">{profileUser?.website || '-'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Address</p>
                      <p className="text-foreground">{profileUser?.address || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <Button onClick={() => setIsEditingProfileDetails(true)}>Update</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Institution</Label>
                      <Input value={institution} onChange={e => setInstitution(e.target.value)} placeholder="Institution" />
                    </div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="Department" />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Email</Label>
                      <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="Contact email" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="Phone number" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Website</Label>
                      <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Address</Label>
                      <Textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} placeholder="Address" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">These details are separate from Student CV forms.</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditingProfileDetails(false);
                          setInstitution(profileUser?.institution || '');
                          setDepartment(profileUser?.department || '');
                          setContactEmail(profileUser?.contact_email || '');
                          setPhoneNumber(profileUser?.phone_number || '');
                          setAddress(profileUser?.address || '');
                          setWebsite(profileUser?.website || '');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfileDetails} disabled={savingProfile}>
                        {savingProfile ? 'Saving...' : 'Save Details'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {user.role === 'STUDENT' && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Previous Projects</h2>
              <Button size="sm" onClick={() => setShowPreviousProjectForm(v => !v)}>
                <Plus className="h-4 w-4 mr-1" />
                {showPreviousProjectForm ? 'Close' : 'Add Project'}
              </Button>
            </div>

            {showPreviousProjectForm && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-4 mb-4">
                <div className="space-y-2">
                  <Label>Project Title</Label>
                  <Input
                    value={newPreviousProjectTitle}
                    onChange={e => setNewPreviousProjectTitle(e.target.value)}
                    placeholder="My previous AI project"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project Link</Label>
                  <Input
                    value={newPreviousProjectLink}
                    onChange={e => setNewPreviousProjectLink(e.target.value)}
                    placeholder="https://github.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newPreviousProjectDescription}
                    onChange={e => setNewPreviousProjectDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe what you did in this project"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleAddPreviousProject} disabled={savingPreviousProject || !newPreviousProjectTitle.trim()}>
                    {savingPreviousProject ? 'Saving...' : 'Save Project'}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {previousProjects.map(item => (
                <div key={item.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                      {item.project_link && (
                        <a
                          href={item.project_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                        >
                          Open project link <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeletePreviousProject(item.id)}
                      aria-label="Delete previous project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {previousProjects.length === 0 && (
                <p className="text-sm text-muted-foreground">No previous projects yet. Add one to show it on your profile.</p>
              )}
            </div>
          </section>
        )}

        {user.role !== 'STUDENT' && (
          <>
            {/* Projects */}
            <section className="mb-10">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Projects</h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {myProjects.map(p => (
                  <Link key={p.id} to={`/projects/${p.id}`} className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                    <h3 className="text-sm font-medium text-foreground mb-1">{p.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="text-primary">{p.role}</span>
                      <span>·</span>
                      <span>{p.visibility}</span>
                    </div>
                  </Link>
                ))}
                {myProjects.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
              </div>
            </section>

            {/* Recent Tasks */}
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Recent Tasks</h2>
              <div className="space-y-2">
                {recentTasks.map(task => {
                  const proj = projects.find(p => p.id === task.project_id);
                  return (
                    <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl border border-border bg-card">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground block truncate">{task.title}</span>
                        <span className="text-xs text-muted-foreground">{proj?.title}</span>
                      </div>
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                      {task.due_date && (
                        <span className="text-xs font-mono text-muted-foreground hidden sm:flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {task.due_date}
                        </span>
                      )}
                    </div>
                  );
                })}
                {recentTasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks found.</p>}
              </div>
            </section>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;
