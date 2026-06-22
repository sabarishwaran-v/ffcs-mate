"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useScheduleStore } from "@/lib/store";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Home } from "lucide-react";

import { IssueButton } from "./nav-bar/buttons/issues";
import { ShareButton } from "./nav-bar/buttons/share-button";
import { ModeToggle } from "./nav-bar/buttons/mode-toggle";
import { MobileNav } from "./nav-bar/mobile-nav";
import { AuthDialog } from "./auth/auth-dialog";
import { RoomDashboardDialog } from "./room/room-dashboard-dialog";
import Link from "next/link";

export function Title() {
  const pathname = usePathname();
  const router = useRouter();
  const activeSemester = useScheduleStore((state) => state.activeSemester);
  const [isHomeWarningOpen, setIsHomeWarningOpen] = useState(false);
  const isHomePage = pathname === "/";
  const isRoomPage = pathname?.startsWith("/room/");
  const isCollaborationEnabled =
    process.env.NEXT_PUBLIC_ENABLE_COLLABORATION !== "false";
  const showRoomButton = !isHomePage && !isRoomPage && isCollaborationEnabled;

  // We have completely removed the physical back button trap logic for now
  // to prevent browser history manipulation bugs across different browsers.
  useEffect(() => {
    // Empty hook to maintain component stability
  }, [pathname, isHomePage]);

  return (
    <div className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b shadow-sm mb-6">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div
          onClick={() => {
            if (isHomePage) return;
            if (activeSemester) {
              setIsHomeWarningOpen(true);
            } else {
              router.push("/");
            }
          }}
          className="flex items-center group cursor-pointer"
        >
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-tr from-purple-500/10 to-blue-500/10 p-2 mr-4 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            <Image
              src="/logo.png"
              alt="FFCS MATE Logo"
              width={44}
              height={44}
              className="object-contain"
            />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-purple-500 to-blue-600 bg-clip-text text-transparent">
              FFCS
            </span>
            <span className="text-foreground ml-2">MATE</span>
          </h1>
        </div>

        <div className="hidden xl:flex items-center gap-3">
          {showRoomButton && <RoomDashboardDialog />}
          <AuthDialog />
          <div className="w-px h-6 bg-border/60 mx-1" />
          <ShareButton />
          <IssueButton />
          <div className="w-px h-6 bg-border/60 mx-1" />
          <ModeToggle />
        </div>
        <div className="xl:hidden">
          <MobileNav />
        </div>
      </div>

      <Dialog open={isHomeWarningOpen} onOpenChange={setIsHomeWarningOpen}>
        <DialogContent className="bg-card border border-border rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Home className="w-6 h-6 text-purple-500" />
              Return to Homepage?
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground mt-2">
              Are you sure you want to leave the planner? Don't worry, your{" "}
              <strong className="text-foreground font-semibold">
                {activeSemester === "winter2025"
                  ? "Winter Semester 2025-26"
                  : activeSemester === "fall2026"
                  ? "Fall Semester 2026"
                  : activeSemester === "spring2026"
                  ? "Spring Semester 2026"
                  : "Semester"}
              </strong>{" "}
              data is stored safely and you can continue editing at any time!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 sm:justify-end gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsHomeWarningOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsHomeWarningOpen(false);
                toast.success("Progress saved safely!", { duration: 2000 });
                router.push("/");
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl border-0"
            >
              Leave to Homepage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
