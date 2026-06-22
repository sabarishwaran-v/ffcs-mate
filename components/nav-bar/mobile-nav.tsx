"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { AnimatedButton } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { IssueButton } from "./buttons/issues";
import { ShareButton } from "./buttons/share-button";
import { ModeToggle } from "./buttons/mode-toggle";
import { AuthDialog } from "../auth/auth-dialog";
import { RoomDashboardDialog } from "../room/room-dashboard-dialog";
import { usePathname } from "next/navigation";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isRoomPage = pathname?.startsWith("/room/");
  const isCollaborationEnabled =
    process.env.NEXT_PUBLIC_ENABLE_COLLABORATION !== "false";
  const showRoomButton = !isHomePage && !isRoomPage && isCollaborationEnabled;

  return (
    <div className="flex gap-2">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <AnimatedButton variant="outline" size="icon">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
          </AnimatedButton>
        </SheetTrigger>
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-4 mt-6 items-center">
            {showRoomButton && <RoomDashboardDialog />}
            <AuthDialog />
            <div className="w-full h-px bg-border/60 my-2" />
            <ShareButton />
            <IssueButton />
            <ModeToggle isMobile />
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
