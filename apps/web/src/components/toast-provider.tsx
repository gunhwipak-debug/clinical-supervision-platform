"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return <Toaster richColors position="top-center" toastOptions={{ duration: 3200 }} />;
}
