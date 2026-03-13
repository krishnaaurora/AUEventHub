'use client'
import Link from "next/link";
import { cn } from "../../lib/utils";

export const BentoGrid = ({
    className,
    children
}) => {
    return (
        (<div
            className={cn(
                "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ",
                className
            )}>
            {children}
        </div>)
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
    onRegister,
    detailsLink
}) => {
    return (
        (<div
            className={cn(
                "row-span-1 rounded-[2rem] group/bento transition duration-300 p-4 bg-white border border-black/5 justify-between flex flex-col space-y-4 cursor-pointer overflow-hidden shadow-xl hover:shadow-2xl",
                className
            )}>
            {header}
            <div className="group-hover/bento:translate-x-2 transition duration-200 p-2">
                <div
                    className="font-sans font-bold text-black text-lg mb-2 mt-2 tracking-tight">
                    {title}
                </div>
                <div
                    className="font-sans font-normal text-black/60 text-xs line-clamp-2 mb-4">
                    {description}
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/5">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRegister();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all active:scale-95 shadow-lg"
                    >
                        Register
                    </button>
                    <Link
                        href={detailsLink}
                        onClick={(e) => e.stopPropagation()}
                        className="text-black/40 hover:text-black text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1 group/link"
                    >
                        View Info
                        <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                    </Link>
                </div>
            </div>
        </div>)
    );
};
