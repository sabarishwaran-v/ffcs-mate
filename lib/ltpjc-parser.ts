import { Course } from "@/types";

export interface LTPJC {
  L: number;
  T: number;
  P: number;
  J: number;
  C: number;
}

export function parseLTPJC(course: Course): LTPJC {
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
    if (course.hasProjectComponent) baseC += 1;
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

  const type = (course.type || "TH").toUpperCase();
  
  let L = theoryTokens;
  let T = 0;
  let P = practicalTokens;
  let J = 0;
  
  if (type === "PJT" || course.hasProjectComponent) {
    J = 1;
  }

  // Calculate C mathematically from the components
  let C = L + T + (P / 2) + J;

  // Handle case where course might be pure lab but type is not set properly
  if (type === "LO") {
    L = 0;
    P = practicalTokens;
    C = (P / 2) + J;
  }

  return { L, T, P, J, C };
}

export function getCreditsFromSlotString(slotString: string, course?: Course): number {
  if (!slotString || slotString === "NILL") return course?.credits || 0;

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

  // If course has a project and this is a theory slot (or course is PJT), add the project credit here
  // so it's not lost. We assume theory component takes the project credit in embedded courses.
  if (course && (course.type === "PJT" || course.hasProjectComponent) && theoryTokens > 0) {
    C += 1;
  }
  // Fallback if computed C is 0 (e.g. unknown token format)
  return C > 0 ? C : (course?.credits || 0);
}
