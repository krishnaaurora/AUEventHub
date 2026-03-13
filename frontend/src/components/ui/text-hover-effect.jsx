"use client";
import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

export const TextHoverEffect = ({
    text,
    duration
}) => {
    const svgRef = useRef(null);
    const [cursor, setCursor] = useState({
        x: 0,
        y: 0
    });
    const [hovered, setHovered] = useState(false);
    const [maskPosition, setMaskPosition] = useState({
        cx: "50%",
        cy: "50%"
    });

    useEffect(() => {
        if (svgRef.current && cursor.x !== null && cursor.y !== null) {
            const svgRect = svgRef.current.getBoundingClientRect();
            const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
            const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
            setMaskPosition({
                cx: `${cxPercentage}%`,
                cy: `${cyPercentage}%`
            });
        }
    }, [cursor]);

    return (
        <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox="0 0 300 100"
            xmlns="http://www.w3.org/2000/svg"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onMouseMove={e => setCursor({
                x: e.clientX,
                y: e.clientY
            })}
            className="select-none overflow-visible"
        >
            <defs>
                <linearGradient
                    id="textGradient"
                    gradientUnits="userSpaceOnUse"
                    cx="50%"
                    cy="50%"
                    r="25%"
                >
                    {hovered && (
                        <motion.stop
                            offset="0%"
                            stopColor={"#3b82f6"} // blue-500
                            animate={{
                                stopColor: ["#3b82f6", "#8b5cf6", "#ef4444", "#eab308", "#06b6d4"],
                            }}
                            transition={{
                                duration: duration ?? 4,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                        />
                    )}
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>

                <motion.radialGradient
                    id="revealMask"
                    gradientUnits="userSpaceOnUse"
                    r="20%"
                    cx={maskPosition.cx}
                    cy={maskPosition.cy}
                    animate={maskPosition}
                    transition={{ duration: hovered ? 0 : duration ?? 0.2 }}
                >
                    <stop offset="0%" stopColor="white" />
                    <stop offset="100%" stopColor="black" />
                </motion.radialGradient>
                <mask id="textMask">
                    <rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill="url(#revealMask)"
                    />
                </mask>
            </defs>
            <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                strokeWidth="0.3"
                className="font-[helvetica] font-bold stroke-neutral-200 dark:stroke-neutral-800 fill-transparent text-4xl sm:text-5xl md:text-6xl opacity-30"
                style={{
                    opacity: hovered ? 0.7 : 0.3
                }}
            >
                {text}
            </text>
            <motion.text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                strokeWidth="0.3"
                className="font-[helvetica] font-bold fill-transparent text-4xl sm:text-5xl md:text-6xl stroke-neutral-200 dark:stroke-neutral-800"
                initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
                animate={{
                    strokeDashoffset: 0,
                    strokeDasharray: 1000
                }}
                transition={{
                    duration: 4,
                    ease: "easeInOut"
                }}
            >
                {text}
            </motion.text>
            <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                strokeWidth="0.3"
                className="font-[helvetica] font-bold fill-transparent text-4xl sm:text-5xl md:text-6xl stroke-blue-500"
                mask="url(#textMask)"
            >
                {text}
            </text>
        </svg>
    );
};
