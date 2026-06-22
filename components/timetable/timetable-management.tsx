"use client";

import { Calendar, ChevronDown, Copy, Edit, Trash2, Users } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MotionDiv } from "@/components/ui/motion";
import { useScheduleStore } from "@/lib/store";
import { getCreditsFromSlotString } from "@/lib/ltpjc-parser";
import { cn } from "@/lib/utils";

import { TimetableCreationDialog } from "./management/timetable-creation-dialog";
import {
  TimetableRenameDialog,
  TimetableRenameDialogRef,
} from "./management/timetable-rename-dialog";

export function TimetableManagement() {
  const {
    timetables,
    activeTimetableId,
    createTimetable,
    deleteTimetable,
    renameTimetable,
    setActiveTimetable,
    duplicateTimetable,
    courses,
  } = useScheduleStore();

  const renameDialogRef = useRef<TimetableRenameDialogRef>(null);

  const activeTimetable = timetables.find((t) => t.id === activeTimetableId);

  const handleRename = (timetableId: string, newName: string) => {
    renameTimetable(timetableId, newName);
    toast.success(`Timetable renamed to "${newName}"`);
  };

  const openRenameDialog = (timetableId: string, currentName: string) => {
    renameDialogRef.current?.openDialog(timetableId, currentName);
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
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Active Timetable:</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                disabled={!timetables.length}
              >
                <span className="font-medium">
                  {activeTimetable?.name || "No Timetable"}
                </span>
                <Badge variant="secondary" className="ml-2">
                  {activeTimetable?.selectedTeachers.length || 0} courses
                </Badge>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              {timetables.map((timetable) => (
                <DropdownMenuItem
                  key={timetable.id}
                  onClick={() => setActiveTimetable(timetable.id)}
                  className={cn(
                    "flex items-center justify-between p-3 cursor-pointer",
                    timetable.id === activeTimetableId && "bg-accent"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{timetable.name}</span>
                      {timetable.id === activeTimetableId && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {timetable.selectedTeachers.length} courses
                      </span>
                      <span>
                        Updated:{" "}
                        {timetable.updatedAt
                          ? new Date(timetable.updatedAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openRenameDialog(timetable.id, timetable.name);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(timetable.id, timetable.name);
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    {timetables.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(timetable.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TimetableCreationDialog
          onCreateTimetable={createTimetable}
          timetableCount={timetables.length}
        />

        <TimetableRenameDialog ref={renameDialogRef} onRename={handleRename} />
      </div>

      {activeTimetable && (
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-muted-foreground"
        >
          Total available courses: {courses.length} | Selected in this
          timetable:{" "}
          {new Set(activeTimetable.selectedTeachers.map((t) => t.course)).size}{" "}
          | Total credits:{" "}
          {activeTimetable.selectedTeachers.reduce((sum, teacher) => {
            const course = courses.find((c) => c.id === teacher.course);
            return sum + getCreditsFromSlotString(teacher.name, course);
          }, 0)}
        </MotionDiv>
      )}
    </div>
  );
}
