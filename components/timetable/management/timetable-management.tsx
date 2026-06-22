"use client";

import { memo, useRef } from "react";
import { toast } from "sonner";

import { useScheduleStore } from "@/lib/store";

import { TimetableCreationDialog } from "./timetable-creation-dialog";
import {
  TimetableRenameDialog,
  TimetableRenameDialogRef,
} from "./timetable-rename-dialog";
import { TimetableSelector } from "./timetable-selector";
import { TimetableStats } from "./timetable-stats";

export const TimetableManagement = memo(function TimetableManagement() {
  const {
    timetables,
    activeTimetableId,
    createTimetable,
    deleteTimetable,
    renameTimetable,
    setActiveTimetable,
    duplicateTimetable,
  } = useScheduleStore();

  const renameDialogRef = useRef<TimetableRenameDialogRef>(null);

  const handleRename = (timetableId: string, newName: string) => {
    renameTimetable(timetableId, newName);
    toast.success(`Timetable renamed to "${newName}"`);
  };

  const openRenameDialog = (id: string, currentName: string) => {
    renameDialogRef.current?.openDialog(id, currentName);
  };

  const handleDuplicate = (timetableId: string, currentName: string) => {
    duplicateTimetable(timetableId, `${currentName} (Copy)`);
  };

  const handleDelete = (timetableId: string) => {
    if (timetables.length > 1) {
      deleteTimetable(timetableId);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex flex-col items-start justify-between p-4 border rounded-lg md:flex-row md:items-center">
        <div className="flex flex-wrap items-start gap-4 md:items-center">
          <TimetableSelector
            timetables={timetables}
            activeTimetableId={activeTimetableId}
            setActiveTimetable={setActiveTimetable}
            onRename={openRenameDialog}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        </div>

        <TimetableCreationDialog
          onCreateTimetable={createTimetable}
          timetableCount={timetables.length}
        />

        <TimetableRenameDialog ref={renameDialogRef} onRename={handleRename} />
      </div>

      {activeTimetableId && <TimetableStats timetableId={activeTimetableId} />}
    </div>
  );
});
