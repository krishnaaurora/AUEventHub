"use client";
import React from 'react';

export default function SidebarTooltip({ children, label, isVisible = true }) {
    if (!isVisible) return <>{children}</>;

    return (
        <div className="group flex items-center w-full">
            {children}
            
            {/* Pure Tailwind Tooltip (Group-Hover) */}
            <div 
                style={{ fontFamily: '"Times New Roman", Times, serif' }}
                className="
                    absolute left-[72px] ml-2 px-3 py-1.5 
                    bg-gray-900 text-white text-[12px] font-medium 
                    rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 
                    translate-x-[-10px] group-hover:translate-x-0
                    transition-all duration-200 pointer-events-none 
                    whitespace-nowrap z-[9999] backdrop-blur-md border border-white/20
                "
            >
                {label}
                {/* Arrow */}
                <div className="absolute top-1/2 -left-[5px] -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-r-[5px] border-r-gray-900" />
            </div>
        </div>
    );
}
