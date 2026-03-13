import React, { useMemo } from "react";
import { cn } from "../../lib/utils";

export const RippleBackground = ({
    mainCircleSize = 210,
    mainCircleOpacity = 0.24,
    numCircles = 8,
    className,
}) => {
    return (
        <div
            className={cn(
                "absolute inset-0 pointer-events-none select-none overflow-hidden [mask-image:radial-gradient(ellipse_at_center,white,transparent)]",
                className
            )}
        >
            {Array.from({ length: numCircles }).map((_, i) => (
                <div
                    key={i}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/10 shadow-xl"
                    style={{
                        width: `${mainCircleSize + i * 70}px`,
                        height: `${mainCircleSize + i * 70}px`,
                        opacity: mainCircleOpacity - i * 0.03,
                        animation: `ripple-bg 4s cubic-bezier(0, 0.2, 0.8, 1) infinite`,
                        animationDelay: `${i * 0.2}s`,
                    }}
                />
            ))}
            <style>{`
        @keyframes ripple-bg {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
          50% {
            opacity: 0.1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
        </div>
    );
};
