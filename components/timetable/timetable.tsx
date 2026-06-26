"use client";

import React, { useRef, useMemo, useState } from 'react';
import { useScheduleStore } from "@/lib/store";
import { vitapSlotMapping } from "@/lib/vitap-slot-mapping";
import { getAllSlots } from "@/src/utils/timetable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, AlertTriangle } from "lucide-react";

const DAYS = ['TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
const DAY_LABELS: Record<string, string> = { tue: 'TUE', wed: 'WED', thu: 'THU', fri: 'FRI', sat: 'SAT' };

type DayType = typeof DAYS[number];

// VTOP Exact Colors
const VTOP_COLORS = {
  borderColor: '#3c8dbc',
  theoryTimeBg: '#ccccff',
  labTimeBg: '#99ccff',
  labelBg: '#e2e2e2',
  theorySlotBg: '#ffffcc',
  labSlotBg: '#f9efa4',
  hoverBg: '#CCFF33',
  emptyBg: '#ffffff',
  filledText: '#000000',
  emptyText: '#808080',
  clashBg: '#ff0000',
  clashText: '#ffffff'
};

const schema = {
  theory: [
      { start: "08:00", end: "08:50", days: { tue: "TFF1", wed: "TEE1", thu: "TG1", fri: "TDD1" } },
      { start: "09:00", end: "09:50", days: { tue: "A1", wed: "D1", thu: "C1", fri: "B1", sat: "TC1" } },
      { start: "09:01", end: "09:51", days: { tue: "SE2", fri: "SA2" } },
      { start: "10:00", end: "10:50", days: { tue: "B1", wed: "F1", thu: "D1", fri: "A1", sat: "C1" } },
      { start: "10:01", end: "10:51", days: { tue: "SD2", fri: "SF2" } },
      { start: "11:00", end: "11:50", days: { tue: "C1", wed: "G1", thu: "A1", fri: "G1", sat: "F1" } },
      { start: "11:01", end: "11:51", days: { wed: "TE1", thu: "SB2", fri: "TF1" } },
      { start: "12:00", end: "12:50", days: { tue: "D1", wed: "B1", thu: "F1", fri: "E1", sat: "G1" } },
      { start: "12:01", end: "12:51", days: { wed: "SC2", sat: "TD1" } },
      { start: "13:00", end: "13:50", days: {} },
      { lunch: true },
      { start: "14:00", end: "14:50", days: { tue: "F2", wed: "D2", thu: "E2", fri: "TC2", sat: "G2" } },
      { start: "14:01", end: "14:51", days: { sat: "TD2" } },
      { start: "15:00", end: "15:50", days: { tue: "A2", wed: "F2", thu: "C2", fri: "B2", sat: "D2" } },
      { start: "15:01", end: "15:51", days: { tue: "SF1", fri: "SA1" } },
      { start: "16:00", end: "16:50", days: { tue: "B2", wed: "B2", thu: "A2", fri: "A2", sat: "F2" } },
      { start: "16:01", end: "16:51", days: { tue: "SC1", wed: "SD1", thu: "SB1", fri: "SE1" } },
      { start: "17:00", end: "17:50", days: { tue: "C2", wed: "G2", thu: "D2", fri: "G2", sat: "C2" } },
      { start: "17:01", end: "17:51", days: { wed: "TE2", fri: "TF2" } },
      { start: "18:00", end: "18:50", days: { tue: "TDD2", wed: "TG2", thu: "TFF2", fri: "TEE2" } },
      { start: "19:00", end: "19:50", days: {} }
  ],
  lab: [
      { start: "08:00", end: "08:50", days: { tue: "L1", wed: "L7", thu: "L13", fri: "L19", sat: "L25" } },
      { start: "08:50", end: "09:40", days: { tue: "L2", wed: "L8", thu: "L14", fri: "L20", sat: "L26" } },
      { start: "08:51", end: "09:41", days: {} },
      { start: "09:50", end: "10:40", days: { tue: "L3", wed: "L9", thu: "L15", fri: "L21", sat: "L27" } },
      { start: "09:51", end: "10:41", days: {} },
      { start: "10:40", end: "11:30", days: { tue: "L4", wed: "L10", thu: "L16", fri: "L22", sat: "L28" } },
      { start: "10:41", end: "11:31", days: {} },
      { start: "11:45", end: "12:30", days: { tue: "L5", wed: "L11", thu: "L17", fri: "L23", sat: "L29" } },
      { start: "11:46", end: "12:31", days: {} },
      { start: "12:30", end: "13:10", days: { tue: "L6", wed: "L12", thu: "L18", fri: "L24", sat: "L30" } },
      { lunch: true },
      { start: "14:00", end: "14:50", days: { tue: "L31", wed: "L37", thu: "L43", fri: "L49", sat: "L55" } },
      { start: "14:01", end: "14:51", days: {} },
      { start: "14:50", end: "15:40", days: { tue: "L32", wed: "L38", thu: "L44", fri: "L50", sat: "L56" } },
      { start: "14:51", end: "15:41", days: {} },
      { start: "16:00", end: "16:50", days: { tue: "L33", wed: "L39", thu: "L45", fri: "L51", sat: "L57" } },
      { start: "16:01", end: "16:51", days: {} },
      { start: "16:50", end: "17:40", days: { tue: "L34", wed: "L40", thu: "L46", fri: "L52", sat: "L58" } },
      { start: "16:51", end: "17:41", days: {} },
      { start: "18:00", end: "18:50", days: { tue: "L35", wed: "L41", thu: "L47", fri: "L53", sat: "L59" } },
      { start: "18:50", end: "19:30", days: { tue: "L36", wed: "L42", thu: "L48", fri: "L54", sat: "L60" } }
  ]
};

const timeToMinutes = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Group overlapping times into columns
const groupOverlappingTimes = (theoryTimes: string[], labTimes: string[]) => {
  const groups: any[] = [];

  for (const theoryTime of theoryTimes) {
    const [s, e] = theoryTime.split('-');
    groups.push({
      times: [{ original: theoryTime, startMin: timeToMinutes(s), endMin: timeToMinutes(e), isTheory: true, isLab: false }],
      theoryTimes: [theoryTime],
      labTimes: []
    });
  }

  for (const labTime of labTimes) {
    const [labStart, labEnd] = labTime.split('-').map(timeToMinutes);
    let assigned = false;

    for (const group of groups) {
      const theory = group.theoryTimes[0];
      if (!theory) continue;

      const [ts, te] = theory.split('-').map(timeToMinutes);
      // If lab ends during theory or shortly after
      if (labEnd > ts && labEnd <= te + 10) {
        const [s, e] = labTime.split('-');
        group.times.push({ original: labTime, startMin: timeToMinutes(s), endMin: timeToMinutes(e), isTheory: false, isLab: true });
        group.labTimes.push(labTime);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      const [s, e] = labTime.split('-');
      groups.push({
        times: [{ original: labTime, startMin: timeToMinutes(s), endMin: timeToMinutes(e), isTheory: false, isLab: true }],
        theoryTimes: [],
        labTimes: [labTime]
      });
    }
  }

  return groups.sort((a, b) => Math.min(...a.times.map((t: any) => t.startMin)) - Math.min(...b.times.map((t: any) => t.startMin)));
};

const extractTimeAndDay = () => {
  const theoryTimes = new Set<string>();
  const labTimes = new Set<string>();
  const days = new Set<string>();

  Object.entries(vitapSlotMapping).forEach(([slot, schedules]) => {
    if (slot === 'Lunch') return;
    const isLab = /^L\d+/i.test(slot);

    schedules.forEach(({ day, time }) => {
      if (day) days.add(day);
      if (time) {
        isLab ? labTimes.add(time) : theoryTimes.add(time);
      }
    });
  });

  return {
    days: DAYS,
    timeGroups: groupOverlappingTimes([...theoryTimes], [...labTimes])
  };
};

interface TimetableProps {
  hideControls?: boolean;
}

export const Timetable = React.memo(function Timetable({ hideControls = false }: TimetableProps = {}) {
  const timetableRef = useRef<HTMLDivElement>(null);
  const { getSelectedTeachers, courses, activeRoomId, no8amRule } = useScheduleStore();
  const selectedTeachers = getSelectedTeachers();

  const AVATAR_COLORS = [
    "bg-emerald-400 ring-emerald-500/30",
    "bg-[#B4D33F] ring-[#B4D33F]/30",
    "bg-purple-400 ring-purple-500/30",
    "bg-blue-400 ring-blue-500/30",
    "bg-rose-400 ring-rose-500/30",
    "bg-amber-400 ring-amber-500/30",
  ];

  const getAvatarColor = (uid: string) => {
    if (!uid) return "bg-emerald-400";
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
      hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    }
    // we only want the bg part for the small dot
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length].split(" ")[0];
  };



  const { allTimeGroups, timetableData } = useMemo(() => {
    const { timeGroups } = extractTimeAndDay();
    const groups = [...timeGroups];
    const lunchTimes = vitapSlotMapping.Lunch?.map(l => l.time) || [];

    if (lunchTimes.length) {
      groups.push({
        isLunch: true,
        lunchCount: lunchTimes.length,
        times: lunchTimes.map(t => ({ original: t })),
        theoryTimes: [],
        labTimes: []
      });
    }

    const sortedGroups = groups.sort(
      (a, b) => timeToMinutes(a.times[0].original.split('-')[0]) - timeToMinutes(b.times[0].original.split('-')[0])
    );

    // Build slot data map for fast lookup
    const tData: Record<string, { courses: any[], teacherNames: string[], authors: { uid?: string, name?: string }[] }> = {};
    for (const teacher of selectedTeachers) {
      const course = courses.find(c => c.id === teacher.course);
      if (!course) continue;
      
      const allSlots = getAllSlots(teacher);
      for (const slot of allSlots) {
        if (!tData[slot]) {
          tData[slot] = { courses: [], teacherNames: [], authors: [] };
        }
        tData[slot].courses.push(course);
        tData[slot].teacherNames.push(teacher.name);
        tData[slot].authors.push({ uid: teacher.addedByUid, name: teacher.addedByName });
      }
    }

    return { allTimeGroups: sortedGroups, timetableData: tData };
  }, [selectedTeachers, courses]);

  // Find slot name for a given day and time
  const getSlotName = (day: string, time: string, isLab: boolean) => {
    if (!time || time === '-') return '-';
    
    const matchingSlots: string[] = [];
    for (const [slot, schedules] of Object.entries(vitapSlotMapping)) {
      if (slot === 'Lunch') continue;
      if (/^L\d+/i.test(slot) !== isLab) continue;
      
      if (schedules.some(s => s.day === day && s.time === time)) {
        matchingSlots.push(slot);
      }
    }
    return matchingSlots.length > 0 ? matchingSlots.join(', ') : '-';
  };

  const renderCell = (slotName: string, isLunch: boolean, isLabRow: boolean, is8am: boolean = false) => {
    const is8amRestricted = no8amRule && is8am;

    if (isLunch) {
      return (
        <td 
          rowSpan={2} 
          style={{ 
            border: `1px solid ${VTOP_COLORS.borderColor}`, 
            backgroundColor: VTOP_COLORS.labelBg,
            color: VTOP_COLORS.filledText,
            textAlign: 'center',
            verticalAlign: 'middle',
            padding: '4px',
            minWidth: '50px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          Lunch
        </td>
      );
    }

    if (!slotName || slotName === '-') {
      return (
        <td 
          style={{ 
            border: `1px solid ${VTOP_COLORS.borderColor}`, 
            backgroundColor: isLabRow ? VTOP_COLORS.labSlotBg : VTOP_COLORS.theorySlotBg,
            color: VTOP_COLORS.emptyText,
            textAlign: 'center',
            verticalAlign: 'middle',
            padding: '4px',
            minWidth: '50px',
            fontSize: '12px'
          }}
        >
          -
        </td>
      );
    }

    const slotsInCell = slotName.split(',').map(s => s.trim());
    const cellCourses: any[] = [];
    
    slotsInCell.forEach(s => {
      if (timetableData[s]) {
        cellCourses.push(...timetableData[s].courses);
      }
    });

    // deduplicate courses
    const uniqueCourses = Array.from(new Set(cellCourses));

    const isClash = uniqueCourses.length > 1;
    const isSelected = uniqueCourses.length > 0;

    let bg = isLabRow ? VTOP_COLORS.labSlotBg : VTOP_COLORS.theorySlotBg;
    if (isSelected) bg = VTOP_COLORS.hoverBg;
    if (isClash) bg = VTOP_COLORS.clashBg;

    let textCol = VTOP_COLORS.filledText;
    if (isClash) textCol = VTOP_COLORS.clashText;

    const primarySlot = slotsInCell.find(s => timetableData[s]);
    const author = primarySlot ? timetableData[primarySlot].authors[0] : null;

    const cellContent = isClash ? (
      <div className="font-bold flex flex-col items-center">
        {uniqueCourses.map(c => <span key={c.id}>{c.code}</span>)}
      </div>
    ) : isSelected ? (
      <div className="flex flex-col items-center leading-tight gap-0.5 py-1 relative w-full h-full justify-center">
        <span style={{ fontSize: '11px' }}>
          {primarySlot}
        </span>
        <span style={{ fontSize: '11px' }}>
          {uniqueCourses[0].code}
        </span>
        {activeRoomId && author?.name && (
          <div className={`absolute top-0 right-0 w-2 h-2 rounded-full shadow-sm ${getAvatarColor(author.uid || "")}`} />
        )}
      </div>
    ) : (
      <span style={{ fontSize: '12px' }}>{slotName}</span>
    );

    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <td 
              className={`transition-colors hover:opacity-80 relative ${is8amRestricted && !isSelected ? "opacity-60 bg-gray-200/50" : ""}`}
              style={{ 
                border: `1px solid ${VTOP_COLORS.borderColor}`, 
                backgroundColor: bg,
                color: textCol,
                textAlign: 'center',
                verticalAlign: 'middle',
                padding: '4px',
                minWidth: '50px',
                cursor: 'default',
              }}
            >
              {is8amRestricted && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-10">
                  <div className="w-[150%] border-t-[3px] border-red-500/50 rotate-[20deg]"></div>
                </div>
              )}
              <div className={is8amRestricted ? "line-through text-gray-500 opacity-70" : ""}>
                {cellContent}
              </div>
            </td>
          </TooltipTrigger>
          {(isClash || (isSelected && author?.name)) && (
            <TooltipContent side="top" className="bg-popover text-popover-foreground border border-border shadow-xl">
              {isClash ? (
                <div className="space-y-1">
                  <p className="font-bold text-destructive flex items-center gap-2">⚠️ Clashing Slot</p>
                  {uniqueCourses.map((c, i) => {
                    const cAuthor = timetableData[slotsInCell.find(s => timetableData[s].courses.some(cc => cc.id === c.id))!]?.authors.find((_, idx) => timetableData[slotsInCell.find(s => timetableData[s].courses.some(cc => cc.id === c.id))!].courses[idx].id === c.id);
                    return (
                      <p key={c.id} className="text-sm">
                        {c.code} {cAuthor?.name ? <span className="text-muted-foreground">(by {cAuthor.name})</span> : null}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-bold">{uniqueCourses[0]?.title || uniqueCourses[0]?.code}</p>
                  {activeRoomId && author?.name && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${getAvatarColor(author?.uid || "")}`} />
                      Added by {author?.name}
                    </p>
                  )}
                </div>
              )}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  const baseThStyle: React.CSSProperties = {
    border: `1px solid ${VTOP_COLORS.borderColor}`,
    textAlign: 'center',
    verticalAlign: 'middle',
    padding: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: VTOP_COLORS.filledText
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {!hideControls && (
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold text-foreground">Timetable Grid</h3>
        </div>
      )}

      <div 
        ref={timetableRef} 
        className="bg-white rounded-md border border-border shadow-sm overflow-x-auto overflow-y-hidden"
        style={{ color: '#000', WebkitOverflowScrolling: 'touch' }} 
      >
        <div className="min-w-max w-full relative">
          <table 
            className="w-full border-collapse" 
            style={{ 
              border: `2px solid ${VTOP_COLORS.borderColor}`,
              backgroundColor: '#fff',
              fontFamily: 'Arial, sans-serif',
              minWidth: '1100px'
            }}
          >
            <tbody>
              {/* Theory Header - Start */}
              <tr>
                <td rowSpan={2} style={{ ...baseThStyle, backgroundColor: VTOP_COLORS.labelBg }}>THEORY</td>
                <td style={{ ...baseThStyle, backgroundColor: VTOP_COLORS.labelBg }}>Start</td>
                {allTimeGroups.map((group, idx) => (
                  <td key={`ts-${idx}`} style={{ ...baseThStyle, backgroundColor: group.isLunch ? VTOP_COLORS.labelBg : VTOP_COLORS.theoryTimeBg }}>
                    {group.isLunch ? 'Lunch' : (group.theoryTimes[0] ? group.theoryTimes[0].split('-')[0] : '-')}
                  </td>
                ))}
              </tr>
              {/* Theory Header - End */}
              <tr>
                <td style={{ ...baseThStyle, backgroundColor: VTOP_COLORS.labelBg }}>End</td>
                {allTimeGroups.map((group, idx) => (
                  <td key={`te-${idx}`} style={{ ...baseThStyle, backgroundColor: group.isLunch ? VTOP_COLORS.labelBg : VTOP_COLORS.theoryTimeBg }}>
                    {group.isLunch ? 'Lunch' : (group.theoryTimes[0] ? group.theoryTimes[0].split('-')[1] : '-')}
                  </td>
                ))}
              </tr>

              {/* Lab Header - Start */}
              <tr>
                <td rowSpan={2} style={{ ...baseThStyle, backgroundColor: VTOP_COLORS.labelBg }}>LAB</td>
                <td style={{ ...baseThStyle, backgroundColor: VTOP_COLORS.labelBg }}>Start</td>
                {allTimeGroups.map((group, idx) => (
                  <td key={`ls-${idx}`} style={{ ...baseThStyle, backgroundColor: group.isLunch ? VTOP_COLORS.labelBg : VTOP_COLORS.labTimeBg }}>
                    {group.isLunch ? 'Lunch' : (group.labTimes[0] ? group.labTimes[0].split('-')[0] : '-')}
                  </td>
                ))}
              </tr>
              {/* Lab Header - End */}
              <tr>
                <td style={{ ...baseThStyle, backgroundColor: VTOP_COLORS.labelBg }}>End</td>
                {allTimeGroups.map((group, idx) => (
                  <td key={`le-${idx}`} style={{ ...baseThStyle, backgroundColor: group.isLunch ? VTOP_COLORS.labelBg : VTOP_COLORS.labTimeBg }}>
                    {group.isLunch ? 'Lunch' : (group.labTimes[0] ? group.labTimes[0].split('-')[1] : '-')}
                  </td>
                ))}
              </tr>

              {/* Grid Body */}
              {DAYS.map((day) => {
                return (
                  <React.Fragment key={day}>
                    {/* Theory Row */}
                    <tr>
                      <td rowSpan={2} style={{ ...baseThStyle, backgroundColor: VTOP_COLORS.labelBg }}>
                        {DAY_LABELS[day.toLowerCase()]}
                      </td>
                      <td style={{ ...baseThStyle, backgroundColor: VTOP_COLORS.theoryTimeBg }}>
                        THEORY
                      </td>
                      {allTimeGroups.map((group, idx) => {
                        if (group.isLunch) {
                          // Lunch cell is rendered with rowSpan=2, so we only return it on Theory row
                          return <React.Fragment key={`lunch-${day}-${idx}`}>{renderCell('', true, false)}</React.Fragment>;
                        }
                        const theoryTime = group.theoryTimes[0];
                        const slotName = getSlotName(day, theoryTime, false);
                        const is8am = theoryTime && theoryTime.startsWith("08:00");
                        return <React.Fragment key={`t-${day}-${idx}`}>{renderCell(slotName, false, false, !!is8am)}</React.Fragment>;
                      })}
                    </tr>
                    {/* Lab Row */}
                    <tr>
                      <td style={{ ...baseThStyle, backgroundColor: VTOP_COLORS.labTimeBg }}>
                        LAB
                      </td>
                      {allTimeGroups.map((group, idx) => {
                        if (group.isLunch) return null; // Handled by rowSpan in theory row
                        const labTime = group.labTimes[0];
                        const slotName = getSlotName(day, labTime, true);
                        const is8am = labTime && labTime.startsWith("08:00");
                        return <React.Fragment key={`l-${day}-${idx}`}>{renderCell(slotName, false, true, !!is8am)}</React.Fragment>;
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Uncroppable Centered Watermark Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-10"
            aria-hidden="true"
          >
            <span 
              className="text-black font-black whitespace-nowrap select-none tracking-widest"
              style={{ fontSize: '100px', opacity: 0.05 }}
            >
              FFCS MATE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
