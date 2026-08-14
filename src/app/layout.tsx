import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planner AI",
  description: "Behavioral adaptive planning, built on a task/occurrence/completion data model.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-neutral-900">{children}</body>
    </html>
  );
}
