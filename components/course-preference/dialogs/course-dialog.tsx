"use client";

import { type VariantProps } from "class-variance-authority";
import { EditIcon } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { toast } from "sonner";

import { AddIcon } from "@/components/icon-memo";
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
import { useScheduleStore } from "@/lib/store";
import { Course, DialogButtonProps } from "@/types";

interface CourseDialogProps {
  courseToEdit?: Course;
}

export function CourseDialog({
  disabled,
  buttonText,
  buttonIcon,
  courseToEdit,
  variant = "primary",
  size,
}: CourseDialogProps &
  DialogButtonProps &
  VariantProps<typeof buttonVariants>) {
  const { addCourse, editCourse } = useScheduleStore();

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(courseToEdit ? courseToEdit.code : "");
  const [name, setName] = useState(courseToEdit ? courseToEdit.name : "");
  const [credits, setCredits] = useState(
    courseToEdit ? courseToEdit.credits.toString() : "4",
  );

  const handleSave = useCallback(() => {
    if (!code.trim() || !name.trim()) return;
    const courseData = {
      code: code.trim(),
      name: name.trim(),
      credits: parseFloat(credits) || 0,
    };
    if (courseToEdit) {
      editCourse(courseToEdit.id, courseData);
      toast.success("Course updated successfully!");
    } else {
      addCourse(courseData);
      toast.success("Course added successfully!");
    }
    setOpen(false);
  }, [code, name, credits, courseToEdit, addCourse, editCourse]);

  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value),
    [],
  );
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value),
    [],
  );
  const handleCreditsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setCredits(e.target.value),
    [],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <AnimatedButton disabled={disabled} variant={variant} size={size}>
          {buttonIcon === "add" ? <AddIcon /> : <EditIcon />}
          {buttonText && buttonText}
        </AnimatedButton>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeaderMemo courseToEdit={courseToEdit} />

          <div className="grid gap-4 py-4">
            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="grid gap-2"
            >
              <Label htmlFor="code">Course Code</Label>
              <Input
                id="code"
                value={code}
                onChange={handleCodeChange}
                placeholder="CS101"
              />
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="grid gap-2"
            >
              <Label htmlFor="name">Course Name</Label>
              <Input
                id="name"
                value={name}
                onChange={handleNameChange}
                placeholder="Introduction to Programming"
              />
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="grid gap-2"
            >
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                min="1"
                step={0.5}
                value={credits}
                onChange={handleCreditsChange}
              />
            </MotionDiv>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <AnimatedButton variant="outline">Cancel</AnimatedButton>
            </DialogClose>
            <AnimatedButton
              variant="greenSolid"
              onClick={handleSave}
              disabled={!code.trim() || !name.trim()}
            >
              {courseToEdit ? "Update" : "Save"}
            </AnimatedButton>
          </DialogFooter>
        </MotionDiv>
      </DialogContent>
    </Dialog>
  );
}

const DialogHeaderMemo = memo(
  ({ courseToEdit }: { courseToEdit: Course | null | undefined }) => {
    return (
      <DialogHeader>
        <DialogTitle>{courseToEdit ? "Edit Course" : "Add Course"}</DialogTitle>
        <DialogDescription>
          {courseToEdit
            ? "Edit the course details below:"
            : "Enter the course details below to add it to your FFCS planner."}
        </DialogDescription>
      </DialogHeader>
    );
  },
);
DialogHeaderMemo.displayName = "DialogHeaderMemo";
