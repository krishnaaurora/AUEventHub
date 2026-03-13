import React, { useRef, useState, useEffect } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export const GlowingEffect = ({
    spread = 40,
    glow = true,
    disabled = false,
    proximity = 64,
    inactiveZone = 0.01,
    className = ""
}) => {
    if (disabled || !glow) return null;

    const containerRef = useRef(null);
    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    const springConfig = { damping: 25, stiffness: 700 };
    const dx = useSpring(mouseX, springConfig);
    const dy = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Check if mouse is within proximity
            if (
                x >= -proximity &&
                x <= rect.width + proximity &&
                y >= -proximity &&
                y <= rect.height + proximity
            ) {
                mouseX.set(x);
                mouseY.set(y);
            } else {
                mouseX.set(-1000);
                mouseY.set(-1000);
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [proximity, mouseX, mouseY]);

    return (
        <div
            ref={containerRef}
            className={`absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] ${className}`}
        >
            <motion.div
                className="absolute w-[300px] h-[300px] rounded-full blur-[80px]"
                style={{
                    background: "radial-gradient(circle, rgba(76, 29, 149, 0.15) 0%, transparent 70%)",
                    left: dx,
                    top: dy,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
            />
            <motion.div
                className="absolute w-[100px] h-[100px] rounded-full blur-[40px]"
                style={{
                    background: "radial-gradient(circle, rgba(76, 29, 149, 0.3) 0%, transparent 70%)",
                    left: dx,
                    top: dy,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
            />
        </div>
    );
};
