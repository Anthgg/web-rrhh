import { backendRequest } from "@/lib/api/backend-client";
import { normalizeWorkerRecord } from "@/lib/api/normalizers";
import { getSessionContext } from "@/lib/api/session-context";
import { handleRouteError, jsonResponse } from "@/lib/api/server-utils";
import { isUuid } from "@/lib/api/worker-ids";

const paths = (workerId: string) => [
 `/api/workers/${workerId}/labor-info`,
 `/api/workers/${workerId}/labor-assignment`,
 `/api/workers/${workerId}`,
 `/api/admin/workers/${workerId}/labor-info`,
];

export async function PUT(request: Request, props: { params: Promise<{ workerId: string }> }) {
 try {
 const { workerId } = await props.params;
 if (!isUuid(workerId)) {
 return jsonResponse(
 {
 message:
 "Este registro todavia no tiene un ID de trabajador valido. Usa completar perfil para crear o vincular el trabajador.",
 status: 400,
 },
 400,
 );
 }

 const context = await getSessionContext();
 const body = await request.json();
 const response = await backendRequest({
 pathCandidates: paths(workerId),
 method: "PUT",
 accessToken: context.accessToken,
 refreshToken: context.refreshToken,
 body: {
 dni: body.dni,
 personal_id: body.dni,
 full_name: body.fullName,
 email: body.email,
 phone: body.phone,
 address: body.address,
 company: body.company,
 internal_department_id: body.departmentId,
 department_id: body.departmentId,
 area_id: body.areaId,
 position_id: body.positionId,
 worker_type: body.workerType,
 hire_date: body.hireDate,
 labor_status: body.laborStatus,
 work_location_id: body.workLocationId,
 crew_id: body.crewId,
 supervisor_id: body.supervisorId,
 attendance_radius_meters: body.attendanceRadius,
 },
 });

 return jsonResponse(normalizeWorkerRecord(response.data));
 } catch (error) {
 return handleRouteError(error);
 }
}
