"use client";

import { useEffect, useRef } from "react";

export function LoginBackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particle definition
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;
      alphaSpeed: number;
      blur: boolean;
    }

    const colors = [
      "rgba(34, 211, 238, ", // cyan
      "rgba(20, 184, 166, ",  // teal/petroleum
      "rgba(59, 130, 246, ",  // blue
      "rgba(255, 255, 255, ", // white
    ];

    const particles: Particle[] = Array.from({ length: 50 }, () => {
      const size = Math.random() * 2.5 + 1.2;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size,
        speedX: (Math.random() - 0.5) * 0.18,
        speedY: (Math.random() - 0.5) * 0.18,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.35 + 0.1,
        alphaSpeed: (Math.random() - 0.5) * 0.0015,
        blur: Math.random() > 0.5,
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle digital map/tech dots (extremely faint grid)
      ctx.fillStyle = "rgba(255, 255, 255, 0.007)";
      const gridSize = 50;
      for (let x = 0; x < width; x += gridSize) {
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around screen boundaries smoothly
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.alpha += p.alphaSpeed;
        if (p.alpha > 0.45 || p.alpha < 0.08) {
          p.alphaSpeed = -p.alphaSpeed;
        }

        ctx.save();
        if (p.blur) {
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color + "0.4)";
        }
        ctx.fillStyle = p.color + `${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-60"
    />
  );
}
