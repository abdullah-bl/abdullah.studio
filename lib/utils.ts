/// <reference types="@webgpu/types" />

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function hasWebGPU() {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

