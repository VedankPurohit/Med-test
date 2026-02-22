import "@/app/globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist_Mono } from "next/font/google";

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MRI Planning Trainer",
  description: "Next.js MRI planning trainer core"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
