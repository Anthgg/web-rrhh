"use client";

import { useParams } from "next/navigation";

import { RequestDetailView } from "@/features/requests/request-detail-view";

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = params?.id as string;

  return <RequestDetailView requestId={requestId} />;
}
