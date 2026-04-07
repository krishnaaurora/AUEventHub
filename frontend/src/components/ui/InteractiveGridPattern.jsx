"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";

const COLORS = [
  "rgba(99, 102, 241, 0.55)",   // indigo
  "rgba(139, 92, 246, 0.55)",   // violet
  "rgba(236, 72, 153, 0.50)",   // pink
  "rgba(59, 130, 246, 0.55)",   // blue
  "rgba(16, 185, 129, 0.50)",   // emerald
  "rgba(245, 158, 11, 0.50)",   // amber
  "rgba(239, 68, 68, 0.45)",    // red
  "rgba(20, 184, 166, 0.50)",   // teal
  "rgba(132, 204, 22, 0.50)",   // lime
  "rgba(249, 115, 22, 0.50)",   // orange
  "rgba(168, 85, 247, 0.55)",   // purple
  "rgba(6, 182, 212, 0.50)",    // cyan
];

function getRandomColor(exclude) {
  let c;
  do {
    c = COLORS[Math.floor(Math.random() * COLORS.length)];
  } while (c === exclude);
  return c;
}

function GridCell() {
  const [bg, setBg] = useState("transparent");
  const lastColor = useRef("transparent");

  const timeoutRef = useRef(null);

  const handleEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const newColor = getRandomColor(lastColor.current);
    lastColor.current = newColor;
    setBg(newColor);
  }, []);

  const handleLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setBg("transparent");
    }, 400);
  }, []);

  return (
    <div
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        backgroundColor: bg,
        transition: "background-color 0.35s ease",
        borderRight: "1px solid rgba(0,0,0,0.06)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}
    />
  );
}

export function InteractiveGridPattern({ containerRef, cellSize = 40 }) {
  const gridRef = useRef(null);
  const [dims, setDims] = useState({ cols: 0, rows: 0 });

  useEffect(() => {
    const target = containerRef?.current || gridRef.current?.parentElement;
    if (!target) return;

    const measure = () => {
      const rect = target.getBoundingClientRect();
      setDims({
        cols: Math.ceil(rect.width / cellSize),
        rows: Math.ceil(rect.height / cellSize),
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(target);
    return () => ro.disconnect();
  }, [containerRef, cellSize]);

  const totalCells = dims.cols * dims.rows;

  return (
    <div
      ref={gridRef}
      className="absolute inset-0"
      style={{
        zIndex: 1,
        display: "grid",
        gridTemplateColumns: `repeat(${dims.cols}, 1fr)`,
        gridTemplateRows: `repeat(${dims.rows}, 1fr)`,
      }}
    >
      {Array.from({ length: totalCells }, (_, i) => (
        <GridCell key={`${dims.cols}-${dims.rows}-${i}`} />
      ))}
    </div>
  );
}
