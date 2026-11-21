import assert from "node:assert/strict";
import test from "node:test";
import { cmcUrlFor } from "./cmc-url.ts";
import {
  anchorPrice,
  extraCostVs,
  fairnessRaw,
  fairValueReceived,
  issuerRaw,
  liquidityRaw,
  normalizeToOunce,
  pickBest,
  historySeries,
  premiumPct,
  scoreWrapper,
  stabilityOf,
} from "./scoring.ts";

test("fairness matches the published scale", () => {
  assert.equal(fairnessRaw(0), 40);
  assert.equal(fairnessRaw(1), 30);
  assert.equal(fairnessRaw(-1), 30);
  assert.equal(fairnessRaw(4), 0);
  assert.equal(fairnessRaw(6), 0);
});

test("anchor prefers the CMC aggregate, else the median", () => {
  assert.equal(anchorPrice(10, [1, 2, 3]), 10);
  assert.equal(anchorPrice(null, [1, 3, 9]), 3);
  assert.equal(anchorPrice(undefined, [1, 3]), 2);
});

test("large issuers score above 20 and token count cannot carry the score", () => {
  assert.ok(issuerRaw(6.35e8, 2.7e9, 2) > 20);
  assert.ok(issuerRaw(2.48e8, 1.9e9, 1) > 20);
  assert.ok(issuerRaw(8e6, 3.8e7, 592) > 20);
  assert.ok(issuerRaw(1e8, 1e8, 1218) > 20);
  assert.ok(issuerRaw(0, 0, 322) < issuerRaw(6.35e8, 2.7e9, 2));
  assert.ok(issuerRaw(0, 0, 322) <= 4);
});

test("per-gram gold prices convert to ounces before premium", () => {
  const anchor = 3577.378814062838;
  const cgo = normalizeToOunce(115.05407046130885, anchor, "CGO");
  const vnx = normalizeToOunce(118.10023279478135, anchor, "VNXAU");
  const paxg = normalizeToOunce(3575.942844173954, anchor, "PAXG");
  assert.equal(cgo.normalized, true);
  assert.equal(vnx.normalized, true);
  assert.equal(paxg.normalized, false);
  assert.ok(Math.abs(cgo.price - 3578.6) < 1);
  assert.ok(Math.abs(vnx.price - 3673.3) < 1);
  for (const price of [cgo.price, vnx.price, paxg.price]) {
    const premium = premiumPct(price, anchor);
    const received = fairValueReceived(1000, price, anchor);
    assert.ok(premium != null && Math.abs(premium) < 5);
    assert.ok(received != null && received > 950 && received < 1050);
  }
});

test("missing volume does not score liquidity", () => {
  assert.equal(liquidityRaw(null, 1_000_000), 0);
  assert.ok(liquidityRaw(100_000_000, null) > liquidityRaw(10_000, null));
});

test("dollar gap scales with the amount", () => {
  const at1k = extraCostVs(1000, 110, 100, 100);
  const at5k = extraCostVs(5000, 110, 100, 100);
  assert.ok(at1k != null && at5k != null);
  assert.ok(Math.abs(at5k - at1k * 5) < 1e-9);
});

test("low volume is excluded from Best; volatile is only a flag", () => {
  const low = scoreWrapper({
    price: 100,
    anchor: 100,
    volume24h: 500,
    marketCap: 1000,
    issuerTokens: 10,
    issuerVolume: 500,
    issuerMarketCap: 1000,
    quoteUpdated: new Date().toISOString(),
    now: Date.now(),
    checkStale: true,
    historyPremiums: [],
  });
  assert.ok(low.excluded);
  assert.ok(low.flags.includes("Low liquidity"));

  const volatile = scoreWrapper({
    price: 100,
    anchor: 100,
    volume24h: 50_000,
    marketCap: 1_000_000,
    issuerTokens: 10,
    issuerVolume: 50_000,
    issuerMarketCap: 1_000_000,
    quoteUpdated: new Date().toISOString(),
    now: Date.now(),
    checkStale: true,
    historyPremiums: [-1.2, 1.2],
  });
  assert.equal(volatile.stability, "Volatile");
  assert.equal(volatile.excluded, false);
  assert.equal(volatile.total, volatile.fairness + volatile.liquidity + volatile.issuer);
});

test("a single wrapper is never Best", () => {
  const row = { excluded: false, total: 90, price: 1 };
  assert.equal(pickBest([row]), null);
});

test("history keeps a real snapshot and the live premium", () => {
  assert.deepEqual(historySeries([1.2], 0.4), [1.2, 0.4]);
  assert.deepEqual(historySeries([], null), []);
  assert.deepEqual(historySeries([0.2], null), [0.2]);
});

test("CMC links use the verified gold map or an API slug", () => {
  assert.equal(cmcUrlFor("GOLD", "XAUt", "tether-gold"), "https://coinmarketcap.com/currencies/tether-gold/");
  assert.equal(cmcUrlFor("GOLD", "XAU", "gold-derivatives"), null);
  assert.equal(cmcUrlFor("NVDA", "NVDAX", "nvidia-tokenized-stock-xstock"), "https://coinmarketcap.com/currencies/nvidia-tokenized-stock-xstock/");
  assert.equal(cmcUrlFor("NVDA", "NVDAX", ""), null);
  assert.equal(cmcUrlFor("NVDA", "NVDAX", null), null);
  assert.equal(cmcUrlFor("SPY", "SPY", "SPY guess"), null);
});

test("stability bands", () => {
  assert.equal(stabilityOf([0, 0.9]), "Stable");
  assert.equal(stabilityOf([0, 1]), "Moderate");
  assert.equal(stabilityOf([0, 2]), "Volatile");
});
