"use client";

import { useEffect, useRef } from "react";

interface TrackingSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function TrackingSparkline({
  data,
  width = 120,
  height = 30,
  color = "var(--accent)",
}: TrackingSparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Calculate range
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const xStep = (width - 4) / (data.length - 1);

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";

    data.forEach((val, i) => {
      const x = 2 + i * xStep;
      const y = height - 3 - ((val - min) / range) * (height - 6);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill area under curve
    ctx.lineTo(2 + (data.length - 1) * xStep, height - 3);
    ctx.lineTo(2, height - 3);
    ctx.closePath();
    ctx.fillStyle = color.replace(")", ", 0.1)").replace("var(--accent)", "rgba(183,110,75,0.1)");
    ctx.fill();
  }, [data, width, height, color]);

  if (data.length < 2) return <div className="text-[10px] text-[var(--muted-foreground)] font-sans">数据不足</div>;

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px` }}
      className="inline-block"
    />
  );
}
