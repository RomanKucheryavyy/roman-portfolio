// [site edit] The registry entry ships the beam without its utils folder; this is
// the shadcn cn() helper the component imports from it, as its other files use it.
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
