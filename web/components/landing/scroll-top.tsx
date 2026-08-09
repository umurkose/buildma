"use client"

import { useState } from "react"
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react"
import { ArrowUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DOCK_BUTTON } from "@/components/layout/accessibility"
import { useScrollContainer } from "@/components/landing/scroll"

const SHOW_AFTER = 1200

export function ScrollTop() {
  const container = useScrollContainer()
  const reduce = useReducedMotion()
  const { scrollY } = useScroll({ container })
  const [shown, setShown] = useState(false)

  useMotionValueEvent(scrollY, "change", (value) => {
    setShown(value > SHOW_AFTER)
  })

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          className="fixed right-4 bottom-[calc(4.625rem+env(safe-area-inset-bottom))] z-45 print:hidden"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 8 }}
          transition={reduce ? { duration: 0.15 } : { type: "spring", bounce: 0.25, duration: 0.35 }}
        >
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="Back to top"
            onClick={() =>
              container?.current?.scrollTo({
                top: 0,
                behavior: reduce ? "auto" : "smooth",
              })
            }
            className={DOCK_BUTTON}
          >
            <ArrowUp className="size-5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
