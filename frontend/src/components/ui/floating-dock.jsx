"use client";
import React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "../../lib/utils";
import { useRef } from "react";

export function FloatingDock({ items, className }) {
    const mouseX = useMotionValue(Infinity);

    return (
        <motion.div
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className={cn(
                "flex items-end gap-3 px-4 py-2.5 rounded-2xl",
                className
            )}
            style={{
                background: "transparent",
            }}
        >
            {items.map((item) => (
                <DockIcon key={item.title} mouseX={mouseX} {...item} />
            ))}
        </motion.div>
    );
}

function DockIcon({ mouseX, title, icon, href, onClick }) {
    const ref = useRef(null);

    const distance = useTransform(mouseX, (val) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    const widthSync = useTransform(distance, [-120, 0, 120], [40, 60, 40]);
    const heightSync = useTransform(distance, [-120, 0, 120], [40, 60, 40]);

    const width = useSpring(widthSync, { mass: 0.1, stiffness: 200, damping: 12 });
    const height = useSpring(heightSync, { mass: 0.1, stiffness: 200, damping: 12 });

    const iconScale = useTransform(distance, [-120, 0, 120], [1, 1.3, 1]);
    const springScale = useSpring(iconScale, { mass: 0.1, stiffness: 200, damping: 12 });

    const Content = (
        <motion.div
            ref={ref}
            style={{ width, height }}
            className="aspect-square rounded-xl flex items-center justify-center relative group cursor-pointer"
        >
            {/* Tooltip */}
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: "rgba(0,0,0,0.75)", color: "#fff" }}>
                {title}
            </div>
            <motion.div style={{ scale: springScale }} className="flex items-center justify-center">
                {icon}
            </motion.div>
        </motion.div>
    );

    if (href) {
        return <a href={href}>{Content}</a>;
    }
    if (onClick) {
        return <div onClick={onClick}>{Content}</div>;
    }
    return Content;
}
