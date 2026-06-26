"use client";

import Image from "next/image";
import { motion, useReducedMotion, type Variants, type HTMLMotionProps } from "framer-motion";
import { CalendarClock, Clock, MapPin, Users } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Asistencia en tiempo real",
    description: "Registra y supervisa la asistencia del equipo desde cualquier lugar.",
  },
  {
    icon: CalendarClock,
    title: "Gestión de horarios y turnos",
    description: "Organiza turnos, descansos y asignaciones de forma inteligente.",
  },
  {
    icon: MapPin,
    title: "Control por ubicación",
    description: "Verifica ubicaciones y actividades en campo con precisión.",
  },
  {
    icon: Users,
    title: "Administración de personal",
    description: "Centraliza la información y roles de todo tu equipo.",
  },
] as const;

export function LoginHero() {
  const reduceMotion = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduceMotion ? 0.04 : 0.09, delayChildren: 0.1 },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 4 : 14 },
    show: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0.25 : 0.5, ease: [0.22, 1, 0.36, 1] } },
  };

  // Floating animation for the constructor image
  const floatAnimation: HTMLMotionProps<"div"> = reduceMotion
    ? {}
    : {
        animate: {
          y: [0, -6, 0],
        },
        transition: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        },
      };

  return (
    <motion.aside
      variants={container}
      initial="hidden"
      animate="show"
      className="relative hidden lg:flex lg:w-[50%] xl:w-[54%] lg:flex-col justify-between p-10 xl:p-14 z-10 border-r border-cyan-500/10"
    >
      {/* Glow Behind the Constructor and Benefits */}
      <div className="absolute -left-20 top-[40%] size-96 rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute left-[30%] bottom-10 size-80 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

      {/* Top logo & branding */}
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="relative size-11 overflow-hidden rounded-xl bg-gradient-to-br from-cyan-400/20 to-teal-400/20 p-2 border border-cyan-500/20 shadow-md shadow-cyan-900/10">
          <Image src="/logo.png" alt="FABRYOR" fill sizes="44px" className="object-contain p-0.5" priority />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold tracking-tight text-white">FABRYOR <span className="text-cyan-400">Admin</span></span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
            Plataforma Corporativa
          </span>
        </div>
      </motion.div>

      {/* Mid Info Content */}
      <div className="my-auto max-w-xl space-y-6 pt-10 pb-6">
        <motion.span
          variants={item}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-400 shadow-sm backdrop-blur-sm"
        >
          <span className="size-1.5 rounded-full bg-cyan-400 animate-ping" />
          Plataforma de gestión operativa
        </motion.span>

        <motion.h1
          variants={item}
          className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white xl:text-5xl"
        >
          Gestiona asistencia, horarios y personal{" "}
          <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent block mt-1">en un solo lugar</span>
        </motion.h1>

        <motion.p variants={item} className="max-w-md text-sm xl:text-base leading-relaxed text-slate-300">
          Control total de tu equipo y operaciones en campo. Toma decisiones con datos en tiempo real.
        </motion.p>

        {/* Benefits Grid 2x2 */}
        <motion.ul variants={container} className="grid gap-4 pt-2 sm:grid-cols-2">
          {benefits.map(({ icon: Icon, title, description }) => (
            <motion.li
              key={title}
              variants={item}
              className="flex items-start gap-3 rounded-2xl border border-cyan-500/10 bg-slate-900/40 p-4 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-cyan-500/25 hover:bg-slate-900/50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 text-cyan-400 shadow-inner">
                <Icon className="size-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>

      {/* Constructor image with bottom positioning and visual glow integration */}
      <motion.div
        variants={item}
        initial={{ opacity: 0, scale: reduceMotion ? 0.99 : 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0.3 : 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full h-[320px] xl:h-[380px] mt-auto self-center flex items-end justify-center pointer-events-none"
      >
        {/* Glow behind constructor image */}
        <div className="absolute inset-x-8 bottom-4 top-12 rounded-[50%] bg-gradient-to-t from-cyan-500/20 to-teal-500/10 blur-3xl opacity-80" />

        {/* Image wrapper with floating effect */}
        <motion.div 
          className="relative w-full h-full"
          {...floatAnimation}
        >
          <Image
            src="/assets/login/constructor.png"
            alt="Trabajador de construcción usando FABRYOR en campo"
            fill
            sizes="(min-width: 1024px) 45vw, 0px"
            className="object-contain object-bottom filter drop-shadow-[0_10px_25px_rgba(20,184,166,0.25)] [mask-image:linear-gradient(to_bottom,black_75%,transparent_98%)]"
            priority
          />
        </motion.div>
      </motion.div>
    </motion.aside>
  );
}
