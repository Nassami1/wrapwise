import fs from "fs";
import os from "os";
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

function bundledDir(): string {
  return path.join(process.cwd(), "data", "cache");
}

let diskDir: string | null = null;

function writableDir(): string {
  if (diskDir) return diskDir;
  const candidates = [bundledDir(), path.join(os.tmpdir(), "wrapwise-cache")];
  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      diskDir = dir;
      return dir;
    } catch {
      // try the next candidate
    }
  }
  diskDir = candidates[1];
  try {
    fs.mkdirSync(diskDir, { recursive: true });
  } catch {
    // last resort: memory cache still works
  }
  return diskDir;
}

export function readDisk<T>(name: string): T | null {
  for (const dir of [bundledDir(), writableDir()]) {
    try {
      return JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")) as T;
    } catch {
      // try the next location
    }
  }
  return null;
}

export function writeDisk(name: string, value: unknown) {
  try {
    const dir = writableDir();
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), JSON.stringify(value));
  } catch {
    // serverless disk can be read-only; memory cache still works
  }
}
