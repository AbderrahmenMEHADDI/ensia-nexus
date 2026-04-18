import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { apiRepository } from '@/repositories/apiRepository';
import { RoleBadge } from '@/components/Badges';
import { Loader2, Mail, FileText, Link as LinkIcon } from 'lucide-react';
import type { User, Student, StudentCVEntry, StudentPreviousProject } from '@/types';

interface StudentProfileModalProps {
  user: User | null;
  onClose: () => void;
}

export const StudentProfileModal = ({ user, onClose }: StudentProfileModalProps) => {
  const [profile, setProfile] = useState<Student | null>(null);
  const [cvs, setCvs] = useState<StudentCVEntry[]>([]);
  const [projects, setProjects] = useState<StudentPreviousProject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setCvs([]);
      setProjects([]);
      return;
    }
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [profileData, cvsData, projectsData] = await Promise.all([
          apiRepository.getStudentProfile(user.id).catch(() => null),
          apiRepository.getStudentCVs(user.id).catch(() => []),
          apiRepository.getStudentPreviousProjects(user.id).catch(() => []),
        ]);
        setProfile(profileData);
        setCvs(cvsData);
        setProjects(projectsData);
      } catch (e) {
        console.error("Error fetching student profile data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [user]);

  return (
    <Dialog open={!!user} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            {user?.full_name}
            {user && <RoleBadge role={user.role} />}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 mt-1">
            <Mail className="h-4 w-4" /> {user?.email}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : profile ? (
          <div className="space-y-6 mt-4">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Academic Background</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">University</span>
                  <p className="font-medium">{profile.university || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">Level</span>
                  <p className="font-medium">{profile.level || 'Not specified'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-xs mb-1">Major</span>
                  <p className="font-medium">{profile.major || 'Not specified'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-xs mb-1">Bio</span>
                  <p className="text-foreground/80 leading-relaxed">{profile.bio || 'No bio provided.'}</p>
                </div>
              </div>
            </section>

            {(profile.skills || profile.research_interests) && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Skills & Interests</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  {profile.skills && (
                    <div>
                      <span className="text-muted-foreground block text-xs mb-2">Skills</span>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.skills.split(',').filter(Boolean).map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[11px] font-medium border border-border shadow-sm">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.research_interests && (
                    <div>
                      <span className="text-muted-foreground block text-xs mb-2">Research Interests</span>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.research_interests.split(',').filter(Boolean).map((interest, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[11px] font-medium shadow-sm">
                            {interest.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {profile.experience && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Experience</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{profile.experience}</p>
              </section>
            )}

            {(profile.cv_url || cvs.length > 0) && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Curriculum Vitae</h3>
                <div className="grid gap-2">
                  {profile.cv_url && (
                    <a
                      href={profile.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Primary CV (Profile Link)</p>
                        <p className="text-xs text-muted-foreground">Original Document</p>
                      </div>
                    </a>
                  )}
                  {cvs.map(cv => (
                    <a
                      key={cv.id}
                      href={cv.cv_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{cv.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded {new Date(cv.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {projects.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Previous Projects</h3>
                <div className="grid gap-3">
                  {projects.map(proj => (
                    <div key={proj.id} className="p-3 rounded-lg border border-border bg-card">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium">{proj.title}</h4>
                        {proj.project_link && (
                          <a href={proj.project_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium text-xs flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" /> View Project
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-foreground/80 mt-2 whitespace-pre-wrap">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>No detailed profile information found for this user.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
