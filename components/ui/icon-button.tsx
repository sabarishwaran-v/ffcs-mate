import { VariantProps } from "class-variance-authority";
import {
  CheckIcon,
  Download,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";

import { AnimatedButton, Button, buttonVariants } from "./button";

type IconType = "add" | "edit" | "delete" | "check" | "close" | "download";

interface IconButtonProps {
  icon: IconType;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  useAnimation?: boolean;
}

export function IconButton({
  icon,
  variant = "default",
  size = "sm",
  onClick,
  disabled,
  className,
  label,
  useAnimation = true,
}: IconButtonProps & VariantProps<typeof buttonVariants>) {
  const getIcon = () => {
    switch (icon) {
      case "add":
        return <PlusIcon className="w-4 h-4" />;
      case "edit":
        return <PencilIcon className="w-4 h-4" />;
      case "delete":
        return <TrashIcon className="w-4 h-4" />;
      case "check":
        return <CheckIcon className="w-4 h-4" />;
      case "close":
        return <XIcon className="w-4 h-4" />;
      case "download":
        return <Download className="w-4 h-4" />;
    }
  };

  return useAnimation ? (
    <AnimatedButton
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {getIcon()}
      {label && label}
    </AnimatedButton>
  ) : (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {getIcon()}
      {label && label}
    </Button>
  );
}
