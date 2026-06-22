"use client";

import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export function WarnMessage() {
  return (
    <Alert variant="default" className="mb-4 bg-blue-ui">
      <AlertCircleIcon />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>
        Currently when adding teachers with embedded theory some faculty and not
        grouping by their lab and theory, make sure to select both lab and
        theory
      </AlertDescription>
    </Alert>
  );
}
