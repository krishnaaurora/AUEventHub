"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const colors = [
    "#38bdf8", "#f472b6", "#4ade80", "#facc15",
    "#a78bfa", "#34d399", "#818cf8", "#fb923c",
    "#2dd4bf", "#c084fc", "#f87171", "#60a5fa",
];

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const HoverBox = React.memo(({ i, j }) => {
    const [hovered, setHovered] = useState(false);
    const [color] = useState(() => getRandomColor());

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="w-16 h-8 border-r border-t border-slate-500/40 relative"
            style={{
                backgroundColor: hovered ? color : "transparent",
                transition: hovered ? "background-color 0s" : "background-color 1.2s ease",
            }}
        />
    );
});
HoverBox.displayName = "HoverBox";

export const BoxesCore = ({ className, ...rest }) => {
    // Optimized resolution: 65x35 = ~2,275 divs (80% less than before)
    const rows = new Array(65).fill(1);
    const cols = new Array(35).fill(1);
    
    return (
        <div
            style={{
                transform: `translate(-40%,-60%) skewX(-48deg) skewY(14deg) scale(0.675) rotate(0deg) translateZ(0)`,
            }}
            className={cn(
                "absolute -left-[5%] p-4 -top-1/4 flex flex-shrink-0",
                className
            )}
            {...rest}
        >
            {rows.map((_, i) => (
                <div key={`row-${i}`} className="w-20 h-10 border-l border-slate-500/30 relative flex-shrink-0">
                    {cols.map((_, j) => (
                        <HoverBox key={`col-${j}`} />
                    ))}
                </div>
            ))}
        </div>
    );
};

export const Boxes = React.memo(BoxesCore);
