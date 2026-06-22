import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FFCS MATE",
    short_name: "FFCS MATE",
    description:
      "A comprehensive course planning tool for VIT University's Fully Flexible Credit System (FFCS). Plan your academic schedule, manage courses, and optimize your timetable.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff",
    theme_color: "#fff",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
