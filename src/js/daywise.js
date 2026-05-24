export function renderDayWiseView() {
    const $container = $('#daywise-content');
    $container.empty();

    if (!window.activeSchema || !window.activeTable || !window.activeTable.data) {
        return;
    }

    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const dayNames = {
        'mon': 'MON', 'tue': 'TUE', 'wed': 'WED', 
        'thu': 'THU', 'fri': 'FRI', 'sat': 'SAT', 'sun': 'SUN'
    };

    function timeToMinutes(timeStr) {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    }

    function formatTime(timeStr) {
        if (!timeStr) return '';
        let [h, m] = timeStr.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
    }

    // Modern Pastel Palette matching the UniPlan mockup with distinct Theory/Lab shades
    const palette = [
        { // Blue
            theory: { bg: '#e3f2fd', border: '#64b5f6', text: '#0d47a1' },
            lab: { bg: '#bbdefb', border: '#42a5f5', text: '#0d47a1' } 
        },
        { // Green
            theory: { bg: '#e8f5e9', border: '#81c784', text: '#1b5e20' },
            lab: { bg: '#c8e6c9', border: '#66bb6a', text: '#1b5e20' }
        },
        { // Orange
            theory: { bg: '#fff3e0', border: '#ffb74d', text: '#e65100' },
            lab: { bg: '#ffe0b2', border: '#ffa726', text: '#e65100' }
        },
        { // Purple
            theory: { bg: '#f3e5f5', border: '#ba68c8', text: '#4a148c' },
            lab: { bg: '#e1bee7', border: '#ab47bc', text: '#4a148c' }
        },
        { // Cyan
            theory: { bg: '#e0f7fa', border: '#4dd0e1', text: '#006064' },
            lab: { bg: '#b2ebf2', border: '#26c6da', text: '#006064' }
        },
        { // Red
            theory: { bg: '#ffebee', border: '#e57373', text: '#b71c1c' },
            lab: { bg: '#ffcdd2', border: '#ef5350', text: '#b71c1c' }
        },
        { // Yellow/Amber
            theory: { bg: '#fff8e1', border: '#ffd54f', text: '#f57f17' },
            lab: { bg: '#ffecb3', border: '#ffca28', text: '#f57f17' }
        },
        { // Teal
            theory: { bg: '#e0f2f1', border: '#4db6ac', text: '#004d40' },
            lab: { bg: '#b2dfdb', border: '#26a69a', text: '#004d40' }
        }
    ];

    // Assign unique colors to courses dynamically to prevent repetition
    let courseColorMap = {};
    let nextColorIndex = 0;

    function getColorForCourse(courseCode, isLab) {
        if (!(courseCode in courseColorMap)) {
            courseColorMap[courseCode] = nextColorIndex % palette.length;
            nextColorIndex++;
        }
        const colorTheme = palette[courseColorMap[courseCode]];
        return isLab ? colorTheme.lab : colorTheme.theory;
    }

    // Global timeline bounds
    const startHour = 8; // 8:00 AM
    const endHour = 20; // 8:00 PM (12 hours span)
    const totalMinutes = (endHour - startHour) * 60;
    
    // UI Constants
    const pixelsPerMinute = 1.5; // Controls vertical scale
    const timelineHeight = totalMinutes * pixelsPerMinute; 

    let hasAnyClasses = false;
    let dayData = {};

    days.forEach(day => {
        let dayBlocks = [];

        const checkSchemaType = (typeList, isLab) => {
            typeList.forEach(slotDef => {
                if (slotDef.days && slotDef.days[day]) {
                    const slotName = slotDef.days[day];
                    const userCourse = window.activeTable.data.find(c => {
                        return c.slots.some(s => {
                            const subSlots = s.split('+').map(part => part.trim());
                            return subSlots.includes(slotName);
                        });
                    });
                    
                    if (userCourse) {
                        dayBlocks.push({
                            start: slotDef.start,
                            end: slotDef.end,
                            startMin: timeToMinutes(slotDef.start),
                            endMin: timeToMinutes(slotDef.end),
                            courseCode: userCourse.courseCode,
                            title: userCourse.courseTitle || userCourse.courseCode,
                            venue: userCourse.venue,
                            isLab: isLab,
                            slot: slotName
                        });
                    }
                }
            });
        };

        if (window.activeSchema.theory) checkSchemaType(window.activeSchema.theory, false);
        if (window.activeSchema.lab) checkSchemaType(window.activeSchema.lab, true);

        if (dayBlocks.length > 0) hasAnyClasses = true;

        dayBlocks.sort((a, b) => a.startMin - b.startMin);

        // Merge contiguous slots of the SAME course
        let mergedBlocks = [];
        let currentBlock = null;

        dayBlocks.forEach(block => {
            if (!currentBlock) {
                currentBlock = Object.assign({}, block);
            } else {
                if (currentBlock.courseCode === block.courseCode && currentBlock.isLab === block.isLab && (block.startMin - currentBlock.endMin <= 10)) {
                    currentBlock.end = block.end;
                    currentBlock.endMin = block.endMin;
                } else {
                    mergedBlocks.push(currentBlock);
                    currentBlock = Object.assign({}, block);
                }
            }
        });
        if (currentBlock) mergedBlocks.push(currentBlock);

        // Add Free Time blocks
        let finalBlocks = [];
        for (let i = 0; i < mergedBlocks.length; i++) {
            finalBlocks.push(mergedBlocks[i]);
            if (i < mergedBlocks.length - 1) {
                const currentEnd = mergedBlocks[i].endMin;
                const nextStart = mergedBlocks[i + 1].startMin;
                const diff = nextStart - currentEnd;

                // Only consider gaps >= 45 mins as free time (ignores 10 min transit breaks)
                if (diff >= 45) {
                    finalBlocks.push({
                        isFreeTime: true,
                        startMin: currentEnd,
                        endMin: nextStart,
                        start: mergedBlocks[i].end,
                        end: mergedBlocks[i + 1].start
                    });
                }
            }
        }

        dayData[day] = finalBlocks;
    });

    if (!hasAnyClasses) {
        $container.append(`
            <div class="text-center text-muted p-5 bg-white rounded-4 shadow-sm border border-light">
                <i class="fas fa-calendar-times fa-3x mb-3 text-light"></i>
                <h5>No Classes Scheduled</h5>
                <p>Your timetable is completely empty!</p>
            </div>
        `);
        return;
    }

    // Build the visual calendar grid
    let gridHtml = `
    <div class="calendar-view-wrapper bg-white rounded-4 border border-light shadow-sm overflow-auto" style="position: relative; max-height: 75vh;">
        <!-- Header Row (Days) -->
        <div class="d-flex sticky-top bg-white z-2" style="border-bottom: 1px solid #f0f0f0;">
            <div style="width: 70px; flex-shrink: 0;"></div>
    `;

    // Only show Mon-Fri by default, include Sat/Sun if they have classes
    const visibleDays = days.filter(d => ['mon', 'tue', 'wed', 'thu', 'fri'].includes(d) || (dayData[d] && dayData[d].length > 0));

    visibleDays.forEach(day => {
        gridHtml += `
            <div class="flex-grow-1 text-center py-3 fw-bold text-dark" style="flex-basis: 0; min-width: 120px; border-left: 1px solid #f0f0f0;">
                ${dayNames[day]}
            </div>
        `;
    });

    gridHtml += `
        </div>
        <!-- Timeline Body -->
        <div class="d-flex position-relative" style="height: ${timelineHeight}px;">
            <!-- Y-Axis Time Labels -->
            <div style="width: 70px; flex-shrink: 0; position: relative;">
    `;

    // Generate hour ticks
    for (let h = startHour; h <= endHour; h++) {
        const top = (h - startHour) * 60 * pixelsPerMinute;
        const displayHour = h % 12 === 0 ? 12 : h % 12;
        const ampm = h >= 12 ? 'PM' : 'AM';
        
        gridHtml += `
                <div class="text-end text-muted small pe-2" style="position: absolute; top: ${top - 10}px; width: 100%;">
                    ${displayHour}:00 ${ampm}
                </div>
        `;
    }

    gridHtml += `
            </div>
            <!-- Horizontal Grid Lines (background) -->
            <div class="position-absolute w-100 h-100" style="left: 70px; z-index: 0; pointer-events: none;">
    `;
    
    for (let h = startHour; h <= endHour; h++) {
        const top = (h - startHour) * 60 * pixelsPerMinute;
        gridHtml += `<div style="position: absolute; top: ${top}px; width: 100%; border-top: 1px solid #f0f0f0;"></div>`;
    }

    gridHtml += `
            </div>
    `;

    // Render columns
    visibleDays.forEach(day => {
        gridHtml += `
            <div class="flex-grow-1 position-relative z-1" style="flex-basis: 0; min-width: 120px; border-left: 1px solid #f0f0f0;">
        `;

        dayData[day].forEach(block => {
            const topPx = (block.startMin - (startHour * 60)) * pixelsPerMinute;
            const heightPx = (block.endMin - block.startMin) * pixelsPerMinute;

            if (block.isFreeTime) {
                gridHtml += `
                    <div class="position-absolute rounded-3 shadow-none p-2 overflow-hidden d-flex flex-column align-items-center justify-content-center" 
                         style="
                            top: ${topPx}px; 
                            height: ${heightPx}px; 
                            left: 4px; 
                            right: 4px;
                            background-color: #FFF8E1;
                            border: 1px dashed #FFCA28;
                            color: #E65100;
                         "
                    >
                        <div class="fw-bold lh-sm mb-1" style="font-size: 0.85rem;">
                            <i class="fas fa-hourglass-half me-1"></i>FREE TIME
                        </div>
                        <div class="opacity-75 fw-medium" style="font-size: 0.7rem;">
                            ${formatTime(block.start)} - ${formatTime(block.end)}
                        </div>
                    </div>
                `;
            } else {
                const colorTheme = getColorForCourse(block.courseCode, block.isLab);
                const typeText = block.isLab ? 'Lab' : 'Lecture';
                const icon = block.isLab ? 'fa-flask' : 'fa-chalkboard-teacher';

                gridHtml += `
                    <div class="position-absolute rounded-3 shadow-sm p-2 overflow-hidden" 
                         style="
                            top: ${topPx}px; 
                            height: ${heightPx}px; 
                            left: 4px; 
                            right: 4px;
                            background-color: ${colorTheme.bg};
                            border: 1px solid ${colorTheme.border};
                            border-left: 4px solid ${colorTheme.border};
                            color: ${colorTheme.text};
                            transition: transform 0.1s;
                            cursor: pointer;
                         "
                         onmouseover="this.style.transform='scale(1.02)'"
                         onmouseout="this.style.transform='scale(1)'"
                    >
                        <div class="fw-bold lh-sm mb-1" style="font-size: 0.85rem;">
                            <i class="fas ${icon} me-1 opacity-75"></i>${block.courseCode}
                        </div>
                        <div class="opacity-75 lh-sm" style="font-size: 0.7rem; margin-bottom: 2px;">
                            [${typeText}] ${block.venue ? ' - ' + block.venue : ''}
                        </div>
                        <div class="opacity-75 fw-medium" style="font-size: 0.7rem;">
                            ${formatTime(block.start)} - ${formatTime(block.end)}
                        </div>
                    </div>
                `;
            }
        });

        gridHtml += `
            </div>
        `;
    });

    gridHtml += `
        </div>
    </div>
    `;

    $container.append(gridHtml);
}
window.renderDayWiseView = renderDayWiseView;
