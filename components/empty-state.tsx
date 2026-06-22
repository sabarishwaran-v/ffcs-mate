import { MotionDiv } from "./ui/motion";

export default function EmptyState({
  text,
  animationKey,
  children,
}: {
  text: string;
  animationKey?: string;
  children?: React.ReactNode;
}) {
  return (
    <MotionDiv
      key={animationKey}
      className="p-4 text-center border rounded-lg text-muted-foreground flex flex-col items-center justify-center gap-4 py-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <p>{text}</p>
      {children}
    </MotionDiv>
  );
}
