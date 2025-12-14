import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import NavigationMobile from "@/components/NavigationMobile";
import Footer from "@/components/Footer";
import AdminTopBar from "@/components/AdminTopBar";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Auto Dealership",
  description: "Your trusted vehicle dealership",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  other: {
    'color-scheme': 'light only',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* DNS Prefetch and Preconnect for faster loading */}
        <link rel="dns-prefetch" href="https://imagedelivery.net" />
        <link rel="preconnect" href="https://imagedelivery.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://vehicle-dealership-analytics.nick-damato0011527.workers.dev" />
        <link rel="preconnect" href="https://vehicle-dealership-analytics.nick-damato0011527.workers.dev" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <SiteSettingsProvider>
          <AdminTopBar />
          <NavigationMobile />
          <div className="flex-grow">
            {children}
          </div>
          <Footer />
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
