"use client";

import { Moon, Sun, Paintbrush } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { MotionDiv } from "../../ui/motion";

export function ModeToggle({ isMobile = false }: { isMobile?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Check if first time user
    const hasSeenGuide = localStorage.getItem("hasSeenThemeGuide");
    if (!hasSeenGuide) {
      // Small delay to let the UI settle before showing the guide
      const showTimer = setTimeout(() => {
        setShowGuide(true);
      }, 1000);
      
      // Auto dismiss after 5 seconds
      const hideTimer = setTimeout(() => {
        setShowGuide(false);
        localStorage.setItem("hasSeenThemeGuide", "true");
      }, 6000);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open && showGuide) {
      setShowGuide(false);
      localStorage.setItem("hasSeenThemeGuide", "true");
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
    if (showGuide) {
      setShowGuide(false);
      localStorage.setItem("hasSeenThemeGuide", "true");
    }
  };

  const button = isMobile ? (
    <Button variant="outline" size={"sm"} onClick={toggleTheme}>
      <Moon className="w-4 h-4 transition-all scale-100 rotate-0 dark:-rotate-90 dark:scale-0 dark:hidden" />
      <Sun className="w-4 h-4 transition-all scale-0 rotate-90 dark:rotate-0 dark:scale-100" />
      <span className="">Toggle theme</span>
    </Button>
  ) : (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      <Moon className="w-4 h-4 transition-all scale-100 rotate-0 dark:-rotate-90 dark:scale-0 dark:hidden" />
      <Sun className="absolute w-4 h-4 transition-all scale-0 rotate-90 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );

  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Popover open={showGuide} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          {button}
        </PopoverTrigger>
        <PopoverContent side="bottom" align="end" className="w-64 p-4 animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 shadow-lg border-primary/20">
          <div className="flex gap-3">
            <div className="bg-primary/10 p-2 rounded-full h-fit mt-0.5">
              <Paintbrush className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm leading-none tracking-tight">Customize Theme</h4>
              <p className="text-xs text-muted-foreground leading-snug">
                You can switch between Light and Dark mode here anytime!
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </MotionDiv>
  );
}
