"use client";

import { GoogleAnalytics, sendGAEvent } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { useEffect } from "react";

export function VersionAnalytics() {
  useEffect(() => {
    sendGAEvent("app_version_check", {
      app_version: process.env.NEXT_PUBLIC_APP_VERSION,
    });
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("set", "user_properties", {
        app_version: process.env.NEXT_PUBLIC_APP_VERSION,
      });
    }
  }, []);

  return (
    <>
      <Analytics />
      <GoogleAnalytics gaId="G-NBX1B5KT25" />
    </>
  );
}
