"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

export function LoginBackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    // If the user prefers reduced motion, we do not animate particles
    if (reduceMotion) return;

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

    // Define subtle, corporate particles (slow and small)
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;
      alphaSpeed: number;
    }

    const colors = [
      "rgba(34, 211, 238, ", // cyan
      "rgba(20, 184, 166, ",  // petroleum green
      "rgba(59, 130, 246, ",  // slate blue
      "rgba(255, 255, 255, ", // white
    ];

    // Reduced number of particles for a clean corporate look (30 particles)
    const particles: Particle[] = Array.from({ length: 30 }, () => {
      const size = Math.random() * 1.5 + 0.8;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size,
        speedX: (Math.random() - 0.5) * 0.08, // slow movement
        speedY: (Math.random() - 0.5) * 0.08,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.2 + 0.05, // low opacity
        alphaSpeed: (Math.random() - 0.5) * 0.001,
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle technical grid (very fine lines)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.012)";
      ctx.lineWidth = 0.5;

      const gridSize = 60;
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Render slow particles
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around borders
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.alpha += p.alphaSpeed;
        if (p.alpha > 0.25 || p.alpha < 0.05) {
          p.alphaSpeed = -p.alphaSpeed;
        }

        ctx.fillStyle = p.color + `${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [reduceMotion]);

  if (reduceMotion) {
    // Static technical grid for reduced motion
    return (
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:60px_60px]" />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-50"
    />
  );
}
