"use client";

import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const animationVariants = {
    blurIn: {
        container: {
            hidden: { opacity: 0 },
            visible: (i = 1) => ({
                opacity: 1,
                transition: { staggerChildren: 0.05, delayChildren: 0.03 * i },
            }),
        },
        item: {
            hidden: { opacity: 0, filter: "blur(10px)" },
            visible: {
                opacity: 1,
                filter: "blur(0px)",
            },
        },
    },
    blurInUp: {
        container: {
            hidden: { opacity: 0 },
            visible: (i = 1) => ({
                opacity: 1,
                transition: { staggerChildren: 0.05, delayChildren: 0.03 * i },
            }),
        },
        item: {
            hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
            visible: {
                opacity: 1,
                filter: "blur(0px)",
                y: 0,
                transition: {
                    y: { type: "spring", damping: 12, stiffness: 100 },
                    filter: { duration: 0.3 },
                    opacity: { duration: 0.3 }
                }
            },
        },
    },
    fadeIn: {
        container: {
            hidden: { opacity: 0 },
            visible: (i = 1) => ({
                opacity: 1,
                transition: { staggerChildren: 0.1, delayChildren: 0.05 * i },
            }),
        },
        item: {
            hidden: { opacity: 0 },
            visible: { opacity: 1 },
        },
    },
};

export default function TextAnimate({
    children,
    className,
    animation = "blurInUp",
    by = "character",
    once = true,
    ...props
}) {
    const words = children.split(" ");
    const currentVariant = animationVariants[animation] || animationVariants.blurInUp;

    return (
        <motion.div
            variants={currentVariant.container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once }}
            className={cn("flex flex-wrap whitespace-pre-wrap", className)}
            {...props}
        >
            {words.map((word, wordIdx) => (
                <span key={wordIdx} className="inline-block whitespace-nowrap">
                    {by === "character" ? (
                        word.split("").map((char, charIdx) => (
                            <motion.span
                                key={charIdx}
                                variants={currentVariant.item}
                                className="inline-block"
                            >
                                {char}
                            </motion.span>
                        ))
                    ) : (
                        <motion.span variants={currentVariant.item} className="inline-block">
                            {word}
                        </motion.span>
                    )}
                    {/* Add space after word if it's not the last one */}
                    {wordIdx < words.length - 1 && (
                        <span className="inline-block">&nbsp;</span>
                    )}
                </span>
            ))}
        </motion.div>
    );
}
