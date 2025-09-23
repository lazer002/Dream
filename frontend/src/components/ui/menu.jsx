"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"; // your classnames helper
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

// Menu wrapper
export const Menu = ({ children, className, ...props }) => (
  <DropdownMenu.Root {...props} className={cn("relative inline-block text-left", className)}>
    {children}
  </DropdownMenu.Root>
);

// MenuTrigger
export const MenuTrigger = ({ children, asChild = false, className, ...props }) => (
  <DropdownMenu.Trigger asChild={asChild} {...props} className={cn("", className)}>
    {children}
  </DropdownMenu.Trigger>
);

// MenuContent
const menuContentVariants = cva(
  "z-50 min-w-[180px] rounded-md border border-gray-200 bg-white p-1 shadow-md animate-in fade-in-80",
  {}
);

export const MenuContent = ({ children, className, ...props }) => (
  <DropdownMenu.Content {...props} className={cn(menuContentVariants(), className)}>
    {children}
  </DropdownMenu.Content>
);

// MenuItem
const menuItemVariants = cva(
  "flex items-center w-full px-2 py-1 text-sm rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100 outline-none select-none",
  {}
);

export const MenuItem = ({ children, className, ...props }) => (
  <DropdownMenu.Item {...props} className={cn(menuItemVariants(), className)}>
    {children}
  </DropdownMenu.Item>
);
