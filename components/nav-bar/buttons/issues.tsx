"use client";

import { SiGithub } from '@icons-pack/react-simple-icons';

import { AnimatedButton } from "@/components/ui/button";

export function IssueButton() {
  return (
    <AnimatedButton
      variant="red"
      onClick={() => {
        window.open(
          "https://github.com/Sabarishwaran-V/ffcs-mate/issues/new",
          "_blank",
        );
      }}
    >
      <SiGithub className="w-4 h-4" />
      Report Issue
    </AnimatedButton>
  );
}
