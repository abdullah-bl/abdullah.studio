/// <reference types="@webgpu/types" />

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



export const hasWebGPU = () => {
  if (typeof navigator === 'undefined') return false;
  return navigator.gpu !== undefined;
}