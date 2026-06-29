import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LFS Kleinanzeigen",
  description: "Der Schulmarktplatz der Erzb. Liebfrauenschule Köln",
  icons: {
    icon: "https://www.lfs-koeln.de/wp-content/uploads/2019/01/cropped-logo-wei%C3%9F-gro%C3%9F-1-192x192.png",
    apple: "https://www.lfs-koeln.de/wp-content/uploads/2019/01/cropped-logo-wei%C3%9F-gro%C3%9F-1-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
