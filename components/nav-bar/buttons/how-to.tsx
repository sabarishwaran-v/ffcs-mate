"use client";

import { CircleQuestionMarkIcon } from "lucide-react";

import { AnimatedButton } from "@/components/ui/button";

export function HowToButton() {
  return (
    <AnimatedButton
      variant="green"
      onClick={() => {
        window.open("https://infinite-coder.notion.site/", "_blank");
      }}
    >
      <CircleQuestionMarkIcon className="w-4 h-4" />
      How to?
    </AnimatedButton>
  );
}
