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
  initialX: number;
  initialY: number;
  isLast: boolean;
}

function buildBorderBricks(step: number): BrickSpec[] {
  const bricks: BrickSpec[] = [];
  let maxDelay = 0;

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      // We only place bricks on the edges (border frame)
      const isEdge = row === 0 || row === ROWS - 1 || col === 0 || col === COLS - 1;
      if (!isEdge) continue;

      // Symmetric reveal delay based on distance from top-left/top-right
      const order = row + Math.min(col, COLS - 1 - col);
      const delay = order * step;
      maxDelay = Math.max(maxDelay, delay);

      // Flying direction from outside
      let initialX = 0;
      let initialY = 0;

      if (row === 0) initialY = -24;
      else if (row === ROWS - 1) initialY = 24;

      if (col === 0) initialX = -24;
      else if (col === COLS - 1) initialX = 24;

      bricks.push({
        id: `${row}-${col}`,
        row,
        col,
        delay,
        initialX,
        initialY,
        isLast: false,
      });
    }
  }

  // Mark the last brick(s) to trigger the onBuilt callback
  return bricks.map((brick) => ({ ...brick, isLast: brick.delay === maxDelay }));
}

interface BrickBuildAnimationProps {
  onBuilt: () => void;
  className?: string;
}

export function BrickBuildAnimation({ onBuilt, className }: BrickBuildAnimationProps) {
  const reduceMotion = useReducedMotion();

  // Animation settings for ~1.5s total time
  const step = reduceMotion ? 0.015 : 0.08;
  const duration = reduceMotion ? 0.25 : 0.6;
  const fromScale = reduceMotion ? 0.98 : 0.9;

  const edgeBricks = buildBorderBricks(step);

  // Generate a full grid array to render (including empty spacer divs for the center)
  const gridCells = [];
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const brick = edgeBricks.find((b) => b.row === r && b.col === c);
      gridCells.push({ row: r, col: c, brick });
    }
  }

  return (
    <div
      className={cn(
        "grid h-full w-full grid-cols-6 grid-rows-6 gap-2.5 p-4 relative z-10 overflow-hidden",
        className
      )}
      aria-hidden
    >
      {gridCells.map((cell) => {
        const { brick, row, col } = cell;

        if (!brick) {
          // Empty center cells
          return <div key={`empty-${row}-${col}`} className="invisible" />;
        }

        // Tech look: subtle variation of cyan/teal colors
        const isTeal = (row + col) % 2 === 0;

        return (
          <motion.div
            key={brick.id}
            className={cn(
              "rounded-[6px] border backdrop-blur-sm transition-all duration-300",
              isTeal
                ? "border-teal-500/20 bg-gradient-to-br from-teal-500/5 to-slate-900/40 shadow-[0_0_8px_rgba(20,184,166,0.12)]"
                : "border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-slate-900/40 shadow-[0_0_8px_rgba(34,211,238,0.12)]"
            )}
            initial={{
              opacity: 0,
              x: brick.initialX,
              y: brick.initialY,
              scale: fromScale,
            }}
            animate={{
              opacity: 0.8,
              x: 0,
              y: 0,
              scale: 1,
            }}
            transition={{
              delay: brick.delay,
              duration,
              ease: [0.25, 1, 0.5, 1],
            }}
            onAnimationComplete={brick.isLast ? onBuilt : undefined}
          />
        );
      })}
    </div>
  );
}
