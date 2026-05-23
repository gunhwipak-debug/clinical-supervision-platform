import { redirect } from "next/navigation";

export default function LegacyPayoutsRedirect() {
  redirect("/admin/payouts");
}
