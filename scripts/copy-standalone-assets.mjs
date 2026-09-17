#!/usr/bin/env node
/**
 * Next.js `output: 'standalone'` does not copy `public/` or `.next/static`
 * into the standalone tree (CDN is assumed). Copy them so
 * `node .next/standalone/server.js` can serve `/globe/earth-blue-marble.jpg`
 * and hashed JS/CSS without a manual `cp`.
 *
 * Equivalent of:
 *   cp -a public .next/standalone/public
 *   mkdir -p .next/standalone/.next && cp -a .next/static .next/standalone/.next/static
 */
import { cpSync, existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const standaloneDir = join(root, ".next", "standalone");
const publicDir = join(root, "public");
const staticDir = join(root, ".next", "static");

function fail(message) {
  console.error(`copy-standalone-assets: ${message}`);
  process.exit(1);
}

function isDir(path) {
  return existsSync(path) && statSync(path).isDirectory();
}

function copyTree(src, dest) {
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true, preserveTimestamps: true });
}

if (!isDir(standaloneDir)) {
  fail(
    ".next/standalone is missing. Run after `next build` with output: 'standalone'.",
  );
}

if (isDir(publicDir)) {
  copyTree(publicDir, join(standaloneDir, "public"));
  console.log("copied public → .next/standalone/public");
}

if (!isDir(staticDir)) {
  fail(".next/static is missing after build.");
}

mkdirSync(join(standaloneDir, ".next"), { recursive: true });
copyTree(staticDir, join(standaloneDir, ".next", "static"));
console.log("copied .next/static → .next/standalone/.next/static");
