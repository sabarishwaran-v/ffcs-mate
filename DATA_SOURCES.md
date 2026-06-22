# Data Sources (DATA_SOURCES.md)

## Overview

To function accurately as a course planner, FFCS MATE requires a comprehensive list of all courses offered by the university for the upcoming semester, including their credits, slot timings, and exam schedules.

## Provenance

The data driving FFCS MATE is not scraped automatically. It is manually compiled from official university circulars and the VTOP portal prior to the FFCS registration period.

### Structure

The core data is stored statically in the repository as a JSON file, located at:
`lib/courses.json`

Because the data is static JSON:

1. It loads incredibly fast natively within the Next.js bundle.
2. It does not cost database reads (saving Firebase quota).

### Format

Each entry in `courses.json` adheres strictly to the `Course` TypeScript interface defined in `types/course.ts`.

Example structure:

```json
{
  "id": "MAT1001",
  "title": "Calculus for Engineers",
  "type": "Theory",
  "credits": { "l": 3, "t": 0, "p": 0, "j": 0, "c": 3 },
  "slots": ["A1", "TA1"],
  "exams": {
    "midterm": { "date": "2025-02-15", "time": "10:00 - 11:30" },
    "final": { "date": "2025-05-10", "time": "09:00 - 12:00" }
  }
}
```

## Updates & Maintenance

Whenever a new semester begins, the `courses.json` file must be manually completely replaced with the new semester's data.

**Copyright Note:** The course titles, codes, and slot structures belong to VIT-AP University. This tool is built independently by students, for students, to assist in planning.
