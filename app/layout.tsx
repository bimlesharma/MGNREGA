import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MGNREGA District Performance Dashboard',
  description: 'View and understand monthly MGNREGA district performance data',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gradient-to-b from-background to-background/80`}>
        <div className="flex min-h-screen flex-col">
          {children}
          <footer className="mt-auto py-6 text-center text-sm text-muted-foreground">
            <div className="container">
              <p>© {new Date().getFullYear()} MGNREGA District Performance Dashboard</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
