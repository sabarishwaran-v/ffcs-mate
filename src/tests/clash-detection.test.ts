import { expect, test } from "vitest";

import {
  teacherLabOnlyM1,
  teacherLabOnlyM2,
  teacherLabOnlyM3,
  teacherTheoryOnlyMA,
  teacherTheoryOnlyMB,
  teacherTheoryOnlyMC,
} from "../mocks/fake-data";
import {
  hasClashEnhanced,
  hasClashSlot,
  hasClashSlotEnhanced,
} from "../utils/clash-detection";

test("Theory Only Teachers", () => {
  const clashes = hasClashEnhanced(teacherTheoryOnlyMA, [
    teacherTheoryOnlyMB,
    teacherTheoryOnlyMC,
  ]);

  expect(clashes).toStrictEqual([]);
});

test("Lab Only Teachers", () => {
  const clashes = hasClashEnhanced(teacherLabOnlyM1, [
    teacherLabOnlyM2,
    teacherLabOnlyM3,
  ]);

  expect(clashes).toStrictEqual([]);
});

test("Theory and Lab Teachers Same Slot", () => {
  const clashes = hasClashEnhanced(teacherTheoryOnlyMA, [
    teacherTheoryOnlyMB,
    teacherTheoryOnlyMC,
    teacherLabOnlyM1,
    teacherLabOnlyM2,
    teacherLabOnlyM3,
  ]);

  expect(clashes).toStrictEqual([teacherLabOnlyM1]);
});

test("Teacher clash using slot", () => {
  const clashes = hasClashSlot("A1", teacherLabOnlyM1);

  expect(clashes).toBe(true);
});

test("Teacher clash using slot enhanced", () => {
  const clashes = hasClashSlotEnhanced("A1", [
    teacherLabOnlyM1,
    teacherTheoryOnlyMA,
  ]);

  expect(clashes).toStrictEqual([teacherLabOnlyM1, teacherTheoryOnlyMA]);
});
