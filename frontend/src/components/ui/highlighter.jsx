"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const Highlighter = ({
    children,
    color = "#FF9800",
    action = "underline",
    className,
    delay = 0,
}) => {
    return (
        <span className={cn("relative inline-block font-bold", className)}>
            <span className="relative z-10">{children}</span>
            {action === "underline" && (
                <motion.span
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay, ease: "easeOut" }}
                    className="absolute bottom-0 left-0 h-[30%] -z-0 opacity-40 rounded-full"
                    style={{ backgroundColor: color }}
                />
            )}
            {action === "highlight" && (
                <motion.span
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay, ease: "easeOut" }}
                    className="absolute inset-0 -z-0 opacity-40 rounded-sm"
                    style={{ backgroundColor: color }}
                />
            )}
        </span>
    );
};
