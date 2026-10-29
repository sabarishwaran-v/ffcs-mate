import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function mergeSeniorCourses() {
  console.log('🔄 Merging Senior Courses into courses.json and winter_raw_slots.json...');

  const coursesPath = path.resolve('lib/courses.json');
  const winterRawPath = path.resolve('lib/winter_raw_slots.json');
  const seniorRawPath = path.resolve('lib/senior_raw_slots.json');

  const currentCourses = JSON.parse(fs.readFileSync(coursesPath, 'utf-8'));
  const winterRaw = JSON.parse(fs.readFileSync(winterRawPath, 'utf-8'));
  const seniorRaw = JSON.parse(fs.readFileSync(seniorRawPath, 'utf-8'));

  // Get historical credits lookup from git if available
  let histCreditMap: Record<string, number> = {};
  try {
    const gitOut = execSync('git show e26efbb:lib/courses.json', { maxBuffer: 10 * 1024 * 1024 });
    const histCourses = JSON.parse(gitOut.toString());
    for (const c of histCourses) {
      histCreditMap[c.code] = c.credits;
    }
  } catch (e) {
    console.warn('Could not load historical credits, using default curriculum credit mapping.');
  }

  // Map existing courses by courseCode
  const coursesMap = new Map<string, any>();
  for (const c of currentCourses) {
    coursesMap.set(c.code, c);
  }

  // Process senior offerings
  for (const item of seniorRaw) {
    const { courseCode, courseTitle, courseType, slot } = item;

    if (!coursesMap.has(courseCode)) {
      let credits = 4;
      if (courseCode === 'CSE1005') {
        credits = 4;
      } else if (courseCode.startsWith('STS')) {
        credits = 1;
      } else if (histCreditMap[courseCode]) {
        credits = histCreditMap[courseCode];
      } else if (courseCode.startsWith('LIB') || courseCode.startsWith('HUM') || courseCode.startsWith('FRL')) {
        credits = 3;
      } else if (courseCode.startsWith('ECS') || courseType === 'PJT') {
        credits = 2;
      } else if (courseType === 'LO') {
        credits = 2;
      } else if (courseType === 'TH') {
        credits = 3;
      } else {
        credits = 4;
      }

      coursesMap.set(courseCode, {
        id: courseCode,
        code: courseCode,
        name: courseTitle,
        type: courseType,
        credits: credits,
        theorySlots: [],
        labSlots: []
      });
    }

    const courseObj = coursesMap.get(courseCode)!;
    const isLab = courseType === 'ELA' || courseType === 'LO' || (slot.startsWith('L') && /[0-9]/.test(slot));

    if (isLab) {
      if (courseObj.type === 'TH') courseObj.type = 'ETH';
      if (slot && slot !== 'NILL' && slot !== 'NIL' && !courseObj.labSlots.includes(slot)) {
        courseObj.labSlots.push(slot);
      }
    } else {
      if (courseObj.type === 'LO') courseObj.type = 'ETH';
      if (slot && slot !== 'NILL' && slot !== 'NIL' && !courseObj.theorySlots.includes(slot)) {
        courseObj.theorySlots.push(slot);
      }
    }
  }

  // Sort courses: popular freshers first, then alphabetically
  const topCodes = ['CSE1022', 'MAT1002', 'PHY1008', 'CHY1009'];
  const finalCourses = Array.from(coursesMap.values()).sort((a, b) => {
    const aIsTop = topCodes.includes(a.code);
    const bIsTop = topCodes.includes(b.code);
    if (aIsTop && !bIsTop) return -1;
    if (!aIsTop && bIsTop) return 1;
    return a.code.localeCompare(b.code);
  });

  // Combine winter_raw_slots with senior-only offerings
  const existingWinterCodes = new Set(winterRaw.map((s: any) => s.courseCode));
  const seniorOnlyOfferings = seniorRaw.filter((s: any) => !existingWinterCodes.has(s.courseCode));
  const combinedWinterRaw = [...winterRaw, ...seniorOnlyOfferings];

  // Write files
  fs.writeFileSync(coursesPath, JSON.stringify(finalCourses, null, 2) + '\n');
  fs.writeFileSync(winterRawPath, JSON.stringify(combinedWinterRaw, null, 2) + '\n');

  console.log(`\n🎉 Success!`);
  console.log(`- Total courses in lib/courses.json: ${finalCourses.length} (was ${currentCourses.length})`);
  console.log(`- Total offerings in lib/winter_raw_slots.json: ${combinedWinterRaw.length} (was ${winterRaw.length})`);
}

mergeSeniorCourses().catch((err) => {
  console.error('Error merging senior courses:', err);
  process.exit(1);
});
