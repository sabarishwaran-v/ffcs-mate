import React from "react";
import { CoursePreference } from "@/components/course-preference/course-preferences";
import { Footer } from "@/components/footer";
import dynamic from "next/dynamic";

const SelectedCoursesTable = dynamic(() =>
  import("@/components/selected-courses-table").then(
    (mod) => mod.SelectedCoursesTable
  )
);

const ExportSection = dynamic(() =>
  import("@/components/timetable/export/export-section").then(
    (mod) => mod.ExportSection
  )
);

import { TimetableManagement } from "@/components/timetable/management/timetable-management";
import { Timetable } from "@/components/timetable/timetable";
import { Title } from "@/components/title";
import {
  MotionDiv,
  Parallax,
  ScrollAnimation,
  Stagger,
} from "@/components/ui/motion";
import { EditProvider } from "@/src/providers/edit-provider";
import { PlannerGuard } from "@/components/planner-guard";

export default function Home() {
  return (
    <PlannerGuard>
      <main className="container p-4 mx-auto">
        {/* <WarnMessage /> */}

        <Stagger staggerDelay={0.15} animation="slideUp">
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
              className="rounded-lg border bg-card p-6 shadow-sm"
              whileHover={{
                scale: 1.01,
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <h2 className="mb-4 text-2xl font-semibold text-primary">
                Timetable
              </h2>
              <div className="space-y-4">
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
    </PlannerGuard>
  );
}
