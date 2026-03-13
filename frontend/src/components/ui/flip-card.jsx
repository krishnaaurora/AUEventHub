"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const FlipCard = ({ data, className, onAction }) => {
    return (
        <div className={cn("group h-[380px] w-full [perspective:1000px]", className)}>
            <div className="relative h-full w-full rounded-3xl transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-2xl">
                {/* Front Side */}
                <div className="absolute inset-0 h-full w-full [backface-visibility:hidden]">
                    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-slate-200">
                        <img
                            src={data.image}
                            alt={data.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 flex flex-col justify-end">
                            <span className="mb-2 w-fit rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                                {data.category}
                            </span>
                            <h3 className="text-2xl font-black text-white leading-tight">
                                {data.name}
                            </h3>
                            <p className="mt-2 text-white/60 text-xs font-bold uppercase tracking-widest">
                                {data.username}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 h-full w-full rounded-3xl bg-white p-8 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-between border border-slate-100 shadow-2xl">
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-black text-slate-900 leading-tight">
                                    {data.name}
                                </h3>
                                <span className="text-[10px] font-black text-slate-400">DETAIL VIEW</span>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed font-medium">
                                {data.bio}
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-y border-slate-100 py-6">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Following</p>
                                <p className="text-lg font-black text-slate-900">{data.stats.following}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Followers</p>
                                <p className="text-lg font-black text-slate-900">{data.stats.followers}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Posts</p>
                                <p className="text-lg font-black text-slate-900">{data.stats.posts}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onAction}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-black active:scale-95 shadow-xl"
                    >
                        Register Now
                    </button>
                </div>
            </div>
        </div>
    );
};
