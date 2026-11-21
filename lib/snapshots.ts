import fs from "fs";
import path from "path";
import os from "os";

export type Snapshot = {
  rwa_id: number;
  token_id: number;
  price: number;
  premium_pct: number;
  volume_24h: number | null;
  timestamp: string;
};

function dir(): string {
  const local = path.join(process.cwd(), "data", "snapshots");
  try {
    fs.mkdirSync(local, { recursive: true });
    fs.accessSync(local, fs.constants.W_OK);
    return local;
  } catch {
    const tmp = path.join(os.tmpdir(), "wrapwise-snapshots");
    fs.mkdirSync(tmp, { recursive: true });
    return tmp;
  }
}

function fileFor(symbol: string): string {
  return path.join(dir(), `${symbol.replace(/[^A-Z0-9]/g, "")}.json`);
}

export function readSnapshots(symbol: string): Snapshot[] {
  try {
    const rows = JSON.parse(fs.readFileSync(fileFor(symbol), "utf8")) as Snapshot[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

const HOUR = 60 * 60 * 1000;

export function appendSnapshots(symbol: string, rows: Snapshot[]) {
  if (!rows.length) return;
  const existing = readSnapshots(symbol);
  const next = [...existing];
  for (const row of rows) {
    const prev = [...next].reverse().find((item) => item.token_id === row.token_id);
    if (prev && Date.now() - Date.parse(prev.timestamp) < HOUR) continue;
    next.push(row);
  }
  const cutoff = Date.now() - 8 * 24 * HOUR;
  const trimmed = next.filter((row) => Date.parse(row.timestamp) >= cutoff);
  try {
    fs.writeFileSync(fileFor(symbol), JSON.stringify(trimmed));
  } catch {
    // history is optional until the disk is writable
  }
}
