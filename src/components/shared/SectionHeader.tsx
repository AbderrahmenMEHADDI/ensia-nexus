import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export const SectionHeader = ({ title, subtitle, className }: SectionHeaderProps) => {
  return (
    <div className={cn("mb-16", className)}>
      <h2 className="text-3xl md:text-4xl font-display font-bold mb-3" style={{ color: '#173C7E' }}>
        {title}
      </h2>
      <div className="w-14 h-1 rounded-full mb-4" style={{ background: '#F47A1E' }} />
      {subtitle && (
        <p className="text-lg max-w-2xl" style={{ color: '#64748B' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
