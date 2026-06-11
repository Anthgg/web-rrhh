import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
 title: "FABRYOR - Portal",
 description: "Portal administrativo.",
};

export default function HomePage() {
 redirect("/dashboard");
}
