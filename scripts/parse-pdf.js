const fs = require('fs');
const path = require('path');

/**
 * Usage: node scripts/parse-pdf.js path/to/course-list.pdf
 * Requires: npm install pdf-parse --legacy-peer-deps
 */

const filePath = process.argv[2];

if (!filePath) {
  console.error('Please provide a path to the PDF file.');
  process.exit(1);
}

let pdf;
try {
  pdf = require('pdf-parse');
} catch (e) {
  console.error("Error: pdf-parse not found. Run 'npm install pdf-parse --legacy-peer-deps'");
  process.exit(1);
}

const dataBuffer = fs.readFileSync(filePath);

pdf(dataBuffer).then(function(data) {
  const lines = data.text.split(/\n/).filter(Boolean);
  const courseMap = new Map();
  // Standard VIT-AP format matching: CODE NAME TYPE SLOT
  const courseRegex = /([A-Z]{3}\d{4})\s+(.+?)\s+(ETH|TH|ELA|LO|PJT)\s+([A-Z0-9\+\-]+|NILL)/g;
  
  for (let line of lines) {
    let match;
    while ((match = courseRegex.exec(line)) !== null) {
      const [_, code, name, type, slotStr] = match;
      const slotsArr = slotStr.split(/[\+\-]/).map(s => s.trim()).filter(Boolean);
      const theory = slotsArr.filter(s => !/^L\d+/i.test(s));
      const lab = slotsArr.filter(s => /^L\d+/i.test(s));
      const key = `${code}__${name.trim()}`;
      
      if (!courseMap.has(key)) {
        courseMap.set(key, {
          id: Math.random().toString(36).substr(2, 9),
          code,
          name: name.trim(),
          type,
          credits: 3, // Default, not in PDF
          theorySlots: [],
          labSlots: []
        });
      }
      
      const course = courseMap.get(key);
      if (theory.length) {
        const theoryStr = theory.join('+');
        if (!course.theorySlots.includes(theoryStr)) course.theorySlots.push(theoryStr);
      }
      if (lab.length) {
        const labStr = lab.join('+');
        if (!course.labSlots.includes(labStr)) course.labSlots.push(labStr);
      }
    }
  }
  
  const parsedCourses = Array.from(courseMap.values());
  const outPath = path.join(__dirname, '../lib/courses.json');
  fs.writeFileSync(outPath, JSON.stringify(parsedCourses, null, 2));
  console.log(`Parsed ${parsedCourses.length} courses successfully into lib/courses.json`);
}).catch(console.error);
