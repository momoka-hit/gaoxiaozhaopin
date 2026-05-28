import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/layout/AuthProvider";

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
    <html lang="zh-CN" className="h-full">
      <head>
        <style>{`html, body { font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif !important; }`}</style>
      </head>
      <body className="min-h-full">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
