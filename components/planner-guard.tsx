"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useScheduleStore } from "@/lib/store";

export function PlannerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const activeSemester = useScheduleStore((state) => state.activeSemester);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !activeSemester) {
      router.push("/");
    }
  }, [isMounted, activeSemester, router]);

  // Don't render until we are sure they have a semester, avoiding flashes of content
  if (!isMounted || !activeSemester) {
    return null;
  }

  return <>{children}</>;
}
