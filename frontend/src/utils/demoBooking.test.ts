import { describe, expect, it } from "vitest";
import { confirmDemoSide } from "./demoBooking";
import type { BookingView } from "../types/workflows";

const booking: BookingView = {
  id: "test",
  title: "Calculator",
  category: "Study",
  art: "calculator",
  owner: "A",
  borrower: "B",
  role: "borrower",
  status: "accepted",
  start: "2026-11-15",
  due: "2026-11-16",
  pickup: "Sample",
  price: 0,
  deposit: 0,
  borrowerPickup: false,
  lenderPickup: false,
  borrowerReturn: false,
  lenderReturn: false,
};
describe("isolated two-participant demo", () => {
  it("requires both pickup confirmations before becoming active", () => {
    const first = confirmDemoSide(booking, "borrower", "pickup");
    expect(first.status).toBe("accepted");
    expect(first.lenderPickup).toBe(false);
    expect(confirmDemoSide(first, "lender", "pickup").status).toBe("active");
  });
  it("does not complete a return until the other student agrees", () => {
    const active = {
      ...booking,
      status: "active" as const,
      borrowerPickup: true,
      lenderPickup: true,
    };
    const first = confirmDemoSide(active, "borrower", "return");
    expect(first.status).toBe("return_pending");
    expect(first.lenderReturn).toBe(false);
    expect(confirmDemoSide(first, "lender", "return").status).toBe("completed");
  });
  it("rejects return before pickup and does not mutate the original", () => {
    expect(confirmDemoSide(booking, "borrower", "return")).toBe(booking);
    confirmDemoSide(booking, "borrower", "pickup");
    expect(booking.borrowerPickup).toBe(false);
  });
  it("does not revive a declined or completed booking", () => {
    expect(
      confirmDemoSide({ ...booking, status: "rejected" }, "lender", "pickup")
        .status,
    ).toBe("rejected");
    expect(
      confirmDemoSide({ ...booking, status: "completed" }, "borrower", "return")
        .status,
    ).toBe("completed");
  });
});
