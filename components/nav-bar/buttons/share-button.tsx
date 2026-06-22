"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

import { AnimatedButton } from "@/components/ui/button";

export function ShareButton() {
  const [copied, setCopied] = useState(false);
  const shareUrl = "https://ffcs-mate.vercel.app";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatedButton
      variant="outline"
      onClick={handleCopyLink}
      className="w-[100px]"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </>
      )}
    </AnimatedButton>
  );
}
