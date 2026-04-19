import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "HandyTools",
  description: "Your personal handy tools dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
