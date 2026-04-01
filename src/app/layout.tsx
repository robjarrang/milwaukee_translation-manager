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
          <header className="border-b bg-card">
            <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
              <a href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
                <span className="inline-block w-3 h-3 rounded-sm bg-primary" />
                Milwaukee Translation Manager
              </a>
            </div>
          </header>
          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-4 py-6">
              {children}
            </div>
          </main>
          <Toaster richColors />
        </TooltipProvider>
      </body>
    </html>
  );
}
