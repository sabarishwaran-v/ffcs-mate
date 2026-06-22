import React from 'react';
import { useUserStore } from '../../store/useUserStore';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABELS: Record<string, string> = { mon: 'MON', tue: 'TUE', wed: 'WED', thu: 'THU', fri: 'FRI', sat: 'SAT' };

const schema = {
  theory: [
      { start: "08:00", end: "08:50", days: { tue: "TFF1", wed: "TEE1", thu: "TG1", fri: "TDD1" } },
      { start: "09:00", end: "09:50", days: { mon: "TA1", tue: "A1", wed: "D1", thu: "C1", fri: "B1", sat: "TC1" } },
      { start: "09:01", end: "09:51", days: { tue: "SE2", fri: "SA2" } },
      { start: "10:00", end: "10:50", days: { mon: "TB1", tue: "B1", wed: "F1", thu: "D1", fri: "A1", sat: "C1" } },
      { start: "10:01", end: "10:51", days: { tue: "SD2", fri: "SF2" } },
      { start: "11:00", end: "11:50", days: { mon: "E1", tue: "C1", wed: "G1", thu: "A1", fri: "G1", sat: "F1" } },
      { start: "11:01", end: "11:51", days: { wed: "TE1", thu: "SB2", fri: "TF1" } },
      { start: "12:00", end: "12:50", days: { mon: "E1", tue: "D1", wed: "B1", thu: "F1", fri: "E1", sat: "G1" } },
      { start: "12:01", end: "12:51", days: { wed: "SC2", sat: "TD1" } },
      { start: "13:00", end: "13:50", days: {} },
      { lunch: true },
      { start: "14:00", end: "14:50", days: { mon: "TA2", tue: "F2", wed: "D2", thu: "E2", fri: "TC2", sat: "G2" } },
      { start: "14:01", end: "14:51", days: { sat: "TD2" } },
      { start: "15:00", end: "15:50", days: { mon: "TB2", tue: "A2", wed: "F2", thu: "C2", fri: "B2", sat: "D2" } },
      { start: "15:01", end: "15:51", days: { tue: "SF1", fri: "SA1" } },
      { start: "16:00", end: "16:50", days: { mon: "E2", tue: "B2", wed: "B2", thu: "A2", fri: "A2", sat: "F2" } },
      { start: "16:01", end: "16:51", days: { tue: "SC1", wed: "SD1", thu: "SB1", fri: "SE1" } },
      { start: "17:00", end: "17:50", days: { mon: "E2", tue: "C2", wed: "G2", thu: "D2", fri: "G2", sat: "C2" } },
      { start: "17:01", end: "17:51", days: { wed: "TE2", fri: "TF2" } },
      { start: "18:00", end: "18:50", days: { tue: "TDD2", wed: "TG2", thu: "TFF2", fri: "TEE2" } },
      { start: "19:00", end: "19:50", days: {} }
  ],
  lab: [
      { start: "08:00", end: "08:50", days: { mon: "L61", tue: "L1", wed: "L7", thu: "L13", fri: "L19", sat: "L25" } },
      { start: "08:50", end: "09:40", days: { mon: "L62", tue: "L2", wed: "L8", thu: "L14", fri: "L20", sat: "L26" } },
      { start: "08:51", end: "09:41", days: {} },
      { start: "09:50", end: "10:40", days: { mon: "L63", tue: "L3", wed: "L9", thu: "L15", fri: "L21", sat: "L27" } },
      { start: "09:51", end: "10:41", days: {} },
      { start: "10:40", end: "11:30", days: { mon: "L64", tue: "L4", wed: "L10", thu: "L16", fri: "L22", sat: "L28" } },
      { start: "10:41", end: "11:31", days: {} },
      { start: "11:45", end: "12:30", days: { mon: "L65", tue: "L5", wed: "L11", thu: "L17", fri: "L23", sat: "L29" } },
      { start: "11:46", end: "12:31", days: {} },
      { start: "12:30", end: "13:10", days: { mon: "L66", tue: "L6", wed: "L12", thu: "L18", fri: "L24", sat: "L30" } },
      { lunch: true },
      { start: "14:00", end: "14:50", days: { mon: "L67", tue: "L31", wed: "L37", thu: "L43", fri: "L49", sat: "L55" } },
      { start: "14:01", end: "14:51", days: {} },
      { start: "14:50", end: "15:40", days: { mon: "L68", tue: "L32", wed: "L38", thu: "L44", fri: "L50", sat: "L56" } },
      { start: "14:51", end: "15:41", days: {} },
      { start: "16:00", end: "16:50", days: { mon: "L69", tue: "L33", wed: "L39", thu: "L45", fri: "L51", sat: "L57" } },
      { start: "16:01", end: "16:51", days: {} },
      { start: "16:50", end: "17:40", days: { mon: "L70", tue: "L34", wed: "L40", thu: "L46", fri: "L52", sat: "L58" } },
      { start: "16:51", end: "17:41", days: {} },
      { start: "18:00", end: "18:50", days: { mon: "L71", tue: "L35", wed: "L41", thu: "L47", fri: "L53", sat: "L59" } },
      { start: "18:50", end: "19:30", days: { mon: "L72", tue: "L36", wed: "L42", thu: "L48", fri: "L54", sat: "L60" } }
  ]
};

export default function TimetableGrid() {
  const hoveredSlots = useUserStore((state) => state.hoveredSlots);
  const selectedCourses = useUserStore((state) => state.selectedCourses);

  const borderColor = '#3c8dbc';
  const theoryTimeBg = '#ccccff';
  const labTimeBg = '#99ccff';
  const labelBg = '#e2e2e2';
  const theorySlotBg = '#ffffcc';
  const labSlotBg = '#f9efa4';
  const hoverBg = '#CCFF33';
  const emptyBg = '#ffffff';
  const filledText = '#000000';
  const emptyText = '#808080';

  const baseTdStyle: React.CSSProperties = {
    border: `1px solid ${borderColor}`,
    textAlign: 'center',
    verticalAlign: 'middle',
    padding: '3px',
    fontSize: '12px',
    cursor: 'default',
    userSelect: 'none'
  };

  const slotWidthStyle: React.CSSProperties = {
    width: '50px',
    minWidth: '50px'
  };

  return (
    <div className="w-full h-full overflow-auto bg-white p-6">
      <div className="min-w-max mx-auto shadow-sm">
        <table className="w-full border-collapse" style={{ border: `2px solid ${borderColor}` }}>
          <tbody>
            <tr>
              <td rowSpan={2} style={{ ...baseTdStyle, backgroundColor: labelBg, fontWeight: 'bold' }}>THEORY</td>
              <td style={{ ...baseTdStyle, backgroundColor: labelBg, fontWeight: 'bold' }}>Start</td>
              {schema.theory.map((col, idx) => (
                <td key={`ts-${idx}`} style={{ ...baseTdStyle, ...slotWidthStyle, backgroundColor: theoryTimeBg }}>
                  {col.lunch ? 'Lunch' : col.start}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ ...baseTdStyle, backgroundColor: labelBg, fontWeight: 'bold' }}>End</td>
              {schema.theory.map((col, idx) => (
                <td key={`te-${idx}`} style={{ ...baseTdStyle, ...slotWidthStyle, backgroundColor: theoryTimeBg }}>
                  {col.lunch ? 'Lunch' : col.end}
                </td>
              ))}
            </tr>

            <tr>
              <td rowSpan={2} style={{ ...baseTdStyle, backgroundColor: labelBg, fontWeight: 'bold' }}>LAB</td>
              <td style={{ ...baseTdStyle, backgroundColor: labelBg, fontWeight: 'bold' }}>Start</td>
              {schema.lab.map((col, idx) => (
                <td key={`ls-${idx}`} style={{ ...baseTdStyle, ...slotWidthStyle, backgroundColor: labTimeBg }}>
                  {col.lunch ? 'Lunch' : col.start}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ ...baseTdStyle, backgroundColor: labelBg, fontWeight: 'bold' }}>End</td>
              {schema.lab.map((col, idx) => (
                <td key={`le-${idx}`} style={{ ...baseTdStyle, ...slotWidthStyle, backgroundColor: labTimeBg }}>
                  {col.lunch ? 'Lunch' : col.end}
                </td>
              ))}
            </tr>

            {DAYS.map((day) => (
              <React.Fragment key={day}>
                <tr>
                  <td rowSpan={2} style={{ ...baseTdStyle, backgroundColor: labelBg, fontWeight: 'bold' }}>
                    {DAY_LABELS[day]}
                  </td>
                  <td style={{ ...baseTdStyle, backgroundColor: theoryTimeBg, fontWeight: 'bold' }}>THEORY</td>
                  {schema.theory.map((col, idx) => {
                    if (col.lunch) return <td key={`tl-${idx}`} style={{ ...baseTdStyle, ...slotWidthStyle, backgroundColor: labelBg }}>Lunch</td>;
                    const slotName = col.days && col.days[day] ? col.days[day] : '-';
                    const isHovered = hoveredSlots.includes(slotName);
                    const isEmpty = slotName === '-';
                    const coursesInSlot = selectedCourses.filter(c => c.slots.includes(slotName));
                    const isClash = coursesInSlot.length > 1;
                    const isSelected = coursesInSlot.length > 0;

                    let bg = theorySlotBg;
                    if (isHovered || isSelected) bg = hoverBg;
                    if (isClash) bg = '#ff0000';
                    
                    let textCol = isEmpty ? emptyText : filledText;
                    if (isClash) textCol = '#ffffff';

                    return (
                      <td 
                        key={`t-${idx}`} 
                        data-slot={!isEmpty ? slotName : ''}
                        style={{ 
                          ...baseTdStyle,
                          ...slotWidthStyle,
                          backgroundColor: bg,
                          color: textCol
                        }}
                        className="hover:opacity-80 transition-colors"
                      >
                        {isClash ? (
                           <div className="font-bold flex flex-col items-center">
                             {coursesInSlot.map(c => <span key={c.id}>{c.code}</span>)}
                           </div>
                        ) : isSelected ? (
                           <div className="flex flex-col items-center leading-tight">
                             <span className="text-[11px]">{slotName}</span>
                             <span className="text-[11px]">{coursesInSlot[0].code}</span>
                             {coursesInSlot[0].venue && coursesInSlot[0].venue !== '-' && (
                               <span className="text-[10px] opacity-80">{coursesInSlot[0].venue}</span>
                             )}
                           </div>
                        ) : (
                           slotName
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td style={{ ...baseTdStyle, backgroundColor: labTimeBg, fontWeight: 'bold' }}>LAB</td>
                  {schema.lab.map((col, idx) => {
                    if (col.lunch) return <td key={`ll-${idx}`} style={{ ...baseTdStyle, ...slotWidthStyle, backgroundColor: labelBg }}>Lunch</td>;
                    const slotName = col.days && col.days[day] ? col.days[day] : '--';
                    const isHovered = hoveredSlots.includes(slotName);
                    const isEmpty = slotName === '--';
                    const coursesInSlot = selectedCourses.filter(c => c.slots.includes(slotName));
                    const isClash = coursesInSlot.length > 1;
                    const isSelected = coursesInSlot.length > 0;

                    let bg = labSlotBg;
                    if (isHovered || isSelected) bg = hoverBg;
                    if (isClash) bg = '#ff0000';
                    
                    let textCol = isEmpty ? emptyText : filledText;
                    if (isClash) textCol = '#ffffff';

                    return (
                      <td 
                        key={`l-${idx}`} 
                        data-slot={!isEmpty ? slotName : ''}
                        style={{ 
                          ...baseTdStyle,
                          ...slotWidthStyle,
                          backgroundColor: bg,
                          color: textCol
                        }}
                        className="hover:opacity-80 transition-colors"
                      >
                        {isClash ? (
                           <div className="font-bold flex flex-col items-center">
                             {coursesInSlot.map(c => <span key={c.id}>{c.code}</span>)}
                           </div>
                        ) : isSelected ? (
                           <div className="flex flex-col items-center leading-tight">
                             <span className="text-[11px]">{slotName}</span>
                             <span className="text-[11px]">{coursesInSlot[0].code}</span>
                             {coursesInSlot[0].venue && coursesInSlot[0].venue !== '-' && (
                               <span className="text-[10px] opacity-80">{coursesInSlot[0].venue}</span>
                             )}
                           </div>
                        ) : (
                           slotName
                        )}
                      </td>
                    );
                  })}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
