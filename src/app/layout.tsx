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
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <header className="bg-[#231F20] border-b border-[#333]">
            <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
              <a href="/" className="flex items-center gap-3 group">
                <span className="inline-block w-8 h-8 bg-[#DB011C]" />
                <span className="text-white text-sm font-black uppercase tracking-wider">
                  Milwaukee<span className="hidden sm:inline"> Translation Manager</span>
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
