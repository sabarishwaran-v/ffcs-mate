import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

import { MotionDiv } from "./motion";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",

        primary:
          "bg-bluea-ui text-bluea-dim focus-visible:ring-bluea-8 dark:focus-visible:ring-bluedarka-8",
        primarySolid:
          "bg-blue-ui text-blue-dim focus-visible:ring-blue-8 dark:focus-visible:ring-bluedark-8",
        secondary:
          "bg-orangea-ui text-orangea-dim focus-visible:ring-orangea-8 dark:focus-visible:ring-orangedarka-8",
        secondarySolid:
          "bg-orange-ui text-orange-dim focus-visible:ring-orange-8 dark:focus-visible:ring-orangedark-8",
        yellow:
          "bg-yellowa-ui text-yellowa-dim focus-visible:ring-yellowa-8 dark:focus-visible:ring-yellowdarka-8",
        yellowSolid:
          "bg-yellow-ui text-yellow-dim focus-visible:ring-yellow-8 dark:focus-visible:ring-yellowdark-8",
        red: "bg-reda-ui text-reda-dim focus-visible:ring-reda-8 dark:focus-visible:ring-reddarka-8",
        redSolid:
          "bg-red-ui text-red-dim focus-visible:ring-red-8 dark:focus-visible:ring-reddark-8",
        green:
          "bg-greena-ui text-greena-dim focus-visible:ring-greena-8 dark:focus-visible:ring-greenadarka-8",
        greenSolid:
          "bg-green-ui text-greena-dim focus-visible:ring-green-8 dark:focus-visible:ring-greenadark-8",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? SlotPrimitive.Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

function AnimatedButton({
  className,
  variant,
  size,
  asChild = false,
  leftIcon,
  rightIcon,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  }) {
  const Comp = asChild ? SlotPrimitive.Slot : "button";

  return (
    <MotionDiv
      initial={{ scale: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      exit={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.2 }}
      tabIndex={-1}
    >
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {leftIcon && <span className="mr-1">{leftIcon}</span>}
        {props.children}
        {rightIcon && <span className="ml-1">{rightIcon}</span>}
      </Comp>
    </MotionDiv>
  );
}
export { AnimatedButton, Button, buttonVariants };
