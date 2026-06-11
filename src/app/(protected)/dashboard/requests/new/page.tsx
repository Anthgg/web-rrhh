import { Suspense } from "react";

import { RequestsWorkspace } from "@/features/requests/requests-workspace";

export default function NewRequestPage() {
 return (
 <Suspense fallback={null}>
 <RequestsWorkspace section="new-request" />
 </Suspense>
 );
}
