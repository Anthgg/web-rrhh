"use client";

import { m, useReducedMotion, type Variants } from "framer-motion";
import { CalendarClock, Clock3, MapPinned, UsersRound } from "lucide-react";
import Image from "next/image";

const benefits = [
  { icon: Clock3, title: "Asistencia en tiempo real" },
  { icon: CalendarClock, title: "Gestión de horarios y turnos" },
  { icon: MapPinned, title: "Control por ubicación" },
  { icon: UsersRound, title: "Administración de personal" },
] as const;

export function LoginHero() {
  const reduceMotion = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0.025 : 0.07,
        delayChildren: 0.08,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 3 : 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0.18 : 0.48,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <m.aside
      variants={container}
      initial="hidden"
      animate="show"
      className="relative z-10 hidden h-dvh min-w-0 flex-col overflow-hidden px-[clamp(2rem,3.3vw,6rem)] py-[clamp(1.75rem,3vh,4.5rem)] lg:flex lg:w-[54%]"
    >
      <div className="pointer-events-none absolute -left-28 bottom-[9%] size-[34rem] rounded-full bg-[#315f60]/12 blur-[120px]" />

      <m.header variants={item} className="flex items-center gap-3">
        <div className="relative size-[clamp(2.75rem,2.5vw,4rem)] overflow-hidden rounded-xl border border-white/10 bg-white/[0.07] p-2 shadow-[0_10px_30px_rgba(2,12,16,0.18)]">
          <Image
            src="/logo.png"
            alt="FABRYOR"
            fill
            sizes="48px"
            className="object-contain p-1"
            priority
          />
        </div>
        <div className="leading-none">
          <p className="font-display text-[clamp(1.05rem,0.9vw,1.45rem)] font-extrabold tracking-[-0.02em] text-white">
            FABRYOR <span className="font-semibold text-[#aabcb8]">Admin</span>
          </p>
          <p className="mt-1.5 text-[clamp(9px,0.45vw,12px)] font-semibold uppercase tracking-[0.2em] text-[#839792]">
            Control de personal y obra
          </p>
        </div>
      </m.header>

      <div className="relative z-10 mt-[clamp(2.25rem,5vh,5rem)] min-h-0 flex-1">
        <m.div
          variants={item}
          className="inline-flex items-center gap-2 rounded-full border border-[#93aaa5]/20 bg-[#19353a]/65 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#b8c7c4]"
        >
          <span className="size-1.5 rounded-full bg-[#829c96]" aria-hidden />
          Plataforma de gestión operativa
        </m.div>

        <m.h1
          variants={item}
          className="relative z-10 mt-5 max-w-[48rem] font-display text-[clamp(2.2rem,3.25vw,5rem)] font-extrabold leading-[1.04] tracking-[-0.045em] text-[#f4f6f3]"
        >
          Gestiona asistencia, horarios y personal
          <span className="mt-1 block font-medium text-[#aabcb8]">en un solo lugar</span>
        </m.h1>

        <m.p
          variants={item}
          className="relative z-10 mt-5 max-w-[44rem] text-[clamp(0.875rem,0.7vw,1.125rem)] leading-[1.7] text-[#a8b4b4]"
        >
          Controla tu equipo en campo, turnos, ubicaciones y solicitudes desde una sola plataforma.
        </m.p>

        <m.ul
          variants={container}
          aria-label="Beneficios de FABRYOR Admin"
          className="absolute bottom-3 left-0 z-10 w-36 space-y-1 border-y border-white/[0.08] py-2.5 xl:w-[clamp(11rem,28%,14rem)] min-[1800px]:bottom-auto min-[1800px]:top-[clamp(22rem,30vh,26rem)]"
        >
          {benefits.map(({ icon: Icon, title }) => (
            <m.li
              key={title}
              variants={item}
              className="flex min-h-9 items-center gap-2.5 border-l border-white/[0.08] pl-3"
            >
              <Icon className="size-4 shrink-0 text-[#8fa7a2]" strokeWidth={1.7} aria-hidden />
              <span className="text-[clamp(11px,0.55vw,14px)] font-medium leading-4 text-[#d4dcda]">
                {title}
              </span>
            </m.li>
          ))}
        </m.ul>

        <m.figure
          variants={item}
          className="pointer-events-none absolute bottom-0 right-0 z-0 w-[22rem] xl:w-[clamp(32rem,76%,40rem)] min-[1800px]:bottom-auto min-[1800px]:top-[clamp(22rem,30vh,26rem)]"
        >
          <div className="absolute inset-x-[12%] bottom-[2%] h-[46%] rounded-[50%] bg-[#274d50]/20 blur-[50px]" />
          <Image
            src="/assets/login/constructor.png"
            alt="Profesional de construcción gestionando una operación en campo"
            width={1522}
            height={898}
            sizes="(min-width: 1536px) 40rem, (min-width: 1280px) 38vw, (min-width: 1024px) 22rem, 0px"
            className="relative h-auto w-full drop-shadow-[0_24px_32px_rgba(0,0,0,0.28)]"
            priority
          />
          <div className="absolute inset-x-[4%] bottom-0 h-px bg-gradient-to-r from-transparent via-[#95aaa5]/35 to-transparent" />
        </m.figure>
      </div>
    </m.aside>
  );
}
