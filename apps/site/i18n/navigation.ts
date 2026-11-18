import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Type-safe wrappers on top of Next.js primitives — use these instead of
// `next/link` / `next/navigation` inside translated pages so that the locale
// segment is always preserved.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
