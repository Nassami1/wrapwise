import fs from "fs";
import path from "path";

type Hit = { exp: number; value: unknown };
const mem = new Map<string, Hit>();

export function readCache<T>(key: string): T | null {
  const hit = mem.get(key);
  if (!hit || hit.exp <= Date.now()) return null;
  return hit.value as T;
}

export function writeCache(key: string, value: unknown, ttlMs: number) {
  mem.set(key, { exp: Date.now() + ttlMs, value });
}

function cacheDir(): string {
  return path.join(process.cwd(), "data", "cache");
}

export function readDisk<T>(name: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(cacheDir(), name), "utf8")) as T;
  } catch {
    return null;
  }
}

export function writeDisk(name: string, value: unknown) {
  try {
    fs.mkdirSync(cacheDir(), { recursive: true });
    fs.writeFileSync(path.join(cacheDir(), name), JSON.stringify(value));
  } catch {
    // serverless disk can be read-only; memory cache still works
  }
}
