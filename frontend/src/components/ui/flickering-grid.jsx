import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const FlickeringGrid = ({
    squareSize = 4,
    gridGap = 6,
    flickerChance = 0.3,
    color = "rgb(0, 0, 0)",
    width,
    height,
    className,
    maxOpacity = 0.3,
}) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isInView, setIsInView] = useState(false);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    const memoizedColors = useMemo(() => {
        const colorsArray = Array.isArray(color) ? color : [color];
        return colorsArray.map(c => {
            const temp = c.includes(",")
                ? c.replace(/rgb\(|\)/g, "")
                : c;
            if (temp.startsWith("#")) {
                const r = parseInt(temp.slice(1, 3), 16);
                const g = parseInt(temp.slice(3, 5), 16);
                const b = parseInt(temp.slice(5, 7), 16);
                return `${r}, ${g}, ${b}`;
            }
            return temp;
        });
    }, [color]);

    const setupCanvas = useCallback(
        (canvas, width, height) => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            const cols = Math.floor(width / (squareSize + gridGap));
            const rows = Math.floor(height / (squareSize + gridGap));

            const squares = new Float32Array(cols * rows);
            const squareColors = new Int32Array(cols * rows); // Store index of color
            for (let i = 0; i < squares.length; i++) {
                squares[i] = Math.random() * maxOpacity;
                squareColors[i] = Math.floor(Math.random() * memoizedColors.length);
            }

            return { cols, rows, squares, squareColors, dpr };
        },
        [squareSize, gridGap, maxOpacity, memoizedColors.length]
    );

    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setCanvasSize({ width, height });
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || canvasSize.width === 0 || canvasSize.height === 0) return;

        const { cols, rows, squares, squareColors, dpr } = setupCanvas(
            canvas,
            canvasSize.width,
            canvasSize.height
        );
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    if (Math.random() < flickerChance) {
                        squares[i * rows + j] = Math.random() * maxOpacity;
                    }

                    const opacity = squares[i * rows + j];
                    const colorIndex = squareColors[i * rows + j];
                    const rgb = memoizedColors[colorIndex];

                    ctx.fillStyle = `rgba(${rgb}, ${opacity})`;
                    ctx.fillRect(
                        i * (squareSize + gridGap) * dpr,
                        j * (squareSize + gridGap) * dpr,
                        squareSize * dpr,
                        squareSize * dpr
                    );
                }
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [setupCanvas, canvasSize, flickerChance, memoizedColors, squareSize, gridGap, maxOpacity]);

    return (
        <div ref={containerRef} className={`size-full ${className}`}>
            <canvas
                ref={canvasRef}
                className="pointer-events-none"
                style={{
                    width: canvasSize.width,
                    height: canvasSize.height,
                }}
            />
        </div>
    );
};
