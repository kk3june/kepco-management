import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatBusinessNumber = (value: string) => {
  return value
    .replace(/[^0-9]/g, "")
    .replace(/([0-9]{3})([0-9]{2})([0-9]{5})/g, "$1-$2-$3");
};

export const formatPhoneNumber = (value: string) => {
  return value
    .replace(/[^0-9]/g, "")
    .replace(
      /(^02.{0}|^01.{1}|^0[3-6][0-9].{0}|[0-9]{3,4})([0-9]{3,4})([0-9]{4})/g,
      "$1-$2-$3"
    );
};
