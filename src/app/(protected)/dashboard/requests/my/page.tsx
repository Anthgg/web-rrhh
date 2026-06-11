import { Suspense } from "react";

import { RequestsWorkspace } from "@/features/requests/requests-workspace";

export default function MyRequestsPage() {
 return (
 <Suspense fallback={null}>
 <RequestsWorkspace section="my-requests" />
 </Suspense>
 );
}
