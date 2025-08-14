import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Product',
      links: [
        { href: '/features', label: 'Features' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/signup', label: 'Start Free Trial' },
      ]
    },
    {
      title: 'Industries',
      links: [
        { href: '/industries/law-firms', label: 'Law Firms' },
        { href: '/industries/contractors', label: 'Contractors' },
        { href: '/industries/agencies', label: 'Creative Agencies' },
      ]
    },
    {
      title: 'Support',
      links: [
        { href: '/support', label: 'Help Center' },
        { href: '/contact', label: 'Contact Us' },
        { href: '/about', label: 'About' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/terms', label: 'Terms of Service' },
        { href: '/cookie-policy', label: 'Cookie Policy' },
      ]
    }
  ];

  return (
    <footer className="bg-surface border-t border-border">
      <div className="container-custom section-spacing">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-foreground mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted hover:text-primary transition-colors duration-[var(--dur)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <Link href="/" className="text-xl font-bold text-foreground">
              StackPro
            </Link>
            <span className="text-muted">
              © {currentYear} StackPro. All rights reserved.
            </span>
          </div>
          
          <div className="text-muted text-sm">
            Built with ❤️ for small businesses
          </div>
        </div>
      </div>
    </footer>
  );
}
