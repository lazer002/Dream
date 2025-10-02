// src/components/ui/CustomCheckbox.jsx
import React from "react";
import { Checkbox as RadixCheckbox } from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { Label } from "./label";

export function Checkbox({ id, label, checked, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <RadixCheckbox
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="w-5 h-5 border rounded-sm border-gray-400 flex items-center justify-center focus:ring-2 focus:ring-black transition"
      >
        <Check className="w-4 h-4 text-black" />
      </RadixCheckbox>
      {label && <Label htmlFor={id}>{label}</Label>}
    </div>
  );
}
