import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => (
    // Since we don't have radix-ui installed, we'll implement a custom switch using standard HTML/React for now to avoid dependency issues in this environment
    // A true shadcn implementation uses radix-ui.
    // We will build a visual equivalent.
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange && onCheckedChange(!checked)}
        className={cn(
            "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
            checked ? "bg-primary" : "bg-input",
            className
        )}
        ref={ref}
        {...props}
    >
        <span
            className={cn(
                "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
                checked ? "translate-x-5" : "translate-x-0"
            )}
        />
    </button>
))
Switch.displayName = "Switch"

export { Switch }
