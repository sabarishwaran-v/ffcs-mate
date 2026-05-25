import $ from 'jquery';

$(() => {
    $('#parse-btn').on('click', () => {
        const rawText = $('#vtop-input').val().trim();
        if (!rawText) {
            alert("Please paste the timetable text from VTOP.");
            return;
        }
        
        try {
            const schema = parseTimetable(rawText);
            $('#json-output').text(JSON.stringify(schema, null, 4));
        } catch (e) {
            alert("Error parsing timetable. Make sure you copied the entire grid including headers.\n\nError details: " + e.message);
            console.error(e);
        }
    });
    
    $('#copy-btn').on('click', () => {
        const jsonText = $('#json-output').text();
        navigator.clipboard.writeText(jsonText).then(() => {
            const $btn = $('#copy-btn');
            $btn.html('<i class="fas fa-check me-1"></i>Copied!');
            setTimeout(() => {
                $btn.html('<i class="fas fa-copy me-1"></i>Copy JSON');
            }, 2000);
        });
    });
});

function parseTimetable(rawText) {
    // Split by lines and then by tabs, cleaning whitespace
    const lines = rawText.split('\n')
                         .map(l => l.trim().split('\t').map(c => c.trim()))
                         .filter(l => l.length > 0 && l[0] !== ''); // Remove empty lines
    
    let theoryHeaderStart = null, theoryHeaderEnd = null;
    let labHeaderStart = null, labHeaderEnd = null;
    let daysData = [];

    // First pass: locate headers and collect data rows
    let i = 0;
    while(i < lines.length) {
        if(lines[i][0] === 'THEORY' && lines[i][1] === 'Start') {
            theoryHeaderStart = lines[i];
        } else if(lines[i][0] === 'End' && theoryHeaderStart && !theoryHeaderEnd) {
            theoryHeaderEnd = lines[i];
        } else if(lines[i][0] === 'LAB' && lines[i][1] === 'Start') {
            labHeaderStart = lines[i];
        } else if(lines[i][0] === 'End' && labHeaderStart && !labHeaderEnd) {
            labHeaderEnd = lines[i];
        } else {
            const validStart = ['MON','TUE','WED','THU','FRI','SAT','SUN','LAB','THEORY'];
            if(lines[i].length >= 2 && validStart.includes(lines[i][0].toUpperCase())) {
                daysData.push(lines[i]);
            }
        }
        i++;
    }
    
    if (!theoryHeaderStart || !theoryHeaderEnd || !labHeaderStart || !labHeaderEnd) {
        throw new Error("Could not find all required headers (THEORY Start/End, LAB Start/End).");
    }

    const theorySchema = [];
    const labSchema = [];

    // Parse Theory Columns
    for(let c = 2; c < theoryHeaderStart.length; c++) {
        let start = theoryHeaderStart[c];
        if (start.toLowerCase() === 'lunch') {
            theorySchema.push({ lunch: true });
        } else {
            // End array is shifted left because it doesn't have the 'THEORY' label
            let end = theoryHeaderEnd[c-1];
            theorySchema.push({ start, end, days: {} });
        }
    }
    
    // Parse Lab Columns
    for(let c = 2; c < labHeaderStart.length; c++) {
        let start = labHeaderStart[c];
        if (start.toLowerCase() === 'lunch') {
            labSchema.push({ lunch: true });
        } else {
            // End array shifted by 1
            let end = labHeaderEnd[c-1];
            labSchema.push({ start, end, days: {} });
        }
    }
    
    // Parse Grid
    let currentDay = '';
    for (let row of daysData) {
        const firstCol = row[0].toUpperCase();
        
        if (['MON','TUE','WED','THU','FRI','SAT','SUN'].includes(firstCol)) {
            currentDay = firstCol.toLowerCase();
            
            // Theory Row (Starts with Day, then THEORY)
            if (row.length > 1 && row[1].toUpperCase() === 'THEORY') {
                let offset = 2;
                for (let c = offset; c < row.length; c++) {
                    let schemaIdx = c - offset;
                    if (theorySchema[schemaIdx] && !theorySchema[schemaIdx].lunch) {
                        let cleanSlot = cleanSlotName(row[c]);
                        if (cleanSlot) theorySchema[schemaIdx].days[currentDay] = cleanSlot;
                    }
                }
            }
        } else if (firstCol === 'LAB' && currentDay !== '') {
            // Lab Row (Starts with LAB directly below Theory row)
            let offset = 1;
            for (let c = offset; c < row.length; c++) {
                let schemaIdx = c - offset;
                if (labSchema[schemaIdx] && !labSchema[schemaIdx].lunch) {
                    let cleanSlot = cleanSlotName(row[c]);
                    if (cleanSlot) labSchema[schemaIdx].days[currentDay] = cleanSlot;
                }
            }
        }
    }
    
    return {
        theory: theorySchema,
        lab: labSchema
    };
}

function cleanSlotName(raw) {
    if (!raw || raw === '-' || raw === '--' || raw.toLowerCase() === 'lunch') {
        return null;
    }
    // Extract base slot name (e.g., TFF1-CSE2005-ETH... -> TFF1)
    let slot = raw.split('-')[0].trim();
    if (slot === '') return null;
    return slot;
}
