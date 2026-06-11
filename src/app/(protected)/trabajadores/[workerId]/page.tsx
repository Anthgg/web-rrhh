import { WorkerProfilePage } from "@/features/workers/worker-profile-page";

export default async function Page({
 params,
}: {
 params: Promise<{ workerId: string }>;
}) {
 const { workerId } = await params;

 return <WorkerProfilePage workerId={workerId} />;
}
