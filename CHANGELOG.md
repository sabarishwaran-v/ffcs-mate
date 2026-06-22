# Changelog

All notable changes to the FFCS MATE project will be documented in this file.

## [2.0.0] - Initial Rewrite

Welcome to the completely reimagined FFCS MATE v2.0.0! We have rebuilt the entire platform from scratch to give you the ultimate course planning experience.

### Added

- **Real-Time Multiplayer Collaboration (Rooms)**: Generate a unique room code, share it with friends, and watch them add and drop courses in real-time.
- **Unified Dashboard**: View everyone's selected courses and slots side-by-side to easily find overlapping free times.
- **Intelligent Clash Detection Engine**: Automatically blocks you from selecting theory or lab slots that overlap in timing.
- **Exam Clash Warnings**: Warns you instantly if two courses have overlapping mid-term or final exam schedules.
- **Live Credit Tracking**: Automatically calculates total credits (L T P J C) as you build your timetable.
- **Glassmorphism UI**: A stunning, premium new aesthetic.
- **True Dark/Light Mode**: Seamlessly switch between themes, and the UI adapts flawlessly with beautiful translucent layers.
- **Cloud Sync Database**: Timetables automatically and securely sync across phones, tablets, and laptops.
- **VIT-AP Exclusive Auth**: Integrated Google Sign-In with strict `@vitapstudent.ac.in` domain restrictions.

### Changed

- **Database Architecture**: Moved from local storage arrays to real-time Firebase Firestore documents.
- **Framework**: Upgraded to Next.js App Router.

### Removed

- Removed the old v1.0 local-only data architecture. Legacy timetables will not migrate to v2.0.
