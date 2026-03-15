"use client";

import React from "react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

export const TypewriterEffectSmooth = ({
    words,
    className,
    cursorClassName,
}) => {
    // split text inside of words into array of characters
    const wordsArray = words.map((word) => {
        return {
            ...word,
            text: word.text.split(""),
        };
    });

    const renderWords = () => {
        return (
            <div className="flex flex-wrap items-center">
                {wordsArray.map((word, idx) => {
                    return (
                        <div key={`word-${idx}`} className="inline-block">
                            {word.text.map((char, index) => (
                                <span
                                    key={`char-${index}`}
                                    className={cn(
                                        `dark:text-white text-gray-900`,
                                        word.className
                                    )}
                                >
                                    {char}
                                </span>
                            ))}
                            &nbsp;
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={cn("flex flex-row space-x-1 justify-center my-6", className)}>
            <motion.div
                className="overflow-hidden pb-0 md:pb-2"
                initial={{
                    width: "0%",
                }}
                whileInView={{
                    width: "fit-content",
                }}
                transition={{
                    duration: 1.5,
                    ease: "linear",
                    delay: 0.1,
                }}
            >
                <div
                    className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold whitespace-nowrap"
                    style={{ whiteSpace: "nowrap" }}
                >
                    {renderWords()}
                </div>
            </motion.div>
            <motion.span
                initial={{
                    opacity: 0,
                }}
                animate={{
                    opacity: 1,
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    repeatType: "reverse",
                }}
                className={cn(
                    "block rounded-sm w-[2px] sm:w-[4px] h-8 sm:h-10 lg:h-14 bg-cyan-500",
                    cursorClassName
                )}
            ></motion.span>
        </div>
    );
};
