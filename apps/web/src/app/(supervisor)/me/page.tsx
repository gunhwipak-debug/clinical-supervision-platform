import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../lib/auth/current-user";

export default async function CurrentUserRedirectPage() {
  const current = await getCurrentUser();

  if (!current) {
    redirect("/login?returnTo=/me");
  }

  if (current.user.role === "admin") {
    redirect("/settings");
  }

  if (current.user.role === "supervisor") {
    redirect("/supervisor");
  }

  redirect("/requests");
}
