// src/components/ui/sheet.jsx
import React, { forwardRef } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils" // small classNames helper — include below if you don't have it

/**
 * Sheet (shadcn-style) built on Radix Dialog.
 *
 * Exports:
 * - <Sheet> (Dialog.Root)
 * - <SheetTrigger> (Dialog.Trigger)
 * - <SheetContent> (Dialog.Content)
 * - <SheetClose> (Dialog.Close)
 * - <SheetHeader>, <SheetFooter>, <SheetTitle>, <SheetDescription>
 *
 * Styling => Clean black & white theme. Adjust classes to match your design tokens.
 */

/* ---------- Helpers ---------- */
/* If you don't have a `cn` helper, create it (simple): */
export function cn(...args) {
  return args.filter(Boolean).join(" ")
}

/* ---------- Sheet Root / Trigger ---------- */
export const Sheet = Dialog.Root
export const SheetTrigger = Dialog.Trigger

/* ---------- Sheet Content ---------- */
/* forwardRef allows you to pass refs and use this like any other wrapper component */
export const SheetContent = forwardRef(
  ({ children, className, side = "right", size = "default", closeButton = true, ...props }, ref) => {
    /**
     * side: 'right' | 'left' | 'top' | 'bottom'
     * size: 'default' | 'sm' | 'lg' | 'xl' | 'content'
     */
    const sideClass = {
      right: "animate-sheet-in-right fixed right-0 top-0 h-full",
      left: "animate-sheet-in-left fixed left-0 top-0 h-full",
      top: "animate-sheet-in-top fixed top-0 left-0 w-full",
      bottom: "animate-sheet-in-bottom fixed bottom-0 left-0 w-full",
    }[side]

    const sizeClass = {
      default: "w-[28rem] md:w-96",
      sm: "w-80",
      lg: "w-[40rem]",
      xl: "w-[56rem]",
      content: "max-w-xs",
    }[size]

    return (
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />

        {/* Content */}
        <Dialog.Content
          ref={ref}
          className={cn(
            "z-50 bg-white text-black shadow-2xl border-l border-gray-100 focus:outline-none",
            sideClass,
            sizeClass,
            "p-6",
            "flex flex-col",
            className
          )}
          {...props}
        >
          {/* Close button (top-right) */}
          {closeButton && (
            <Dialog.Close asChild>
              <button
                aria-label="Close"
                className="absolute top-4 right-4 inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          )}

          {children}
        </Dialog.Content>
      </Dialog.Portal>
    )
  }
)

SheetContent.displayName = "SheetContent"

/* ---------- Small helpers for structure ---------- */

export const SheetHeader = ({ className, children, ...props }) => {
  return (
    <div className={cn("mb-4 flex flex-col gap-1", className)} {...props}>
      {children}
    </div>
  )
}
export const SheetFooter = ({ className, children, ...props }) => {
  return (
    <div className={cn("mt-4 flex items-center justify-end gap-2", className)} {...props}>
      {children}
    </div>
  )
}
export const SheetTitle = ({ className, children, ...props }) => {
  return (
    <Dialog.Title className={cn("text-lg font-semibold leading-none", className)} {...props}>
      {children}
    </Dialog.Title>
  )
}
export const SheetDescription = ({ className, children, ...props }) => {
  return (
    <Dialog.Description className={cn("text-sm text-gray-600", className)} {...props}>
      {children}
    </Dialog.Description>
  )
}

export const SheetClose = Dialog.Close
