import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Assuming these are correctly set up by create-next-app
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
  title: "Textile Fiber Analysis Calculator",
  description: "A calculator for textile fiber analysis including manual separation, chemical separation, and garments analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}