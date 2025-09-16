// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quiet Hours Scheduler",
  description: "Block off quiet hours with Supabase + Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen antialiased">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {children}
        </div>
      </body>
    </html>
  );
}
