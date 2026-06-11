"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X, UsersRound, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, FieldFrame } from "@/components/ui/fields";

import { workCrewsService, WorkCrew } from "@/services/work-crews.service";
import { workersService } from "@/services/workers.service";
import { profileService } from "@/services/profile.service";
import { normalizeCurrentUserProfile } from "@/lib/api/normalizers";
import { extractArray } from "@/lib/utils/extract-array";
import { WorkerRecord } from "@/types";

import { getApiErrorCode, getApiErrorDetails, canReassignWorker, WORKER_ASSIGNMENT_ERROR_MESSAGES } from "@/lib/api/error-handlers";
import { WorkerReassignModal } from "./WorkerReassignModal";

import { WorkerSearchBar } from "./add-workers-modal/WorkerSearchBar";
import { WorkerFilterTabs } from "./add-workers-modal/WorkerFilterTabs";
import { AvailableWorkersList } from "./add-workers-modal/AvailableWorkersList";
import { SelectedWorkersSummary } from "./add-workers-modal/SelectedWorkersSummary";
import { ConfirmAssignmentDialog } from "./add-workers-modal/ConfirmAssignmentDialog";

const EMPTY_WORKERS: WorkerRecord[] = [];

interface AddWorkersState {
 search: string;
 activeTab: string;
 selectedIds: Set<string>;
 reason: string;
 showConfirmDialog: boolean;
}

type AddWorkersAction =
 | { type: "setSearch"; value: string }
 | { type: "setActiveTab"; value: string }
 | { type: "toggleWorker"; id: string }
 | { type: "removeWorker"; id: string }
 | { type: "setReason"; value: string }
 | { type: "setShowConfirmDialog"; value: boolean };

const addWorkersInitialState: AddWorkersState = {
 search: "",
 activeTab: "all",
 selectedIds: new Set<string>(),
 reason: "",
 showConfirmDialog: false,
};

function addWorkersReducer(state: AddWorkersState, action: AddWorkersAction): AddWorkersState {
 switch (action.type) {
 case "setSearch":
 return { ...state, search: action.value };
 case "setActiveTab":
 return { ...state, activeTab: action.value };
 case "toggleWorker": {
 const selectedIds = new Set(state.selectedIds);
 if (selectedIds.has(action.id)) selectedIds.delete(action.id);
 else selectedIds.add(action.id);
 return { ...state, selectedIds };
 }
 case "removeWorker": {
 const selectedIds = new Set(state.selectedIds);
 selectedIds.delete(action.id);
 return { ...state, selectedIds };
 }
 case "setReason":
 return { ...state, reason: action.value };
 case "setShowConfirmDialog":
 return { ...state, showConfirmDialog: action.value };
 default:
 return state;
 }
}

// Custom hook for debounce
function useDebounce<T>(value: T, delay: number): T {
 const [debouncedValue, setDebouncedValue] = useState<T>(value);
 
 useEffect(() => {
 const handler = setTimeout(() => {
 setDebouncedValue(value);
 }, delay);
 return () => {
 clearTimeout(handler);
 };
 }, [value, delay]);
 
 return debouncedValue;
}

interface AssignmentConflict {
 workerId: string;
 requestedWorkLocationId: string;
 requestedCrewId?: string;
 details?: unknown;
}

function AddWorkersModalHeader({
 crewName,
 onClose,
}: {
 crewName: string;
 onClose: () => void;
}) {
 return (
 <div className="flex items-center justify-between border-b border-border px-6 py-5 shrink-0 bg-card">
 <div className="flex items-center gap-3">
 <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
 <UsersRound className="size-5" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-foreground leading-tight">Agregar Trabajadores</h2>
 <p className="text-sm text-muted-foreground">
 Selecciona trabajadores disponibles para asignarlos a{" "}
 <span className="font-medium text-foreground">{crewName}</span>
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
 >
 <X className="size-5" />
 </button>
 </div>
 );
}

function AddWorkersModalFilters({
 activeTab,
 filteredCount,
 search,
 onSearchChange,
 onTabChange,
}: {
 activeTab: string;
 filteredCount: number;
 search: string;
 onSearchChange: (value: string) => void;
 onTabChange: (value: string) => void;
}) {
 return (
 <div className="p-6 pb-2 shrink-0 border-b border-border bg-card">
 <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-4">
 <WorkerSearchBar value={search} onChange={onSearchChange} />
 <div className="text-sm text-muted-foreground whitespace-nowrap">
 Mostrando <span className="font-medium text-foreground">{filteredCount}</span> trabajadores
 </div>
 </div>
 <WorkerFilterTabs activeTab={activeTab} onTabChange={onTabChange} />
 </div>
 );
}

function AssignmentConflictBanner({
 canReassign,
 crew,
 onIgnore,
 onReassign,
}: {
 canReassign: boolean;
 crew: WorkCrew;
 onIgnore: () => void;
 onReassign: () => void;
}) {
 return (
 <div className="mx-6 mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col gap-3">
 <div className="flex items-start gap-2.5">
 <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
 <div>
 <h4 className="text-sm font-bold text-foreground">Conflicto de Asignacion Detectado</h4>
 <p className="text-xs text-muted-foreground mt-1">
 El trabajador ya esta asignado a otra obra o cuadrilla.
 </p>
 <p className="text-[11px] text-muted-foreground mt-1">
 Origen: obra/cuadrilla actual. Destino solicitado: {crew.work_location_name} (Cuadrilla: {crew.name}).
 </p>
 </div>
 </div>

 <div className="flex justify-end gap-2 border-t border-amber-100 pt-3">
 <Button
 type="button"
 variant="secondary"
 onClick={onIgnore}
 className="h-8 px-3 text-xs border-border text-muted-foreground hover:bg-muted hover:text-foreground"
 >
 Ignorar
 </Button>

 {canReassign ? (
 <Button
 type="button"
 onClick={onReassign}
 className="h-8 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg"
 >
 Reasignar trabajador
 </Button>
 ) : (
 <p className="text-xs text-amber-700 font-medium self-center">
 Solo su supervisor actual, RR.HH. o un administrador puede moverlo.
 </p>
 )}
 </div>
 </div>
 );
}

function AddWorkersModalFooter({
 isPending,
 reason,
 selectedCount,
 onAssign,
 onClose,
 onReasonChange,
}: {
 isPending: boolean;
 reason: string;
 selectedCount: number;
 onAssign: () => void;
 onClose: () => void;
 onReasonChange: (value: string) => void;
}) {
 const selectedLabel = selectedCount === 1 ? "trabajador" : "trabajadores";

 return (
 <div className="border-t border-border p-6 flex flex-col sm:flex-row justify-between items-center bg-card shrink-0 gap-4">
 <div className="w-full sm:w-1/2">
 <Input
 placeholder="Motivo de asignacion (Ej. Refuerzo de obra)..."
 value={reason}
 onChange={(event) => onReasonChange(event.target.value)}
 className="w-full"
 />
 </div>

 <div className="flex gap-3 w-full sm:w-auto justify-end">
 <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
 Cancelar
 </Button>
 <Button
 type="button"
 disabled={selectedCount === 0 || isPending}
 onClick={onAssign}
 >
 {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
 {isPending ? "Asignando..." : `Asignar ${selectedCount} ${selectedLabel}`}
 </Button>
 </div>
 </div>
 );
}

interface AddWorkersToCrewModalProps {
 isOpen: boolean;
 onClose: () => void;
 crew: WorkCrew;
 existingWorkerIds: string[];
}

export function AddWorkersToCrewModal({
 isOpen,
 onClose,
 crew,
 existingWorkerIds,
}: AddWorkersToCrewModalProps) {
 const queryClient = useQueryClient();
 const [state, dispatch] = useReducer(addWorkersReducer, addWorkersInitialState);
 const { search, activeTab, selectedIds, reason, showConfirmDialog } = state;
 const debouncedSearch = useDebounce(search, 250);

 const { data: crewsData = [] } = useQuery({
 queryKey: ["work-crews"],
 queryFn: async () => {
 const data = await workCrewsService.getWorkCrews();
 return extractArray<WorkCrew>(data);
 },
 enabled: isOpen,
 });

 const {
 data: workersData = EMPTY_WORKERS,
 isLoading: isLoadingWorkers,
 } = useQuery({
 queryKey: ["workers-list", debouncedSearch],
 queryFn: async () => {
 const res = await workersService.list({ search: debouncedSearch, pageSize: 100 });
 return extractArray<WorkerRecord>(res);
 },
 enabled: isOpen,
 });

 const allWorkers = workersData;
 const crewId = crew.id;
 const crewSupervisorId = crew.supervisor_id;
 const crewWorkLocationId = crew.work_location_id;
 const crewWorkLocationName = crew.work_location_name;

 const supervisorIds = useMemo(() => {
 return new Set(crewsData.flatMap((crew) => (crew.supervisor_id ? [crew.supervisor_id] : [])));
 }, [crewsData]);

 // Local Filtering
 const filteredWorkers = useMemo(() => {
 // Exclude supervisors, admins, and HR roles, and anyone who is a supervisor of any crew
 let list = allWorkers.filter(w =>
 w.role !== "supervisor" &&
 w.role !== "admin" &&
 w.role !== "hr" &&
 w.role !== "super_admin" &&
 !supervisorIds.has(w.id) &&
 w.id !== crewSupervisorId &&
 w.user_id !== crewSupervisorId
 );

 // Tab filter
 if (activeTab === "available") {
 list = list.filter(w => {
 // Must not be already in this crew
 if (existingWorkerIds.includes(w.id)) return false;
 // Must not be in another crew
 if (w.crew_id && w.crew_id !== crewId) return false;
 // Must either have no project, or be on the same project
 const hasNoProject = !w.work_location_id && !w.project;
 const isOnSameProject =
 (w.work_location_id && w.work_location_id === crewWorkLocationId) ||
 (w.project && w.project === crewWorkLocationName);
 return hasNoProject || isOnSameProject;
 });
 } else if (activeTab === "assigned") {
 list = list.filter(w => {
 // Is in another crew
 if (w.crew_id && w.crew_id !== crewId) return true;
 // Is on a different project
 const hasDifferentProject =
 (w.work_location_id && w.work_location_id !== crewWorkLocationId) ||
 (w.project && w.project !== crewWorkLocationName);
 return !!hasDifferentProject;
 });
 }

 // Note: Search filter is handled server-side via React Query refetch,
 // but we can also do it locally to be snappy if the API returns 100 records
 if (search) {
 const lowerSearch = search.toLowerCase();
 list = list.filter(w => 
 w.fullName?.toLowerCase().includes(lowerSearch) || 
 w.email?.toLowerCase().includes(lowerSearch) ||
 w.position?.toLowerCase().includes(lowerSearch)
 );
 }

 return list;
 }, [allWorkers, activeTab, search, existingWorkerIds, crewId, crewSupervisorId, crewWorkLocationId, crewWorkLocationName, supervisorIds]);

 // Derived state for summary
 const selectedWorkers = useMemo(() => {
 return allWorkers.filter(w => selectedIds.has(w.id));
 }, [allWorkers, selectedIds]);

 const toggleWorker = (id: string) => {
 dispatch({ type: "toggleWorker", id });
 };

 const removeSelectedWorker = (id: string) => {
 dispatch({ type: "removeWorker", id });
 };

 const { data: profileData } = useQuery({
 queryKey: ["current-user-profile"],
 queryFn: () => profileService.get(),
 select: normalizeCurrentUserProfile,
 staleTime: 30 * 60 * 1000,
 enabled: isOpen,
 });

 const [assignmentConflict, setAssignmentConflict] = useState<AssignmentConflict | null>(null);
 const [isReassignOpen, setIsReassignOpen] = useState(false);

 const mutation = useMutation({
 mutationFn: () =>
 workCrewsService.addWorkersToCrew(crew.id, Array.from(selectedIds), reason || "Asignación inicial"),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["work-crews", crew.id, "workers"] });
 queryClient.invalidateQueries({ queryKey: ["work-crews"] });
 setAssignmentConflict(null);
 onClose();
 },
 onError: (error: any) => {
 const errorCode = getApiErrorCode(error);
 const details = getApiErrorDetails(error);

 if (errorCode === "WORKER_ALREADY_ASSIGNED") {
 const workerId = String(details?.workerId ?? details?.worker_id ?? Array.from(selectedIds)[0] ?? "");
 setAssignmentConflict({
 workerId,
 requestedWorkLocationId: crew.work_location_id ?? "",
 requestedCrewId: crew.id,
 details,
 });
 toast.warning("El trabajador ya está asignado a otra obra o cuadrilla.");
 return;
 }

 if (errorCode === "WORKER_ALREADY_IN_CREW") {
 toast.warning("El trabajador ya pertenece a esta cuadrilla.");
 return;
 }

 if (errorCode === "WORKER_REASSIGN_FORBIDDEN") {
 toast.error("No tienes permisos para mover este trabajador. Solo su supervisor actual, RR.HH. o un administrador puede hacerlo.");
 return;
 }

 const friendlyMessage = errorCode
 ? (WORKER_ASSIGNMENT_ERROR_MESSAGES[errorCode] || "Ocurrió un error al asignar los trabajadores.")
 : "Ocurrió un error al asignar los trabajadores.";
 toast.error(friendlyMessage);
 },
 });

 const handleAssignClick = () => {
 // Check if any selected worker has a conflict (assigned to a different project or different crew)
 const hasConflicts = selectedWorkers.some(w =>
 (w.work_location_id && w.work_location_id !== crew.work_location_id) ||
 (w.project && w.project !== crew.work_location_name) ||
 (w.crew_id && w.crew_id !== crew.id)
 );

 if (hasConflicts) {
 dispatch({ type: "setShowConfirmDialog", value: true });
 } else {
 mutation.mutate();
 }
 };

 const handleConfirmAssignment = () => {
 mutation.mutate();
 dispatch({ type: "setShowConfirmDialog", value: false });
 };

 if (!isOpen) return null;

 return (
 <>
 <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/60 p-4 backdrop-blur-sm">
 <div className="flex w-full max-w-4xl max-h-[85vh] flex-col rounded-2xl bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
 
 <AddWorkersModalHeader crewName={crew.name} onClose={onClose} />

 {/* Body */}
 <div className="flex-1 flex flex-col overflow-hidden bg-muted/50">
 <AddWorkersModalFilters
 activeTab={activeTab}
 filteredCount={filteredWorkers.length}
 search={search}
 onSearchChange={(value) => dispatch({ type: "setSearch", value })}
 onTabChange={(value) => dispatch({ type: "setActiveTab", value })}
 />

 {assignmentConflict ? (
 <AssignmentConflictBanner
 canReassign={canReassignWorker(profileData)}
 crew={crew}
 onIgnore={() => setAssignmentConflict(null)}
 onReassign={() => setIsReassignOpen(true)}
 />
 ) : null}

 {/* List */}
 <AvailableWorkersList 
 workers={filteredWorkers}
 isLoading={isLoadingWorkers}
 selectedIds={selectedIds}
 onToggleWorker={toggleWorker}
 existingWorkerIds={existingWorkerIds}
 crew={crew}
 />

 {/* Summary */}
 <SelectedWorkersSummary 
 selectedWorkers={selectedWorkers}
 onRemove={removeSelectedWorker}
 />
 </div>

 <AddWorkersModalFooter
 isPending={mutation.isPending}
 reason={reason}
 selectedCount={selectedIds.size}
 onAssign={handleAssignClick}
 onClose={onClose}
 onReasonChange={(value) => dispatch({ type: "setReason", value })}
 />
 </div>
 </div>

 {/* Confirmation Dialog */}
 <ConfirmAssignmentDialog
 isOpen={showConfirmDialog}
 onClose={() => dispatch({ type: "setShowConfirmDialog", value: false })}
 onConfirm={handleConfirmAssignment}
 isPending={mutation.isPending}
 conflictCount={selectedWorkers.filter(w =>
 (w.work_location_id && w.work_location_id !== crew.work_location_id) ||
 (w.project && w.project !== crew.work_location_name) ||
 (w.crew_id && w.crew_id !== crew.id)
 ).length}
 />

 {isReassignOpen && assignmentConflict && (
 <WorkerReassignModal
 isOpen={isReassignOpen}
 onClose={() => setIsReassignOpen(false)}
 workerId={assignmentConflict.workerId}
 targetWorkLocationId={assignmentConflict.requestedWorkLocationId}
 targetCrewId={assignmentConflict.requestedCrewId}
 onSuccess={() => {
 setAssignmentConflict(null);
 dispatch({ type: "removeWorker", id: assignmentConflict.workerId });
 queryClient.invalidateQueries({ queryKey: ["work-crews", crew.id, "workers"] });
 queryClient.invalidateQueries({ queryKey: ["work-crews"] });
 onClose();
 }}
 />
 )}
 </>
 );
}
