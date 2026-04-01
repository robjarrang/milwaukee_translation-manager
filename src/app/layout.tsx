import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
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
  title: "Milwaukee Translation Manager",
  description: "Manage email translation projects for Milwaukee regional marketing teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <header className="bg-[#231F20] border-b border-[#333]">
            <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
              <a href="/" className="flex items-center gap-3 group">
                <img src="/milwaukee-logo.png" alt="Milwaukee" className="h-12 w-auto" />
                <span className="text-white text-sm font-black uppercase tracking-wider">
                  Translation Manager
                </span>
              </a>
            </div>
          </header>
          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-4 py-8">
              {children}
            </div>
          </main>
          <footer className="bg-[#231F20] border-t border-[#333]">
            <div className="mx-auto max-w-6xl px-4 py-3">
              <p className="text-xs text-[#57585B] uppercase tracking-wider">
                Milwaukee Tool — Translation Manager
              </p>
            </div>
          </footer>
          <Toaster richColors />
        </TooltipProvider>
      </body>
    </html>
  );
}
