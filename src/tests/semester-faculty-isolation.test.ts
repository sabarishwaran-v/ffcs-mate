import { describe, it, expect } from "vitest";
import fallbackWinterData from "@/lib/fallback_faculties.json";
import fallbackFallData from "@/lib/fallback_faculties.fall2026.json";
import facultiesJson from "@/lib/faculties.json";

describe("Semester Faculty Data Isolation (Winter 2026-27 vs Fall)", () => {
  it("ensures fallback_faculties.json contains zero entries from previous fall semester", () => {
    const winterKeys = Object.keys(fallbackWinterData);
    const fallKeys = new Set(Object.keys(fallbackFallData));

    const leakedFromFall = winterKeys.filter((k) => fallKeys.has(k));
    expect(leakedFromFall).toEqual([]);
  });

  it("ensures faculties.json contains zero CSE3002, CSE2001, ECE2002 previous semester entries", () => {
    const facultyKeys = Object.keys(facultiesJson);

    const staleCourses = ["CSE3002", "CSE2001", "ECE2002", "MAT1003", "STS2010"];
    for (const code of staleCourses) {
      const matching = facultyKeys.filter((k) => k.startsWith(`${code}_`));
      expect(matching).toEqual([]);
    }
  });

  it("ensures CSE3002 has zero pre-populated faculties in winter fallback data", () => {
    const winterEntries = Object.values(fallbackWinterData);
    const cse3002Entries = winterEntries.filter(
      (f: any) => f.courseCode === "CSE3002" || f.courseId === "CSE3002"
    );
    expect(cse3002Entries).toEqual([]);
  });

  it("ensures verified Winter courses have valid faculties in faculties.json", () => {
    const verifiedWinterCourses = ["CSE2007", "CSE2008", "MAT1010", "CSE1005", "STS2011"];
    const facultyKeys = Object.keys(facultiesJson);

    for (const code of verifiedWinterCourses) {
      const hasOfferings = facultyKeys.some((k) => k.startsWith(`${code}_`));
      expect(hasOfferings).toBe(true);
    }
  });
});
