import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Vaulty",
  description: "Personal portfolio dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="antialiased">
      <body className="bg-vaulty-bg text-vaulty-ink">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </div>
      </body>
    </html>
  );
}
