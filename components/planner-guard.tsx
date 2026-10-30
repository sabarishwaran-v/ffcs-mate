"use client";

import { useEffect, useState } from "react";
import { useScheduleStore } from "@/lib/store";

export function PlannerGuard({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlSemester = urlParams.get("semester");
      const currentSemester = useScheduleStore.getState().activeSemester;

      if (!currentSemester) {
        useScheduleStore.setState({ activeSemester: urlSemester || "winter2026" });
      } else if (urlSemester && urlSemester !== currentSemester) {
        useScheduleStore.setState({ activeSemester: urlSemester });
      }
    }
  }, []);

  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
}
