import type { Transition, Variants } from 'motion/react'

export const springs = {
  snappy: { type: 'spring', visualDuration: 0.4, bounce: 0.1 },
  soft: { type: 'spring', visualDuration: 0.55, bounce: 0.2 },
  bouncy: { type: 'spring', visualDuration: 0.6, bounce: 0.5 },
  panel: { type: 'spring', visualDuration: 0.45, bounce: 0 },
} satisfies Record<string, Transition>

export const fades = {
  swap: { duration: 0.18 },
  crossfade: { duration: 0.25 },
  collapse: { duration: 0.2 },
} satisfies Record<string, Transition>

export const stagger = {
  tight: 0.06,
  normal: 0.07,
  loose: 0.1,
} as const

export const travel = {
  nudge: 4,
  short: 12,
  long: 24,
} as const

export const inViewOnce = { once: true, amount: 0.25 } as const

export const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.05, staggerChildren: stagger.tight } },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: travel.short },
  visible: { opacity: 1, y: 0, transition: springs.snappy },
}

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.4, rotate: -14 },
  visible: { opacity: 1, scale: 1, rotate: 0, transition: springs.bouncy },
}

export const cardIn: Variants = {
  hidden: { opacity: 0, y: travel.long, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...springs.soft, delayChildren: 0.12, staggerChildren: stagger.normal },
  },
}

export const collapseIn: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto' },
}

export const panelInlineEnd: Variants = {
  closed: { x: '100%', pointerEvents: 'none', transition: springs.panel },
  open: {
    x: '0%',
    pointerEvents: 'auto',
    transition: { ...springs.panel, delayChildren: 0.08, staggerChildren: stagger.tight },
  },
}

export const panelItemInlineEnd: Variants = {
  closed: { opacity: 0, x: 16 },
  open: { opacity: 1, x: 0, transition: springs.snappy },
}

export const scrimVariants: Variants = {
  closed: { opacity: 0, pointerEvents: 'none', transition: fades.crossfade },
  open: { opacity: 1, pointerEvents: 'auto', transition: fades.crossfade },
}

export const dropdownVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: -travel.nudge - 2 },
  visible: { opacity: 1, scale: 1, y: 0, transition: springs.snappy },
  exit: { opacity: 0, scale: 0.96, y: -travel.nudge },
}
