import { createContext, useContext, useEffect, useState } from "react";
import { X } from "lucide-react";

const DialogContext = createContext({ onClose: () => {}, show: false });

export function Dialog({ open, onOpenChange, children }) {
  const [isVisible, setIsVisible] = useState(open);
  const [show, setShow] = useState(open); // track animation state

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setTimeout(() => setShow(true), 10); // slide in
    } else {
      setShow(false); // slide out
      setTimeout(() => setIsVisible(false), 300); // hide after animation
    }
  }, [open]);

  const handleClose = () => onOpenChange(false);

  if (!isVisible) return null;

  return (
    <DialogContext.Provider value={{ onClose: handleClose, show }}>
      <div className="fixed inset-0 z-50 flex">{children}</div>
    </DialogContext.Provider>
  );
}

export function DialogContent({ className = "", children }) {
  const { onClose, show } = useContext(DialogContext);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      ></div>

      {/* Main Content */}
      <div
        className={`relative m-auto w-full   bg-white shadow-lg transition-transform duration-300 ease-in-out ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        } ${className}`}
      >
        {children}
      </div>
    </>
  );
}

export function DialogHeader({ children, className = "" }) {
  return (
    <div
      className={`flex items-center justify-between border-b px-4 py-3 ${className}`}
    >
      {children}
    </div>
  );
}

export function DialogTitle({ children, className = "" }) {
  return (
    <h2 className={`text-lg font-semibold leading-none ${className}`}>
      {children}
    </h2>
  );
}

export function DialogFooter({ children, className = "" }) {
  return (
    <div
      className={`flex flex-col-reverse gap-2 border-t px-4 py-3 sm:flex-row sm:justify-end ${className}`}
    >
      {children}
    </div>
  );
}

export function DialogClose({ asChild = false, children }) {
  const { onClose } = useContext(DialogContext);

  if (asChild) {
    return (
      <div onClick={onClose} className="cursor-pointer">
        {children}
      </div>
    );
  }

  return (
    <button onClick={onClose}>
      {children ?? <X className="h-6 w-6 text-gray-700 hover:text-black" />}
    </button>
  );
}

