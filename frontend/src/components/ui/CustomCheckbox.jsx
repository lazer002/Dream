// src/components/ui/CustomCheckbox.jsx

import React from "react";
import { Checkbox as RadixCheckbox } from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { Label } from "./label";

export function Checkbox({
  id,
  label,
  checked,
  onChange,
}) {
  return (
    <div className="flex items-center gap-3">
      <RadixCheckbox
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="
          flex
          h-5
          w-5
          items-center
          justify-center

          border
          border-neutral-400
rounded-sm
          transition-all

          data-[state=checked]:bg-black
          data-[state=checked]:border-black
        "
      >
        {checked && (
          <Check className="h-3.5 w-3.5 text-white" />
        )}
      </RadixCheckbox>

      {label && (
        <Label
          htmlFor={id}
          className="
            text-sm
            text-neutral-700
            cursor-pointer
          "
        >
          {label}
        </Label>
      )}
    </div>
  );
}