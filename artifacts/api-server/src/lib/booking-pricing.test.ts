import { describe, expect, it } from "vitest";
import { calculateBookingPrice, isCarAvailable } from "./booking-pricing";

describe("calculateBookingPrice", () => {
  it("computes the basic 1-day rental with 12% service fee", () => {
    const r = calculateBookingPrice({
      pricePerDay: 1000,
      cleaningFee: 0,
      depositAmount: 0,
      startDate: "2026-05-01",
      endDate: "2026-05-02",
      insuranceAdded: false,
    });
    expect(r.days).toBe(1);
    expect(r.subtotal).toBe(1000);
    expect(r.serviceFee).toBe(120);
    expect(r.totalAmount).toBe(1120);
  });

  it("adds 18% per-day insurance only when toggled", () => {
    const off = calculateBookingPrice({
      pricePerDay: 1000, cleaningFee: 0, depositAmount: 0,
      startDate: "2026-05-01", endDate: "2026-05-04",
      insuranceAdded: false,
    });
    const on = calculateBookingPrice({
      pricePerDay: 1000, cleaningFee: 0, depositAmount: 0,
      startDate: "2026-05-01", endDate: "2026-05-04",
      insuranceAdded: true,
    });
    expect(off.insuranceFee).toBe(0);
    expect(on.insuranceFee).toBe(540); // 1000 * 0.18 * 3
    expect(on.totalAmount - off.totalAmount).toBe(540);
  });

  it("never returns less than 1 day even for zero-duration ranges", () => {
    const r = calculateBookingPrice({
      pricePerDay: 500, cleaningFee: 0, depositAmount: 0,
      startDate: "2026-05-01", endDate: "2026-05-01",
      insuranceAdded: false,
    });
    expect(r.days).toBe(1);
  });

  it("splits hostReceives = subtotal + cleaning + delivery, platform = service + insurance", () => {
    const r = calculateBookingPrice({
      pricePerDay: 1000, cleaningFee: 200, depositAmount: 0,
      startDate: "2026-05-01", endDate: "2026-05-03",
      insuranceAdded: true, deliveryFee: 150,
    });
    // subtotal 2000 + cleaning 200 + delivery 150 + service 240 + insurance 360 = 2950
    expect(r.totalAmount).toBe(2950);
    expect(r.platformFee).toBe(600); // 240 + 360
    expect(r.hostReceives).toBe(2350); // 2000 + 200 + 150
  });
});

describe("isCarAvailable", () => {
  it("returns true when no blocked dates overlap", () => {
    expect(isCarAvailable(["2026-06-01", "2026-06-02"], "2026-05-15", "2026-05-18")).toBe(true);
  });

  it("returns false when a blocked date falls inside the range", () => {
    expect(isCarAvailable(["2026-05-16"], "2026-05-15", "2026-05-18")).toBe(false);
  });

  it("returns true on empty input", () => {
    expect(isCarAvailable([], "2026-05-15", "2026-05-18")).toBe(true);
  });

  it("ignores garbage entries instead of throwing", () => {
    expect(isCarAvailable(["not-a-date", "2026-06-01"], "2026-05-15", "2026-05-18")).toBe(true);
  });
});
