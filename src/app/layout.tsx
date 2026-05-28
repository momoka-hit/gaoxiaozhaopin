import type { Metadata } from "next";
import { Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/layout/AuthProvider";

const notoSansSC = Noto_Sans_SC({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-noto',
});

export const metadata: Metadata = {
  title: "高校招聘通 - 高校行政辅导员招聘信息平台",
  description: "专注于陕西、四川及周边省份的高校行政岗、辅导员招聘信息聚合",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${notoSansSC.variable} h-full`}>
      <body className="min-h-full">
        <link rel="stylesheet" href="/fonts.css" />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
