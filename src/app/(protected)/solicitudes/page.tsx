import { redirect } from "next/navigation";

export default function LegacyRequestsPage() {
 redirect("/dashboard/requests");
}
