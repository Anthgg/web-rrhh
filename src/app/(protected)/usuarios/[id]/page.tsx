import { UserDetailPage } from "@/features/users/user-detail-page";

interface UserDetailRouteProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function UserDetailRoute({ params }: UserDetailRouteProps) {
  const { id } = await params;
  return <UserDetailPage userId={id} />;
}
