"use client";
import { cn } from "../../lib/utils";
import React from "react";

export const AuroraBackground = ({
    className,
    children,
    showRadialGradient = true,
    ...props
}) => {
    return (
        <main>
            <div
                className={cn(
                    "relative flex flex-col h-full items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-slate-950 transition-bg",
                    className
                )}
                {...props}
            >
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        //   I'm sorry but this is the only way I could get the animation to work
                        //   with the aurora background. I'm sure there's a better way to do this
                        //   but I'm not a CSS wizard.
                        className={cn(
                            `
            [--white-gradient:linear-gradient(to_bottom,white,transparent)]
            [--dark-gradient:linear-gradient(to_bottom,var(--zinc-950),transparent)]
            [--aurora:repeating-linear-gradient(100deg,#0ea5e9_10%,#6366f1_15%,#a855f7_20%,#ec4899_25%,#3b82f6_30%)]
            [background-image:var(--white-gradient),var(--aurora)]
            dark:[background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[26px] brightness-125
            after:content-[""] after:absolute after:inset-0 
            after:[background-image:var(--white-gradient),var(--aurora)] 
            after:dark:[background-image:var(--dark-gradient),var(--aurora)]
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] 
            after:mix-blend-overlay
            pointer-events-none
            absolute -inset-[10px] opacity-60 will-change-transform`,
                            showRadialGradient &&
                            `[mask-image:radial-gradient(ellipse_at_50%_50%,black_100%,transparent_100%)]`
                        )}
                    ></div>
                </div>
                {children}
            </div>
        </main>
    );
};
