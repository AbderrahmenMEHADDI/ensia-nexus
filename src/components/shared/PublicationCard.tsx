import React, { useState } from 'react';
import { ExternalLink, Quote, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface PublicationCardProps {
  publication: {
    id: number;
    title: string;
    abstract?: string;
    publication_date?: string | Date;
    year?: number | string;
    venue?: string;
    journal?: string;
    doi?: string;
    paper_url?: string;
    citation_count?: number;
    authors?: any[] | null;
  };
  className?: string;
}

export const PublicationCard: React.FC<PublicationCardProps> = ({
  publication,
  className,
}) => {
  const [citationOpen, setCitationOpen] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Extract date and metadata
  const pubYear = publication.publication_date
    ? new Date(publication.publication_date).getFullYear()
    : publication.year || '';

  const venueName = publication.venue || publication.journal || 'Academic Repository';

  const metaText = [pubYear, venueName].filter(Boolean).join(' • ');

  // Extract author names (last names)
  let authorsText = '';
  if (publication.authors && Array.isArray(publication.authors)) {
    const sorted = [...publication.authors].sort(
      (a, b) => (a.author_order ?? 0) - (b.author_order ?? 0)
    );
    const names = sorted
      .map((a) => {
        const name = a.user?.full_name || a.full_name || '';
        if (!name) return '';
        const parts = name.trim().split(/\s+/);
        return parts[parts.length - 1]; // last name
      })
      .filter(Boolean);
    
    if (names.length > 0) {
      authorsText = names.join(', ');
    }
  }

  // APA citation formatting
  const getAPACitation = () => {
    const yearPart = pubYear ? ` (${pubYear})` : '';
    const titlePart = publication.title ? ` ${publication.title}.` : '';
    const venuePart = publication.venue || publication.journal ? ` *${publication.venue || publication.journal}*.` : '';
    
    let authorsPart = 'Unknown Authors';
    if (publication.authors && publication.authors.length > 0) {
      const formatted = [...publication.authors]
        .sort((a, b) => (a.author_order ?? 0) - (b.author_order ?? 0))
        .map((a) => {
          const name = a.user?.full_name || a.full_name || 'Author';
          const parts = name.trim().split(/\s+/);
          const lastName = parts[parts.length - 1];
          const firstName = parts[0];
          const initial = firstName ? `${firstName[0]}.` : '';
          return `${lastName}, ${initial}`;
        });
      
      if (formatted.length === 1) {
        authorsPart = formatted[0];
      } else if (formatted.length > 1) {
        const last = formatted.pop();
        authorsPart = `${formatted.join(', ')} & ${last}`;
      }
    }
    
    return `${authorsPart}${yearPart}.${titlePart}${venuePart}`;
  };

  // BibTeX citation formatting
  const getBibTeXCitation = () => {
    const authorNames = publication.authors && publication.authors.length > 0
      ? [...publication.authors]
          .sort((a, b) => (a.author_order ?? 0) - (b.author_order ?? 0))
          .map((a) => a.user?.full_name || a.full_name || 'Author')
          .join(' and ')
      : 'Unknown Author';
    
    const firstAuthor = publication.authors?.[0]?.user?.full_name || publication.authors?.[0]?.full_name || 'key';
    const firstAuthorLastName = firstAuthor.trim().split(/\s+/).pop()?.toLowerCase() || 'key';
    const firstWordTitle = publication.title?.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'pub';
    const citeKey = `${firstAuthorLastName}${pubYear || 'year'}${firstWordTitle}`;

    return `@article{${citeKey},
  author = {${authorNames}},
  title = {${publication.title}},
  journal = {${venueName}},
  year = {${pubYear || '2026'}}${publication.paper_url ? `,\n  url = {${publication.paper_url}}` : ''}${publication.doi ? `,\n  doi = {${publication.doi}}` : ''}
}`;
  };

  // Chicago citation formatting
  const getChicagoCitation = () => {
    let authorsPart = 'Unknown Authors';
    if (publication.authors && publication.authors.length > 0) {
      const formatted = [...publication.authors]
        .sort((a, b) => (a.author_order ?? 0) - (b.author_order ?? 0))
        .map((a) => a.user?.full_name || a.full_name || 'Author');
      
      if (formatted.length === 1) {
        authorsPart = formatted[0];
      } else if (formatted.length === 2) {
        authorsPart = `${formatted[0]} and ${formatted[1]}`;
      } else {
        const last = formatted.pop();
        authorsPart = `${formatted.join(', ')}, and ${last}`;
      }
    }
    const yearStr = pubYear ? ` (${pubYear})` : '';
    return `${authorsPart}. "${publication.title}." *${venueName}*${yearStr}.`;
  };

  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div
      className={cn(
        'group p-5 bg-white rounded-2xl border border-[#E3E7EE]',
        'shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] transition-all duration-300',
        'hover:shadow-[0_12px_35px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-1 hover:scale-[1.01]',
        className
      )}
    >
      {/* Top Row: Type Badge + Metadata */}
      <div className="flex flex-wrap items-center gap-3 mb-3 text-xs">
        <Badge
          className="bg-[#173C7E]/10 text-[#173C7E] border border-[#173C7E]/20 hover:bg-[#173C7E]/15 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
        >
          Paper
        </Badge>
        {metaText && (
          <span className="text-[#5E6B7C] font-semibold tracking-wide">
            {metaText}
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="font-display font-bold text-base md:text-lg text-[#0E1B2E] mb-2 leading-snug group-hover:text-[#173C7E] transition-colors line-clamp-2">
        {publication.title}
      </h4>

      {/* Authors list */}
      {authorsText && (
        <p className="text-xs text-[#5E6B7C] mb-4 font-medium italic">
          Authors: {authorsText}
        </p>
      )}

      {/* Divider */}
      <div className="border-t border-[#E3E7EE] my-3.5" />

      {/* Dual CTAs */}
      <div className="flex items-center gap-4">
        {publication.paper_url ? (
          <a
            href={publication.paper_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#173C7E] hover:text-[#F47A1E] transition-colors"
          >
            Read Paper <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="text-xs text-[#CBD5E1] cursor-not-allowed">
            No Link Available
          </span>
        )}

        <button
          onClick={() => setCitationOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F47A1E] hover:text-[#dd6c14] transition-colors"
        >
          Cite <Quote className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Citation Modal */}
      <Dialog open={citationOpen} onOpenChange={setCitationOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border border-[#E3E7EE] p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold text-[#173C7E] flex items-center gap-2">
              <Quote className="h-5 w-5 text-[#F47A1E]" /> Cite Publication
            </DialogTitle>
            <DialogDescription className="text-sm text-[#5E6B7C] font-medium pt-1">
              Select a format to copy the citation to your clipboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* APA Format */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider font-bold text-[#173C7E]">APA Style</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 rounded-full text-xs font-semibold hover:bg-slate-100 text-[#F47A1E]"
                  onClick={() => copyToClipboard(getAPACitation(), 'APA')}
                >
                  {copiedFormat === 'APA' ? (
                    <span className="flex items-center gap-1 text-emerald-600"><Check className="h-3.5 w-3.5" /> Copied!</span>
                  ) : (
                    <span className="flex items-center gap-1"><Copy className="h-3.5 w-3.5" /> Copy</span>
                  )}
                </Button>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-sans text-[#0E1B2E] select-all leading-relaxed">
                {getAPACitation()}
              </div>
            </div>

            {/* Chicago Format */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider font-bold text-[#173C7E]">Chicago Style</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 rounded-full text-xs font-semibold hover:bg-slate-100 text-[#F47A1E]"
                  onClick={() => copyToClipboard(getChicagoCitation(), 'Chicago')}
                >
                  {copiedFormat === 'Chicago' ? (
                    <span className="flex items-center gap-1 text-emerald-600"><Check className="h-3.5 w-3.5" /> Copied!</span>
                  ) : (
                    <span className="flex items-center gap-1"><Copy className="h-3.5 w-3.5" /> Copy</span>
                  )}
                </Button>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-sans text-[#0E1B2E] select-all leading-relaxed">
                {getChicagoCitation()}
              </div>
            </div>

            {/* BibTeX Format */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider font-bold text-[#173C7E]">BibTeX Format</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 rounded-full text-xs font-semibold hover:bg-slate-100 text-[#F47A1E]"
                  onClick={() => copyToClipboard(getBibTeXCitation(), 'BibTeX')}
                >
                  {copiedFormat === 'BibTeX' ? (
                    <span className="flex items-center gap-1 text-emerald-600"><Check className="h-3.5 w-3.5" /> Copied!</span>
                  ) : (
                    <span className="flex items-center gap-1"><Copy className="h-3.5 w-3.5" /> Copy Code</span>
                  )}
                </Button>
              </div>
              <pre className="p-3 bg-slate-900 border border-slate-950 rounded-xl text-xs font-mono text-slate-100 overflow-x-auto select-all leading-relaxed">
                {getBibTeXCitation()}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
