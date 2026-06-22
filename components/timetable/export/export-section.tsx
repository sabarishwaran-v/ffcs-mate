"use client";

import { Download, FileIcon as FilePdf, ImageIcon, Share2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/radix/tabs";
import { AnimatedButton } from "@/components/ui/button";
import { MotionDiv, ScrollAnimation } from "@/components/ui/motion";
import { useScheduleStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { exportToImage, exportToPdf } from "@/src/utils/export";

import { ExportPreview } from "./export-preview";

export function ExportSection() {
  const [exportType, setExportType] = useState<"pdf" | "image">("image");
  const [isExporting, setIsExporting] = useState(false);
  const { getSelectedTeachers } = useScheduleStore();
  const previewRef = useRef<HTMLDivElement>(null);

  const selectedTeachers = getSelectedTeachers();
  const hasSelectedCourses = selectedTeachers.length > 0;

  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleExport = async () => {
    if (!previewRef.current) return;

    setIsExporting(true);
    try {
      // Use a temporary div with full scale for export
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.transform = "scale(1)";
      tempDiv.innerHTML = previewRef.current.innerHTML;
      document.body.appendChild(tempDiv);

      switch (exportType) {
        case "pdf":
          await exportToPdf(tempDiv, "ffcs-timetable.pdf");
          toast("PDF exported successfully", {
            description: "Your timetable has been exported as a PDF file",
          });
          break;
        case "image":
          await exportToImage(tempDiv, "ffcs-timetable.png");
          toast("Image exported successfully", {
            description: "Your timetable has been exported as an image",
          });
          break;
      }

      // Clean up
      document.body.removeChild(tempDiv);
    } catch (error) {
      toast.error("Export failed", {
        description: "There was an error exporting your timetable",
      });
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ScrollAnimation animation="fadeIn" duration={0.6} className="mb-6">
      <div className="border rounded-lg shadow-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold">Export Timetable</h2>
        </div>

        <div className="p-4">
          <Tabs
            defaultValue="image"
            className="mb-4"
            onValueChange={(value) => setExportType(value as "pdf" | "image")}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="image" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Image
              </TabsTrigger>
              <TabsTrigger value="pdf" className="flex items-center gap-2">
                <FilePdf className="w-4 h-4" />
                PDF
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pdf" className="mt-2">
              <div className="p-4 border rounded-md">
                <h3 className="mb-2 text-lg font-medium">PDF Export</h3>
                <p className="text-sm text-muted-foreground">
                  Export your timetable as a PDF file that you can save, share,
                  or print later.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="image" className="mt-2">
              <div className="p-4 border rounded-md">
                <h3 className="mb-2 text-lg font-medium">Image Export</h3>
                <p className="text-sm text-muted-foreground">
                  Export your timetable as a PNG image that you can easily share
                  on social media or messaging apps.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <h3 className="text-lg font-medium">Preview</h3>
            <div
              className={cn(
                "border rounded-md p-4 max-h-[60vh] overflow-auto",
                "flex justify-center items-start",
              )}
            >
              <ScrollAnimation animation="fadeIn" duration={0.5}>
                <div
                  ref={previewRef}
                  className="origin-top"
                  style={{
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                >
                  <ExportPreview />
                </div>
              </ScrollAnimation>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <AnimatedButton
              onClick={handleExport}
              disabled={!isMounted || isExporting || !hasSelectedCourses}
              className="gap-2"
            >
              {isExporting ? (
                <MotionDiv
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 1,
                    ease: "linear",
                  }}
                >
                  <Share2 className="w-4 h-4" />
                </MotionDiv>
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting
                ? "Exporting..."
                : `Export as ${exportType.toWellFormed()}`}
            </AnimatedButton>
          </div>
        </div>
      </div>
    </ScrollAnimation>
  );
}
