import { useContext } from "react";

import { EditContext } from "../providers/edit-provider";

export function useEditProvider() {
  const context = useContext(EditContext);
  if (context === undefined) {
    throw new Error("useEditProvider must be used within an EditProvider");
  }
  return context;
}
