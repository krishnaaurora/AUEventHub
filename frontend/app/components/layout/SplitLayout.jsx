"use client";
import React, { useState, useRef, useEffect } from 'react';
import TabBar from './TabBar';

export default function SplitLayout({ children, rightPanel: RightPanel, showRight, onToggleRight }) {
  const [leftWidth, setLeftWidth] = useState(70); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  // Persistence logic from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('aurora-panel-width');
    if (savedWidth) {
      setLeftWidth(parseFloat(savedWidth));
    }
  }, []);

  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Limit bounds (20% to 80%)
      const clampedWidth = Math.min(Math.max(newWidth, 20), 80);
      setLeftWidth(clampedWidth);
      localStorage.setItem('aurora-panel-width', clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const leftTabs = [{ id: 'main', title: 'Main Workspace' }];
  const rightTabs = [{ id: 'assistant', title: 'AI Assistant' }];

  return (
    <div 
      ref={containerRef}
      className={`
        flex h-screen w-full bg-[#1e1e1e] overflow-hidden 
        ${isResizing ? 'cursor-col-resize select-none' : ''}
      `}
    >
      {/* Left Panel */}
      <div 
        style={{ width: `${showRight ? leftWidth : 100}%` }}
        className="flex flex-col border-r border-[#333] transition-all duration-300"
      >
        <TabBar 
          tabs={leftTabs} 
          activeTabId="main" 
          onTabClick={() => {}} 
          onTabClose={() => {}} 
        />
        <div className="flex-1 overflow-auto bg-white/5 no-scrollbar">
          {children}
        </div>
      </div>

      {/* Resize Divider */}
      {showRight && (
        <div
          onMouseDown={handleMouseDown}
          className={`
            w-1 bg-[#1e1e1e] hover:bg-indigo-500/50 cursor-col-resize transition-all
            ${isResizing ? 'bg-indigo-500' : 'border-x border-[#333]'}
          `}
        />
      )}

      {/* Right Panel */}
      {showRight && (
        <div 
          style={{ width: `${100 - leftWidth}%`, minWidth: '300px' }}
          className="flex flex-col bg-[#252526]"
        >
          <TabBar 
            tabs={rightTabs} 
            activeTabId="assistant" 
            onTabClick={() => {}} 
            onTabClose={onToggleRight} 
          />
          <div className="flex-1 overflow-hidden">
            {RightPanel}
          </div>
        </div>
      )}
    </div>
  );
}
