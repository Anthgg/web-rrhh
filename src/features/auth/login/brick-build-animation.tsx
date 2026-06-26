"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

const COLS = 6;
const ROWS = 6;

interface BrickSpec {
  id: string;
  row: number;
  col: number;
  delay: number;
  isLast: boolean;
}

function buildBricks(step: number): BrickSpec[] {
  const bricks: BrickSpec[] = [];
  let maxDelay = 0;

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      // Reveal order: cascading diagonal waves
      const order = row + col;
      const delay = order * step;
      maxDelay = Math.max(maxDelay, delay);
      bricks.push({ id: `${row}-${col}`, row, col, delay, isLast: false });
    }
  }

  return bricks.map((brick) => ({ ...brick, isLast: brick.delay === maxDelay }));
}

interface BrickBuildAnimationProps {
  onBuilt: () => void;
  className?: string;
}

export function BrickBuildAnimation({ onBuilt, className }: BrickBuildAnimationProps) {
  const reduceMotion = useReducedMotion();

  // Stagger parameters targeting ~1.8 seconds build time
  const step = reduceMotion ? 0.015 : 0.08;
  const duration = reduceMotion ? 0.25 : 0.65;
  const travelY = reduceMotion ? 5 : 24;
  const fromScale = reduceMotion ? 0.98 : 0.8;

  const bricks = buildBricks(step);
  const rows = Array.from({ length: ROWS }, (_, row) => bricks.filter((b) => b.row === row));

  return (
    <div
      className={cn(
        "grid h-full w-full grid-rows-6 gap-2.5 overflow-hidden p-4 relative z-10",
        className
      )}
      aria-hidden
    >
      {rows.map((rowBricks, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-2.5 font-sans"
          style={{
            width: "108%",
            // Horizontal offset to simulate digital construction masonry
            transform: rowIndex % 2 === 0 ? "translateX(-4%)" : "translateX(0%)",
          }}
        >
          {rowBricks.map((brick) => {
            const isHighlight = (rowIndex + brick.col) % 3 === 0;
            return (
              <motion.div
                key={brick.id}
                className={cn(
                  "flex-1 rounded-[6px] border backdrop-blur-md transition-all duration-300",
                  isHighlight
                    ? "border-cyan-400/40 bg-gradient-to-br from-cyan-400/15 to-teal-400/20 shadow-[0_0_12px_rgba(34,211,238,0.22)]"
                    : "border-cyan-500/20 bg-gradient-to-br from-cyan-500/8 to-teal-500/12 shadow-[0_0_8px_rgba(20,184,166,0.14)]"
                )}
                initial={{ opacity: 0, y: travelY, scale: fromScale, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                transition={{ delay: brick.delay, duration, ease: [0.25, 1, 0.5, 1] }}
                onAnimationComplete={brick.isLast ? onBuilt : undefined}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
