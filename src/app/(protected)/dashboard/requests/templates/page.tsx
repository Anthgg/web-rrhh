import { Suspense } from "react";

import { RequestsWorkspace } from "@/features/requests/requests-workspace";

export default function RequestTemplatesPage() {
 return (
 <Suspense fallback={null}>
 <RequestsWorkspace section="templates" />
 </Suspense>
 );
}
