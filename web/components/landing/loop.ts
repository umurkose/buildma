"use client"

import { useReducedMotion, type MotionProps, type Transition } from "motion/react"

type Frames = Record<string, (string | number)[]>

/**
 * Props for a motion element that plays `frames` on a seamless, endless loop.
 * Every keyframe track should end where it starts, so the repeat has no seam.
 * With reduced motion it holds one still pose instead: `still`, or the first frame.
 */
export function useLoop() {
  const reduce = useReducedMotion()
  return (frames: Frames, transition: Transition, still?: Record<string, string | number>) => {
    const first = Object.fromEntries(Object.entries(frames).map(([key, values]) => [key, values[0]]))
    if (reduce) {
      const pose = still ?? first
      return { initial: pose, animate: pose } as MotionProps
    }
    return {
      initial: first,
      animate: frames,
      transition: { repeat: Infinity, ease: "easeInOut", ...transition },
    } as MotionProps
  }
}
