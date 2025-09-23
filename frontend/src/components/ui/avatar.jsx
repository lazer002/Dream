"use client";

import React from "react";

export default function Avatar({ src, alt = "User Avatar", size = 40, className = "" }) {
  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-100 ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="rounded-full object-cover w-full h-full"
        />
      ) : (
        <span className="text-gray-500 font-medium">{alt.charAt(0)}</span>
      )}
    </div>
  );
}
