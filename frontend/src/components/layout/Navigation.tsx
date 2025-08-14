import Link from 'next/link';
import { useState } from 'react';
import ThemeToggle from '../theme/ThemeToggle';

interface NavigationProps {
  currentPage?: string;
}

export default function Navigation({ currentPage }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isIndustriesOpen, setIsIndustriesOpen] = useState(false);

  const navItems = [
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { 
      href: '/industries', 
      label: 'Industries',
      hasDropdown: true,
      subItems: [
        { href: '/industries/law-firms', label: 'Law Firms' },
        { href: '/industries/contractors', label: 'Contractors' },
        { href: '/industries/agencies', label: 'Creative Agencies' },
        { href: '/industries/marketing-agencies', label: 'Marketing Agencies' },
      ]
    },
    { href: '/support', label: 'Support' },
  ];

  return (
    <header className="bg-surface/95 backdrop-blur-md shadow-[var(--shadow-1)] fixed w-full top-0 z-50 border-b border-border">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-foreground hover:text-primary transition-colors duration-[var(--dur)]">
              StackPro
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <div key={item.href} className="relative">
                {item.hasDropdown ? (
                  <div 
                    className="relative"
                    onMouseEnter={() => setIsIndustriesOpen(true)}
                    onMouseLeave={() => setIsIndustriesOpen(false)}
                  >
                    <button
                      className={`transition-colors duration-[var(--dur)] ease-[var(--ease)] flex items-center ${
                        currentPage?.startsWith('/industries')
                          ? 'text-secondary'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      {item.label}
                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isIndustriesOpen && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg py-2 z-50">
                        {item.subItems?.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className="block px-4 py-2 text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
                            onClick={() => setIsIndustriesOpen(false)}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`transition-colors duration-[var(--dur)] ease-[var(--ease)] ${
                      currentPage === item.href
                        ? 'text-secondary'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-muted hover:text-foreground transition-colors duration-[var(--dur)] font-medium"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="btn btn-primary"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <nav className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted text-sm">Theme:</span>
                <ThemeToggle />
              </div>
              {navItems.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted hover:text-primary transition-colors duration-[var(--dur)]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.hasDropdown && (
                    <div className="ml-4 mt-2 space-y-2">
                      {item.subItems?.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className="block text-sm text-muted hover:text-primary transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-4 border-t border-border space-y-3">
                <Link
                  href="/login"
                  className="block text-muted hover:text-primary transition-colors duration-[var(--dur)]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="btn btn-primary w-full text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Start Free Trial
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
