import type { BookingView } from "../types/workflows";
// Only the isolated /demo tree uses this local simulator. Production transitions belong to BE2.
export function confirmDemoSide(
  booking: BookingView,
  participant: "borrower" | "lender",
  stage: "pickup" | "return",
): BookingView {
  if (stage === "pickup" && booking.status !== "accepted") return booking;
  if (
    stage === "return" &&
    !["active", "return_pending"].includes(booking.status)
  )
    return booking;
  const key = `${participant}${stage === "pickup" ? "Pickup" : "Return"}` as
    "borrowerPickup" | "lenderPickup" | "borrowerReturn" | "lenderReturn";
  const next = { ...booking, [key]: true };
  if (stage === "pickup" && next.borrowerPickup && next.lenderPickup)
    next.status = "active";
  if (stage === "return")
    next.status =
      next.borrowerReturn && next.lenderReturn ? "completed" : "return_pending";
  return next;
}
