/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  AnimatePresence,
  AnimationGeneratorType,
  Easing,
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { memo, useMemo, useRef } from "react";
import React from "react";

import { cn } from "@/lib/utils";

interface MotionDivProps {
  children: React.ReactNode;
  className?: string;
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
  whileHover?: any;
  whileTap?: any;
  layout?: boolean;
  layoutId?: string;
  [key: string]: any;
}

const MotionDiv = memo(function MotionDiv({
  children,
  className,
  initial = { opacity: 0 },
  animate = { opacity: 1 },
  exit = { opacity: 0 },
  transition = { duration: 0.2 },
  whileHover,
  whileTap,
  layout,
  layoutId,
  ...props
}: MotionDivProps) {
  const motionProps = useMemo(
    () => ({
      initial,
      animate,
      exit,
      transition,
      whileHover,
      whileTap,
      layout,
      layoutId,
      ...props,
    }),
    [
      initial,
      animate,
      exit,
      transition,
      whileHover,
      whileTap,
      layout,
      layoutId,
      props,
    ],
  );

  return (
    <motion.div className={cn(className)} {...motionProps}>
      {children}
    </motion.div>
  );
});

interface AnimatePresenceWrapperProps {
  children: React.ReactNode;
  mode?: "sync" | "wait" | "popLayout";
}

function AnimatePresenceWrapper({
  children,
  mode = "sync",
}: AnimatePresenceWrapperProps) {
  return <AnimatePresence mode={mode}>{children}</AnimatePresence>;
}

// Enhanced animation presets
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3, ease: "easeOut" },
};

const slideInFromTop = {
  initial: { y: -30, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -30, opacity: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

const slideInFromLeft = {
  initial: { x: -30, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -30, opacity: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

const slideInFromRight = {
  initial: { x: 30, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 30, opacity: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

const slideInFromBottom = {
  initial: { y: 30, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 30, opacity: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

const scaleUp = {
  initial: { scale: 0.85, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.85, opacity: 0 },
  transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] },
};

const slideUp = {
  initial: { y: 50, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 50, opacity: 0 },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
};

const zoomIn = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 },
  transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
};

const rotateIn = {
  initial: { rotate: -10, scale: 0.8, opacity: 0 },
  animate: { rotate: 0, scale: 1, opacity: 1 },
  exit: { rotate: 10, scale: 0.8, opacity: 0 },
  transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
};

const bounceIn = {
  initial: { scale: 0.3, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.3, opacity: 0 },
  transition: {
    duration: 0.6,
    ease: [0.68, -0.55, 0.265, 1.55],
    scale: {
      type: "spring",
      damping: 10,
      stiffness: 100,
      restDelta: 0.001,
    },
  },
};

interface ScrollAnimationProps {
  children: React.ReactNode;
  className?: string;
  animation?:
    | "fadeIn"
    | "slideUp"
    | "slideLeft"
    | "slideRight"
    | "slideDown"
    | "scaleUp"
    | "zoomIn"
    | "rotateIn"
    | "bounceIn";
  threshold?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
  stagger?: number;
}

const ScrollAnimation = memo(function ScrollAnimation({
  children,
  className,
  animation = "fadeIn",
  threshold = 0.1,
  delay = 0,
  duration = 0.5,
  once = true,
  stagger = 0,
}: ScrollAnimationProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });

  const animationProps = useMemo(() => {
    const baseTransition = {
      duration,
      delay: delay + stagger,
      ease: [0.25, 0.46, 0.45, 0.94] as Easing,
    };

    switch (animation) {
      case "slideUp":
        return {
          initial: { y: 50, opacity: 0 },
          animate: isInView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 },
          transition: baseTransition,
        };
      case "slideLeft":
        return {
          initial: { x: 50, opacity: 0 },
          animate: isInView ? { x: 0, opacity: 1 } : { x: 50, opacity: 0 },
          transition: baseTransition,
        };
      case "slideRight":
        return {
          initial: { x: -50, opacity: 0 },
          animate: isInView ? { x: 0, opacity: 1 } : { x: -50, opacity: 0 },
          transition: baseTransition,
        };
      case "slideDown":
        return {
          initial: { y: -50, opacity: 0 },
          animate: isInView ? { y: 0, opacity: 1 } : { y: -50, opacity: 0 },
          transition: baseTransition,
        };
      case "scaleUp":
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: isInView
            ? { scale: 1, opacity: 1 }
            : { scale: 0.8, opacity: 0 },
          transition: {
            ...baseTransition,
            ease: [0.34, 1.56, 0.64, 1] as Easing,
          },
        };
      case "zoomIn":
        return {
          initial: { scale: 0, opacity: 0 },
          animate: isInView
            ? { scale: 1, opacity: 1 }
            : { scale: 0, opacity: 0 },
          transition: {
            ...baseTransition,
            ease: [0.34, 1.56, 0.64, 1] as Easing,
          },
        };
      case "rotateIn":
        return {
          initial: { rotate: -15, scale: 0.8, opacity: 0 },
          animate: isInView
            ? { rotate: 0, scale: 1, opacity: 1 }
            : { rotate: -15, scale: 0.8, opacity: 0 },
          transition: {
            ...baseTransition,
            ease: [0.34, 1.56, 0.64, 1] as Easing,
          },
        };
      case "bounceIn":
        return {
          initial: { scale: 0.3, opacity: 0 },
          animate: isInView
            ? { scale: 1, opacity: 1 }
            : { scale: 0.3, opacity: 0 },
          transition: {
            ...baseTransition,
            ease: [0.68, -0.55, 0.265, 1.55] as Easing,
            type: "spring" as AnimationGeneratorType,
            stiffness: 100,
            damping: 10,
            restDelta: 0.001,
          },
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: isInView ? { opacity: 1 } : { opacity: 0 },
          transition: baseTransition,
        };
    }
  }, [animation, isInView, delay, duration, stagger]);

  return (
    <motion.div ref={ref} className={className} {...animationProps}>
      {children}
    </motion.div>
  );
});

interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  direction?: "up" | "down" | "left" | "right";
}

function Parallax({
  children,
  className,
  speed = 0.5,
  direction = "up",
}: ParallaxProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  let transformX = useTransform(scrollYProgress, [0, 1], ["0%", "0%"]);
  let transformY = useTransform(scrollYProgress, [0, 1], ["0%", "0%"]);

  const amount = 100 * speed;

  switch (direction) {
    case "up":
      transformY = useTransform(
        scrollYProgress,
        [0, 1],
        [`${amount}%`, `-${amount}%`],
      );
      break;
    case "down":
      transformY = useTransform(
        scrollYProgress,
        [0, 1],
        [`-${amount}%`, `${amount}%`],
      );
      break;
    case "left":
      transformX = useTransform(
        scrollYProgress,
        [0, 1],
        [`${amount}%`, `-${amount}%`],
      );
      break;
    case "right":
      transformX = useTransform(
        scrollYProgress,
        [0, 1],
        [`-${amount}%`, `${amount}%`],
      );
      break;
  }

  const springTransformX = useSpring(transformX, {
    stiffness: 100,
    damping: 30,
  });
  const springTransformY = useSpring(transformY, {
    stiffness: 100,
    damping: 30,
  });

  const style =
    direction === "up" || direction === "down"
      ? { y: springTransformY }
      : { x: springTransformX };

  return (
    <motion.div ref={ref} className={className} style={style}>
      {children}
    </motion.div>
  );
}

// Enhanced Stagger Animation Component
interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  animation?: "fadeIn" | "slideUp" | "slideLeft" | "slideRight" | "scaleUp";
}

function Stagger({
  children,
  className,
  staggerDelay = 0.1,
  animation = "fadeIn",
}: StaggerProps) {
  const ref = useRef(null);

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, index) => (
        <ScrollAnimation
          animation={animation}
          delay={index * staggerDelay}
          key={index}
        >
          {child}
        </ScrollAnimation>
      ))}
    </div>
  );
}

// Interactive hover animations
const hoverScale = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: { type: "spring", stiffness: 300, damping: 20 },
};

const hoverGlow = {
  whileHover: {
    boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
    scale: 1.02,
  },
  transition: { duration: 0.2 },
};

const hoverFloat = {
  whileHover: { y: -5 },
  transition: { type: "spring", stiffness: 300, damping: 20 },
};

const MotionDivClient = MotionDiv;
const MotionTr = motion.tr;
const MotionTd = motion.td;
const MotionLi = motion.li;
const MotionUl = motion.ul;

export {
  AnimatePresenceWrapper,
  bounceIn,
  fadeIn,
  hoverFloat,
  hoverGlow,
  hoverScale,
  MotionDiv,
  MotionDivClient,
  MotionLi,
  MotionTd,
  MotionTr,
  MotionUl,
  Parallax,
  rotateIn,
  scaleUp,
  ScrollAnimation,
  slideInFromBottom,
  slideInFromLeft,
  slideInFromRight,
  slideInFromTop,
  slideUp,
  Stagger,
  zoomIn,
};
