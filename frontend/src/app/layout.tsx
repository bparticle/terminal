import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Terminal Game',
  description: 'A retro CRT terminal text adventure game',
  openGraph: {
    title: 'Terminal Game',
    description: 'A retro CRT terminal text adventure game',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=VT323&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-black">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
