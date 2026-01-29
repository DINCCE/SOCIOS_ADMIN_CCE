import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { CSPostHogProvider } from "@/components/providers/posthog-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ColorSchemeProvider } from "@/components/providers/color-scheme-provider";
import { DensityProvider } from "@/components/providers/density-provider";
import { Toaster } from "@/components/ui/sonner";
import { GlobalSearchDialog } from "@/components/search/global-search-dialog";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CCE Portal",
  description: "Plataforma Corporativa CCE",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CCE Portal",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${jetBrainsMono.variable} h-full w-full bg-background`}
    >
      <body className="antialiased h-full w-full">
        <CSPostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ColorSchemeProvider>
              <DensityProvider>
                <QueryProvider>
                <div className="flex h-full w-full flex-col">
                  {children}
                  <Toaster />
                </div>
                <GlobalSearchDialog />
              </QueryProvider>
              </DensityProvider>
            </ColorSchemeProvider>
          </ThemeProvider>
        </CSPostHogProvider>
      </body>
    </html>
  );
}
