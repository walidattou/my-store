import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@fontsource-variable/cairo";
import "@fontsource-variable/changa";
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
  title: "جودة | اختيارات تستحقها",
  description: "منتجات عملية وأنيقة، مختارة بعناية وتوصّل إلى بابك في كل الجزائر.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
