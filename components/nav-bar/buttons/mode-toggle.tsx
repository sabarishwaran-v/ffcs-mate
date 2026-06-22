"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { MotionDiv } from "../../ui/motion";

export function ModeToggle({ isMobile = false }: { isMobile?: boolean }) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {isMobile ? (
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
      )}
    </MotionDiv>
  );
}
