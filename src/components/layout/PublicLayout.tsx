import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Cookie, Linkedin, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCookie, setCookie } from '@/lib/cookies';
import { AisiLogo } from '../shared/AisiLogo';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleHashClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    if (!targetId || targetId === '#') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      window.history.pushState(null, '', '/');
      return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      const navbarHeight = scrolled ? 72 : 80;
      // Target the heading / title element inside the section for exact alignment
      const headingElement = element.querySelector('h1, h2, h3, .section-header') || element;
      const headingTop = headingElement.getBoundingClientRect().top + window.scrollY;
      
      // Align heading directly below fixed navbar with comfortable margin
      const offsetPosition = headingTop - navbarHeight - 20;
      
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
      
      window.history.pushState(null, '', href);
    }
  };

  const resolvedNavLinks = navLinks || [
    { label: 'Home', href: '/', isActive: true, isHash: false },
    { label: 'Projects', href: '/discovery/projects', isActive: false, isHash: false },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 overflow-x-hidden w-full">
      {/* ── Slim Top Utility Bar ── */}
      <div className="w-full" style={{ background: '#0E1B2E' }}>
        <div className="container flex items-center justify-end px-4 sm:px-6 h-8 text-[11px] tracking-wide">
          <div className="flex items-center gap-4">
            <a href="https://ensia.edu.dz" target="_blank" rel="noopener noreferrer" className="text-white/75 hover:text-white transition-colors duration-200">
              ENSIA Website
            </a>
            <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.25)', display: 'inline-block' }} />
            <Link 
              to="/signin" 
              className="px-2.5 py-0.5 text-white font-medium hover:bg-white/15 rounded transition-colors duration-200"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* ── White Sticky Navbar ── */}
      <nav className={cn(
        "sticky top-0 z-50 w-full transition-shadow duration-300 border-b border-[#E3E7EE] bg-white",
        scrolled ? "shadow-md" : "shadow-sm"
      )}>
        <div className="max-w-[1200px] mx-auto flex items-center justify-between py-4 sm:py-5 px-4 sm:px-8 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <AisiLogo className="w-8 h-8 shrink-0 transition-transform duration-300 group-hover:scale-105" />
            <span className="font-display font-bold text-[17px] sm:text-[18px] tracking-wider leading-none text-[#173C7E]">
              AISI
              <small className="block font-sans font-medium text-[11px] tracking-normal text-[#5E6B7C] mt-1 whitespace-nowrap hidden min-[640px]:block">
                Applied Intelligence for Societal Impact
              </small>
            </span>
          </Link>

          {/* Desktop Nav Links (Visible on lg screens 1024px+) */}
          <div className="hidden lg:flex items-center gap-5 xl:gap-7 ml-auto mr-4">
            {resolvedNavLinks.map((link) => link.isHash ? (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleHashClick(e, link.href)}
                className={cn(
                  "relative py-2 text-[14px] font-sans font-medium transition-colors duration-150 whitespace-nowrap",
                  link.isActive
                    ? "text-[#173C7E]"
                    : "text-[#5E6B7C] hover:text-[#2E9FDA]"
                )}
              >
                {link.label}
                {link.isActive && (
                  <span className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#F47A1E]" />
                )}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                className={cn(
                  "relative py-2 text-[14px] font-sans font-medium transition-colors duration-150 whitespace-nowrap",
                  link.isActive
                    ? "text-[#173C7E]"
                    : "text-[#5E6B7C] hover:text-[#2E9FDA]"
                )}
              >
                {link.label}
                {link.isActive && (
                  <span className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#F47A1E]" />
                )}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button className="h-9 w-9 rounded-lg flex items-center justify-center text-[#5E6B7C] hover:bg-gray-100 transition-colors" aria-label="Search">
              <Search className="h-[18px] w-[18px]" />
            </button>
            <Link to="/signup" className="hidden sm:block">
              <Button className="rounded-lg px-4 sm:px-5 h-9 text-sm font-semibold shadow-none whitespace-nowrap" style={{ background: '#F47A1E', color: '#fff' }}>
                Join Hub
              </Button>
            </Link>
            
            {/* Mobile / Tablet Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-9 w-9 rounded-lg flex items-center justify-center text-[#5E6B7C] hover:bg-gray-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Mobile / Tablet Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-6 py-4 animate-in slide-in-from-top-2 duration-200 shadow-lg">
            <div className="flex flex-col space-y-3">
              {resolvedNavLinks.map((link) => link.isHash ? (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    handleHashClick(e, link.href);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "py-2 text-base font-sans font-medium transition-colors border-b border-slate-50",
                    link.isActive ? "text-[#173C7E] font-semibold" : "text-[#5E6B7C] hover:text-[#2E9FDA]"
                  )}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "py-2 text-base font-sans font-medium transition-colors border-b border-slate-50",
                    link.isActive ? "text-[#173C7E] font-semibold" : "text-[#5E6B7C] hover:text-[#2E9FDA]"
                  )}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-2 flex flex-col gap-3 sm:hidden">
                <Link to="/signin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-lg h-10 text-sm font-semibold">
                    Sign in
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full rounded-lg h-10 text-sm font-semibold shadow-none" style={{ background: '#F47A1E', color: '#fff' }}>
                    Join Hub
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
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
                <span className="font-display font-bold text-white text-lg">AISI</span>
              </div>
            </div>
            <FooterCol title="Platform" links={[
              { label: 'Home', href: '/' },
              { label: 'Project Board', href: '/discovery/projects' },
              { label: 'Research & Publications', href: '/#activities' },
              { label: 'Research Opportunities', href: '/#opportunities' },
            ]} />
            <FooterCol title="Quick Links" links={[
              { label: 'Team Objectives', href: '/#objectives' },
              { label: 'Meet the Team', href: '/#team' },
              { label: 'Contact Us', href: '/#contact' },
              { label: 'Sign In', href: '/signin' },
              { label: 'Join Hub', href: '/signup' },
            ]} />
            <FooterCol title="Connect" links={[
              { label: 'ENSIA Website', href: 'https://ensia.edu.dz', isExternal: true },
              { label: 'LinkedIn', href: 'https://www.linkedin.com/company/aisi-research-team', isExternal: true },
            ]} />
          </div>
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>© 2026 AISI. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a
                href="https://www.linkedin.com/company/aisi-research-team"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-105 transition-transform"
                aria-label="LinkedIn"
                onMouseEnter={e => {
                  const iconEl = e.currentTarget.querySelector('div');
                  if (iconEl) {
                    iconEl.style.borderColor = '#F47A1E';
                    iconEl.style.color = '#F47A1E';
                  }
                }}
                onMouseLeave={e => {
                  const iconEl = e.currentTarget.querySelector('div');
                  if (iconEl) {
                    iconEl.style.borderColor = 'rgba(255,255,255,0.15)';
                    iconEl.style.color = 'rgba(255,255,255,0.4)';
                  }
                }}
              >
                <SocialIcon icon={Linkedin} />
              </a>
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
const FooterCol = ({ title, links }: { title: string; links: { label: string; href: string; isExternal?: boolean }[] }) => (
  <div className="space-y-6">
    <h4 className="text-sm font-bold uppercase tracking-widest text-white">{title}</h4>
    <ul className="space-y-4">
      {links.map(link => (
        <li key={link.label}>
          {link.isExternal || link.href.startsWith('http') ? (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm transition-colors inline-block"
              style={{ color: 'rgba(255,255,255,0.45)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F47A1E')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >
              {link.label}
            </a>
          ) : link.href.startsWith('/#') || link.href.startsWith('#') ? (
            <a
              href={link.href}
              className="text-sm transition-colors inline-block"
              style={{ color: 'rgba(255,255,255,0.45)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F47A1E')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >
              {link.label}
            </a>
          ) : (
            <Link
              to={link.href}
              className="text-sm transition-colors inline-block"
              style={{ color: 'rgba(255,255,255,0.45)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F47A1E')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >
              {link.label}
            </Link>
          )}
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
