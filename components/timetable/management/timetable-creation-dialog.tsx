"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MotionDiv } from "@/components/ui/motion";

interface TimetableCreationDialogProps {
  onCreateTimetable: (name?: string) => void;
  timetableCount: number;
}

export function TimetableCreationDialog({
  onCreateTimetable,
  timetableCount,
}: TimetableCreationDialogProps) {
  const [open, setOpen] = useState(false);
  const [newTimetableName, setNewTimetableName] = useState("");

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setNewTimetableName("");
    }
  };

  const handleCreateTimetable = () => {
    const name = newTimetableName.trim() || undefined;
    onCreateTimetable(name);
    handleOpenChange(false);
    toast.success("Timetable Created", {
      description: "Your new timetable has been created successfully!",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <AnimatedButton className="flex items-center gap-2" variant={"primary"}>
          <Plus className="w-4 h-4" />
          New Timetable
        </AnimatedButton>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <DialogTitle>Create New Timetable</DialogTitle>
            <DialogDescription>
              Create a new timetable that will share the same courses and
              teachers.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="grid gap-2"
            >
              <Label htmlFor="timetable-name">Timetable Name</Label>
              <Input
                id="timetable-name"
                value={newTimetableName}
                onChange={(e) => setNewTimetableName(e.target.value)}
                placeholder={`Timetable ${timetableCount + 1}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateTimetable();
                  }
                }}
              />
            </MotionDiv>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <AnimatedButton variant="outline">Cancel</AnimatedButton>
            </DialogClose>
            <AnimatedButton onClick={handleCreateTimetable} variant={"primary"}>
              Create
            </AnimatedButton>
          </DialogFooter>
        </MotionDiv>
      </DialogContent>
    </Dialog>
  );
}
