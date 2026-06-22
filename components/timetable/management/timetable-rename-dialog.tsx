"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { toast } from "sonner";

import { AnimatedButton } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MotionDiv } from "@/components/ui/motion";

interface TimetableRenameDialogProps {
  onRename: (timetableId: string, newName: string) => void;
}

export interface TimetableRenameDialogRef {
  openDialog: (id: string, currentName: string) => void;
}

export const TimetableRenameDialog = forwardRef<
  TimetableRenameDialogRef,
  TimetableRenameDialogProps
>(function TimetableRenameDialog({ onRename }, ref) {
  const [open, setOpen] = useState(false);
  const [timetableId, setTimetableId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setNewName("");
      setTimetableId(null);
    }
  };

  const handleRename = () => {
    if (timetableId && newName.trim()) {
      onRename(timetableId, newName.trim());
      handleOpenChange(false);
      toast.success("Timetable Renamed", {
        description: "Your timetable has been renamed successfully!",
      });
    }
  };

  const openDialog = (id: string, currentName: string) => {
    setTimetableId(id);
    setNewName(currentName);
    handleOpenChange(true);
  };

  useImperativeHandle(ref, () => ({
    openDialog,
  }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <DialogTitle>Rename Timetable</DialogTitle>
            <DialogDescription>
              Enter a new name for this timetable.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="grid gap-2"
            >
              <Label htmlFor="rename-timetable">Timetable Name</Label>
              <Input
                id="rename-timetable"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter timetable name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRename();
                  }
                }}
              />
            </MotionDiv>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <AnimatedButton variant="outline">Cancel</AnimatedButton>
            </DialogClose>
            <AnimatedButton
              onClick={handleRename}
              variant={"primary"}
              disabled={!newName.trim()}
            >
              Rename
            </AnimatedButton>
          </DialogFooter>
        </MotionDiv>
      </DialogContent>
    </Dialog>
  );
});
