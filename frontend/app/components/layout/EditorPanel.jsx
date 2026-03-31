"use client";
import React from 'react';

export default function EditorPanel({ children }) {
  return (
    <div className="h-full w-full bg-[#1e1e1e] text-slate-300 relative">
      <div className="absolute inset-0 overflow-auto custom-scrollbar p-6">
        {children}
      </div>
      
      {/* Visual background detail typical of high-end dashboards */}
      <div className="fixed top-0 right-0 w-1/2 h-1/2 bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full" />
    </div>
  );
}
