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
    const verifiedWinterCourses = ["CSE2007", "CSE2008", "MAT1010", "CSE1005", "STS2011", "ECE2003", "ECE2016"];
    const facultyKeys = Object.keys(facultiesJson);

    for (const code of verifiedWinterCourses) {
      const hasOfferings = facultyKeys.some((k) => k.startsWith(`${code}_`));
      expect(hasOfferings).toBe(true);
    }
  });

  it("verifies ECE2003 and ECE2016 slot mappings and faculties", () => {
    const facultyKeys = Object.keys(facultiesJson);
    const ece2003Slots = facultyKeys.filter((k) => k.startsWith("ECE2003_"));
    const ece2016Slots = facultyKeys.filter((k) => k.startsWith("ECE2016_"));

    // ECE2003: 5 theory slot keys + 6 lab slot keys = 11 unique slot keys
    expect(ece2003Slots.length).toBe(11);
    // ECE2016: 3 theory slot keys (A2+TA2+TAA2, A1+TA1+TAA1, B1+TB1+TBB1)
    expect(ece2016Slots.length).toBe(3);

    // Verify multi-faculty slot in ECE2016
    const a2Slot = (facultiesJson as any)["ECE2016_A2+TA2+TAA2"];
    expect(a2Slot.length).toBe(2);
    expect(a2Slot.map((f: any) => f.faculty)).toContain("ANSHUMAN CHOUDHARY");
    expect(a2Slot.map((f: any) => f.faculty)).toContain("G Bharath Reddy");
  });
});
