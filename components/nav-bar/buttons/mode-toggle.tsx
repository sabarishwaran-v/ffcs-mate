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
        <PopoverContent 
          side="bottom" 
          align="center" 
          sideOffset={10} 
          className="relative w-auto p-2 px-3 min-w-0 bg-primary text-primary-foreground border-none rounded-md shadow-md animate-in fade-in slide-in-from-top-1"
        >
          {/* Custom upward arrow */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45 rounded-sm" />
          <span className="relative z-10 text-xs font-medium whitespace-nowrap">Switch between themes</span>
        </PopoverContent>
      </Popover>
    </MotionDiv>
  );
}
