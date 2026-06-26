"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Smartphone,
  ShieldAlert,
  RotateCcw,
  RefreshCw,
  Clock,
  Lock,
  AlertTriangle,
  X,
} from "lucide-react";

import { apiClient, ApiClientError } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldFrame, Select } from "@/components/ui/fields";
import { Badge } from "@/components/ui/badge";
import { extractArray } from "@/lib/utils/extract-array";

interface WorkerDevicesTabProps {
  userId: string;
}

export interface WorkerDevice {
  id: string;
  userId: string;
  workerId?: string | null;
  deviceId: string;
  platform: string;
  deviceName?: string | null;
  osVersion?: string | null;
  appVersion?: string | null;
  ipAddress?: string | null;
  lastActivityAt?: string | null;
  isBlocked?: boolean;
  blockedAt?: string | null;
  blockedReason?: string | null;
  changesThisMonth?: number;
  monthlyChangeLimit?: number;
  createdAt?: string;
  updatedAt?: string;
}

export function WorkerDevicesTab({ userId }: WorkerDevicesTabProps) {
  const queryClient = useQueryClient();
  const [selectedDevice, setSelectedDevice] = useState<WorkerDevice | null>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetReason, setResetReason] = useState("");

  const { data: responseData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["worker-devices", userId],
    queryFn: () => apiClient<unknown>(`/api/admin/devices?userId=${userId}`),
    enabled: Boolean(userId),
    retry: false,
  });

  const devices = extractArray<WorkerDevice>(responseData);

  // Mutation to lock device
  const lockMutation = useMutation({
    mutationFn: ({ deviceId, reason }: { deviceId: string; reason: string }) =>
      apiClient<unknown>(`/api/admin/devices/${deviceId}/lock`, {
        method: "POST",
        body: { reason },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker-devices", userId] });
      toast.success("Dispositivo bloqueado correctamente.");
      setBlockModalOpen(false);
      setBlockReason("");
      setSelectedDevice(null);
    },
    onError: (err: unknown) => {
      const apiErr = err as ApiClientError;
      const status = apiErr?.status ?? "Desconocido";
      const message = apiErr?.message || "Error al realizar la petición.";
      toast.error(`No se pudo bloquear el dispositivo (Error ${status}): ${message}`);
    },
  });

  // Mutation to reset monthly limit
  const resetMutation = useMutation({
    mutationFn: ({ deviceId, reason }: { deviceId: string; reason: string }) =>
      apiClient<unknown>(`/api/admin/devices/${deviceId}/reset-monthly-limit`, {
        method: "POST",
        body: { reason },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker-devices", userId] });
      toast.success("Límite mensual de cambios reiniciado correctamente.");
      setResetModalOpen(false);
      setResetReason("");
      setSelectedDevice(null);
    },
    onError: (err: unknown) => {
      const apiErr = err as ApiClientError;
      const status = apiErr?.status ?? "Desconocido";
      const message = apiErr?.message || "Error al realizar la petición.";
      toast.error(`No se pudo resetear el límite mensual (Error ${status}): ${message}`);
    },
  });

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Sin actividad reciente";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Sin actividad reciente";
      return date.toLocaleString("es-PE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Sin actividad reciente";
    }
  };

  const handleOpenLock = (device: WorkerDevice) => {
    setSelectedDevice(device);
    setBlockReason("Robo reportado");
    setBlockModalOpen(true);
  };

  const handleOpenReset = (device: WorkerDevice) => {
    setSelectedDevice(device);
    setResetReason("");
    setResetModalOpen(true);
  };

  // Render 404 or backend unavailable diagnostics
  const is404 = isError && error instanceof ApiClientError && error.status === 404;

  if (is404) {
    return (
      <Card className="p-6 border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200 space-y-4 rounded-2xl">
        <div className="flex items-start gap-3">
          <ShieldAlert className="size-6 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-foreground">
              Módulo de Dispositivos Móviles no disponible en el Backend (404)
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              El frontend intentó conectarse con los endpoints administrativos de dispositivos móviles, pero el servidor respondió con un error <strong>404 Not Found</strong>. Esto indica que las rutas del microservicio aún no han sido desplegadas o están desactivadas.
            </p>
          </div>
        </div>

        <div className="bg-background/80 border border-border/50 rounded-xl p-4 text-xs font-mono text-foreground-soft space-y-2">
          <div className="font-bold text-foreground">Registro de Diagnóstico para Backend:</div>
          <div><span className="font-semibold text-primary">GET Endpoint probado:</span> /api/admin/devices?userId={userId}</div>
          <div><span className="font-semibold text-primary">Método HTTP:</span> GET</div>
          <div><span className="font-semibold text-primary">Cabeceras enviadas:</span> Authorization: Bearer [Access Token]</div>
          <div><span className="font-semibold text-primary">Respuesta recibida:</span> 404 Not Found (Ruta no mapeada)</div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={() => refetch()} variant="secondary" className="text-xs h-8 gap-1.5 rounded-lg">
            <RefreshCw className="size-3.5" />
            Reintentar Conexión
          </Button>
        </div>
      </Card>
    );
  }

  if (isError) {
    const apiErr = error as ApiClientError;
    return (
      <Card className="p-6 border-rose-500/30 bg-rose-500/5 space-y-4 rounded-2xl">
        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <AlertTriangle className="size-6 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-foreground">Error al consultar dispositivos</h3>
            <p className="text-xs text-muted-foreground">
              {apiErr?.message || "No se pudo establecer comunicación con el microservicio de seguridad."}
            </p>
          </div>
        </div>
        <div className="bg-background/80 border border-border/50 rounded-xl p-4 text-xs font-mono space-y-1">
          <div><span className="font-semibold text-primary">Error Código:</span> {apiErr?.code || "HTTP_ERROR"}</div>
          <div><span className="font-semibold text-primary">Status:</span> {apiErr?.status || "Unknown"}</div>
        </div>
        <Button onClick={() => refetch()} variant="secondary" className="h-8 text-xs gap-1.5 rounded-lg">
          <RefreshCw className="size-3.5" />
          Reintentar
        </Button>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="text-xs font-medium">Buscando dispositivos móviles asociados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Description Info */}
      <Card className="p-4 bg-muted/15 border-border/60 flex items-center gap-3.5 rounded-2xl">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <Smartphone className="size-5" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Control de Dispositivos</h4>
          <p className="text-xs text-muted-foreground">
            Los trabajadores solo pueden marcar asistencia desde celulares autorizados. RR.HH. puede bloquear celulares y resetear límites de cambios aquí.
          </p>
        </div>
      </Card>

      {devices.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 border-dashed text-center min-h-[200px] rounded-2xl">
          <Smartphone className="size-8 text-muted-foreground/60 mb-2" />
          <h4 className="text-sm font-bold text-foreground">Sin dispositivos registrados</h4>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            Este colaborador aún no ha enlazado su cuenta a ningún dispositivo móvil.
          </p>
        </Card>
      ) : (
        <div className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full border-collapse text-left text-sm min-w-[1100px]">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="p-4">Dispositivo</th>
                <th className="p-4">Plataforma</th>
                <th className="p-4">Sistema Operativo</th>
                <th className="p-4">Versión App</th>
                <th className="p-4">Dirección IP</th>
                <th className="p-4">Última Actividad</th>
                <th className="p-4">Cambios del Mes</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {devices.map((dev) => {
                const deviceDisplayName = dev.deviceName || `${dev.platform} ${dev.osVersion || ""}` || dev.deviceId || "Dispositivo desconocido";
                return (
                  <tr key={dev.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-semibold text-foreground">{deviceDisplayName}</td>
                    <td className="p-4 capitalize text-foreground-soft">{dev.platform}</td>
                    <td className="p-4 text-muted-foreground">{dev.osVersion || "-"}</td>
                    <td className="p-4 text-muted-foreground">{dev.appVersion || "-"}</td>
                    <td className="p-4 text-muted-foreground">{dev.ipAddress || "IP no disponible"}</td>
                    <td className="p-4 text-muted-foreground font-medium flex items-center gap-1.5">
                      <Clock className="size-3.5 text-muted-foreground/50 shrink-0" />
                      {formatDate(dev.lastActivityAt)}
                    </td>
                    <td className="p-4 text-muted-foreground font-medium">
                      {dev.changesThisMonth ?? 0} / {dev.monthlyChangeLimit ?? 3}
                    </td>
                    <td className="p-4">
                      <Badge variant={dev.isBlocked ? "destructive" : "success"}>
                        {dev.isBlocked ? "Bloqueado" : "Activo"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        variant="secondary"
                        onClick={() => handleOpenReset(dev)}
                        title="Resetear límite mensual de cambios"
                        className="h-8 text-xs gap-1 rounded-lg hover:bg-secondary/80"
                      >
                        <RotateCcw className="size-3.5" />
                        Reset Límite
                      </Button>
                      <Button
                        variant="danger"
                        disabled={dev.isBlocked}
                        onClick={() => handleOpenLock(dev)}
                        title="Bloquear celular de emergencia"
                        className="h-8 text-xs gap-1 rounded-lg"
                      >
                        <Lock className="size-3.5" />
                        Bloquear
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Lock Confirmation Modal */}
      {blockModalOpen && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <h2 className="text-base font-bold text-foreground">¿Bloquear este dispositivo?</h2>
              <button
                type="button"
                onClick={() => setBlockModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 bg-rose-500/5 text-rose-600 dark:text-rose-400 p-4 border border-rose-500/20 rounded-2xl text-xs leading-relaxed">
                <ShieldAlert className="size-5 shrink-0 mt-0.5" />
                <span>
                  <strong>Atención:</strong> Este celular ya no podrá registrar asistencia ni operar como dispositivo autorizado del trabajador. Esta acción es inmediata y crítica.
                </span>
              </div>

              <FieldFrame label="Motivo del bloqueo (Obligatorio)">
                <Select value={blockReason} onChange={(e) => setBlockReason(e.target.value)}>
                  <option value="Robo reportado">Robo reportado</option>
                  <option value="Pérdida del equipo">Pérdida del equipo</option>
                  <option value="Cambio no autorizado">Cambio no autorizado</option>
                  <option value="Equipo comprometido">Equipo comprometido</option>
                </Select>
              </FieldFrame>

              <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
                <Button type="button" variant="secondary" onClick={() => setBlockModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={lockMutation.isPending}
                  onClick={() => lockMutation.mutate({ deviceId: selectedDevice.deviceId, reason: blockReason })}
                >
                  {lockMutation.isPending ? "Bloqueando..." : "Bloquear Dispositivo"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Limit Confirmation Modal */}
      {resetModalOpen && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <h2 className="text-base font-bold text-foreground">¿Resetear límite mensual?</h2>
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Esto permitirá que el trabajador pueda registrar un nuevo dispositivo móvil durante el mes actual, sobreescribiendo el límite mensual establecido.
              </p>

              <FieldFrame label="Motivo del reinicio (Obligatorio)">
                <select
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  className="h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-primary w-full"
                >
                  <option value="">Seleccione un motivo...</option>
                  <option value="Trabajador presentó sustento por cambio de equipo">Trabajador presentó sustento por cambio de equipo</option>
                  <option value="Error de configuración del sistema">Error de configuración del sistema</option>
                  <option value="Reemplazo temporal autorizado">Reemplazo temporal autorizado</option>
                </select>
              </FieldFrame>

              <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
                <Button type="button" variant="secondary" onClick={() => setResetModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={resetMutation.isPending || !resetReason}
                  onClick={() => resetMutation.mutate({ deviceId: selectedDevice.deviceId, reason: resetReason })}
                >
                  {resetMutation.isPending ? "Reiniciando..." : "Resetear Límite"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
