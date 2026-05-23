import { redirect } from "next/navigation";

export default function VerifyEmailLegacyPage() {
  redirect("/email/verify");
}
