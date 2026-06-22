"use client";

import { Calendar, ChevronDown, Copy, Edit, Trash2, Users } from "lucide-react";
import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import { AnimatedButton } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Timetable } from "@/types";

interface TimetableSelectorProps {
  timetables: Timetable[];
  activeTimetableId: string | null;
  setActiveTimetable: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export const TimetableSelector = memo(function TimetableSelector({
  timetables,
  activeTimetableId,
  setActiveTimetable,
  onRename,
  onDuplicate,
  onDelete,
}: TimetableSelectorProps) {
  const activeTimetable = timetables.find((t) => t.id === activeTimetableId);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-col">
        <Calendar className="w-5 h-5 text-muted-foreground" />
        <span className="font-medium">Active Timetable:</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <AnimatedButton
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
          </AnimatedButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          {timetables.map((timetable) => (
            <DropdownMenuItem
              key={timetable.id}
              onClick={() => setActiveTimetable(timetable.id)}
              className={cn(
                "flex items-center justify-between p-3 cursor-pointer",
                timetable.id === activeTimetableId && "bg-accent",
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
                      : "Never"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <AnimatedButton
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename(timetable.id, timetable.name);
                  }}
                >
                  <Edit className="w-3 h-3" />
                </AnimatedButton>
                <AnimatedButton
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(timetable.id, timetable.name);
                  }}
                >
                  <Copy className="w-3 h-3" />
                </AnimatedButton>
                {timetables.length > 1 && (
                  <AnimatedButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(timetable.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </AnimatedButton>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});
