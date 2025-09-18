import { createContext, useContext, useEffect, useState } from "react";
import { X } from "lucide-react";

const DialogContext = createContext({ onClose: () => {} });

export function Dialog({ open, onOpenChange, children }) {
  const [isVisible, setIsVisible] = useState(open);

  // track internal show state for animation
  const [show, setShow] = useState(open);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setTimeout(() => setShow(true), 10); // trigger slide-in
    } else {
      setShow(false); // trigger slide-out
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

export function DialogContent({ className, children }) {
  const { onClose, show } = useContext(DialogContext);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      ></div>

      {/* Sidebar / Content */}
      <div
        className={`relative bg-white h-full transition-transform duration-300 ease-in-out ${
          show ? "translate-x-0" : "-translate-x-full"
        } ${className}`}
      >
        {children}
      </div>
    </>
  );
}

export function DialogHeader({ children, className }) {
  return <div className={`flex justify-between items-center ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className }) {
  return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>;
}

// X icon close button
export function DialogClose({ asChild }) {
  const { onClose } = useContext(DialogContext);

  if (asChild) {
    return (
      <span onClick={onClose} className="cursor-pointer">
        <X className="h-6 w-6 text-gray-700 hover:text-black" />
      </span>
    );
  }

  return (
    <button onClick={onClose}>
      <X className="h-6 w-6 text-gray-700 hover:text-black" />
    </button>
  );
}
