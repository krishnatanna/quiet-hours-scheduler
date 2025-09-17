import type { Metadata } from "next";
import "../styles/globals.css"; 

export const metadata: Metadata = {
  title: "Quiet Hours Scheduler",
  description: "Manage your quiet hours with ease.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
