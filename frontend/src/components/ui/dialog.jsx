// src/components/ui/dialog.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * Simple Dialog implementation (shadcn-style API)
 *
 * Exports:
 * - Dialog (Root)               -> <Dialog open={} onOpenChange={}>
 * - DialogTrigger               -> <DialogTrigger asChild>...</DialogTrigger>
 * - DialogPortal                -> wrapper for portal (kept simple)
 * - DialogOverlay               -> semi-opaque backdrop
 * - DialogContent               -> the content area
 * - DialogHeader / Title / Footer
 * - DialogClose                 -> close button or asChild wrapper
 *
 * Works in controlled or uncontrolled mode:
 * - Controlled: pass `open` + `onOpenChange`
 * - Uncontrolled: omit `open` and use <DialogTrigger> to open
 */

/* ---------- Context ---------- */
const DialogContext = createContext({
  open: false,
  setOpen: (v) => {},
});

function useDialog() {
  return useContext(DialogContext);
}

/* ---------- Dialog Root ---------- */
export function Dialog({ children, open: controlledOpen, onOpenChange, defaultOpen = false }) {
  const [openState, setOpenState] = useState(defaultOpen);
  const isControlled = typeof controlledOpen === "boolean";
  const open = isControlled ? controlledOpen : openState;

  const setOpen = (val) => {
    if (!isControlled) setOpenState(val);
    if (typeof onOpenChange === "function") onOpenChange(val);
  };

  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>;
}

/* ---------- Trigger ---------- */
/**
 * Wraps a child element (button/link) and toggles dialog open state.
 * Usage:
 * <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
 */
export function DialogTrigger({ asChild = false, children }) {
  const { setOpen } = useDialog();

  if (asChild && React.isValidElement(children)) {
    const child = React.cloneElement(children, {
      onClick: (e) => {
        if (typeof children.props.onClick === "function") children.props.onClick(e);
        setOpen(true);
      },
    });
    return child;
  }

  return (
    <button onClick={() => setOpen(true)} type="button">
      {children}
    </button>
  );
}

/* ---------- Portal (very small - renders children directly) ---------- */
export function DialogPortal({ children }) {
  // For a production app you may want to render via createPortal into document.body.
  // For simplicity we render inline (since many dev setups support it). If you want portal behavior,
  // replace with ReactDOM.createPortal(children, document.body)
  return <>{children}</>;
}

/* ---------- Overlay ---------- */
export function DialogOverlay({ className = "", onClick }) {
  const { setOpen } = useDialog();
  return (
    <div
      className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity ${className}`}
      onClick={(e) => {
        if (onClick) onClick(e);
        setOpen(false);
      }}
    />
  );
}

/* ---------- Content (centred modal) ---------- */
export function DialogContent({ className = "", children, ariaLabel = "Dialog", avoidCloseOnOverlay = false }) {
  const { open, setOpen } = useDialog();
  const [visible, setVisible] = useState(open);
  const contentRef = useRef(null);

  useEffect(() => {
    if (open) {
      setVisible(true);
      // trap focus
      const previouslyFocused = document.activeElement;
      setTimeout(() => contentRef.current?.focus?.(), 50);
      return () => {
        previouslyFocused?.focus?.();
      };
    } else {
      // animate out then hide
      setVisible(false);
    }
  }, [open]);

  // don't render if not visible
  if (!visible && !open) return null;

  return (
    <>
      {/* Overlay */}
      <DialogPortal>
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div className="absolute inset-0" aria-hidden>
            <DialogOverlay onClick={() => !avoidCloseOnOverlay && setOpen(false)} />
          </div>

          <div
            ref={contentRef}
            role="dialog"
            aria-label={ariaLabel}
            tabIndex={-1}
            className={`relative z-50 w-full max-w-3xl mx-auto bg-white text-black rounded-lg shadow-lg transform transition-all duration-300 ease-in-out ${
              open ? "scale-100 opacity-100" : "scale-95 opacity-0"
            } ${className}`}
          >
            {children}
          </div>
        </div>
      </DialogPortal>
    </>
  );
}

/* ---------- Header / Title / Footer ---------- */
export function DialogHeader({ children, className = "" }) {
  return <div className={`flex items-center justify-between gap-4 px-6 py-4 border-b ${className}`}>{children}</div>;
}
export function DialogTitle({ children, className = "" }) {
  return <h3 className={`text-lg font-semibold leading-none ${className}`}>{children}</h3>;
}
export function DialogFooter({ children, className = "" }) {
  return <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${className}`}>{children}</div>;
}

/* ---------- Close ---------- */
export function DialogClose({ asChild = false, children }) {
  const { setOpen } = useDialog();

  if (asChild && React.isValidElement(children)) {
    const child = React.cloneElement(children, {
      onClick: (e) => {
        if (typeof children.props.onClick === "function") children.props.onClick(e);
        setOpen(false);
      },
    });
    return child;
  }

  return (
    <button
      onClick={() => setOpen(false)}
      aria-label="Close dialog"
      className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
    >
      {children ?? <X className="h-5 w-5 text-gray-700" />}
    </button>
  );
}

/* ---------- Convenience export for default modal usage ---------- */
export default {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
};
