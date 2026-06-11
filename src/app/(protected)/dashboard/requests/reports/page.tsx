import { Suspense } from "react";

import { RequestsWorkspace } from "@/features/requests/requests-workspace";

export default function RequestReportsPage() {
 return (
 <Suspense fallback={null}>
 <RequestsWorkspace section="reports" />
 </Suspense>
 );
}
