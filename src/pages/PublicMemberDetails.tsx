import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiRepository } from '@/repositories/apiRepository';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { User, Teacher, Student, Publication } from '@/types';
import { ArrowLeft, BookOpen, GraduationCap, Briefcase, Mail, MapPin, ExternalLink, Globe, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicationCard } from '@/components/shared/PublicationCard';
import { TeacherProfileView } from '@/components/TeacherProfileView';
import { GoogleScholarIcon } from '@/components/shared/GoogleScholarIcon';

export default function PublicMemberDetails() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [publications, setPublications] = useState<Publication[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!memberId) return;
      try {
        setLoading(true);
        const userData = await apiRepository.getPublicUser(Number(memberId));
        setUser(userData);

        if (userData.role === 'TEACHER') {
          const teacherData = await apiRepository.getTeacherProfile(Number(memberId));
          setTeacher(teacherData);
          try {
            const publicationsData = await apiRepository.getPublications({ user_id: Number(memberId), limit: 3 });
            setPublications(publicationsData);
          } catch (pubErr) {
            console.error('Failed to load publications', pubErr);
          }
        } else if (userData.role === 'STUDENT') {
          const studentData = await apiRepository.getStudentProfile(Number(memberId));
          setStudent(studentData);
        }
      } catch (err: any) {
        // Just show basic user info if teacher/student details fetch fails
        if (!user) {
          setError(err.message || 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [memberId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24">
        <Skeleton className="h-32 w-full rounded-2xl mb-8" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
        <Button asChild variant="outline">
          <Link to="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-4 md:pt-6 pb-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-3">
        <Button variant="ghost" onClick={() => navigate(-1)} className="h-8 hover:bg-transparent pl-0 text-slate-500 hover:text-slate-900 text-xs">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back
        </Button>

        {user.role === 'TEACHER' ? (
          <TeacherProfileView
            user={user}
            teacher={teacher}
            publications={publications}
            isOwnProfile={false}
          />
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-[#173C7E] to-blue-600"></div>

            <div className="px-8 pb-8 relative">
              <div className="flex justify-between items-end -mt-16 mb-6">
                <ProfileAvatar
                  userId={user.id}
                  imageUrl={user.profile_picture_url}
                  name={user.full_name}
                  className="w-32 h-32 rounded-full border-4 border-white bg-white text-3xl shadow-md"
                />
                <span className="px-4 py-1.5 bg-blue-50 text-blue-700 font-bold text-sm rounded-full capitalize">
                  {user.role.toLowerCase()}
                </span>
              </div>

            <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">{user.full_name}</h1>

            <div className="flex flex-wrap gap-4 text-slate-500 text-sm mb-8">
              {user.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${user.email}`} className="hover:text-[#173C7E] transition-colors">{user.email}</a>
                </div>
              )}
              {(user.department || teacher?.department) && (
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  {user.department || teacher?.department}
                </div>
              )}
              {(user.institution || student?.university) && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {user.institution || student?.university}
                </div>
              )}
            </div>

            <div className="space-y-8">
              {teacher && (
                <>
                  {teacher.grade && (
                    <section>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
                        <GraduationCap className="h-5 w-5 text-[#173C7E]" /> Academic Grade
                      </h3>
                      <p className="text-slate-600 capitalize bg-slate-50 p-4 rounded-xl border border-slate-100">{teacher.grade.replace('_', ' ').toLowerCase()}</p>
                    </section>
                  )}
                  {teacher.bio && (
                    <section>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
                        <Briefcase className="h-5 w-5 text-[#173C7E]" /> Biography
                      </h3>
                      <p className="text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                        {teacher.bio}
                      </p>
                    </section>
                  )}
                  {teacher.research_interests && (
                    <section>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
                        <BookOpen className="h-5 w-5 text-[#173C7E]" /> Research Interests
                      </h3>
                      <p className="text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                        {teacher.research_interests}
                      </p>
                    </section>
                  )}
                  {teacher.teaching_modules && (
                    <section>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
                        <BookOpen className="h-5 w-5 text-[#173C7E]" /> Teaching Modules
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {teacher.teaching_modules.split(',').filter(Boolean).map(mod => (
                          <span key={mod.trim()} className="px-3 py-1.5 bg-slate-50 text-slate-600 text-sm font-semibold rounded-lg border border-slate-100">
                            {mod.trim()}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}
                  <section>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
                      <Globe className="h-5 w-5 text-[#173C7E]" /> Professional Links
                    </h3>
                    <div className="flex flex-wrap gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {teacher.google_scholar && (
                        <a href={teacher.google_scholar} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#173C7E] hover:underline">
                          <GoogleScholarIcon className="h-4 w-4 text-[#4285F4]" /> Google Scholar
                        </a>
                      )}
                      {teacher.linkedin && (  
                        <a href={teacher.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#173C7E] hover:underline">
                          <Linkedin className="h-4 w-4" /> Personal LinkedIn
                        </a>
                      )}
                      <a href="https://www.linkedin.com/company/aisi-research-team" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F47A1E] hover:underline">
                        <Linkedin className="h-4 w-4" /> AISI Research Team LinkedIn
                      </a>
                    </div>
                  </section>
                  <section>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
                      <BookOpen className="h-5 w-5 text-[#173C7E]" /> Latest Publications
                    </h3>
                    <div className="grid gap-4">
                      {publications.map(pub => (
                        <PublicationCard key={pub.id} publication={pub} />
                      ))}
                      {publications.length === 0 && (
                        <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-100">No publications listed.</p>
                      )}
                    </div>
                  </section>
                </>
              )}

              {student && (
                <>
                  {(student.major || student.level) && (
                    <section>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
                        <GraduationCap className="h-5 w-5 text-[#173C7E]" /> Education
                      </h3>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        {student.level && <div className="font-medium text-slate-900 mb-1">{student.level}</div>}
                        {student.major && <div className="text-slate-600">{student.major}</div>}
                      </div>
                    </section>
                  )}
                  {student.bio && (
                    <section>
                      <h3 className="text-lg font-bold text-slate-900 mb-3">About</h3>
                      <p className="text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">{student.bio}</p>
                    </section>
                  )}
                  {student.research_interests && (
                    <section>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
                        <BookOpen className="h-5 w-5 text-[#173C7E]" /> Interests
                      </h3>
                      <p className="text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">{student.research_interests}</p>
                    </section>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
