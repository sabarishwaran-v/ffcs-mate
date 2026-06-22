"use client";

import { DownloadIcon, Loader, TriangleAlert } from "lucide-react";
import { useCallback, useState } from "react";

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
import { useScheduleStore } from "@/lib/store";

export function DownloadTimetableDialog({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { getExportData, getActiveTimetable } = useScheduleStore();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const activeTimetable = getActiveTimetable();

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) {
        setError("");
      } else {
        const defaultName = activeTimetable?.name || "timetable";
        const now = new Date();
        const datePart = now.toISOString().split("T")[0];
        setName(`${defaultName}-${datePart}`);
      }
    },
    [activeTimetable],
  );

  const handleDownload = useCallback(() => {
    if (!name.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const data = getExportData();
      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${name.trim()}.ffcsplanner`;
      a.click();

      setTimeout(() => URL.revokeObjectURL(url), 100);

      setIsLoading(false);
      handleOpenChange(false);
    } catch (err) {
      console.error("Error while downloading:", err);
      setError("Failed to save timetable. Please try again.");
      setIsLoading(false);
    }
  }, [getExportData, handleOpenChange, name]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <AnimatedButton size="sm" disabled={disabled} variant={"primary"}>
          <DownloadIcon /> Save TT
        </AnimatedButton>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <DialogTitle>Save Timetable</DialogTitle>
            <DialogDescription>
              Export your timetable to use again.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="grid gap-2"
            >
              <Label htmlFor="name">File Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Timetable"
              />
            </MotionDiv>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <AnimatedButton variant="outline">Cancel</AnimatedButton>
            </DialogClose>

            <AnimatedButton
              variant={error ? "red" : "primary"}
              className="flex items-center gap-2"
              onClick={handleDownload}
              disabled={!name.trim() || isLoading}
            >
              {isLoading && <Loader className="w-4 h-4 animate-spin" />}
              {error && !isLoading && <TriangleAlert className="w-4 h-4" />}
              {!isLoading && !error && <DownloadIcon className="w-4 h-4" />}
              {isLoading ? "Saving..." : error ? "Retry" : "Save"}
            </AnimatedButton>
          </DialogFooter>
        </MotionDiv>
      </DialogContent>
    </Dialog>
  );
}
