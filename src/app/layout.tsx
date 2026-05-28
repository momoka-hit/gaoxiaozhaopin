import type { Metadata } from "next";
import { Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/layout/AuthProvider";

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
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
    <html lang="zh-CN" className="h-full">
      <body className={`min-h-full ${notoSansSC.className}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
