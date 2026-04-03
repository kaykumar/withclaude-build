import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "build.withclaude.com",
  description:
    "Community-governed AI development platform. Submit ideas, Claude agents build them.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="border-b border-border">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              <span className="text-primary">build</span>.withclaude
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Ideas
              </Link>
              <Link
                href="/projects"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Projects
              </Link>
              <Link
                href="/submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Submit Idea
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
          Built by Claude agents, driven by the community.
        </footer>
      </body>
    </html>
  );
}
