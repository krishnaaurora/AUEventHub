import React from "react";

export const Ripple = () => {
    return (
        <div className="absolute inset-x-0 top-0 h-full pointer-events-none overflow-hidden [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
            {[...Array(8)].map((_, i) => (
                <div
                    key={i}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#4C1D95]/10"
                    style={{
                        width: `${(i + 1) * 150}px`,
                        height: `${(i + 1) * 150}px`,
                        opacity: `${1 - (i * 0.12)}`,
                        animation: `ripple-effect ${3 + i}s cubic-bezier(0, 0.2, 0.8, 1) infinite`,
                    }}
                />
            ))}
            <style>{`
        @keyframes ripple-effect {
          0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
          20% { opacity: 0.1; }
          100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
        }
      `}</style>
        </div>
    );
};
