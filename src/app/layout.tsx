import "@/app/globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist_Mono } from "next/font/google";
import AgentationLocalOnly from "@/app/AgentationLocalOnly";

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MedAssist — MRI Planning Trainer",
  description: "Interactive MRI scan planning simulator with real-time feedback, guided tutorials, and clinical training workflows.",
  keywords: ["MRI", "planning", "training", "simulator", "medical education", "radiology"],
  openGraph: {
    title: "MedAssist — MRI Planning Trainer",
    description: "Practice MRI scan planning with real NIfTI data and instant feedback.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0d1117" />
      </head>
      <body className={`${geistMono.variable} antialiased`}>
        {children}
        {process.env.NODE_ENV === "development" && <AgentationLocalOnly />}
      </body>
    </html>
  );
}
