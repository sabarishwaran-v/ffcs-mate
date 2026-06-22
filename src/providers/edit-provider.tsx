"use client";

import { createContext, useState } from "react";

interface EditContextType {
  editMode: boolean;
  toggleEditMode: () => void;
}

export const EditContext = createContext<EditContextType | undefined>(
  undefined,
);

export const EditProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [editMode, setEditMode] = useState<boolean>(false);

  const toggleEditMode = () => {
    setEditMode((prev) => !prev);
  };

  return (
    <EditContext.Provider value={{ editMode, toggleEditMode }}>
      {children}
    </EditContext.Provider>
  );
};
