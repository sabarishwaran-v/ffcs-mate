"use client";

import { VariantProps } from "class-variance-authority";
import { PlusIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { AnimatedButton, buttonVariants } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { MotionDiv } from "@/components/ui/motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useScheduleStore } from "@/lib/store";
import { mergeSlots } from "@/src/utils/slots";
import { isMorningSlot } from "@/src/utils/timetable";
import type { DialogButtonProps } from "@/types";

type BulkAddTeachersDialogProps = DialogButtonProps;

export function BulkAddTeachersDialog({
  variant,
  size,
  buttonText = "Bulk Add Teachers",
  buttonIcon = "add",
  disabled = false,
}: BulkAddTeachersDialogProps & VariantProps<typeof buttonVariants>) {
  const { addTeacher, courses } = useScheduleStore();

  const [open, setOpen] = useState(false);
  const [rawInput, setRawInput] = useState("");
  const [merge, setMerge] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setRawInput("");
      setSelectedCourse("");
    }
  };

  const handleAddTeachers = useCallback(() => {
    if (!rawInput.trim() || !selectedCourse) {
      toast.error("Missing Information", {
        description: "Please paste data and select a course.",
      });
      return;
    }

    let lines: string[] = [];
    if (merge) {
      lines = mergeSlots(
        rawInput.split("\n").filter((line) => line.trim() !== ""),
      );
    } else {
      lines = rawInput.split("\n").filter((line) => line.trim() !== "");
    }

    if (lines.length === 0) {
      toast.error("No Data Found", {
        description: "Please paste valid teacher data.",
      });
      return;
    }

    let addedCount = 0;
    let errorCount = 0;

    lines.forEach((line) => {
      // Attempt to split by tab first, then by multiple spaces
      const parts = line.split("\t").map((p) => p.trim());
      let slotDetail = "";
      let venue = [];
      let faculty = "";
      let type = "";

      if (parts.length >= 3) {
        slotDetail = parts[0];
        type = parts[3];
        venue = parts[1].split(",");
        faculty = parts[2];
      } else {
        // Fallback to splitting by multiple spaces if tab split fails
        const spaceParts = line.split(/\s{2,}/).map((p) => p.trim());
        if (spaceParts.length >= 3) {
          slotDetail = spaceParts[0];
          venue = [spaceParts[0]];
          faculty = spaceParts[2];
        } else {
          errorCount++;
          return; // Skip this line if parsing fails
        }
      }

      const slotArray = slotDetail
        .split("+")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (faculty && slotArray.length > 0) {
        const morningSlots = slotArray.filter((slot) => isMorningSlot(slot));
        const afternoonSlots = slotArray.filter((slot) => !isMorningSlot(slot));

        const teacherData = {
          name: faculty,
          color: "purple",
          slots: {
            morning: morningSlots.length > 0 ? morningSlots : null,
            afternoon: afternoonSlots.length > 0 ? afternoonSlots : null,
          },
          venue: {
            morning:
              morningSlots.length > 0
                ? type === "EM"
                  ? venue[0]
                  : venue[0]
                : null,
            afternoon:
              afternoonSlots.length > 0
                ? type === "EM"
                  ? venue[1]
                  : venue[0]
                : null,
          },
          course: selectedCourse,
        };
        addTeacher(teacherData);
        addedCount++;
      } else {
        errorCount++;
      }
    });

    if (addedCount > 0) {
      toast.success("Teachers Added", {
        description: `${addedCount} teacher(s) added successfully.`,
      });
    }
    if (errorCount > 0) {
      toast.warning("Partial Success", {
        description: `${errorCount} line(s) could not be parsed.`,
      });
    }

    handleOpenChange(false);
  }, [rawInput, selectedCourse, merge, addTeacher]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <AnimatedButton variant={variant} size={size} disabled={disabled}>
          {buttonIcon === "add" && <PlusIcon className="w-4 h-4" />}
          {buttonText}
        </AnimatedButton>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <DialogTitle>Bulk Add Teachers</DialogTitle>
            <DialogDescription>
              1. Login to VTOP <br /> 2. Click Academics &gt; Course
              Registration Allocation <br /> 3. Copy the data from the table{" "}
              <br /> 4. Paste it below and associate with a course
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="grid gap-2"
            >
              <Label htmlFor="course">Associate with Course</Label>
              <Select
                value={selectedCourse}
                onValueChange={setSelectedCourse}
                disabled={courses.length === 0}
              >
                <SelectTrigger className="flex-1 w-full">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {courses.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No courses available. Please add a course first.
                </p>
              )}
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="grid gap-2"
            >
              <Label htmlFor="rawInput">Pasted Data</Label>
              <Textarea
                id="rawInput"
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={`Example:\nC2+TC2+TCC2\tPRP134\tMANIMARAN A\tTH\nC1+TC1+TCC1\tPRP267\tSARAVANARAJAN M C\tTH`}
                rows={8}
                className="font-mono text-xs max-h-[300px]"
              />
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex items-center space-x-2"
            >
              <Switch
                id="useMerge"
                checked={merge}
                onCheckedChange={setMerge}
              />
              <Label htmlFor="useMerge">Embedded Course?</Label>
            </MotionDiv>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <AnimatedButton variant="outline">Cancel</AnimatedButton>
            </DialogClose>
            <AnimatedButton
              variant="green"
              onClick={handleAddTeachers}
              disabled={
                !rawInput.trim() || !selectedCourse || courses.length === 0
              }
            >
              Add Teachers
            </AnimatedButton>
          </DialogFooter>
        </MotionDiv>
      </DialogContent>
    </Dialog>
  );
}
