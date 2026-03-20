import { redirect } from "next/navigation";

/** @deprecated Use /refunds */
export default function RefundPolicyRedirect() {
  redirect("/refunds");
}
