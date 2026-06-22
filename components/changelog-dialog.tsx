"use client";

import { useEffect, useState } from "react";
import { Sparkles, Users, ShieldAlert, Cloud, Rocket } from "lucide-react";
import { AnimatedButton } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MotionDiv } from "./ui/motion";

const CURRENT_VERSION = "2.0.0";

interface ChangelogDialogProps {
  currentAppVersion?: string;
}

export function ChangelogDialog({ currentAppVersion }: ChangelogDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show automatically if they haven't seen the 2.0.0 update
    const seenVersion = localStorage.getItem("ffcs_mate_changelog_seen");
    if (seenVersion !== CURRENT_VERSION) {
      // Small delay so it pops up nicely after page load
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("ffcs_mate_changelog_seen", CURRENT_VERSION);
    setIsOpen(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
        else setIsOpen(true);
      }}
    >
      <DialogTrigger asChild>
        <AnimatedButton
          variant="outline"
          size="sm"
          className="rounded-full px-4 border-primary/30 text-primary hover:bg-primary/10"
        >
          <Sparkles className="w-4 h-4 mr-2" /> View Changelog (v
          {CURRENT_VERSION})
        </AnimatedButton>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl p-0 overflow-hidden flex flex-col rounded-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col h-full"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white shrink-0">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Rocket className="w-6 h-6 text-yellow-300" />
              Welcome to FFCS MATE v2.0!
            </h2>
            <p className="text-white/90 mt-2 text-sm">
              We have completely reimagined the platform from the ground up.
              Faster, more beautiful, and infinitely more powerful.
            </p>
          </div>

          <ScrollArea className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="space-y-8">
              {/* Feature 1 */}
              <div className="flex gap-4">
                <div className="mt-1 bg-blue-500/10 p-2 rounded-xl h-fit border border-blue-500/20">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">
                    Real-Time Multiplayer (Rooms)
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Planning with friends has never been easier. Generate a room
                    code, share it, and watch your friends add and drop courses
                    in real-time. View everyone's selected slots side-by-side!
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-4">
                <div className="mt-1 bg-red-500/10 p-2 rounded-xl h-fit border border-red-500/20">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">
                    Intelligent Clash Detection
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Our brand new smart engine automatically blocks overlapping
                    slots and instantly warns you if two courses have clashing
                    mid-term or final exam schedules.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-4">
                <div className="mt-1 bg-purple-500/10 p-2 rounded-xl h-fit border border-purple-500/20">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">
                    Stunning Glassmorphism UI
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    We threw out the old design. Enjoy a premium, true
                    dark/light mode interface with beautiful translucent layers,
                    micro-animations, and satisfying transitions.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex gap-4">
                <div className="mt-1 bg-green-500/10 p-2 rounded-xl h-fit border border-green-500/20">
                  <Cloud className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">
                    Cloud Sync & Verification
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Your timetable safely syncs across all your devices
                    instantly. We also implemented strict{" "}
                    <code className="bg-secondary px-1 py-0.5 rounded text-xs text-primary">
                      @vitapstudent.ac.in
                    </code>{" "}
                    Google login to keep the platform secure for verified
                    students only.
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border bg-secondary/20 flex justify-end shrink-0">
            <AnimatedButton
              onClick={handleClose}
              className="px-8 font-semibold shadow-lg shadow-primary/20"
            >
              Let's Go!
            </AnimatedButton>
          </div>
        </MotionDiv>
      </DialogContent>
    </Dialog>
  );
}
