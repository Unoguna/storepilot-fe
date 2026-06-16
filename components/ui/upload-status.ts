import { RequestState } from "@/types/store-pilot";

export function statusClassName(status: RequestState) {
  const base = "min-h-6 text-sm font-bold";
  if (status === "success") {
    return `${base} text-teal-700`;
  }
  if (status === "error") {
    return `${base} text-red-600`;
  }
  return `${base} text-slate-500`;
}
