import * as React from "react"
import { cn } from "../../lib/utils"

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
    const variants = {
        default: "bg-primary text-white hover:bg-primary/80",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "text-slate-950 border border-slate-200 hover:bg-slate-100",
    }

    return (
        <div
            ref={ref}
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                variants[variant] || variants.default,
                className
            )}
            {...props}
        />
    )
})
Badge.displayName = "Badge"

export { Badge }
