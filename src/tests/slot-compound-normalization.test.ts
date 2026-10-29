import { describe, it, expect } from "vitest";
import { getAllSlots, getVenueForSlot, isMorningSlot, isAfternoonSlot } from "../utils/timetable";
import { hasClashUsingMap, getDetailedClashMessage, check8amClash, hasClashSlot } from "../utils/clash-detection";
import { vitapSlotMapping } from "@/lib/vitap-slot-mapping";
import { Teacher } from "@/types";

describe("Compound Slot Normalization & Timetable Grid Compatibility", () => {
  const dbmsTheoryTeacher: Teacher = {
    id: "CSE2007_C1+TC1_Ajith_Jubilson_E",
    course: "CSE2007",
    name: "C1+TC1",
    faculty: "Ajith Jubilson E",
    color: "#8b5cf6",
    slots: {
      morning: ["C1+TC1"],
      afternoon: null,
    },
    venue: {
      morning: "CB-425",
      afternoon: null,
    },
  };

  const dbmsLabTeacher: Teacher = {
    id: "CSE2007_L39+L40_Ajith_Jubilson_E",
    course: "CSE2007",
    name: "L39+L40",
    faculty: "Ajith Jubilson E",
    color: "#0ea5e9",
    slots: {
      morning: ["L39+L40"],
      afternoon: null,
    },
    venue: {
      morning: "CB-105",
      afternoon: null,
    },
  };

  it("splits compound slots into individual periods via getAllSlots", () => {
    const theorySlots = getAllSlots(dbmsTheoryTeacher);
    expect(theorySlots).toEqual(["C1", "TC1"]);

    const labSlots = getAllSlots(dbmsLabTeacher);
    expect(labSlots).toEqual(["L39", "L40"]);

    const triSlotTeacher: Teacher = {
      id: "CSE1005_B1+TB1+TBB1",
      course: "CSE1005",
      name: "B1+TB1+TBB1",
      faculty: "D. Santhadevi",
      color: "#8b5cf6",
      slots: {
        morning: ["B1+TB1+TBB1"],
        afternoon: null,
      },
      venue: {
        morning: "CB-323",
        afternoon: null,
      },
    };
    expect(getAllSlots(triSlotTeacher)).toEqual(["B1", "TB1", "TBB1"]);
  });

  it("maps individual periods to vitapSlotMapping cells for Timetable Grid rendering", () => {
    const theorySlots = getAllSlots(dbmsTheoryTeacher);
    // Every slot extracted must exist in vitapSlotMapping
    theorySlots.forEach((slot) => {
      expect(vitapSlotMapping[slot]).toBeDefined();
      expect(vitapSlotMapping[slot].length).toBeGreaterThan(0);
    });

    const labSlots = getAllSlots(dbmsLabTeacher);
    labSlots.forEach((slot) => {
      expect(vitapSlotMapping[slot]).toBeDefined();
      expect(vitapSlotMapping[slot].length).toBeGreaterThan(0);
    });

    // Specifically verify C1, TC1, L39, L40 schedule positions
    const c1Schedules = vitapSlotMapping["C1"];
    expect(c1Schedules.some((s) => s.day === "THU" && s.time === "09:00-09:50")).toBe(true);
    expect(c1Schedules.some((s) => s.day === "SAT" && s.time === "10:00-10:50")).toBe(true);

    const tc1Schedules = vitapSlotMapping["TC1"];
    expect(tc1Schedules.some((s) => s.day === "TUE" && s.time === "11:00-11:50")).toBe(true);

    const l39Schedules = vitapSlotMapping["L39"];
    expect(l39Schedules.some((s) => s.day === "WED" && s.time === "16:00-16:50")).toBe(true);

    const l40Schedules = vitapSlotMapping["L40"];
    expect(l40Schedules.some((s) => s.day === "WED" && s.time === "16:50-17:40")).toBe(true);
  });

  it("retrieves venue correctly for individual slots of a compound slot teacher", () => {
    expect(getVenueForSlot(dbmsTheoryTeacher, "C1")).toBe("CB-425");
    expect(getVenueForSlot(dbmsTheoryTeacher, "TC1")).toBe("CB-425");
    expect(getVenueForSlot(dbmsLabTeacher, "L39")).toBe("CB-105");
    expect(getVenueForSlot(dbmsLabTeacher, "L40")).toBe("CB-105");
    expect(getVenueForSlot(dbmsTheoryTeacher, "A1")).toBeNull();
  });

  it("correctly identifies morning and afternoon slots for compound definitions", () => {
    expect(isMorningSlot("C1+TC1")).toBe(true);
    expect(isMorningSlot("L1+L2")).toBe(true);
    expect(isAfternoonSlot("L39+L40")).toBe(true);
    expect(isAfternoonSlot("C2+TC2")).toBe(true);
  });

  it("accurately detects clashes when teachers have compound slots", () => {
    // Teacher with C1 should clash with Teacher with C1+TC1
    const clashingTeacher: Teacher = {
      id: "TEST_C1",
      course: "TEST101",
      name: "C1",
      faculty: "Prof Test",
      color: "#8b5cf6",
      slots: {
        morning: ["C1"],
        afternoon: null,
      },
      venue: {
        morning: "CB-101",
        afternoon: null,
      },
    };

    expect(hasClashUsingMap(dbmsTheoryTeacher, clashingTeacher).length).toBeGreaterThan(0);
    const clashMsg = getDetailedClashMessage(dbmsTheoryTeacher, clashingTeacher, "DBMS", "TEST101");
    expect(clashMsg).toBeDefined();
    expect(clashMsg).toContain("C1");

    // hasClashSlot should also return true
    expect(hasClashSlot("C1", dbmsTheoryTeacher)).toBe(true);
    expect(hasClashSlot("TC1", dbmsTheoryTeacher)).toBe(true);
    expect(hasClashSlot("C1+TC1", dbmsTheoryTeacher)).toBe(true);

    // Lab L39+L40 should clash with another lab that uses L39
    const clashingLab: Teacher = {
      id: "TEST_LAB",
      course: "TEST102",
      name: "L39+L40",
      faculty: "Prof Lab",
      color: "#0ea5e9",
      slots: {
        morning: ["L39+L40"],
        afternoon: null,
      },
      venue: {
        morning: "CB-201",
        afternoon: null,
      },
    };
    expect(hasClashUsingMap(dbmsLabTeacher, clashingLab).length).toBeGreaterThan(0);
    expect(hasClashSlot("L39+L40", dbmsLabTeacher)).toBe(true);
    expect(hasClashSlot("L39", dbmsLabTeacher)).toBe(true);
    expect(hasClashSlot("L40", dbmsLabTeacher)).toBe(true);
  });

  it("detects 8 AM clash when compound slot contains an 8 AM period", () => {
    // TFF1 is 08:00 on Tuesday
    const tff1Teacher: Teacher = {
      id: "TEST_8AM",
      course: "TEST800",
      name: "TFF1",
      faculty: "Early Bird",
      color: "#8b5cf6",
      slots: {
        morning: ["TFF1"],
        afternoon: null,
      },
      venue: {
        morning: "CB-101",
        afternoon: null,
      },
    };
    const clash8am = check8amClash(tff1Teacher, "TEST800", "ETH");
    expect(clash8am).toBeDefined();
    expect(clash8am).toContain("8 AM");

    // Normal C1+TC1 does not contain 8 AM
    const noClash = check8amClash(dbmsTheoryTeacher, "CSE2007", "ETH");
    expect(noClash).toBeNull();
  });
});
