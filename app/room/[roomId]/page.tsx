"use client";

import React, { use } from "react";
import { CoursePreference } from "@/components/course-preference/course-preferences";
import { Footer } from "@/components/footer";
import dynamic from "next/dynamic";
import { RoomHeader } from "@/components/room/room-header";

const SelectedCoursesTable = dynamic(() =>
  import("@/components/selected-courses-table").then(
    (mod) => mod.SelectedCoursesTable,
  ),
);

const ExportSection = dynamic(() =>
  import("@/components/timetable/export/export-section").then(
    (mod) => mod.ExportSection,
  ),
);

import { TimetableManagement } from "@/components/timetable/management/timetable-management";
import { Timetable } from "@/components/timetable/timetable";
import {
  MotionDiv,
  ScrollAnimation,
  Stagger,
} from "@/components/ui/motion";
import { RoomGuard } from "@/components/room/room-guard";
import { RoomSyncProvider } from "@/components/room/room-sync-provider";

import { useScheduleStore } from "@/lib/store";
import { toast } from "sonner";

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;
  const viewMode = useScheduleStore(state => state.viewMode);
  const setViewMode = useScheduleStore(state => state.setViewMode);
  const cloneToPersonal = useScheduleStore(state => state.cloneToPersonal);

  if (process.env.NEXT_PUBLIC_ENABLE_COLLABORATION === "false") {
    if (typeof window !== "undefined") {
      window.location.href = "/planner";
    }
    return null;
  }

  return (
    <RoomGuard roomId={roomId}>
      <RoomSyncProvider roomId={roomId} />
      <main className="container p-4 mx-auto">
        <Stagger staggerDelay={0.15} animation="slideUp">
        
        <ScrollAnimation animation="fadeIn" duration={0.8} className="mb-4" delay={0.1}>
          <RoomHeader roomId={roomId} />
        </ScrollAnimation>

        <ScrollAnimation
          animation="fadeIn"
          duration={0.8}
          className="mb-8"
          delay={0.3}
        >
          <React.Suspense fallback={<div>Loading checklist...</div>}>
            <CoursePreference />
          </React.Suspense>
        </ScrollAnimation>

        <ScrollAnimation
          animation="slideUp"
          duration={0.8}
          className="mb-8"
          delay={0.1}
        >
          <MotionDiv
            id="timetable"
            className="rounded-lg border border-purple-500/20 bg-card p-6 shadow-[0_0_15px_rgba(168,85,247,0.05)] relative overflow-hidden"
            whileHover={{
              scale: 1.01,
              boxShadow: "0 10px 25px rgba(168,85,247,0.1)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 relative z-10">
                {viewMode === "room" ? "Shared Room Timetable" : "Personal Timetable"}
              </h2>
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="flex items-center p-1 bg-muted rounded-lg border">
                  <button
                    onClick={() => setViewMode("room")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === "room" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Room View
                  </button>
                  <button
                    onClick={() => setViewMode("personal")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === "personal" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Personal View
                  </button>
                </div>
                {viewMode === "room" && (
                  <button 
                    onClick={() => {
                      cloneToPersonal();
                      toast.success("Cloned to Personal Planner", { description: "Switch to Personal View to see it." });
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-md transition-colors"
                  >
                    Clone to Personal
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-4 relative z-10">
              <ScrollAnimation animation="scaleUp" delay={0.1}>
                <TimetableManagement />
              </ScrollAnimation>

              <ScrollAnimation animation="fadeIn" delay={0.3}>
                <Timetable />
              </ScrollAnimation>
            </div>
          </MotionDiv>
        </ScrollAnimation>

        <ScrollAnimation
          animation="slideUp"
          duration={0.8}
          className="mb-8"
          delay={0.2}
        >
          <MotionDiv
            id="selected-courses"
            className="rounded-lg border bg-card p-6 shadow-sm"
            whileHover={{
              scale: 1.01,
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <h2 className="mb-4 text-2xl font-semibold text-primary">
              Selected Courses
            </h2>
            <ScrollAnimation animation="bounceIn" delay={0.1}>
              <SelectedCoursesTable />
            </ScrollAnimation>
          </MotionDiv>
        </ScrollAnimation>

        <ScrollAnimation
          animation="slideUp"
          duration={0.8}
          className="mb-8"
          delay={0.3}
        >
          <MotionDiv
            id="export-share"
            className="rounded-lg border bg-card p-6 shadow-sm"
            whileHover={{
              scale: 1.01,
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <h2 className="mb-4 text-2xl font-semibold text-primary">
              Export & Share
            </h2>
            <ScrollAnimation animation="slideUp" delay={0.1}>
              <ExportSection />
            </ScrollAnimation>
          </MotionDiv>
        </ScrollAnimation>

        <ScrollAnimation
          animation="slideUp"
          duration={0.8}
          className="mb-8"
          delay={0.4}
        >
          <MotionDiv
            className="rounded-lg border bg-card p-6 shadow-sm"
            whileHover={{
              scale: 1.01,
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Footer />
          </MotionDiv>
        </ScrollAnimation>
        </Stagger>
      </main>
    </RoomGuard>
  );
}
