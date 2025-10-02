// src/components/ui/radio-group.jsx
import * as React from "react";
import * as Radix from "@radix-ui/react-radio-group";
import { Check } from "lucide-react";

export const RadioGroup = ({ value, onValueChange, children, ...props }) => {
  return (
    <Radix.Root
      value={value}
      onValueChange={onValueChange}
      className="flex flex-col gap-2"
      {...props}
    >
      {children}
    </Radix.Root>
  );
};

export const RadioGroupItem = React.forwardRef(
  ({ value, id, ...props }, ref) => {
    return (
      <Radix.Item
        ref={ref}
        value={value}
        id={id}
        className="w-5 h-5 border rounded-full border-gray-400 flex items-center justify-center focus:ring-2 focus:ring-black"
        {...props}
      >
        <Radix.Indicator>
          <div className="w-3 h-3 bg-black rounded-full" />
        </Radix.Indicator>
      </Radix.Item>
    );
  }
);

RadioGroupItem.displayName = "RadioGroupItem";
