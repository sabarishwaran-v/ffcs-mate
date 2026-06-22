"use client";

import { FileUp, ClipboardPaste, File, X, CheckCircle2 } from "lucide-react";
import { useState, useRef } from "react";

export function ImportCourseList() {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const selectedFile = files[0];
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "text/plain",
    ];

    if (
      allowedTypes.includes(selectedFile.type) ||
      selectedFile.name.match(/\.(pdf|xlsx|xls|csv|txt)$/i)
    ) {
      setFile(selectedFile);
    } else {
      alert("Invalid file type. Please upload a PDF or Excel document.");
    }
  };

  return (
    <>
      <div className="text-center mb-8 relative z-10">
        <h2 className="text-3xl font-bold mb-2">Import Your Course List</h2>
        <p className="text-muted-foreground">
          Paste your course data directly, or upload the provided file.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-4 relative z-10">
        {/* Text Area */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-sm font-semibold text-primary">
            <ClipboardPaste className="w-4 h-4" />
            <span>Copy & Paste Data</span>
          </div>
          <textarea
            className="w-full h-56 bg-muted/30 border border-border rounded-xl p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none placeholder:text-muted-foreground/50 whitespace-pre overflow-auto"
            placeholder={`e.g.,\nCourseCode  CourseTitle                     CourseType  SLOT\nCSE1012     Problem Solving using Python    ETH         A+A1+TA+TA1+TAA+TAA1\nCSE2001     Data Structures and Algorithms  ETH         B+B1+TB+TB1+TBB+TBB1\n   .                       .                 .                    .\n   .                       .                 .                    .\n   .                       .                 .                    .\n   .                       .                 .                    .\n   .                       .                 .                    .`}
          />
        </div>

        {/* OR Divider for Mobile / Visual for Desktop */}
        <div className="hidden lg:flex items-center justify-center relative px-2">
          <div className="absolute inset-y-0 w-px bg-border/50" />
          <div className="bg-card px-3 py-1 rounded-full border border-border text-xs font-bold text-muted-foreground relative z-10">
            OR
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-4 flex flex-col">
          <div className="flex items-center space-x-2 text-sm font-semibold text-primary">
            <FileUp className="w-4 h-4" />
            <span>Upload File</span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.xlsx,.xls,.csv"
            onChange={handleFileInput}
          />

          {!file ? (
            <div
              className="flex-1 w-full border-2 border-dashed border-border hover:bg-muted/30 hover:border-purple-500/50 rounded-xl flex flex-col items-center justify-center p-8 transition-all cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="p-4 bg-primary/5 rounded-full mb-4 transition-transform duration-300 group-hover:scale-110">
                <FileUp className="w-8 h-8 text-primary" />
              </div>
              <p className="font-medium text-foreground text-center mb-1">
                Click to upload your file here
              </p>
              <p className="text-xs text-muted-foreground text-center">
                *Supports PDF or Excel File only
              </p>
            </div>
          ) : (
            <div className="flex-1 w-full border-2 border-solid border-purple-500/50 bg-purple-500/5 rounded-xl flex flex-col items-center justify-center p-8 relative">
              <button
                onClick={() => setFile(null)}
                className="absolute top-4 right-4 p-1.5 bg-background border border-border rounded-full text-muted-foreground hover:text-red-500 hover:border-red-500/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="p-4 bg-purple-500/10 rounded-full mb-4 text-purple-600 dark:text-purple-400 relative">
                <File className="w-8 h-8" />
                <CheckCircle2 className="w-5 h-5 absolute -bottom-1 -right-1 text-green-500 bg-background rounded-full" />
              </div>
              <p
                className="font-medium text-foreground text-center mb-1 truncate max-w-[200px]"
                title={file.name}
              >
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground text-center">
                {(file.size / 1024 / 1024).toFixed(2)} MB • Ready
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
