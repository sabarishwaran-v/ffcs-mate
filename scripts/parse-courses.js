const fs = require('fs');
const PDFParser = require('pdf2json');

let pdfParser = new PDFParser(this, 1);

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    const rawText = pdfParser.getRawTextContent();
    const lines = rawText.split('\r\n');
    
    const coursesMap = {};

    for (let line of lines) {
        line = line.trim();
        if (!line || line.includes('COURSE CODE') || line.includes('ANNEXURE') || line.includes('Page')) continue;

        // Split by multiple spaces or single spaces and filter out empty strings
        const parts = line.split(/\s+/).filter(Boolean);
        if (parts.length < 4) continue;

        // E.g. CAP4001 Capstone PJT NILL
        // However, pdf2json getRawTextContent might format it differently.
        const slot = parts.pop();
        const type = parts.pop();
        const code = parts.shift();
        const title = parts.join(' ');

        if (!code.match(/^[A-Z]{3,4}\d{4}$/)) continue;

        if (!coursesMap[code]) {
            coursesMap[code] = {
                id: code,
                code: code,
                name: title,
                type: type,
                credits: 4, // Default placeholder
                theorySlots: [],
                labSlots: []
            };
        }

        if (slot !== 'NILL') {
            // Some slots are comma separated, others + separated.
            const slots = slot.split('+');
            const isLab = slots.some(s => s.startsWith('L') && /[0-9]/.test(s));
            
            if (isLab) {
                if (!coursesMap[code].labSlots.includes(slot)) {
                    coursesMap[code].labSlots.push(slot);
                }
            } else {
                if (!coursesMap[code].theorySlots.includes(slot)) {
                    coursesMap[code].theorySlots.push(slot);
                }
            }
        }

        if (coursesMap[code].type !== type && !coursesMap[code].type.includes(type)) {
            coursesMap[code].type += '+' + type;
        }
    }

    const finalCourses = Object.values(coursesMap);
    const output = JSON.stringify(finalCourses, null, 2) + '\n';
    fs.writeFileSync('lib/courses.json', output);
    console.log(`Successfully parsed ${finalCourses.length} unique courses and generated lib/courses.json`);
});

pdfParser.loadPDF("ANNEXURE -II List of courses and Slots.pdf");
