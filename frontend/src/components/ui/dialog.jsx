// src/components/ui/dialog.jsx

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";

/* ---------- Context ---------- */

const DialogContext = createContext({
  open: false,
  setOpen: () => {},
});

function useDialog() {
  return useContext(DialogContext);
}

/* ---------- Dialog Root ---------- */

export function Dialog({
  children,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
}) {
  const [openState, setOpenState] =
    useState(defaultOpen);

  const isControlled =
    typeof controlledOpen === "boolean";

  const open = isControlled
    ? controlledOpen
    : openState;

  const setOpen = (value) => {
    if (!isControlled) {
      setOpenState(value);
    }

    onOpenChange?.(value);
  };

  return (
    <DialogContext.Provider
      value={{ open, setOpen }}
    >
      {children}
    </DialogContext.Provider>
  );
}

/* ---------- Trigger ---------- */

export function DialogTrigger({
  asChild = false,
  children,
}) {
  const { setOpen } = useDialog();

  if (
    asChild &&
    React.isValidElement(children)
  ) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        setOpen(true);
      },
    });
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
    >
      {children}
    </button>
  );
}

/* ---------- Portal ---------- */

export function DialogPortal({ children }) {
  return <>{children}</>;
}

/* ---------- Overlay ---------- */

export function DialogOverlay({
  className = "",
  onClick,
}) {
  const { setOpen } = useDialog();

  return (
    <div
      className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm ${className}`}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
    />
  );
}

/* ---------- Content ---------- */

export function DialogContent({
  className = "",
  children,
  ariaLabel = "Dialog",
  avoidCloseOnOverlay = false,
}) {
  const { open, setOpen } = useDialog();

  const [visible, setVisible] =
    useState(open);

  const contentRef = useRef(null);

  useEffect(() => {
    if (open) {
      setVisible(true);

      const previouslyFocused =
        document.activeElement;

      const timer = setTimeout(() => {
        contentRef.current?.focus?.();
      }, 50);

      return () => {
        clearTimeout(timer);
        previouslyFocused?.focus?.();
      };
    }

    setVisible(false);
  }, [open]);

  if (!visible && !open) {
    return null;
  }

  return (
    <DialogPortal>
      <div
        className="
          fixed inset-0 z-50
          flex items-center justify-center
          px-4 py-6
        "
      >
        {/* Overlay */}
        <div
          className="absolute inset-0"
          aria-hidden="true"
          onClick={(e) => {
            e.stopPropagation();

            if (!avoidCloseOnOverlay) {
              setOpen(false);
            }
          }}
        >
          <DialogOverlay
            onClick={(e) =>
              e.stopPropagation()
            }
          />
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          tabIndex={-1}
          className={`
            relative
            z-50
            w-full
            max-w-3xl
            max-h-[90vh]
            overflow-y-auto
            mx-auto
            bg-white
            text-black
            rounded-xl
            shadow-2xl
            outline-none
            transform
            transition-all
            duration-300
            ease-in-out
            ${
              open
                ? "scale-100 opacity-100"
                : "scale-95 opacity-0"
            }
            ${className}
          `}
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          {children}

          {/* Default close button */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close dialog"
            className="
              absolute
              right-4
              top-4
              z-10
              inline-flex
              h-8
              w-8
              items-center
              justify-center
              rounded-md
              text-gray-500
              transition
              hover:bg-gray-100
              hover:text-gray-900
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </DialogPortal>
  );
}

/* ---------- Header ---------- */

export function DialogHeader({
  children,
  className = "",
}) {
  return (
    <div
      className={`
        flex
        items-center
        justify-between
        gap-4
        px-6
        py-4
        border-b
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/* ---------- Title ---------- */

export function DialogTitle({
  children,
  className = "",
}) {
  return (
    <h3
      className={`
        text-lg
        font-semibold
        leading-none
        tracking-tight
        ${className}
      `}
    >
      {children}
    </h3>
  );
}

/* ---------- Description ---------- */

export function DialogDescription({
  children,
  className = "",
}) {
  return (
    <p
      className={`
        text-sm
        text-gray-500
        ${className}
      `}
    >
      {children}
    </p>
  );
}

/* ---------- Footer ---------- */

export function DialogFooter({
  children,
  className = "",
}) {
  return (
    <div
      className={`
        flex
        items-center
        justify-end
        gap-3
        px-6
        py-4
        border-t
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/* ---------- Close ---------- */

export function DialogClose({
  asChild = false,
  children,
}) {
  const { setOpen } = useDialog();

  if (
    asChild &&
    React.isValidElement(children)
  ) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        setOpen(false);
      },
    });
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(false)}
      aria-label="Close dialog"
      className="
        inline-flex
        items-center
        justify-center
        rounded-md
        p-2
        hover:bg-gray-100
      "
    >
      {children ?? (
        <X className="h-5 w-5 text-gray-700" />
      )}
    </button>
  );
}

/* ---------- Default Export ---------- */

export default {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
};