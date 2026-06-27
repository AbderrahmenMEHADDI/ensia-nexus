import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, FileText, FlaskConical, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCookie, setCookie } from '@/lib/cookies';

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
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const consent = getCookie('cookie_consent_accepted');
    if (!consent) {
      const timer = setTimeout(() => setShowConsent(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setCookie('cookie_consent_accepted', 'true', 365);
    setShowConsent(false);
  };

  const handleDecline = () => {
    setCookie('cookie_consent_accepted', 'false', 365);
    setShowConsent(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      {/* ── Slim Top Utility Bar ── */}
      <div className="w-full" style={{ background: '#0E1B2E' }}>
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
            <div className="h-9 w-9 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img src="/aisi-logo-color.svg" alt="Logo" className="h-6 w-6" />
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
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#F47A1E]" />
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
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#F47A1E]" />
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
              <Button className="rounded-lg px-5 h-9 text-sm font-semibold shadow-none" style={{ background: '#F47A1E', color: '#fff' }}>
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
      <footer className="py-12 md:py-20 mt-auto" style={{ background: '#173C7E' }}>
        <div className="container px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 flex items-center justify-center">
                  <img src="/aisi-logo-on-dark.svg" alt="Logo" className="h-5 w-5" />
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

      {/* ── Cookie Consent Banner (Option B) ── */}
      {showConsent && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="p-5 rounded-2xl bg-white/95 border border-slate-200/80 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] backdrop-blur-md flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <Cookie className="h-5 w-5 text-[#F47A1E]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#0F172A]">We value your privacy</h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  We use cookies to improve your browsing experience, analyze site traffic, and remember your research collaboration submissions.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                onClick={handleDecline}
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-[#64748B] hover:bg-slate-50 transition-colors"
              >
                Decline Optional
              </button>
              <button
                onClick={handleAccept}
                className="text-xs font-semibold px-4 py-2 rounded-lg text-white transition-all hover:brightness-110"
                style={{ background: '#F47A1E' }}
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}
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
          <Link to={link.href} className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.45)' }} onMouseEnter={e => (e.currentTarget.style.color = '#F47A1E')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>{link.label}</Link>
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
