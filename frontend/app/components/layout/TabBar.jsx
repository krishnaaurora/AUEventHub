"use client";
import React from 'react';
import { X } from 'lucide-react';

export default function TabBar({ tabs, activeTabId, onTabClick, onTabClose }) {
  return (
    <div className="flex h-9 bg-[#252526] border-b border-[#1e1e1e] overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          className={`
            group flex items-center h-full px-3 gap-2 cursor-pointer border-r border-[#1e1e1e] min-w-fit max-w-[180px]
            ${activeTabId === tab.id 
              ? 'bg-[#1e1e1e] text-white border-t border-t-indigo-500' 
              : 'bg-[#2d2d2d] text-gray-400 hover:bg-[#2a2d2e]'}
          `}
        >
          <span className="text-xs truncate pointer-events-none select-none">{tab.title}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
            className={`
              p-0.5 rounded-md hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity
              ${activeTabId === tab.id ? 'opacity-100' : ''}
            `}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
