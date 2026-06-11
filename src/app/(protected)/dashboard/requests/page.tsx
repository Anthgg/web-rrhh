import { redirect } from "next/navigation";

export default function RequestsIndexPage() {
 redirect("/dashboard/requests/my");
}
