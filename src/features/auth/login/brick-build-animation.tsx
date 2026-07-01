"use client";

import { m, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils/cn";

const COLS = 5;
const ROWS = 8;

interface BrickSpec {
  id: string;
  row: number;
  col: number;
  order: number;
  initialX: number;
  initialY: number;
}

function buildPerimeter(): BrickSpec[] {
  const positions: Array<[number, number]> = [];

  for (let col = 0; col < COLS; col += 1) positions.push([ROWS - 1, col]);

  for (let row = ROWS - 2; row > 0; row -= 1) {
    positions.push([row, row % 2 === 0 ? 0 : COLS - 1]);
    positions.push([row, row % 2 === 0 ? COLS - 1 : 0]);
  }

  for (let col = 0; col < COLS; col += 1) positions.push([0, col]);

  return positions.map(([row, col], order) => ({
    id: `${row}-${col}`,
    row,
    col,
    order,
    initialX: col === 0 ? -18 : col === COLS - 1 ? 18 : 0,
    initialY: row === 0 ? -18 : 22,
  }));
}

const perimeterBricks = buildPerimeter();
const lastBrickOrder = perimeterBricks.length - 1;

interface BrickBuildAnimationProps {
  onBuilt: () => void;
  className?: string;
}

export function BrickBuildAnimation({ onBuilt, className }: BrickBuildAnimationProps) {
  const reduceMotion = useReducedMotion();
  const step = reduceMotion ? 0.01 : 0.045;
  const duration = reduceMotion ? 0.16 : 0.42;

  return (
    <div
      className={cn(
        "relative grid h-full w-full grid-cols-5 grid-rows-8 gap-2 overflow-hidden p-3 sm:gap-2.5 sm:p-4",
        className,
      )}
      aria-hidden="true"
    >
      {perimeterBricks.map((brick) => {
        const isAlternate = (brick.row + brick.col) % 2 === 0;

        return (
          <m.span
            key={brick.id}
            className={cn(
              "rounded-[6px] border shadow-[0_8px_24px_rgba(0,0,0,0.13)] backdrop-blur-md",
              isAlternate
                ? "border-white/25 bg-[#f3f5f2]/70"
                : "border-white/20 bg-[#cbd4d1]/55",
            )}
            style={{ gridColumn: brick.col + 1, gridRow: brick.row + 1 }}
            initial={{
              opacity: 0,
              x: reduceMotion ? 0 : brick.initialX,
              y: reduceMotion ? 5 : brick.initialY,
              scale: reduceMotion ? 0.98 : 0.92,
            }}
            animate={{ opacity: 0.9, x: 0, y: 0, scale: 1 }}
            transition={{
              delay: brick.order * step,
              duration,
              ease: [0.22, 1, 0.36, 1],
            }}
            onAnimationComplete={brick.order === lastBrickOrder ? onBuilt : undefined}
          />
        );
      })}

      <m.div
        className="pointer-events-none absolute inset-[12%] rounded-[1.25rem] border border-white/[0.08] bg-white/[0.018]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduceMotion ? 0.08 : 0.52, duration: reduceMotion ? 0.12 : 0.5 }}
      />
    </div>
  );
}
