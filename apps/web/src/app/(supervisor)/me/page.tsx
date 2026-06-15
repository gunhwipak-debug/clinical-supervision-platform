import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../lib/auth/current-user";

export default async function CurrentUserRedirectPage() {
  const current = await getCurrentUser();

  if (!current) {
    redirect("/login?returnTo=/me");
  }

  if (current.user.role === "admin") {
    redirect(adminConsoleUrl() as never);
  }

  if (current.user.role === "supervisor") {
    redirect("/supervisor");
  }

  redirect("/requests");
}

function adminConsoleUrl(): string {
  const origin =
    process.env["NEXT_PUBLIC_ADMIN_APP_URL"] ??
    process.env["NEXT_PUBLIC_ADMIN_URL"] ??
    "https://clinicflow-admin-six.vercel.app";
  return `${origin.replace(/\/$/u, "")}/admin`;
}
