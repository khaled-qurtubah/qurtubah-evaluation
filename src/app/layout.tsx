import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "مدارس قرطبة الأهلية – نظام تقويم التعليم",
  description: "نظام تقويم التعليم لمدارس قرطبة الأهلية – مجمع أبحر",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${tajawal.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: "var(--font-tajawal), sans-serif" }}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
