"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  useReducedMotion,
  type Variants,
} from "framer-motion";
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
import { type FormEvent, useRef, useState } from "react";
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
    <LazyMotion features={domAnimation}>
      <main className="relative flex min-h-dvh w-full overflow-x-hidden bg-[#08181f] font-sans text-white">
        <LoginBackgroundParticles />

        <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(118deg,rgba(18,51,59,0.5)_0%,rgba(8,24,31,0.78)_48%,rgba(18,25,28,0.92)_100%)]" />
        <div className="pointer-events-none absolute -right-40 top-[16%] z-0 size-[32rem] rounded-full bg-[#5f7977]/[0.08] blur-[130px]" />

        <LoginHero />

        <div className="z-10 my-10 hidden w-px self-stretch bg-gradient-to-b from-transparent via-white/10 to-transparent lg:block" />

        <section
          aria-labelledby="login-heading"
          className="relative z-10 flex min-h-dvh w-full flex-col items-center justify-center px-4 py-6 sm:px-8 sm:py-10 lg:h-dvh lg:min-h-0 lg:w-[46%] xl:px-[clamp(2.5rem,3vw,6rem)]"
        >
        <div className="mb-5 flex flex-col items-center justify-center gap-2 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="relative size-10 overflow-hidden rounded-xl border border-white/10 bg-white/[0.07] p-2 shadow-lg">
              <Image src="/logo.png" alt="FABRYOR" fill sizes="40px" className="object-contain p-1" priority />
            </div>
            <span className="font-display text-xl font-extrabold tracking-[-0.025em] text-white">
              FABRYOR <span className="font-semibold text-[#aabcb8]">Admin</span>
            </span>
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#839792]">
            Control de Personal y Obra
          </span>
        </div>

        <div className="relative flex w-full max-w-[clamp(520px,24vw,720px)] flex-col justify-center">
          <div
            className="pointer-events-none absolute -inset-5 rounded-[2rem] bg-[#7f9994]/10 blur-3xl transition-opacity duration-700"
            style={{ opacity: built ? 0.65 : 0.18 }}
          />

          <div
            className={cn(
              "relative flex min-h-[clamp(590px,68vh,760px)] w-full flex-col justify-center overflow-hidden rounded-[1.75rem] border px-[clamp(1.5rem,2.4vw,3.75rem)] py-[clamp(2rem,4vh,3.75rem)] shadow-[0_30px_80px_rgba(0,0,0,0.34)] transition-[background-color,border-color,box-shadow] duration-700",
              built
                ? "border-white/40 bg-[#f2f4f1]/[0.96] backdrop-blur-xl"
                : "border-white/[0.08] bg-white/[0.025] backdrop-blur-sm"
            )}
          >
            <AnimatePresence mode="wait">
              {!built && (
                <m.div
                  key="bricks"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0.15 : 0.38, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center p-1"
                >
                  <BrickBuildAnimation onBuilt={() => setBuilt(true)} />
                </m.div>
              )}
            </AnimatePresence>

            <m.div
              variants={formContainer}
              initial="hidden"
              animate={built ? "show" : "hidden"}
              aria-hidden={!built}
              className={cn("space-y-6 min-[2100px]:space-y-8", !built && "pointer-events-none opacity-0")}
            >
              <m.div variants={formItem} className="space-y-4">
                <span className="flex size-11 items-center justify-center rounded-full border border-[#315f60]/15 bg-[#315f60]/[0.07] text-[#315f60] min-[2100px]:size-14">
                  <ShieldCheck className="size-5 min-[2100px]:size-6" strokeWidth={1.8} aria-hidden />
                </span>
                <div className="space-y-2">
                  <h2 id="login-heading" className="font-display text-[1.7rem] font-extrabold leading-tight tracking-[-0.035em] text-[#17272b] sm:text-[2rem] min-[2100px]:text-[2.4rem]">
                    Bienvenido de nuevo
                  </h2>
                  <p className="text-sm leading-relaxed text-[#647476] min-[2100px]:text-base">
                    Accede a tu panel de gestión y control operativo
                  </p>
                </div>
              </m.div>

              {reason && (
                <m.div variants={formItem}>
                  <AuthReasonAlert reason={reason} />
                </m.div>
              )}

              {authError && (
                <m.div
                  variants={formItem}
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-[#a95e5e]/20 bg-[#a95e5e]/[0.07] p-3.5 text-[#7c3f3f]"
                >
                  <TriangleAlert className="mt-0.5 size-[18px] shrink-0" aria-hidden />
                  <p className="text-[13px] font-medium leading-relaxed">{authError}</p>
                </m.div>
              )}

              <form className="space-y-5 min-[2100px]:space-y-6" onSubmit={onSubmit} noValidate>
                <m.div variants={formItem} className="space-y-2">
                  <label htmlFor="login-email" className="block text-[13px] font-semibold text-[#344649] min-[2100px]:text-[15px]">
                    Correo corporativo
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#809092] min-[2100px]:size-5" strokeWidth={1.8} aria-hidden />
                    <input
                      id="login-email"
                      type="email"
                      placeholder="nombre@empresa.com"
                      autoComplete="email"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "login-email-error" : undefined}
                      className={cn(
                        "h-12 w-full rounded-xl border bg-white/75 pl-11 pr-4 text-[15px] text-[#17272b] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#98a4a5] focus:bg-white focus:ring-3 min-[2100px]:h-14 min-[2100px]:pl-12 min-[2100px]:text-base",
                        errors.email
                          ? "border-[#a95e5e]/50 focus:border-[#a95e5e] focus:ring-[#a95e5e]/10"
                          : "border-[#cfd6d4] focus:border-[#547a78] focus:ring-[#547a78]/10",
                      )}
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p id="login-email-error" className="flex items-center gap-1.5 text-xs font-medium text-[#8c4545]">
                      <span className="inline-block size-1 rounded-full bg-[#8c4545]" aria-hidden />
                      {errors.email.message}
                    </p>
                  )}
                </m.div>

                <m.div variants={formItem} className="space-y-2">
                  <label htmlFor="login-password" className="block text-[13px] font-semibold text-[#344649] min-[2100px]:text-[15px]">
                    Contraseña
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#809092] min-[2100px]:size-5" strokeWidth={1.8} aria-hidden />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? "login-password-error" : undefined}
                      className={cn(
                        "h-12 w-full rounded-xl border bg-white/75 pl-11 pr-12 text-[15px] text-[#17272b] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#98a4a5] focus:bg-white focus:ring-3 min-[2100px]:h-14 min-[2100px]:pl-12 min-[2100px]:text-base",
                        errors.password
                          ? "border-[#a95e5e]/50 focus:border-[#a95e5e] focus:ring-[#a95e5e]/10"
                          : "border-[#cfd6d4] focus:border-[#547a78] focus:ring-[#547a78]/10",
                      )}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#718183] transition-colors hover:bg-[#e5e9e6] hover:text-[#24383b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#547a78]"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="login-password-error" className="flex items-center gap-1.5 text-xs font-medium text-[#8c4545]">
                      <span className="inline-block size-1 rounded-full bg-[#8c4545]" aria-hidden />
                      {errors.password.message}
                    </p>
                  )}
                </m.div>

                <m.div variants={formItem} className="flex items-center justify-between gap-3 pt-0.5">
                  <label htmlFor="login-remember" className="flex cursor-pointer select-none items-center gap-2 text-xs text-[#647476] sm:text-sm min-[2100px]:text-base">
                    <input
                      id="login-remember"
                      type="checkbox"
                      className="size-4 rounded border-[#bcc6c4] bg-white accent-[#315f60] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#547a78] focus-visible:ring-offset-2"
                    />
                    Recordarme
                  </label>
                  <button
                    type="button"
                    className="rounded text-xs font-semibold text-[#315f60] underline-offset-4 transition-colors hover:text-[#1f484a] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#547a78] sm:text-sm min-[2100px]:text-base"
                    onClick={() =>
                      toast.info(
                        "Contacta a tu administrador para restablecer tu contraseña.",
                        { id: "forgot-password-toast", duration: 5000 },
                      )
                    }
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </m.div>

                {isSlow && isLoading && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-[#a07840]/20 bg-[#a07840]/[0.07] p-3.5 text-xs text-[#6f512c]">
                    <Clock className="mt-0.5 size-4 shrink-0 text-[#8a6534]" aria-hidden />
                    <div className="space-y-1">
                      <p className="font-semibold">Conexión lenta detectada</p>
                      <p className="leading-relaxed text-[#5d6b6c]">
                        El servidor backend podría estar iniciando (cold start). No cierres la ventana, esto puede tomar unos segundos.
                      </p>
                    </div>
                  </div>
                )}

                <m.button
                  variants={formItem}
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "group relative mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#214c4f] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(33,76,79,0.18)] transition-[transform,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#547a78]/30 focus-visible:ring-offset-2 sm:text-[15px] min-[2100px]:h-14 min-[2100px]:text-base",
                    isLoading
                      ? "cursor-not-allowed opacity-75"
                      : "hover:-translate-y-0.5 hover:bg-[#193f42] hover:shadow-[0_14px_28px_rgba(33,76,79,0.24)] active:translate-y-0",
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
                </m.button>
              </form>

              <m.div
                variants={formItem}
                className="flex items-start gap-2.5 rounded-xl border border-[#d5dcda] bg-white/45 p-3.5"
              >
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#547a78]" strokeWidth={1.8} aria-hidden />
                <p className="text-[11px] leading-relaxed text-[#697879] min-[2100px]:text-[13px]">
                  Conexión segura con cifrado. Tus datos y los de tu empresa están protegidos.
                </p>
              </m.div>
            </m.div>
          </div>

          <p suppressHydrationWarning className="mt-5 text-center text-[10px] text-[#82918f] sm:text-xs min-[2100px]:mt-7 min-[2100px]:text-sm">
            &copy; {year} FABRYOR &mdash; Todos los derechos reservados
          </p>
        </div>
        </section>
      </main>
    </LazyMotion>
  );
}
