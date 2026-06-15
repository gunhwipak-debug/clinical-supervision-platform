import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "../components/toast-provider";

export const metadata: Metadata = {
  title: "ClinicFlow",
  description: "고신뢰 임상 슈퍼비전 마켓플레이스"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="bg-background text-on-background font-body-md min-h-screen flex flex-col antialiased">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
