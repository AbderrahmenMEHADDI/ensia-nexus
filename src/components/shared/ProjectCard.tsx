import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Clock, ArrowRight, CheckCircle2, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ProjectCardProps {
  project: {
    id: number;
    title: string;
    description?: string;
    group_id?: number | null;
    group_name?: string | null;
    team_name?: string | null;
    group?: { name: string } | null;
    is_active?: boolean;
    accepting_collaborators?: boolean;
    landing_page_order?: number;
    deadline?: string | Date | null;
    participants?: any[] | null;
    participant_count?: number;
    focus_areas?: string;
  };
  to?: string;
  callId?: number | null;
  applied?: boolean;
  onApply?: (callId: number) => void;
  leftAccent?: 'orange' | 'blue' | 'none';
  hideTags?: boolean;
  className?: string;
  showFeaturedAccent?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  to,
  callId,
  applied,
  onApply,
  className,
  leftAccent = 'none',
  hideTags = false,
  showFeaturedAccent = true,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Extract variables
  const isFeatured = (project.landing_page_order ?? 0) > 0;
  const isActive = project.is_active ?? true;
  const isOpen = (project.accepting_collaborators ?? false) && isActive;
  const groupName = project.group?.name || project.group_name || project.team_name;

  // Participant count logic
  const participantCount = Array.isArray(project.participants)
    ? project.participants.length
    : (project.participant_count ?? 0);

  // Deadline formatting logic
  let deadlineText = '';
  let isNearDeadline = false; // < 30 days
  let isTealWarning = false;   // < 7 days

  if (project.deadline) {
    const deadlineDate = new Date(project.deadline);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays < 30) {
      isNearDeadline = true;
      if (diffDays === 0) {
        deadlineText = 'Closes today';
      } else {
        deadlineText = `Closes in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
      }
      if (diffDays < 7) {
        isTealWarning = true;
      }
    } else {
      const month = deadlineDate.toLocaleDateString('en-US', { month: 'short' });
      const year = deadlineDate.getFullYear();
      deadlineText = `Ends ${month} ${year}`;
    }
  }

  // Handle card click
  const handleCardClick = (e: React.MouseEvent) => {
    // If the click is on an interactive element (like CTA button), don't trigger card navigation
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || window.getSelection()?.toString()) {
      return;
    }
    if (to) {
      navigate(to);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group/card relative flex flex-col p-6 rounded-2xl border transition-all duration-300 ease-out cursor-pointer',
        'bg-white border-[#E3E7EE] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)]',
        'hover:shadow-[0_12px_30px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 hover:scale-[1.015]',
        leftAccent === 'orange' && 'border-l-[5px] border-l-[#F47A1E]',
        leftAccent === 'blue' && 'border-l-[5px] border-l-[#173C7E]',
        leftAccent === 'none' && isFeatured && showFeaturedAccent && 'border-l-[5px] border-l-[#F47A1E] bg-[#F47A1E]/10',
        to ? 'active:scale-[0.99]' : '',
        className
      )}
    >
      {/* Top Row: status badges */}
      {!hideTags && (
        <div className="flex flex-wrap gap-2 mb-4">
          {isFeatured && (
            <Badge
              className="bg-[#F47A1E] text-white hover:bg-[#F47A1E] border-none text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5"
            >
              Featured
            </Badge>
          )}
          
          {isActive ? (
            <Badge
              className="bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-50 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5"
            >
              Active
            </Badge>
          ) : (
            <Badge
              className="bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-100 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5"
            >
              Finished
            </Badge>
          )}

          {isOpen && (
            <Badge
              className="bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-50 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5"
            >
              Open
            </Badge>
          )}
        </div>
      )}

      {/* Title */}
      <h4 className="font-display font-bold text-lg md:text-xl text-[#0E1B2E] mb-2 leading-snug group-hover/card:text-[#173C7E] transition-colors">
        {project.title}
      </h4>

      {/* Description */}
      <div className="relative">
        <p className={cn("text-sm text-[#5E6B7C] leading-relaxed mb-1", !isExpanded && "line-clamp-2")}>
          {project.description || 'A collaborative research initiative focusing on advanced methodologies.'}
        </p>
        {project.description && project.description.length > 100 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-xs font-semibold text-[#173C7E] hover:text-[#F47A1E] transition-colors flex items-center gap-0.5 mt-1 mb-3"
          >
            <span>{isExpanded ? 'Show less' : 'Read more'}</span>
            {isExpanded ? (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Group affiliation */}
      {project.group_id && groupName && (
        <p className="text-xs text-[#5E6B7C] mb-5 font-medium flex items-center gap-1">
          <span className="text-[#94A3B8]">Part of:</span>
          <span className="text-[#173C7E] font-semibold">{groupName}</span>
        </p>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Divider */}
      <div className="border-t border-[#E3E7EE] my-4" />

      {/* Footer: Metadata & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Metadata section */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#5E6B7C] font-medium min-w-0 flex-1">
          {project.focus_areas ? (
            <div className="flex flex-wrap gap-1 items-center min-w-0">
              {project.focus_areas.split(',').map((tag) => {
                const trimmed = tag.trim();
                if (!trimmed) return null;
                return (
                  <span
                    key={trimmed}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#173C7E]/5 text-[#173C7E] border border-[#173C7E]/10"
                  >
                    {trimmed}
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 italic font-normal">No focus areas</span>
          )}

          {deadlineText && (
            <>
              <span className="text-[#CBD5E1] hidden sm:inline">│</span>
              <span
                className={cn(
                  'flex items-center gap-1 shrink-0',
                  isTealWarning
                    ? 'text-[#0d9488] font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-100'
                    : isNearDeadline
                    ? 'text-[#0d9488] font-semibold'
                    : 'text-[#5E6B7C]'
                )}
              >
                {isTealWarning || isNearDeadline ? (
                  <Clock className="h-3.5 w-3.5 text-[#0d9488]" />
                ) : (
                  <Calendar className="h-3.5 w-3.5 text-[#94A3B8]" />
                )}
                <span>{deadlineText}</span>
              </span>
            </>
          )}
        </div>

        {/* CTA section */}
        <div className="flex items-center justify-end self-end sm:self-auto shrink-0">
          {isOpen && callId && onApply ? (
            applied ? (
              <button
                disabled
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Applied
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApply(callId);
                }}
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold text-white bg-[#F47A1E] hover:bg-[#dd6c14] transition-all duration-200 group/btn shadow-sm"
              >
                <Send className="h-3 w-3 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                <span>Join</span>
              </button>
            )
          ) : (
            <div
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#173C7E] group-hover/card:text-[#F47A1E] transition-colors duration-200 group/btn"
            >
              <span>View Project</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/card:translate-x-1" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
