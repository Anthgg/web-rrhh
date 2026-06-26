"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { BrickBuildAnimation } from "@/features/auth/login/brick-build-animation";
import { LoginHero } from "@/features/auth/login/login-hero";
import { AuthReasonAlert } from "@/features/auth/login/auth-reason-alert";
import { LoginBackgroundParticles } from "@/features/auth/login/login-background-particles";
import { useSession } from "@/features/auth/auth-provider";
import { ApiClientError } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { getClientDeviceInfo } from "@/lib/security/device-info";

/* ─── Schema ─── */
const loginSchema = z.object({
  email: z.email("Ingresa un correo válido corporativo."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function classifyLoginError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 504) {
      return "El servidor tardó demasiado en responder. Es posible que el backend esté experimentando un inicio frío (cold start). Reintenta en unos segundos.";
    }
    if (error.status === 503) {
      return "Servicio temporalmente no disponible (Base de datos). Por favor, intenta de nuevo.";
    }
    if (error.status === 401 || error.status === 400) {
      return "Correo o contraseña incorrectos.";
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    const lowerMessage = error.message.toLowerCase();
    if (
      lowerMessage.includes("fetch") ||
      lowerMessage.includes("network") ||
      lowerMessage.includes("failed to fetch") ||
      lowerMessage.includes("connection")
    ) {
      return "No se pudo conectar con el servidor. Verifica tu conexión a internet.";
    }
    return error.message;
  }

  return "Error inesperado al intentar iniciar sesión.";
}

export function LoginForm() {
  const { login, status } = useSession();
  const reduceMotion = useReducedMotion();
  const [showPassword, setShowPassword] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [built, setBuilt] = useState(false);
  const slowTimerRef = useRef<number | null>(null);

  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  useEffect(() => {
    if (reason === "session-revoked") {
      toast.error("Sesión cerrada desde otro dispositivo.", {
        id: "session-revoked-toast",
        duration: 5000,
      });
    } else if (reason === "session-expired") {
      toast.error("Tu sesión ha expirado. Inicia sesión nuevamente.", {
        id: "session-expired-toast",
        duration: 5000,
      });
    } else if (reason === "auth-required") {
      toast.error("Debes iniciar sesión para acceder al panel.", {
        id: "auth-required-toast",
        duration: 5000,
      });
    }
  }, [reason]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isLoading = isSubmitting || status === "loading";

  const clearSlowTimer = () => {
    if (slowTimerRef.current !== null) {
      window.clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
  };

  const startSlowTimer = () => {
    clearSlowTimer();
    slowTimerRef.current = window.setTimeout(() => {
      setIsSlow(true);
      toast.info("Conexión lenta detectada. El servidor podría estar iniciando...", {
        id: "slow-login-toast",
        duration: 5000,
      });
    }, 8000);
  };

  const submitLogin = async (values: LoginFormValues) => {
    setIsSlow(false);
    setAuthError(null);
    startSlowTimer();
    try {
      const deviceInfo = await getClientDeviceInfo();
      await login({
        ...values,
        deviceInfo,
      });
      clearSlowTimer();
      setIsSlow(false);
      toast.success("Sesión iniciada correctamente.");
    } catch (error) {
      clearSlowTimer();
      setIsSlow(false);

      const classifiedMessage = classifyLoginError(error);
      setAuthError(classifiedMessage);
      toast.error(classifiedMessage, {
        id: "login-error-toast",
        duration: 6000,
      });
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(submitLogin)(event);
  };

  // Staggered animation
  const formContainer: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0.03 : 0.06, delayChildren: 0.05 } },
  };
  const formItem: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 4 : 12 },
    show: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0.2 : 0.45, ease: [0.22, 1, 0.36, 1] } },
  };

  const year = new Date().getFullYear();

  return (
    <main className="relative flex min-h-screen w-full bg-gradient-to-br from-[#0c2533] via-[#051c24] to-[#121618] text-white overflow-hidden font-sans select-none">
      {/* Subtle tech background particles */}
      <LoginBackgroundParticles />

      {/* Corporate soft background glows */}
      <div className="pointer-events-none absolute right-[10%] top-[15%] size-[450px] rounded-full bg-cyan-500/5 blur-[120px] z-0" />
      <div className="pointer-events-none absolute right-[20%] bottom-[15%] size-[350px] rounded-full bg-teal-500/5 blur-[100px] z-0" />

      {/* Column Left (52% width) */}
      <LoginHero />

      {/* Vertical subtle divider line */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-slate-800/40 to-transparent self-stretch my-16 z-10" />

      {/* Column Right (48% width, centered login card) */}
      <div className="relative flex flex-col w-full lg:w-[48%] items-center justify-center px-4 py-8 sm:px-12 z-10">
        
        {/* Mobile Header Logo */}
        <div className="mb-6 flex flex-col items-center justify-center gap-2 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="relative size-10 overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 p-2 border border-cyan-500/20 shadow-md">
              <Image src="/logo.png" alt="FABRYOR" fill sizes="40px" className="object-contain p-0.5" priority />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              FABRYOR <span className="text-cyan-400 font-bold">Admin</span>
            </span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Control de Personal y Obra
          </span>
        </div>

        {/* Card footprint (480px to 540px) */}
        <div className="relative w-full max-w-[480px] sm:max-w-[520px] flex flex-col justify-center">
          
          {/* Card Border Glow Backup */}
          <div 
            className="pointer-events-none absolute -inset-4 rounded-[36px] bg-gradient-to-tr from-cyan-500/5 to-teal-500/5 blur-xl transition-opacity duration-1000" 
            style={{ opacity: built ? 0.6 : 0 }} 
          />

          {/* Card element */}
          <div
            className={cn(
              "relative w-full rounded-[32px] border transition-all duration-700 backdrop-blur-2xl px-6 py-9 sm:px-11 sm:py-11 min-h-[580px] flex flex-col justify-center",
              built
                ? "bg-[#0b171f]/50 border-slate-800 shadow-[0_25px_50px_rgba(0,0,0,0.55)]"
                : "bg-transparent border-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.02)] border-dashed animate-pulse"
            )}
          >
            {/* Border modular brick assembly */}
            <AnimatePresence mode="wait">
              {!built && (
                <motion.div
                  key="bricks"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <BrickBuildAnimation onBuilt={() => setBuilt(true)} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* LoginForm content */}
            <motion.div
              variants={formContainer}
              initial="hidden"
              animate={built ? "show" : "hidden"}
              className={cn("space-y-7", !built && "pointer-events-none opacity-0")}
            >
              {/* Shield Title Header */}
              <motion.div variants={formItem} className="space-y-4">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/15 shadow-[0_0_12px_rgba(34,211,238,0.12)]">
                  <ShieldCheck className="size-6" />
                </span>
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-[30px] leading-tight">
                    Bienvenido de nuevo
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Accede a tu panel de gestión y control operativo
                  </p>
                </div>
              </motion.div>

              {/* Reason alert */}
              {reason && (
                <motion.div variants={formItem}>
                  <AuthReasonAlert reason={reason} />
                </motion.div>
              )}

              {/* Login Errors */}
              {authError && (
                <motion.div
                  variants={formItem}
                  role="alert"
                  className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-300"
                >
                  <TriangleAlert className="mt-0.5 size-[18px] shrink-0" aria-hidden />
                  <p className="text-[13px] leading-relaxed font-medium">{authError}</p>
                </motion.div>
              )}

              <form className="space-y-6" onSubmit={onSubmit} noValidate>
                {/* Email input with real labels */}
                <motion.div variants={formItem} className="space-y-2.5">
                  <label htmlFor="login-email" className="block text-[13px] sm:text-sm font-semibold text-slate-300 tracking-wide">
                    Correo corporativo
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-600" />
                    <input
                      id="login-email"
                      type="email"
                      placeholder="nombre@empresa.com"
                      autoComplete="email"
                      aria-invalid={Boolean(errors.email)}
                      className={cn(
                        "h-13 w-full rounded-xl border bg-slate-950/40 pl-11 pr-4 text-sm sm:text-base text-white outline-none transition-all duration-200 placeholder:text-slate-600 focus:bg-slate-950/70",
                        errors.email
                          ? "border-rose-500/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                          : "border-slate-800 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10",
                      )}
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                      <span className="inline-block size-1 rounded-full bg-rose-400 animate-pulse" />
                      {errors.email.message}
                    </p>
                  )}
                </motion.div>

                {/* Password input with real labels */}
                <motion.div variants={formItem} className="space-y-2.5">
                  <label htmlFor="login-password" className="block text-[13px] sm:text-sm font-semibold text-slate-300 tracking-wide">
                    Contraseña
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-600" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      aria-invalid={Boolean(errors.password)}
                      className={cn(
                        "h-13 w-full rounded-xl border bg-slate-950/40 pl-11 pr-12 text-sm sm:text-base text-white outline-none transition-all duration-200 placeholder:text-slate-600 focus:bg-slate-950/70",
                        errors.password
                          ? "border-rose-500/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                          : "border-slate-800 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10",
                      )}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 transition-colors hover:text-white"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                      <span className="inline-block size-1 rounded-full bg-rose-400 animate-pulse" />
                      {errors.password.message}
                    </p>
                  )}
                </motion.div>

                {/* Remember & forgot password */}
                <motion.div variants={formItem} className="flex items-center justify-between gap-3 pt-1">
                  <label htmlFor="login-remember" className="flex cursor-pointer items-center gap-2 text-xs sm:text-sm text-slate-400 select-none">
                    <input
                      id="login-remember"
                      type="checkbox"
                      className="size-4 rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                    />
                    Recordarme
                  </label>
                  <button
                    type="button"
                    className="text-xs sm:text-sm font-bold text-cyan-400 transition-opacity hover:opacity-80"
                    onClick={() =>
                      toast.info(
                        "Contacta a tu administrador para restablecer tu contraseña.",
                        { id: "forgot-password-toast", duration: 5000 },
                      )
                    }
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </motion.div>

                {/* Slow Connection flag */}
                {isSlow && isLoading && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-300">
                    <Clock className="mt-0.5 size-4 shrink-0 animate-pulse text-amber-400" />
                    <div className="space-y-1">
                      <p className="font-semibold text-amber-300">Conexión lenta detectada</p>
                      <p className="leading-relaxed text-slate-300">
                        El servidor backend podría estar iniciando (cold start). No cierres la ventana, esto puede tomar unos segundos.
                      </p>
                    </div>
                  </div>
                )}

                {/* Main Submit Button */}
                <motion.button
                  variants={formItem}
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "group relative mt-1 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-sm sm:text-base font-bold text-slate-950 shadow-lg shadow-cyan-500/5 transition-all duration-200",
                    isLoading
                      ? "cursor-not-allowed opacity-75"
                      : "hover:-translate-y-0.5 hover:shadow-cyan-500/15 hover:shadow-xl active:translate-y-0",
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Validando…</span>
                    </>
                  ) : (
                    <>
                      <span>Ingresar al panel</span>
                      <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Encryption Bottom Banner */}
              <motion.div
                variants={formItem}
                className="flex items-start gap-2.5 rounded-2xl border border-slate-800/80 bg-slate-900/10 p-4"
              >
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-cyan-400" />
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Conexión segura con cifrado. Tus datos y los de tu empresa están protegidos.
                </p>
              </motion.div>
            </motion.div>
          </div>

          {/* Footer Copyright */}
          <p suppressHydrationWarning className="mt-6 text-center text-[10px] sm:text-xs text-slate-500">
            &copy; {year} FABRYOR &mdash; Todos los derechos reservados
          </p>
        </div>
      </div>
    </main>
  );
}
