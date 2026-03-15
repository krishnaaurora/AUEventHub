"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/utils";

const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const getRandomInt = (max) => Math.floor(Math.random() * max);

export default function HyperText({
    children,
    className,
    duration = 800,
    delay = 0,
    as: Component = "h1",
    startOnView = false,
    animateOnHover = true,
    ...props
}) {
    const [displayText, setDisplayText] = useState(children.split(""));
    const [isAnimating, setIsAnimating] = useState(false);
    const iterationCount = useRef(0);
    const elementRef = useRef(null);

    const handleAnimation = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        iterationCount.current = 0;

        const interval = setInterval(() => {
            setDisplayText((prevText) =>
                prevText.map((char, i) => {
                    if (char === " ") return char;
                    if (i <= iterationCount.current) {
                        return children[i];
                    }
                    return alphabets[getRandomInt(alphabets.length)];
                })
            );

            if (iterationCount.current >= children.length) {
                setIsAnimating(false);
                clearInterval(interval);
            }

            iterationCount.current = iterationCount.current + 0.1;
        }, duration / (children.length * 10));
    };

    useEffect(() => {
        if (!startOnView) {
            const timer = setTimeout(() => {
                handleAnimation();
            }, delay);
            return () => clearTimeout(timer);
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        handleAnimation();
                    }, delay);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, [children, duration, delay, startOnView]);

    return (
        <Component
            ref={elementRef}
            className={cn("overflow-hidden py-2", className)}
            onMouseEnter={() => animateOnHover && handleAnimation()}
            {...props}
        >
            <AnimatePresence mode="wait">
                {displayText.map((char, i) => (
                    <motion.span
                        key={i}
                        className={cn("inline-block", char === " " ? "w-2" : "")}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{
                            duration: 0.1,
                            delay: i * 0.03,
                        }}
                    >
                        {char.toUpperCase()}
                    </motion.span>
                ))}
            </AnimatePresence>
        </Component>
    );
}
