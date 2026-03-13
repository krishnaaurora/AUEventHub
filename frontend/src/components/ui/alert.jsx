import React from "react";
import { cn } from "../../lib/utils";

const Alert = React.forwardRef(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        role="alert"
        className={cn(
            "relative w-full rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:bg-slate-950/80 dark:border-slate-800",
            className
        )}
        {...props}
    >
        <div className="flex flex-col gap-1">{children}</div>
    </div>
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
    <h5
        ref={ref}
        className={cn("mb-1 font-bold leading-none tracking-tight text-slate-900 dark:text-slate-50", className)}
        {...props}
    />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("text-sm text-slate-500 dark:text-slate-400 [&_p]:leading-relaxed", className)}
        {...props}
    />
));
AlertDescription.displayName = "AlertDescription";

const AlertAction = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("absolute right-4 top-1/2 -translate-y-1/2", className)}
        {...props}
    />
));
AlertAction.displayName = "AlertAction";

export { Alert, AlertTitle, AlertDescription, AlertAction };
