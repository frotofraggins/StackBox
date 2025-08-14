import { ReactNode } from 'react';
import Navigation from './Navigation';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  currentPage?: string;
}

export default function Layout({ children, currentPage }: LayoutProps) {
  return (
    <>
      <Navigation currentPage={currentPage} />
      <main className="pt-16">
        {children}
      </main>
      <Footer />
    </>
  );
}
