import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export const MaskContainer = ({
    children,
    revealText,
    size = 10,
    revealSize = 600,
    className
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    const updateMousePosition = (e) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
    };

    let maskSize = isHovered ? revealSize : size;

    return (
        <motion.div
            ref={containerRef}
            onMouseMove={updateMousePosition}
            className={`relative overflow-hidden ${className}`}
        >
            <motion.div
                className="w-full h-full flex items-center justify-center text-6xl absolute bg-black z-20 pointer-events-none"
                animate={{
                    WebkitMaskImage: `radial-gradient(circle ${maskSize / 2}px at ${mousePosition.x}px ${mousePosition.y}px, black 100%, transparent 100%)`,
                    maskImage: `radial-gradient(circle ${maskSize / 2}px at ${mousePosition.x}px ${mousePosition.y}px, black 100%, transparent 100%)`,
                }}
                transition={{ type: "tween", ease: "backOut", duration: 0.1 }}
            >
                <div className="absolute inset-0 bg-black h-full w-full z-0 opacity-50" />
                <div
                    className="max-w-4xl mx-auto text-center text-white text-3xl md:text-5xl font-bold relative z-20"
                >
                    {revealText}
                </div>
            </motion.div>

            <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="w-full h-full flex items-center justify-center"
            >
                {children}
            </div>
        </motion.div>
    );
};
