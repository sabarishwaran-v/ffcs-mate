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
    const tData: Record<string, { courses: any[], teacherNames: string[], authors: { uid?: string, name?: string }[], teachers: any[] }> = {};
    for (const teacher of selectedTeachers) {
      const course = courses.find(c => c.id === teacher.course);
      if (!course) continue;
      
      const allSlots = getAllSlots(teacher);
      for (const slot of allSlots) {
        if (!tData[slot]) {
          tData[slot] = { courses: [], teacherNames: [], authors: [], teachers: [] };
        }
        tData[slot].courses.push(course);
        tData[slot].teacherNames.push(teacher.name);
        tData[slot].authors.push({ uid: teacher.addedByUid, name: teacher.addedByName });
        tData[slot].teachers.push(teacher);
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
    const primaryTeacher = primarySlot ? timetableData[primarySlot].teachers[0] : null;

    let cellVenue = null;
    if (primaryTeacher) {
       // Morning slots start with 08:00 to 13:00 roughly, we can just deduplicate venue strings if both exist
       const venues = Array.from(new Set([primaryTeacher.venue?.morning, primaryTeacher.venue?.afternoon])).filter(Boolean);
       if (venues.length > 0) cellVenue = venues[0]; // just show one
    }

    const cellContent = isClash ? (
      <div className="font-bold flex flex-col items-center">
        {uniqueCourses.map(c => <span key={c.id}>{c.code}</span>)}
      </div>
    ) : isSelected ? (
      <div className="flex flex-col items-center leading-tight gap-0.5 py-1 relative w-full h-full justify-center">
        <span style={{ fontSize: '11px' }}>
          {primarySlot}-
        </span>
        <span style={{ fontSize: '11px' }}>
          {uniqueCourses[0].code}-
        </span>
        <span style={{ fontSize: '11px' }}>
          {(isLabRow ? (uniqueCourses[0].type === "LO" ? "LO" : "ELA") : (uniqueCourses[0].type === "TH" ? "TH" : "ETH"))}{cellVenue ? "-" : ""}
        </span>
        {cellVenue && (
          <span style={{ fontSize: '11px' }}>
            {cellVenue}
          </span>
        )}
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
