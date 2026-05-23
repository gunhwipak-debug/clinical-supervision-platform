import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

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
        <Toaster richColors position="top-center" toastOptions={{ duration: 3200 }} />
      </body>
    </html>
  );
}
