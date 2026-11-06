import { describe, expect, it } from "vitest";
import { canTransfer, cleanAmount, formatCents, formatMoney, groupTyped, hasAmount, instantFee, overTransferLimit, standardTransferArrival, toCents } from "@/components/venmo/amount";

describe("payment amount entry", () => {
  it("keeps whole dollars as typed", () => {
    expect(cleanAmount("1")).toBe("1");
  });

  it("allows at most two decimals", () => {
    expect(cleanAmount("1.239")).toBe("1.23");
  });

  it("ignores a second decimal point", () => {
    expect(cleanAmount("1..5.")).toBe("1.5");
  });

  it("drops a leading zero before whole dollars", () => {
    expect(cleanAmount("05")).toBe("5");
  });

  it("only lets you pay more than $0", () => {
    expect(hasAmount("0")).toBe(false);
    expect(hasAmount("")).toBe(false);
    expect(hasAmount("1")).toBe(true);
  });
});

describe("adding money to the Venmo balance", () => {
  it("adds $2.50 to an $8.00 balance to make $10.50", () => {
    expect(formatCents(800 + toCents("2.50"))).toBe("10.50");
  });

  it("treats an empty amount as $0", () => {
    expect(toCents("")).toBe(0);
  });
});

describe("transferring the Venmo balance to a bank", () => {
  it("allows $299.99 out of a $433.58 balance", () => {
    expect(canTransfer(toCents("299.99"), 43358)).toBe(true);
  });

  it("allows transferring the whole balance", () => {
    expect(canTransfer(43358, 43358)).toBe(true);
  });

  it("blocks more than the balance", () => {
    expect(canTransfer(43359, 43358)).toBe(false);
  });

  it("blocks $0", () => {
    expect(canTransfer(0, 43358)).toBe(false);
  });
});

describe("standard bank transfer", () => {
  it("arrives 3 business days later, skipping the weekend", () => {
    // Thursday, Nov 5 2026 → Tuesday, Nov 10 2026
    expect(standardTransferArrival(new Date(2026, 10, 5))).toBe("Tuesday, Nov 10th");
  });

  it("from a Monday arrives on Thursday", () => {
    expect(standardTransferArrival(new Date(2026, 1, 2))).toBe("Thursday, Feb 5th");
  });

  it("can't transfer more than the balance", () => {
    expect(canTransfer(2600, 2500)).toBe(false);
    expect(canTransfer(2500, 2500)).toBe(true);
  });
});

describe("transfer balance limits and fees", () => {
  it("allows a single bank transfer up to $4,999.99", () => {
    expect(overTransferLimit(toCents("4999.99"))).toBe(false);
    expect(overTransferLimit(toCents("5000"))).toBe(true);
  });

  it("caps the instant fee at $25.00 on a $21,894.03 transfer", () => {
    expect(instantFee(2189403)).toBe(2500);
    expect(formatMoney(2189403 - instantFee(2189403))).toBe("21,869.03");
  });

  it("charges at least $0.25 for an instant transfer", () => {
    expect(instantFee(100)).toBe(25);
  });

  it("transferring $4,999 from $21,894.03 leaves $16,895.03", () => {
    expect(formatMoney(2189403 - toCents("4999"))).toBe("16,895.03");
  });

  it("groups typed dollars with commas", () => {
    expect(groupTyped("4999")).toBe("4,999");
    expect(groupTyped("21894.03")).toBe("21,894.03");
  });
});
