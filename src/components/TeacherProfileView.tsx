import React from 'react';
import { 
  User, 
  Teacher, 
  Publication, 
  Project 
} from '@/types';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  Mail, 
  MapPin, 
  ExternalLink, 
  Globe, 
  Linkedin, 
  Sparkles, 
  FileText, 
  Building2, 
  Edit3, 
  CheckCircle2, 
  Award,
  BookOpen
} from 'lucide-react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { GoogleScholarIcon } from '@/components/shared/GoogleScholarIcon';
import { AisiLogo } from '@/components/shared/AisiLogo';

interface TeacherProfileViewProps {
  user: User;
  teacher: Teacher | null;
  publications?: Publication[];
  projects?: Project[];
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
  onOpenAvatarDialog?: () => void;
}

export const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({
  user,
  teacher,
  publications = [],
  projects = [],
  isOwnProfile = false,
  onEditProfile,
  onOpenAvatarDialog,
}) => {
  const formatGrade = (rawGrade?: string) => {
    if (!rawGrade) return 'AISI Researcher';
    return rawGrade.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  const teachingModulesList = teacher?.teaching_modules
    ? teacher.teaching_modules.split(',').map(m => m.trim()).filter(Boolean)
    : [];

  const researchInterestsList = teacher?.research_interests
    ? teacher.research_interests.split(',').map(i => i.trim()).filter(Boolean)
    : [];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* ── AISI TEAM FACULTY CARD WITH LOGO ORANGE ACCENTS ────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6 relative">
        
        {/* Top Accent Bar in Solid Navy Blue */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#003d7a]" />

        {/* Header Block: Avatar, Name, Title & Links */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left pb-6 border-b border-slate-100 dark:border-slate-800 pt-1">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Circular Profile Avatar */}
            <div className="relative group shrink-0">
              <ProfileAvatar
                userId={user.id}
                imageUrl={user.profile_picture_url}
                name={user.full_name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-slate-50 dark:border-slate-800 shadow-sm bg-slate-100 text-3xl font-bold text-[#003d7a]"
              />
              {isOwnProfile && onOpenAvatarDialog && (
                <button
                  onClick={onOpenAvatarDialog}
                  className="absolute bottom-0 right-0 p-1.5 bg-[#ff6b35] text-white rounded-full shadow-sm hover:bg-[#e55a24] transition-colors"
                  title="Change Avatar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Name & Academic Info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {/* Academic Rank Pill with Orange Logo Accent */}
                <span className="px-3 py-1 bg-[#ff6b35]/10 text-[#ff6b35] dark:text-[#ff6b35] font-bold text-xs rounded-full border border-[#ff6b35]/20">
                  {formatGrade(teacher?.grade)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                  <AisiLogo className="w-3.5 h-3.5" />
                  AISI Team
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#003d7a] dark:text-white leading-tight">
                {user.full_name}
              </h1>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-slate-500">
                {(user.department || teacher?.department) && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#003d7a]" />
                    {user.department || teacher?.department}
                  </span>
                )}
                {user.institution && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {user.institution}
                  </span>
                )}
                {user.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <a href={`mailto:${user.email}`} className="text-[#2E9FDA] hover:text-[#003d7a] font-semibold transition-colors">
                      {user.email}
                    </a>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action / Social Buttons */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 shrink-0">
            {teacher?.google_scholar && (
              <a
                href={teacher.google_scholar}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <GoogleScholarIcon className="w-3.5 h-3.5 text-[#4285F4]" />
                Google Scholar
              </a>
            )}
            {teacher?.linkedin && (
              <a
                href={teacher.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                LinkedIn
              </a>
            )}
            <a
              href="https://www.linkedin.com/company/aisi-research-team"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-xs font-semibold text-[#ff6b35] flex items-center gap-1.5 transition-colors border border-orange-100"
            >
              <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
              AISI LinkedIn
            </a>

            {isOwnProfile && onEditProfile && (
              <Button
                onClick={onEditProfile}
                size="sm"
                className="h-9 px-4 rounded-xl bg-[#ff6b35] hover:bg-[#e55a24] text-white font-semibold text-xs shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Minimal Content Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Biography & Research Focus */}
          <div className="space-y-5">
            {/* Biography with Left Orange Accent Border */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#003d7a]" /> Biography
              </h3>
              {teacher?.bio ? (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border-l-4 border-l-[#ff6b35] border border-slate-100 dark:border-slate-800">
                  {teacher.bio}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50/50 p-3 rounded-xl">No biography details provided.</p>
              )}
            </div>

            {/* Research Focus with Orange Highlight Pills */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff6b35]" /> Research Focus
              </h3>
              {researchInterestsList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {researchInterestsList.map(interest => (
                    <span
                      key={interest}
                      className="px-3 py-1.5 rounded-xl bg-orange-50/80 dark:bg-slate-800 text-[#ff6b35] dark:text-orange-300 text-xs font-semibold border border-orange-100 dark:border-slate-700"
                    >
                      #{interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50/50 p-3 rounded-xl">No research focus specified.</p>
              )}
            </div>
          </div>

          {/* Right Column: Teaching Modules & Latest Publications */}
          <div className="space-y-5">
            {/* Teaching Modules */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#003d7a]" /> Teaching Modules
              </h3>
              {teachingModulesList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {teachingModulesList.map(module => (
                    <span
                      key={module}
                      className="px-3 py-1.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 text-[#003d7a] dark:text-blue-300 text-xs font-medium border border-blue-100/60 dark:border-blue-900/50"
                    >
                      {module}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50/50 p-3 rounded-xl">No teaching modules listed.</p>
              )}
            </div>

            {/* Recent Publications */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#003d7a]" /> Recent Publications ({publications.length})
              </h3>
              {publications.length > 0 ? (
                <div className="space-y-3">
                  {publications.slice(0, 3).map(pub => {
                    const formatExternalUrl = (url?: string, doi?: string) => {
                      let raw = url?.trim();
                      if (!raw && doi) {
                        raw = doi.trim().startsWith('http') ? doi.trim() : `https://doi.org/${doi.trim()}`;
                      }
                      if (!raw) return undefined;
                      if (raw.startsWith('http://') || raw.startsWith('https://')) {
                        return raw;
                      }
                      return `https://${raw}`;
                    };

                    const pubLink = formatExternalUrl(pub.paper_url, pub.doi);
                    const pubYear = pub.publication_date ? new Date(pub.publication_date).getFullYear() : null;
                    const authorNames = pub.authors?.map(a => a.user?.full_name || (a as any).full_name).filter(Boolean).join(', ') || 'AISI Faculty';
                    const linkedProject = projects.find(p => Number(p.id) === Number(pub.project_id));
                    const venueText = pub.venue || 'Journal / Conference';

                    return (
                      <div
                        key={pub.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-[#003d7a] dark:text-blue-300 leading-snug line-clamp-2">
                            {pub.title}
                          </h4>
                          {pubLink && (
                            <a
                              href={pubLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-[#2E9FDA] hover:text-[#003d7a] shrink-0 inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900/40 transition-colors"
                            >
                              Paper Link <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {venueText} {pubYear ? `(${pubYear})` : ''}
                          </span>
                          {linkedProject && (
                            <span className="px-2 py-0.5 rounded bg-orange-50 text-[#ff6b35] font-semibold text-[10px] border border-orange-100">
                              Project: {linkedProject.title}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 italic whitespace-normal leading-relaxed">
                          Authors: {authorNames}
                        </p>

                        {pub.abstract && (
                          <div className="space-y-1 pt-1">
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border-l-2 border-l-[#ff6b35] text-[11px] line-clamp-3 italic">
                              "{pub.abstract}"
                            </p>
                            {pub.abstract.length > 120 && (
                              <div className="flex justify-end">
                                <HoverCard openDelay={100} closeDelay={150}>
                                  <HoverCardTrigger asChild>
                                    <button className="text-[10px] font-bold text-[#2E9FDA] hover:text-[#003d7a] hover:underline cursor-pointer inline-flex items-center gap-0.5 transition-colors">
                                      Show more &rarr;
                                    </button>
                                  </HoverCardTrigger>
                                  <HoverCardContent
                                    side="bottom"
                                    align="end"
                                    sideOffset={8}
                                    collisionPadding={16}
                                    className="w-[calc(100vw-32px)] sm:w-[480px] md:w-[520px] max-w-[92vw] p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 space-y-3"
                                  >
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#003d7a] dark:text-blue-300">
                                        <FileText className="w-3.5 h-3.5 text-[#ff6b35]" /> Full Abstract
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-mono uppercase">Publication Abstract</span>
                                    </div>
                                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed italic font-sans whitespace-pre-wrap max-h-64 sm:max-h-80 overflow-y-auto">
                                      "{pub.abstract}"
                                    </p>
                                  </HoverCardContent>
                                </HoverCard>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50/50 p-3 rounded-xl">No public scientific output listed.</p>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
