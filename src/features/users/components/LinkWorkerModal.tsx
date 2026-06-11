import { useState } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import { useQuery } from "@tanstack/react-query";
import { workersService } from "@/services/workers.service";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { logger } from "@/lib/logger";

interface LinkWorkerModalProps {
 userId: string;
 isOpen: boolean;
 onClose: () => void;
 onLink: (workerId: string) => Promise<void>;
}

export function LinkWorkerModal({ userId, isOpen, onClose, onLink }: LinkWorkerModalProps) {
 const [searchTerm, setSearchTerm] = useState("");
 const [isLinking, setIsLinking] = useState(false);

 const { data, isLoading } = useQuery({
 queryKey: ["workers-search", searchTerm],
 queryFn: () => workersService.list({ search: searchTerm, page: 1, pageSize: 10 }),
 enabled: isOpen,
 });

 const workers = data?.items || [];

 const handleLink = async (workerId: string) => {
 try {
 setIsLinking(true);
 await onLink(workerId);
 onClose();
 } catch (error) {
 logger.error("Error linking worker", error);
 } finally {
 setIsLinking(false);
 }
 };

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
 <button
 type="button"
 className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
 onClick={onClose}
 aria-label="Cerrar modal"
 />
 
 <div className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">
 <div className="flex items-center justify-between border-b border-border px-6 py-4">
 <h2 className="text-lg font-semibold text-foreground">Vincular a trabajador</h2>
 <button
 type="button"
 onClick={onClose}
 className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-muted-foreground"
 >
 <X className="size-5" />
 </button>
 </div>

 <div className="p-6">
 <div className="relative mb-6">
 <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
 <Input
 placeholder="Buscar por nombre o documento..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-9"
 autoFocus
 />
 </div>

 <div className="flex h-64 flex-col gap-2 overflow-y-auto">
 {isLoading ? (
 <div className="flex flex-1 items-center justify-center text-muted-foreground">
 <Loader2 className="size-6 animate-spin" />
 </div>
 ) : workers.length === 0 ? (
 <div className="flex flex-1 flex-col items-center justify-center text-center text-sm text-muted-foreground">
 No se encontraron trabajadores con ese término.
 </div>
 ) : (
 workers.map((worker) => (
 <div 
 key={worker.id}
 className="flex items-center justify-between rounded-xl border border-border p-3 transition-colors hover:bg-muted"
 >
 <div className="flex items-center gap-3">
 <UserAvatar src={worker.avatarUrl} fullName={worker.fullName} email={worker.email} size="sm" />
 <div className="flex flex-col">
 <span className="text-sm font-semibold text-foreground">{worker.fullName}</span>
 <span className="text-xs text-foreground-soft">{worker.position || "Sin cargo"} • {worker.project || "Sin proyecto"}</span>
 </div>
 </div>
 <Button 
 variant="secondary" 
 className="h-9 rounded-xl px-3 text-xs"
 onClick={() => handleLink(worker.id)}
 disabled={isLinking}
 >
 Vincular
 </Button>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
