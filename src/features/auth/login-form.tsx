"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Shield,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useSession } from "@/features/auth/auth-provider";
import { ApiClientError } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { getClientDeviceInfo } from "@/lib/security/device-info";

/* ─── Schema ─── */
const loginSchema = z.object({
  email: z.email("Ingresa un correo válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/* ─── Feature badges for the decorative panel ─── */
const features = [
  { icon: Clock, label: "Asistencia en tiempo real", color: "from-teal-500 to-emerald-500" },
  { icon: MapPin, label: "Control por ubicación", color: "from-cyan-500 to-teal-500" },
  { icon: Shield, label: "Reportes automáticos", color: "from-emerald-500 to-green-500" },
  { icon: Users, label: "Gestión RR.HH.", color: "from-teal-600 to-cyan-500" },
] as const;

function classifyLoginError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 504) {
      return "El servidor tardó demasiado en responder (Timeout). Es posible que el backend esté experimentando problemas de inicio (cold start). Por favor, intenta de nuevo.";
    }
    if (error.status === 503) {
      return "El servidor no se encuentra disponible (503). Esto puede deberse a que el backend se está iniciando. Por favor, reintenta en unos instantes.";
    }
    if (error.status === 401 || error.status === 400) {
      return "Credenciales incorrectas. Verifica que tu correo corporativo y contraseña sean correctos.";
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
      return "No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.";
    }
    return error.message;
  }

  return "Ocurrió un error inesperado al intentar iniciar sesión.";
}

export function LoginForm() {
  const { login, status } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const slowTimerRef = useRef<number | null>(null);

  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  useEffect(() => {
    if (reason === "session-revoked") {
      toast.error("Tu sesión fue cerrada desde otro dispositivo. Inicia sesión nuevamente.", {
        id: "session-revoked-toast",
        duration: 8000,
      });
    } else if (reason === "session-expired") {
      toast.error("Tu sesión ha expirado o es inválida. Inicia sesión nuevamente.", {
        id: "session-expired-toast",
        duration: 8000,
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
      toast.info("Conexion lenta detectada. El servidor podria estar iniciando...", {
        id: "slow-login-toast",
        duration: 5000,
      });
    }, 8000);
  };

  const submitLogin = async (values: LoginFormValues) => {
    setIsSlow(false);
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
      toast.error(classifiedMessage, {
        id: "login-error-toast",
        duration: 6000,
      });
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(submitLogin)(event);
  };

  return (
    <main className="flex min-h-screen w-full">
      {/* ── Left Panel: Decorative Branding ── */}
      <div className="relative hidden w-[52%] overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 lg:flex lg:flex-col lg:justify-between">
        {/* Background decorative elements */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 size-96 rounded-full bg-card/5 blur-3xl" />
          <div className="absolute bottom-20 right-10 size-72 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute right-1/3 top-1/3 size-56 rounded-full bg-teal-300/8 blur-2xl" />
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-14">
          {/* Top: Logo */}
          <div className="flex items-center gap-3">
            <div className="relative size-10 overflow-hidden rounded-xl bg-card/10 p-1.5 backdrop-blur-sm">
              <Image
                src="/logo.png"
                alt="FABRYOR"
                fill
                sizes="40px"
                className="object-contain p-0.5"
                priority
              />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">FABRYOR</span>
          </div>

          {/* Center: Hero text */}
          <div className="my-auto space-y-8 py-12">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-card/10 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-[pulse-soft_2s_infinite]" />
                Plataforma empresarial activa
              </div>
              <h1 className="section-title text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                Gestión inteligente de asistencia, horarios y personal
              </h1>
              <p className="max-w-md text-base leading-relaxed text-white/70">
                Supervisa operaciones, gestiona solicitudes y controla la asistencia de tu equipo
                desde un solo panel administrativo.
              </p>
            </div>

            {/* Feature badges */}
            <div className="grid grid-cols-2 gap-3">
              {features.map(({ icon: Icon, label, color }, index) => (
                <div
                  key={label}
                  className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-card/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-card/10"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br", color)}>
                    <Icon className="size-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white/90">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: Decorative stats */}
          <div className="flex items-center gap-6 border-t border-white/10 pt-6">
            <div>
              <p className="text-2xl font-bold text-white">99.9%</p>
              <p className="text-xs text-white/50">Disponibilidad</p>
            </div>
            <div className="h-8 w-px bg-card/10" />
            <div>
              <p className="text-2xl font-bold text-white">256-bit</p>
              <p className="text-xs text-white/50">Encriptación SSL</p>
            </div>
            <div className="h-8 w-px bg-card/10" />
            <div>
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="text-xs text-white/50">Monitoreo activo</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="relative flex w-full flex-1 items-center justify-center bg-muted px-6 py-12 lg:w-[48%]">
        {/* Subtle background pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -right-32 -top-32 size-96 rounded-full bg-teal-100/50 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 size-72 rounded-full bg-emerald-50/60 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Mobile Logo (hidden on lg+) */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="relative size-10 overflow-hidden rounded-xl bg-primary/10 p-1.5">
              <Image
                src="/logo.png"
                alt="FABRYOR"
                fill
                sizes="40px"
                className="object-contain p-0.5"
                priority
              />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">FABRYOR</span>
          </div>

          {/* Form Card */}
          <div className="rounded-3xl border border-white/60 bg-card/80 p-8 shadow-2xl shadow-brand/5 ring-1 ring-black/5 backdrop-blur-xl sm:p-10">
            {/* Header */}
            <div className="mb-8 space-y-2">
              <h2 className="section-title text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Bienvenido de nuevo
              </h2>
              <p className="text-sm leading-relaxed text-foreground-soft">
                Accede a tu panel de gestión y control de asistencia
              </p>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={onSubmit}>
              {/* Email field */}
              <div className="space-y-2">
                <label htmlFor="login-email" className="block text-sm font-medium text-foreground">
                  Correo corporativo
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="login-email"
                    type="email"
                    placeholder="usuario@fabryor.com"
                    autoComplete="email"
                    className={cn(
                      "h-12 w-full rounded-xl border bg-card pl-11 pr-4 text-sm text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground",
                      errors.email
                        ? "border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                        : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
                    )}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-rose-500">
                    <span className="inline-block size-1 rounded-full bg-rose-500" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <label htmlFor="login-password" className="block text-sm font-medium text-foreground">
                  Contraseña
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={cn(
                      "h-12 w-full rounded-xl border bg-card pl-11 pr-12 text-sm text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground",
                      errors.password
                        ? "border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                        : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
                    )}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground-soft"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-rose-500">
                    <span className="inline-block size-1 rounded-full bg-rose-500" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Slow connection warning banner */}
              {isSlow && isLoading && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Clock className="h-4 w-4 shrink-0 mt-0.5 animate-pulse text-amber-500" />
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-800 dark:text-amber-300">Conexión lenta detectada</p>
                    <p className="leading-relaxed text-amber-700/95 dark:text-amber-400/90">
                      El servidor backend podría estar iniciando (cold start). Por favor, no cierres la ventana, esto puede tomar unos segundos adicionales.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "group relative mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-all duration-200",
                  isLoading
                    ? "cursor-not-allowed opacity-70"
                    : "hover:-translate-y-0.5 hover:bg-primary-strong hover:shadow-xl hover:shadow-brand/25 active:translate-y-0",
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Validando...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar al panel</span>
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Footer info */}
            <div className="mt-6 rounded-xl border border-border bg-muted/80 p-3.5">
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                Conexión segura con la API de producción. Tu sesión se guarda con cookies seguras
                del lado del servidor.
              </p>
            </div>
          </div>

          {/* Bottom copyright */}
          <p suppressHydrationWarning className="mt-6 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} FABRYOR &mdash; Todos los derechos reservados
          </p>
        </div>
      </div>
    </main>
  );
}
