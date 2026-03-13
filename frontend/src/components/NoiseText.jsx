import React from "react";

const NoiseText = ({ children, className = "" }) => (
  <span
    className={`
      relative inline-block w-fit rounded-lg px-6 py-3
      backdrop-blur-md
      bg-white/60
      border border-black/10
      shadow-lg shadow-black/10
      ${className}
    `}
  >
    {/* noise overlay */}
    <span
      aria-hidden="true"
      style={{ opacity: 0.06 }}
      className="
        absolute inset-0 pointer-events-none rounded-lg
        bg-[url('https://i0.wp.com/css-tricks.com/wp-content/uploads/2022/11/tv-static-gif-7.gif')]
        bg-cover
        mix-blend-overlay
      "
    />

    {/* actual payload */}
    <span className="relative z-10 font-medium">
      {children}
    </span>
  </span>
);

export default NoiseText;
