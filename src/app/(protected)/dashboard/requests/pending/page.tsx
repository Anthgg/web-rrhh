import { Suspense } from "react";

import { RequestsWorkspace } from "@/features/requests/requests-workspace";

export default function PendingRequestsPage() {
 return (
 <Suspense fallback={null}>
 <RequestsWorkspace section="pending-requests" />
 </Suspense>
 );
}
