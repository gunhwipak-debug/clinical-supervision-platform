import { redirect } from "next/navigation";

export default function LegacyRefundsRedirect() {
  redirect("/admin/refunds");
}
