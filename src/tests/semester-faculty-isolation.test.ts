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
    const verifiedWinterCourses = ["CSE2007", "CSE2008", "MAT1010", "CSE1005", "STS2011", "ECE2003", "ECE2016", "ECE2006", "ECE3006", "ECE2009"];
    const facultyKeys = Object.keys(facultiesJson);

    for (const code of verifiedWinterCourses) {
      const hasOfferings = facultyKeys.some((k) => k.startsWith(`${code}_`));
      expect(hasOfferings).toBe(true);
    }
  });

  it("verifies ECE2003, ECE2016, ECE2006, ECE3006, and ECE2009 slot mappings and faculties", () => {
    const facultyKeys = Object.keys(facultiesJson);
    const ece2003Slots = facultyKeys.filter((k) => k.startsWith("ECE2003_"));
    const ece2016Slots = facultyKeys.filter((k) => k.startsWith("ECE2016_"));
    const ece2006Slots = facultyKeys.filter((k) => k.startsWith("ECE2006_"));
    const ece3006Slots = facultyKeys.filter((k) => k.startsWith("ECE3006_"));
    const ece2009Slots = facultyKeys.filter((k) => k.startsWith("ECE2009_"));

    // ECE2003: 5 theory slot keys + 6 lab slot keys = 11 unique slot keys
    expect(ece2003Slots.length).toBe(11);
    // ECE2016: 3 theory slot keys (A2+TA2+TAA2, A1+TA1+TAA1, B1+TB1+TBB1)
    expect(ece2016Slots.length).toBe(3);
    // ECE2006: 3 theory slot keys (B1+TB1, B2+TB2, C1+TC1) + 6 lab slot keys = 9 unique slot keys
    expect(ece2006Slots.length).toBe(9);
    // ECE3006: 3 theory slot keys (F1+TF1, F2+TF2, G1+TG1) + 4 lab slot keys = 7 unique slot keys
    expect(ece3006Slots.length).toBe(7);
    // ECE2009: 3 theory slot keys (F1+TF1, F2+TFF2, G2+TG2) + 3 lab slot keys = 6 unique slot keys
    expect(ece2009Slots.length).toBe(6);

    // Verify multi-faculty slot in ECE2016
    const a2Slot = (facultiesJson as any)["ECE2016_A2+TA2+TAA2"];
    expect(a2Slot.length).toBe(2);
    expect(a2Slot.map((f: any) => f.faculty)).toContain("ANSHUMAN CHOUDHARY");
    expect(a2Slot.map((f: any) => f.faculty)).toContain("G Bharath Reddy");

    // Verify multi-faculty slots in ECE2006
    const b1Slot = (facultiesJson as any)["ECE2006_B1+TB1"];
    expect(b1Slot.length).toBe(2);
    expect(b1Slot.map((f: any) => f.faculty)).toContain("Kalapraveen Bagadi");
    expect(b1Slot.map((f: any) => f.faculty)).toContain("Hanumantharao Bitra");

    const b2Slot = (facultiesJson as any)["ECE2006_B2+TB2"];
    expect(b2Slot.length).toBe(2);
    expect(b2Slot.map((f: any) => f.faculty)).toContain("Hanumantharao Bitra");
    expect(b2Slot.map((f: any) => f.faculty)).toContain("Suseela Vappangi");

    // Verify multi-faculty slots in ECE3006
    const f2Slot = (facultiesJson as any)["ECE3006_F2+TF2"];
    expect(f2Slot.length).toBe(2);
    expect(f2Slot.map((f: any) => f.faculty)).toContain("PILLUTLA SIVA RAMAKRISHNA");
    expect(f2Slot.map((f: any) => f.faculty)).toContain("Aruru Sai Kumar");
  });
});
