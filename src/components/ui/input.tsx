import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input"> & {
  icon?: React.ReactNode;
  isValid?: boolean;
  isInvalid?: boolean;
}>(
  ({ className, type, icon, isValid, isInvalid, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">{icon}</span>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-base text-slate-800 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-800 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200",
            icon ? "pl-10" : "",
            isValid ? "border-green-500 focus-visible:ring-green-500" : "",
            isInvalid ? "border-red-500 focus-visible:ring-red-500" : "",
            !isValid && !isInvalid ? "border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent focus-visible:shadow-[0_0_0_2px_rgba(59,130,246,0.5)]" : "",
            "focus-visible:border-transparent focus-visible:shadow-[0_0_0_4px_rgba(99,102,241,0.3)] focus-visible:ring-2 focus-visible:ring-violet-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {isValid && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none">
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeWidth="2" d="M5 10.5l3.5 3.5 6-7"/></svg>
          </span>
        )}
        {isInvalid && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none">
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeWidth="2" d="M6 6l8 8m0-8l-8 8"/></svg>
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
