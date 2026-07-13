import type * as React from "react";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
} & React.SVGProps<SVGSVGElement>;

/**
 * Logo SVG — placeholder rectangle. Ganti SVG ini sesuai kebutuhan.
 */
export function Logo({ className, ...props }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 286.52 286.52"
      className={cn("size-6", className)}
      aria-label="CekStatus"
    >
      <polygon points="191.01 95.51 286.51 0 191.01 0 191.01 0 95.51 0 0 95.5 0 191.01 95.51 191.01 95.51 95.51 191.01 95.51" />
      <polygon points="286.52 191.01 191.01 191.01 191.01 191.01 95.51 191.01 0 286.52 95.51 286.52 95.51 286.52 191.01 286.52 286.52 191.01" />
    </svg>
  );
}

/**
 * Logo dengan teks "CekStatus" di sampingnya.
 */
export function LogoWithText({ className, ...props }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Logo {...props} />
      <span className="font-semibold tracking-tight">CekStatus</span>
    </div>
  );
}
