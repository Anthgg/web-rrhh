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
      transition: { staggerChildren: reduceMotion ? 0.04 : 0.08, delayChildren: 0.05 },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 4 : 14 },
    show: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0.25 : 0.5, ease: [0.22, 1, 0.36, 1] } },
  };

  const floatAnimation: HTMLMotionProps<"div"> = reduceMotion
    ? {}
    : {
        animate: {
          y: [0, -5, 0],
        },
        transition: {
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        },
      };

  return (
    <motion.aside
      variants={container}
      initial="hidden"
      animate="show"
      className="relative hidden lg:flex lg:w-[52%] lg:flex-col justify-between p-12 xl:p-16 z-10 select-none overflow-hidden"
    >
      {/* Suttle visual background glows for constructor depth */}
      <div className="absolute -left-20 top-[35%] size-[500px] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute left-[20%] bottom-6 size-[400px] rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />

      {/* Brand Logo & Title */}
      <motion.div variants={item} className="flex items-center gap-3.5">
        <div className="relative size-12 overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 p-2.5 border border-cyan-500/20 shadow-md">
          <Image src="/logo.png" alt="FABRYOR" fill sizes="48px" className="object-contain p-0.5" priority />
        </div>
        <div className="flex flex-col leading-tight">
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            FABRYOR <span className="text-cyan-400 font-bold">Admin</span>
          </h1>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Control de Personal y Obra
          </span>
        </div>
      </motion.div>

      {/* Hero Copy Panel */}
      <div className="my-auto max-w-xl space-y-7 pt-12 pb-6">
        <motion.span
          variants={item}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-400"
        >
          <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Plataforma de gestión operativa
        </motion.span>

        <div className="space-y-4">
          <motion.h2
            variants={item}
            className="text-4xl xl:text-5xl font-black leading-[1.15] tracking-tight text-white"
          >
            Gestiona asistencia, horarios y personal{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent block mt-1">
              en un solo lugar
            </span>
          </motion.h2>

          <motion.p variants={item} className="max-w-lg text-sm xl:text-base leading-relaxed text-slate-400">
            Controla tu equipo en campo, turnos, ubicaciones y solicitudes desde una sola plataforma.
          </motion.p>
        </div>

        {/* Benefits Grid 2x2 with larger corporate cards */}
        <motion.ul variants={container} className="grid gap-4 pt-3 sm:grid-cols-2">
          {benefits.map(({ icon: Icon, title, description }) => (
            <motion.li
              key={title}
              variants={item}
              className="flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-900/35 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-cyan-500/20 hover:bg-slate-900/50"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/15 text-cyan-400 shadow-inner">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-white tracking-wide">{title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{description}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>

      {/* Constructor image with clean base integration */}
      <motion.div
        variants={item}
        initial={{ opacity: 0, scale: reduceMotion ? 0.99 : 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0.3 : 0.75, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full h-[340px] xl:h-[410px] mt-auto self-center flex items-end justify-center pointer-events-none"
      >
        {/* Soft glow derrière el constructor */}
        <div className="absolute inset-x-12 bottom-6 top-16 rounded-[50%] bg-gradient-to-t from-cyan-500/15 to-teal-500/5 blur-3xl opacity-80" />

        {/* Floating wrapper */}
        <motion.div className="relative w-full h-full" {...floatAnimation}>
          <Image
            src="/assets/login/constructor.png"
            alt="Trabajador de construcción usando FABRYOR Admin"
            fill
            sizes="(min-width: 1024px) 48vw, 0px"
            className="object-contain object-bottom filter drop-shadow-[0_10px_20px_rgba(20,184,166,0.18)] [mask-image:linear-gradient(to_bottom,black_80%,transparent_98%)]"
            priority
          />
        </motion.div>

        {/* Corporate floor line/indicator */}
        <div className="absolute bottom-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      </motion.div>
    </motion.aside>
  );
}
