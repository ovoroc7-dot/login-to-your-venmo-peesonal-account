import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  balanceCovers,
  completeOutgoingRequest,
  createRequest,
  dueRequests,
  EMPTY_WALLET,
  inFeed,
  parseWallet,
  payIncomingRequest,
  removeRequest,
  sendsAsPending,
  setAllPastPrivacy,
  setTransactionPrivacy,
  type PendingRequest,
  type Transaction,
  type Wallet,
} from "@/components/venmo/wallet";

const tx = (t: Partial<Transaction> & Pick<Transaction, "kind" | "cents">): Transaction => ({
  id: Math.random().toString(36),
  counterparty: "Bank of America ••9269",
  at: "2026-11-06T00:00:00.000Z",
  ...t,
});

const withBalance = (balance: number, extra: Partial<Wallet> = {}): Wallet => ({ ...EMPTY_WALLET, balance, ...extra });

const incoming: PendingRequest = {
  id: "in1",
  direction: "incoming",
  cents: 1250,
  counterparty: "Barbara Nace",
  note: "Pizza",
  privacy: "Friends",
  at: "2026-11-06T00:00:00.000Z",
};

describe("Venmo balance", () => {
  it("adds up every time money is added", () => {
    let w = applyTransaction(EMPTY_WALLET, tx({ kind: "add", cents: 1000 }));
    w = applyTransaction(w, tx({ kind: "add", cents: 250 }));
    expect(w.balance).toBe(1250);
    expect(w.transactions).toHaveLength(2);
  });

  it("goes down when money is transferred to a bank", () => {
    const w = applyTransaction(withBalance(5000), tx({ kind: "transfer", cents: 2000 }));
    expect(w.balance).toBe(3000);
  });

  it("goes down when a payment is sent from the Venmo balance", () => {
    const w = applyTransaction(withBalance(5000), tx({ kind: "payment", cents: 1500, fromBalance: true }));
    expect(w.balance).toBe(3500);
  });

  it("stays the same when a payment is paid from a bank", () => {
    const w = applyTransaction(withBalance(5000), tx({ kind: "payment", cents: 1500, fromBalance: false }));
    expect(w.balance).toBe(5000);
    expect(w.transactions).toHaveLength(1);
  });

  it("refuses to transfer more than the balance", () => {
    const start = withBalance(1000);
    expect(applyTransaction(start, tx({ kind: "transfer", cents: 1001 }))).toBe(start);
  });

  it("only lets the balance pay when it covers the full amount", () => {
    expect(balanceCovers(1000, 1000)).toBe(true);
    expect(balanceCovers(1001, 1000)).toBe(false);
  });

  it("keeps the saved balance after reopening the app", () => {
    let w = applyTransaction(EMPTY_WALLET, tx({ kind: "add", cents: 4200 }));
    w = parseWallet(JSON.stringify(w));
    expect(w.balance).toBe(4200);
    expect(w.transactions[0]?.kind).toBe("add");
  });

  it("starts at $0 when saved data is damaged", () => {
    expect(parseWallet("{not json").balance).toBe(0);
  });
});

describe("Requests", () => {
  const sent = createRequest(
    withBalance(0),
    { id: "r1", cents: 1500, counterparty: "tyler nace", note: "Tickets", privacy: "Public", at: "2026-11-06T00:00:00.000Z" },
    15_000,
  );

  it("a sent request waits as pending and does not change the balance", () => {
    expect(sent.balance).toBe(0);
    expect(sent.requests[0]?.direction).toBe("outgoing");
    expect(sent.transactions).toHaveLength(0);
  });

  it("the friend pays 15 seconds after the request", () => {
    expect(dueRequests(sent, new Date("2026-11-06T00:00:14.000Z").getTime())).toHaveLength(0);
    expect(dueRequests(sent, new Date("2026-11-06T00:00:15.000Z").getTime())).toHaveLength(1);
  });

  it("when the friend pays, the money is added to the balance and the request is completed", () => {
    const w = completeOutgoingRequest(sent, "r1", "t1", "2026-11-06T00:00:15.000Z");
    expect(w.balance).toBe(1500);
    expect(w.requests).toHaveLength(0);
    expect(w.transactions[0]).toMatchObject({ kind: "received", charge: true, privacy: "Public", counterparty: "tyler nace" });
  });

  it("canceling a request removes it without moving money", () => {
    const w = removeRequest(sent, "r1");
    expect(w.requests).toHaveLength(0);
    expect(w.balance).toBe(0);
  });

  it("paying a friend's request from the Venmo balance takes it out of the balance", () => {
    const w = payIncomingRequest(withBalance(2000, { requests: [incoming] }), "in1", true, "t2", incoming.at);
    expect(w.balance).toBe(750);
    expect(w.requests).toHaveLength(0);
    expect(w.transactions[0]).toMatchObject({ kind: "payment", charge: true, privacy: "Friends" });
  });

  it("refuses to pay a friend's request from a balance that can't cover it", () => {
    const start = withBalance(1000, { requests: [incoming] });
    expect(payIncomingRequest(start, "in1", true, "t3", incoming.at)).toBe(start);
  });

  it("paying a friend's request from the bank leaves the balance alone", () => {
    const w = payIncomingRequest(withBalance(1000, { requests: [incoming] }), "in1", false, "t4", incoming.at);
    expect(w.balance).toBe(1000);
    expect(w.requests).toHaveLength(0);
  });
});

describe("Privacy and the feed", () => {
  it("only payments between people show in the Home feed, not adds or bank transfers", () => {
    expect(inFeed(tx({ kind: "payment", cents: 100 }))).toBe(true);
    expect(inFeed(tx({ kind: "received", cents: 100 }))).toBe(true);
    expect(inFeed(tx({ kind: "add", cents: 100 }))).toBe(false);
    expect(inFeed(tx({ kind: "transfer", cents: 100 }))).toBe(false);
  });

  it("a payment's privacy can be changed afterwards", () => {
    const w = setTransactionPrivacy(
      withBalance(0, { transactions: [tx({ id: "p1", kind: "payment", cents: 100, privacy: "Public" })] }),
      "p1",
      "Private",
    );
    expect(w.transactions[0]?.privacy).toBe("Private");
  });

  it("Change All to Friends only narrows public payments; private ones stay private", () => {
    const w = setAllPastPrivacy(
      withBalance(0, {
        transactions: [
          tx({ id: "a", kind: "payment", cents: 100, privacy: "Public" }),
          tx({ id: "b", kind: "payment", cents: 100, privacy: "Private" }),
        ],
      }),
      "Friends",
    );
    expect(w.transactions.map((t) => t.privacy)).toEqual(["Friends", "Private"]);
  });

  it("the default privacy is Private and is remembered", () => {
    expect(parseWallet(null).defaultPrivacy).toBe("Private");
    expect(parseWallet(JSON.stringify({ ...EMPTY_WALLET, defaultPrivacy: "Friends" })).defaultPrivacy).toBe("Friends");
  });
});

describe("Large payments stay Pending", () => {
  it("a $1,550.00 payment is saved as Pending", () => {
    const w = applyTransaction(withBalance(200_000), tx({ kind: "payment", cents: 155_000, fromBalance: true }));
    expect(w.transactions[0]?.pending).toBe(true);
  });

  it("a $1,549.99 payment completes normally", () => {
    const w = applyTransaction(withBalance(200_000), tx({ kind: "payment", cents: 154_999, fromBalance: true }));
    expect(w.transactions[0]?.pending).toBeUndefined();
  });

  it("a pending payment's money still leaves the Venmo balance", () => {
    const w = applyTransaction(withBalance(200_000), tx({ kind: "payment", cents: 160_000, fromBalance: true }));
    expect(w.balance).toBe(40_000);
  });

  it("paying a friend's $2,000 request also goes Pending", () => {
    const w = payIncomingRequest(
      withBalance(0, { requests: [{ ...incoming, cents: 200_000 }] }),
      "in1",
      false,
      "t1",
      "2026-11-07T00:00:00.000Z",
    );
    expect(w.transactions[0]?.pending).toBe(true);
  });

  it("money added or received is never Pending, whatever the amount", () => {
    expect(sendsAsPending({ kind: "add", cents: 500_000 })).toBe(false);
    expect(sendsAsPending({ kind: "received", cents: 500_000 })).toBe(false);
  });

  it("a pending payment is still Pending after reopening the app", () => {
    const w = applyTransaction(withBalance(200_000), tx({ kind: "payment", cents: 155_000, fromBalance: true }));
    expect(parseWallet(JSON.stringify(w)).transactions[0]?.pending).toBe(true);
  });
});
