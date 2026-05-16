import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, FileText, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavLinkItem {
  label: string;
  href: string;
  isActive?: boolean;
  isHash?: boolean;
}

interface PublicLayoutProps {
  children: React.ReactNode;
  navLinks?: NavLinkItem[];
}

export const PublicLayout = ({ children, navLinks }: PublicLayoutProps) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      {/* ── Slim Top Utility Bar ── */}
      <div className="w-full" style={{ background: '#053557' }}>
        <div className="container flex items-center justify-between px-4 sm:px-6 h-8 text-[11px] tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>
          <div className="flex items-center gap-3">
            <span className="cursor-pointer hover:text-white/70 transition-colors">EN</span>
            <span>|</span>
            <span className="cursor-pointer hover:text-white/70 transition-colors">FR</span>
            <span>|</span>
            <span className="cursor-pointer hover:text-white/70 transition-colors">AR</span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <a href="https://ensia.edu.dz" className="hover:text-white/70 transition-colors">ENSIA Website</a>
            <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.15)', display: 'inline-block' }} />
            <Link to="/signin" className="hover:text-white/70 transition-colors">Sign in</Link>
          </div>
        </div>
      </div>

      {/* ── White Sticky Navbar ── */}
      <nav className={cn(
        "sticky top-0 z-50 w-full transition-shadow duration-300 bg-white border-b",
        scrolled ? "shadow-md border-gray-200/80" : "shadow-sm border-gray-100"
      )}>
        <div className="container flex items-center justify-between px-4 sm:px-6 h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="h-9 w-9 rounded-lg bg-[#F37F20] flex items-center justify-center group-hover:scale-105 transition-transform">
              <img src="/logo_small.svg" alt="Logo" className="h-6 w-6 brightness-0 invert" />
            </div>
            <span className="font-display font-bold text-[#0F172A] text-lg tracking-tight">ENSIA Nexus</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1 ml-auto mr-4">
            {(navLinks || [
              { label: 'Home', href: '/', isActive: true, isHash: false },
              { label: 'Projects', href: '/discovery/projects', isActive: false, isHash: false },
            ]).map((link) => link.isHash ? (
              <a
                key={link.label}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  link.isActive
                    ? "text-[#0F172A]"
                    : "text-[#475569] hover:text-[#0F172A] hover:bg-gray-100"
                )}
              >
                {link.label}
                {link.isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#F37F20]" />
                )}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  link.isActive
                    ? "text-[#0F172A]"
                    : "text-[#475569] hover:text-[#0F172A] hover:bg-gray-100"
                )}
              >
                {link.label}
                {link.isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#F37F20]" />
                )}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button className="h-9 w-9 rounded-lg flex items-center justify-center text-[#475569] hover:bg-gray-100 transition-colors" aria-label="Search">
              <Search className="h-[18px] w-[18px]" />
            </button>
            <Link to="/signup" className="hidden sm:block">
              <Button className="rounded-lg px-5 h-9 text-sm font-semibold shadow-none" style={{ background: '#F37F20', color: '#fff' }}>
                Join Hub
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="py-12 md:py-20 mt-auto" style={{ background: '#074a75' }}>
        <div className="container px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#F37F20' }}>
                  <img src="/logo_small.svg" alt="Logo" className="h-5 w-5 brightness-0 invert" />
                </div>
                <span className="font-display font-bold text-white text-lg">ENSIA Nexus</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                The official research management and collaboration platform of the École Nationale Supérieure d'Intelligence Artificielle.
              </p>
            </div>
            <FooterCol title="Platform" links={[
              { label: 'Home', href: '/' },
              { label: 'Project Board', href: '/discovery/projects' },
              { label: 'Publications', href: '/publications' },
            ]} />
            <FooterCol title="Resources" links={[
              { label: 'Documentation', href: '#' },
              { label: 'API Reference', href: '#' },
              { label: 'Research Guidelines', href: '#' },
              { label: 'Terms of Service', href: '#' },
            ]} />
            <FooterCol title="Connect" links={[
              { label: 'Lab Support', href: '#' },
              { label: 'Institutional Contact', href: '#' },
              { label: 'ENSIA Website', href: 'https://ensia.edu.dz' },
              { label: 'Feedback Hub', href: '#' },
            ]} />
          </div>
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>© 2026 ENSIA Nexus. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <SocialIcon icon={Users} />
              <SocialIcon icon={FileText} />
              <SocialIcon icon={FlaskConical} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ── Footer sub-components ── */
const FooterCol = ({ title, links }: { title: string; links: { label: string; href: string }[] }) => (
  <div className="space-y-6">
    <h4 className="text-sm font-bold uppercase tracking-widest text-white">{title}</h4>
    <ul className="space-y-4">
      {links.map(link => (
        <li key={link.label}>
          <Link to={link.href} className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.45)' }} onMouseEnter={e => (e.currentTarget.style.color = '#F37F20')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>{link.label}</Link>
        </li>
      ))}
    </ul>
  </div>
);

const SocialIcon = ({ icon: Icon }: { icon: any }) => (
  <div className="h-10 w-10 rounded-full flex items-center justify-center cursor-pointer transition-all" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}>
    <Icon className="h-4 w-4" />
  </div>
);
