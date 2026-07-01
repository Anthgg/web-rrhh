"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

export function LoginBackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const sizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const handleResize = () => {
      sizeCanvas();
    };

    sizeCanvas();
    window.addEventListener("resize", handleResize);

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
      "rgba(255, 255, 255, ",
      "rgba(203, 213, 225, ",
      "rgba(148, 163, 184, ",
      "rgba(127, 151, 149, ",
    ];

    const particleCount = width < 640 ? 14 : 26;
    const particles: Particle[] = Array.from({ length: particleCount }, () => {
      const size = Math.random() * 1.3 + 0.6;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size,
        speedX: (Math.random() - 0.5) * 0.06,
        speedY: (Math.random() - 0.5) * 0.06,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.14 + 0.04,
        alphaSpeed: (Math.random() - 0.5) * 0.0008,
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

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

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.alpha += p.alphaSpeed;
        if (p.alpha > 0.18 || p.alpha < 0.03) {
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
    return (
      <div className="pointer-events-none absolute inset-0 z-0 opacity-40 bg-[radial-gradient(circle_at_12%_18%,rgba(203,213,225,0.18)_0_1px,transparent_1.5px),radial-gradient(circle_at_72%_38%,rgba(127,151,149,0.16)_0_1px,transparent_1.5px),linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:220px_180px,280px_240px,60px_60px,60px_60px]" />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-45"
    />
  );
}
