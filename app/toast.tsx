"use client";

import { TriangleAlert } from "lucide-react";
import { useTheme } from "next-themes";

import { Toaster } from "@/components/ui/sonner";

export function ToastWrapper() {
  const { theme } = useTheme();

  return (
    <Toaster
      icons={{
        error: <TriangleAlert className="w-4 h-4" />,
      }}
      richColors
      theme={(theme as "light" | "dark" | "system") ?? "system"}
    />
  );
}
