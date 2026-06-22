"use client";

import { type VariantProps } from "class-variance-authority";
import { memo, useCallback, useState } from "react";
import { toast } from "sonner";

import { AddIcon, Edit2Icon } from "@/components/icon-memo";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MotionDiv } from "@/components/ui/motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useScheduleStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { colors } from "@/src/constants/colors";
import {
  getAllSlots,
  isAfternoonSlot,
  isMorningSlot,
} from "@/src/utils/timetable";
import { DialogButtonProps, Teacher } from "@/types";

interface TeacherDialogProps {
  teacherToEdit?: Teacher;
  course?: string;
}

export function TeacherDialog({
  teacherToEdit,
  buttonIcon,
  buttonText,
  course,
  variant = "primary",
  size,
}: TeacherDialogProps &
  DialogButtonProps &
  VariantProps<typeof buttonVariants>) {
  const { addTeacher, editTeacher, courses } = useScheduleStore();

  const [open, setOpen] = useState(false);
  const [teacherName, setTeacherName] = useState(
    teacherToEdit ? teacherToEdit.name : "",
  );
  const [selectedColor, setSelectedColor] = useState(
    teacherToEdit ? teacherToEdit.color : "purple",
  );
  const [slots, setSlots] = useState(
    teacherToEdit ? getAllSlots(teacherToEdit).join("+") : "",
  );
  const [venue, setVenue] = useState(
    teacherToEdit
      ? teacherToEdit.venue.morning || teacherToEdit.venue.afternoon || ""
      : "",
  );
  const [selectedCourse, setSelectedCourse] = useState(
    teacherToEdit ? teacherToEdit.course : course || "",
  );

  const handleColorChange = useCallback(
    (value: string) => setSelectedColor(value),
    [],
  );
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setTeacherName(e.target.value),
    [],
  );
  const handleSlotsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSlots(e.target.value),
    [],
  );
  const handleVenueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setVenue(e.target.value),
    [],
  );
  const handleCourseChange = useCallback(
    (value: string) => setSelectedCourse(value),
    [],
  );

  const handleAddTeacher = () => {
    const cleanedName = teacherName.trim();
    const cleanedVenue = venue.trim();
    const slotArray = slots
      .split("+")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (cleanedName && slotArray.length > 0 && selectedCourse) {
      const morningSlots = slotArray.filter((slot) => isMorningSlot(slot));
      const afternoonSlots = slotArray.filter((slot) => isAfternoonSlot(slot));

      const teacherData = {
        name: cleanedName,
        color: selectedColor,
        slots: {
          morning: morningSlots.length > 0 ? morningSlots : null,
          afternoon: afternoonSlots.length > 0 ? afternoonSlots : null,
        },
        venue: {
          morning: morningSlots.length > 0 ? cleanedVenue : null,
          afternoon: afternoonSlots.length > 0 ? cleanedVenue : null,
        },
        course: selectedCourse,
      };

      if (teacherToEdit) {
        editTeacher(teacherToEdit.id, teacherData);
        toast.success("Teacher updated successfully!");
      } else {
        addTeacher(teacherData);
        toast.success("Teacher added successfully!");
      }

      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <AnimatedButton variant={variant} size={size}>
          {buttonIcon === "add" ? <AddIcon /> : <Edit2Icon />}
          {buttonText}
        </AnimatedButton>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeaderMemo teacherToEdit={teacherToEdit} />
          <div className="grid gap-4 py-4">
            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="grid gap-2"
            >
              <Label>Course</Label>
              <Select
                value={selectedCourse}
                onValueChange={handleCourseChange}
                disabled={courses.length === 0}
              >
                <SelectTrigger className="flex-1">
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MotionDiv
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="grid gap-2"
              >
                <Label htmlFor="teacherName">Teacher Name</Label>
                <Input
                  id="teacherName"
                  value={teacherName}
                  onChange={handleNameChange}
                  placeholder="Dr. Smith"
                />
              </MotionDiv>

              <MotionDiv
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="grid gap-2"
              >
                <Label htmlFor="color">Color</Label>
                <Select value={selectedColor} onValueChange={handleColorChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((color) => (
                      <SelectItem
                        key={color.value}
                        value={color.value}
                        className={cn(
                          "my-2",
                          `bg-${color.value}-ui text-${color.value}-normal`,
                        )}
                      >
                        {color.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </MotionDiv>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MotionDiv
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="grid gap-2"
              >
                <Label htmlFor="slots">Slots</Label>
                <Input
                  id="slots"
                  value={slots}
                  onChange={handleSlotsChange}
                  placeholder="e.g. A1+TA1"
                />
              </MotionDiv>

              <MotionDiv
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="grid gap-2"
              >
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={venue}
                  onChange={handleVenueChange}
                  placeholder="e.g. Room 101"
                />
              </MotionDiv>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <AnimatedButton variant="outline">Cancel</AnimatedButton>
            </DialogClose>
            <AnimatedButton
              variant="green"
              onClick={handleAddTeacher}
              disabled={
                !teacherName.trim() ||
                !slots.trim() ||
                !selectedCourse ||
                courses.length === 0
              }
            >
              {teacherToEdit ? "Update" : "Save"}
            </AnimatedButton>
          </DialogFooter>
        </MotionDiv>
      </DialogContent>
    </Dialog>
  );
}

const DialogHeaderMemo = memo(
  ({ teacherToEdit }: { teacherToEdit: Teacher | null | undefined }) => {
    return (
      <DialogHeader>
        <DialogTitle>
          {teacherToEdit ? "Edit Teacher" : "Add Teacher"}
        </DialogTitle>
        <DialogDescription>
          {teacherToEdit
            ? "Edit the teacher details below:"
            : "Enter the teacher details below to add them to your FFCS planner."}
        </DialogDescription>
      </DialogHeader>
    );
  },
);
DialogHeaderMemo.displayName = "DialogHeaderMemo";
