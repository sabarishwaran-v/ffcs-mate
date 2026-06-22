# Specification (SPEC.md)

## Overview

FFCS MATE is a web-based course planning tool tailored exclusively for VIT-AP students. It is designed to replace manual spreadsheets by providing intelligent clash detection and real-time collaboration.

## 1. Functional Requirements

### 1.1 Course Selection & Timetable Generation

- Users must be able to search and filter a list of available courses for the upcoming semester.
- Selecting a course must instantly render its assigned theory/lab slots onto a visual weekly timetable grid.
- Users must be able to see the total sum of their selected Credits (L, T, P, J, C).

### 1.2 Intelligent Clash Detection

- **Slot Clashes:** The system must strictly prevent users from selecting a course if its slots overlap with an already selected course.
- **Exam Clashes:** The system must visibly warn users if the Mid-Term (CAT) or Final (FAT) exam dates of a newly selected course overlap with an existing one.

### 1.3 Real-Time Collaboration (Rooms)

- Users must be able to create a unique "Room" and receive a 6-character alphanumeric invite code.
- Users can join a room via the code.
- State changes (adding/dropping courses) must sync to all connected clients in real-time (< 500ms latency).
- Users must be able to view their peers' selected courses and visual timetables side-by-side to find common free time.

### 1.4 Authentication & Identity

- Users must authenticate via Google Sign-In.
- The system must strictly reject any Google account that does not end in `@vitapstudent.ac.in`.

## 2. Non-Functional Requirements

### 2.1 Performance

- **Initial Load Time:** The application should be fully interactive (Time to Interactive) within 1.5 seconds on a standard 4G connection.
- **Real-Time Latency:** Firebase Firestore snapshot listeners should reflect database changes on UI within 500ms.

### 2.2 Aesthetics & UX

- The UI must utilize a modern "Glassmorphism" design system (translucency, blur, deep shadows).
- The application must support a seamless Light/Dark mode toggle that persists in local storage.
- Interactive elements must provide micro-animated feedback (e.g., hover scaling, active pressing) using Framer Motion.

### 2.3 Reliability & Cleanup

- Stale data must not clutter the database.
- Empty rooms or rooms inactive for > 48 hours must be automatically purged via a scheduled CRON job.

## 3. Scope Boundaries

- **In Scope:** Course planning, clash detection, friend collaboration, timetable exporting (PDF/Image).
- **Out of Scope:** Actual course registration. This tool is strictly a _planner_. Users must still log into the official VTOP portal to register for the courses they planned here.
