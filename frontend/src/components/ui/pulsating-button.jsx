"use client";

import React from "react";
import { cn } from "../../lib/utils";

export default function PulsatingButton({
    className,
    children,
    pulseColor = "#0096ff",
    duration = "1.5s",
    ...props
}) {
    return (
        <button
            className={cn(
                "relative text-center cursor-pointer flex justify-center items-center rounded-lg text-white dark:text-black bg-[#E54D4D] dark:bg-red-400 px-6 py-2 [box-shadow:0_0_0_0_rgba(229,77,77,0.5)]",
                className
            )}
            style={{
                "--pulse-color": pulseColor,
                "--duration": duration,
            }}
            {...props}
        >
            <div className="relative z-10">{children}</div>
            <div className="absolute top-1/2 left-1/2 size-full rounded-lg bg-inherit animate-pulse -translate-x-1/2 -translate-y-1/2 opacity-50 z-0" />
        </button>
    );
}
