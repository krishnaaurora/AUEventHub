"use client";

import { cn } from "../../lib/utils";
import React, { useEffect, useState } from "react";

export const InfiniteMovingCards = ({
    items,
    direction = "left",
    speed = "fast",
    pauseOnHover = true,
    className
}) => {
    const containerRef = React.useRef(null);
    const scrollerRef = React.useRef(null);

    useEffect(() => {
        addAnimation();
    }, []);
    const [start, setStart] = useState(false);

    function addAnimation() {
        if (containerRef.current && scrollerRef.current) {
            const scrollerContent = Array.from(scrollerRef.current.children);

            scrollerContent.forEach((item) => {
                const duplicatedItem = item.cloneNode(true);
                if (scrollerRef.current) {
                    scrollerRef.current.appendChild(duplicatedItem);
                }
            });

            getDirection();
            getSpeed();
            setStart(true);
        }
    }

    const getDirection = () => {
        if (containerRef.current) {
            if (direction === "left") {
                containerRef.current.style.setProperty("--animation-direction", "forwards");
            } else {
                containerRef.current.style.setProperty("--animation-direction", "reverse");
            }
        }
    };

    const getSpeed = () => {
        if (containerRef.current) {
            if (speed === "fast") {
                containerRef.current.style.setProperty("--animation-duration", "20s");
            } else if (speed === "normal") {
                containerRef.current.style.setProperty("--animation-duration", "40s");
            } else {
                containerRef.current.style.setProperty("--animation-duration", "80s");
            }
        }
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
                className
            )}
        >
            <ul
                ref={scrollerRef}
                className={cn(
                    "flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap",
                    start && "animate-scroll",
                    pauseOnHover && "hover:[animation-play-state:paused]"
                )}
            >
                {items.map((item, idx) => (
                    <li
                        className="w-[350px] max-w-full relative rounded-2xl border border-b-0 flex-shrink-0 border-slate-200 px-8 py-6 md:w-[450px] bg-white text-slate-900 shadow-xl"
                        key={idx}
                    >
                        <div className="flex flex-col h-full justify-between">
                            <div
                                aria-hidden="true"
                                className="user-select-none -z-1 pointer-events-none absolute -left-0.5 -top-0.5 h-[calc(100%_+_4px)] w-[calc(100%_+_px)]"
                            ></div>
                            <div className="relative z-20 mb-6 flex flex-row items-center justify-between">
                                <span className="text-sm leading-[1.6] text-slate-500 font-bold uppercase tracking-widest">
                                    {item.category}
                                </span>
                                <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">
                                    {item.timeLeft}
                                </div>
                            </div>

                            <div className="relative z-20 mb-4 h-48 overflow-hidden rounded-xl">
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            </div>

                            <div className="relative z-20 flex flex-col">
                                <h3 className="text-xl leading-[1.2] text-slate-900 font-black mb-2 line-clamp-2">
                                    {item.title}
                                </h3>
                                <div className="flex items-center gap-2 text-slate-400 text-xs mb-4">
                                    <div className="flex items-center gap-1">
                                        <span>{item.date}</span>
                                    </div>
                                    <span>•</span>
                                    <span>{item.location}</span>
                                </div>

                                <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">
                                    Get Early Access
                                </button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
            <style>{`
        @keyframes scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-50% - 0.5rem));
          }
        }
        .animate-scroll {
          animation: scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite;
        }
      `}</style>
        </div>
    );
};
