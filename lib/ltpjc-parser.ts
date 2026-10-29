import { Course } from "@/types";

export interface LTPJC {
  L: number;
  T: number;
  P: number;
  J: number;
  C: number;
}

export function parseLTPJC(course: Course): LTPJC {
  const code = course.code || course.id || "";
  const type = (course.type || "TH").toUpperCase();
  const credits = course.credits || 4;

  // STS courses: strictly 1 credit
  if (code.startsWith("STS")) {
    return { L: 0, T: 0, P: 2, J: 0, C: credits };
  }

  // Extract the first available slot string
  let slotString = "";
  if (course.theorySlots && course.theorySlots.length > 0 && course.theorySlots[0] !== "NILL") {
    slotString += course.theorySlots[0];
  }
  if (course.labSlots && course.labSlots.length > 0 && course.labSlots[0] !== "NILL") {
    if (slotString) slotString += "+";
    slotString += course.labSlots[0];
  }

  // Handle courses with no slots
  if (!slotString) {
    let baseC = course.credits || 0;
    let baseJ = course.hasProjectComponent ? 1 : 0;
    if (course.hasProjectComponent && !course.credits) baseC += 1;
    return { L: 0, T: 0, P: 0, J: baseJ, C: baseC };
  }

  const tokens = slotString.split("+").map((t) => t.trim()).filter((t) => t.length > 0);

  let practicalTokens = 0;
  let theoryTokens = 0;

  tokens.forEach((token) => {
    if (token.startsWith("L")) {
      practicalTokens += 1;
    } else {
      // Main slots (A1-G1, A2-G2) are 2 hours each
      if (/^[A-G][1-2]$/.test(token)) {
        theoryTokens += 2;
      } else {
        theoryTokens += 1;
      }
    }
  });

  let L = theoryTokens;
  let T = 0;
  let P = practicalTokens;
  let J = (type === "PJT" || course.hasProjectComponent) ? 1 : 0;

  if (type === "LO") {
    L = 0;
  }

  // Always respect official course.credits when defined
  let C = (typeof course.credits === "number" && course.credits > 0)
    ? course.credits
    : (L + T + (P / 2) + J);

  return { L, T, P, J, C };
}

export function getCreditsFromSlotString(slotString: string, course?: Course): number {
  if (!slotString || slotString === "NILL") return course?.credits || 0;

  if (course && typeof course.credits === "number" && course.credits > 0) {
    // Pure Theory or Soft Skills (no lab component in curriculum)
    if (!course.labSlots || course.labSlots.length === 0 || course.type === "TH" || course.type === "SS") {
      return course.credits;
    }
    // Pure Lab (no theory component in curriculum)
    if (!course.theorySlots || course.theorySlots.length === 0 || course.type === "LO") {
      return course.credits;
    }
    // Embedded course with both Theory and Lab components:
    const isLab = slotString.split("+").some((t) => t.trim().startsWith("L") && /[0-9]/.test(t));
    if (isLab) {
      const practicalTokens = slotString.split("+").filter((t) => t.trim().startsWith("L")).length;
      return Math.max(1, practicalTokens / 2);
    } else {
      // Theory component gets the remaining credits
      return Math.max(1, course.credits - 1);
    }
  }

  // Fallback calculation from tokens if course metadata is unavailable
  const tokens = slotString.split("+").map((t) => t.trim()).filter((t) => t.length > 0);
  let practicalTokens = 0;
  let theoryTokens = 0;

  tokens.forEach((token) => {
    if (token.startsWith("L")) {
      practicalTokens += 1;
    } else {
      if (/^[A-G][1-2]$/.test(token)) {
        theoryTokens += 2;
      } else {
        theoryTokens += 1;
      }
    }
  });

  let C = theoryTokens + (practicalTokens / 2);

  if (course && (course.type === "PJT" || course.hasProjectComponent) && theoryTokens > 0) {
    C += 1;
  }
  return C > 0 ? C : (course?.credits || 0);
}
